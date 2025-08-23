// scripts/seed-embeddings.js
// Usage: node scripts/seed-embeddings.js --batch 100 --rate 60 --dry-run

const dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/../.env' });

const axios = require('axios');
const mongoose = require('mongoose');
const Product = require('../models/product.model');
const db = require('../config/database');

const argv = require('minimist')(process.argv.slice(2));
const BATCH = parseInt(argv.batch || argv.b || 100, 10);
const RATE_PER_MIN = parseInt(argv.rate || argv.r || 60, 10); // requests per minute
const DRY = argv['dry-run'] || argv.dry || false;
const RESUME = argv.resume !== undefined ? argv.resume : true;

// Default model for embeddings
const MODEL = argv.model || 'models/embedding-001';

// Google API base endpoint
const EMBED_URL = `https://generativelanguage.googleapis.com/v1beta/${MODEL}:embedContent?key=${process.env.GOOGLE_API_KEY}`;

const SLEEP_MS = Math.ceil(60000 / Math.max(1, RATE_PER_MIN)); // ms between requests

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('Seed embeddings started', { BATCH, RATE_PER_MIN, DRY, RESUME, MODEL });

  if (!process.env.GOOGLE_API_KEY) {
    console.error('No GOOGLE_API_KEY found in environment. Aborting.');
    process.exit(1);
  }

  // connect to DB
  try {
    await db.connect();
  } catch (e) {
    console.error('DB connect failed, falling back to mongoose.connect with MONGO_URL');
    await mongoose.connect(process.env.MONGO_URL, {});
  }

  // Count total to process
  const query = RESUME
    ? { $or: [{ embedding: { $exists: false } }, { embedding: { $size: 0 } }, { embedding: null }] }
    : {};
  const total = await Product.countDocuments({ deleted: false, status: 'active', ...query });
  console.log('Total products to consider:', total);

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  const cursor = Product.find({ deleted: false, status: 'active', ...query }).cursor();

  const batch = [];
  for await (const doc of cursor) {
    batch.push(doc);
    if (batch.length >= BATCH) {
      await processBatch(batch);
      processed += batch.length;
      batch.length = 0;
    }
  }
  if (batch.length > 0) {
    await processBatch(batch);
    processed += batch.length;
  }

  console.log(`Done. processed=${processed} skipped=${skipped} errors=${errors}`);
  process.exit(0);

  async function processBatch(items) {
    for (const product of items) {
      let attempt = 0;
      const maxAttempts = 3;
      while (attempt < maxAttempts) {
        try {
          // skip if embedding exists and non-empty
          if (product.embedding && Array.isArray(product.embedding) && product.embedding.length > 0) {
            skipped++;
            break; // move to next product
          }

          const text = `${product.title || ''}\n${product.description || ''}`.trim();
          if (!text) {
            skipped++;
            break;
          }

          console.log('Embedding product:', product._id.toString(), 'title:', (product.title || '').slice(0, 60));
          if (DRY) {
            console.log('[dry-run] would embed:', text.slice(0, 200));
            await sleep(SLEEP_MS);
            break;
          }

          // ✅ Call Google Embedding API (đúng format)
          const resp = await axios.post(
            EMBED_URL,
            {
              model: MODEL,
              content: {
                parts: [{ text }]
              }
            },
            { headers: { 'Content-Type': 'application/json' } }
          );

          const emb = resp.data?.embedding?.values;
          if (!emb || !Array.isArray(emb)) {
            console.error('Invalid embedding response for product', product._id, resp.data);
            errors++;
          } else {
            await Product.updateOne({ _id: product._id }, { $set: { embedding: emb } });
            console.log('✅ Saved embedding for', product._id.toString());
          }

          // rate limit sleep
          await sleep(SLEEP_MS);
          break; // success, exit retry loop
        } catch (e) {
          attempt++;
          const status = e?.response?.status;
          const respBody = e?.response?.data;
          const msg = e?.message || status || e;
          if (status === 429) {
            console.error('❌ Quota exceeded (429). Stopping seed script. Fix billing or API key before resuming.');
            process.exitCode = 2;
            return;
          }
          console.error(`⚠️ Error embedding product ${product._id} (attempt ${attempt}/${maxAttempts}):`, msg);
          if (status) console.error('HTTP status:', status);
          if (respBody) console.error('Response body:', JSON.stringify(respBody));
          if (attempt >= maxAttempts) {
            errors++;
            console.error('Max attempts reached for', product._id, 'skipping');
            break;
          }
          // exponential backoff
          const backoff = SLEEP_MS * Math.pow(2, attempt);
          await sleep(backoff);
        }
      }
    }
  }
}

main().catch(err => {
  console.error('Fatal error in seed script:', err);
  process.exit(1);
});
