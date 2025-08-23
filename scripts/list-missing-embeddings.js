// scripts/list-missing-embeddings.js
// Prints products missing embeddings (up to a limit)

require('dotenv').config({ path: __dirname + '/../.env' });
const db = require('../config/database');
const Product = require('../models/product.model');

(async function main(){
  try {
    await db.connect();
    const query = {
      deleted: false,
      status: 'active',
      $or: [
        { embedding: { $exists: false } },
        { embedding: { $size: 0 } },
        { embedding: null }
      ]
    };
    const total = await Product.countDocuments(query);
    console.log('Missing embeddings total:', total);
    const docs = await Product.find(query).limit(200).lean();
    docs.forEach(d => console.log(String(d._id), '-', (d.title || 'NO_TITLE')));
    process.exit(0);
  } catch (e) {
    console.error('Error listing missing embeddings:', e);
    process.exit(1);
  }
})();
