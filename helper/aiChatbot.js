const axios = require('axios');
const Product = require('../models/product.model');
const ProductCategory = require('../models/product-category.model');

class AIChatbotHelper {
    constructor() {
        this.intents = {
            PRODUCT_SEARCH: 'product_search',
            CATEGORY_INFO: 'category_info',
            PRICE_INQUIRY: 'price_inquiry',
            STOCK_CHECK: 'stock_check',
            PRODUCT_COMPARISON: 'product_comparison',
            RECOMMENDATION: 'recommendation',
            GENERAL_QUESTION: 'general_question',
            GREETING: 'greeting',
            FAREWELL: 'farewell',
            NUTRITION_INFO: 'nutrition_info' 
        };
        this.entities = {
            PRODUCT_NAME: 'product_name',
            CATEGORY_NAME: 'category_name',
            PRICE_RANGE: 'price_range',

            // ...existing code: chỉ giữ lại một class AIChatbotHelper duy nhất, các hàm bên trong...
        }
    }

    //  GEMINI API 
    async _callChatAPI({ system, messages }) {
        try {
            const apiKey = process.env.GOOGLE_API_KEY;
            if (!apiKey) {
                console.error("Google Gemini: API key missing");
                return null;
            }

            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

            const contents = [];

            // System prompt trước
            if (system) {
                contents.push({
                    role: "user",
                    parts: [{ text: system }]
                });
            }

            // Thêm toàn bộ lịch sử chat
            for (const m of messages) {
                if (m.role === "user") {
                    contents.push({ role: "user", parts: [{ text: m.content }] });
                } else if (m.role === "assistant") {
                    contents.push({ role: "model", parts: [{ text: m.content }] });
                }
            }

            const payload = { contents };
            console.log("[Gemini] Payload:", JSON.stringify(payload, null, 2));

            const resp = await axios.post(url, payload, {
                headers: { "Content-Type": "application/json" }
            });

            console.log("[Gemini] Response:", JSON.stringify(resp.data, null, 2));

            return resp.data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
        } catch (e) {
            console.error("Google Gemini call failed:", e.response?.data || e.message || e);
            return null;
        }
    }


    // Call embedding API via Google Gemini / Generative Language embedding endpoint
    async _callEmbeddingAPI(text) {
        try {
            const apiKey = process.env.GOOGLE_API_KEY;
            if (!apiKey) {
                console.warn('Embedding API key missing');
                return null;
            }

            // Allow override via env (full URL), otherwise use a sensible default path
            const endpoint = process.env.GOOGLE_AI_EMBEDDING_ENDPOINT || process.env.GOOGLE_AI_ENDPOINT;
            let url;
            if (endpoint) {
                url = endpoint;
            } else {
                // Best-effort default for Google generative embeddings (may need adjustment in your environment)
                url = `https://generativelanguage.googleapis.com/v1beta/models/embedding-gecko:embed?key=${apiKey}`;
            }

            const payload = {
                model: process.env.GOOGLE_EMBEDDING_MODEL || 'models/embedding-001',
                input: text
            };

            const resp = await axios.post(url, payload, {
                headers: { 'Content-Type': 'application/json' }
            });

            // Normalize many possible response shapes
            const emb = resp.data?.embedding || resp.data?.embeddings || resp.data?.data?.[0]?.embedding || resp.data?.results?.[0]?.embedding;
            if (!emb) {
                console.warn('No embedding returned from embed API', resp.data);
                return null;
            }
            return emb;
        } catch (e) {
            console.error('Embedding API call failed:', e.message || e);
            return null;
        }
    }

    // Simple vector utilities
    _dot(a, b) {
        let s = 0;
        const n = Math.min(a.length, b.length);
        for (let i = 0; i < n; i++) s += a[i] * b[i];
        return s;
    }

    _norm(a) {
        return Math.sqrt(a.reduce((s, v) => s + v * v, 0));
    }

    _cosineSimilarity(a, b) {
        if (!a || !b || a.length === 0 || b.length === 0) return -1;
        const dot = this._dot(a, b);
        const denom = this._norm(a) * this._norm(b);
        if (denom === 0) return -1;
        return dot / denom;
    }

    // Fallback nearest-neighbor search using cosine similarity over DB-stored embeddings
    async findNearestByEmbedding(queryEmbedding, topK = 5) {
        try {
            if (!queryEmbedding || queryEmbedding.length === 0) return [];

            // Load candidates that have embeddings
            const candidates = await Product.find({ embedding: { $exists: true, $ne: [] }, deleted: false, status: 'active' }).lean();

            const scored = candidates.map(p => {
                const score = this._cosineSimilarity(queryEmbedding, (p.embedding || []));
                return { product: p, score };
            }).filter(s => typeof s.score === 'number' && !isNaN(s.score));

            scored.sort((a, b) => b.score - a.score);
            return scored.slice(0, topK).map(s => ({ ...s.product, _similarity: s.score }));
        } catch (e) {
            console.error('findNearestByEmbedding failed:', e);
            return [];
        }
    }

    // Ensure a single product has an embedding (call and save)
    async ensureProductEmbedding(product) {
        try {
            if (!product) return null;
            if (product.embedding && Array.isArray(product.embedding) && product.embedding.length > 0) return product.embedding;

            const text = `${product.title || ''} ${product.description || ''}`;
            const emb = await this._callEmbeddingAPI(text);
            if (!emb) return null;
            product.embedding = emb;
            await Product.updateOne({ _id: product._id }, { $set: { embedding: emb } });
            return emb;
        } catch (e) {
            console.error('ensureProductEmbedding failed:', e);
            return null;
        }
    }

    // Generate a RAG-style answer: embed query, retrieve topK, build context, call Gemini
    async generateRAGProductAnswer(userQuestion, options = {}) {
        try {
            const topK = options.topK || 5;
            const queryEmb = await this._callEmbeddingAPI(userQuestion);
            let results = [];

            if (queryEmb) {
                // Try DB vector search first (if available via MongoDB Atlas you'd prefer native $vectorSearch)
                // Here we use local cosine fallback
                results = await this.findNearestByEmbedding(queryEmb, topK);
            }

            // If no results from embeddings, try keyword search as fallback
            if (!results || results.length === 0) {
                const fallback = await this.searchProducts(userQuestion, {}, { topK });
                results = (fallback || []).map(p => ({ ...p }));
            }

            // Final fallback: if still empty, include top active products so Gemini has context to answer
            if (!results || results.length === 0) {
                try {
                    const top = await Product.find({ deleted: false, status: 'active' }).sort({ featured: -1, position: 1 }).limit(topK).lean();
                    if (top && top.length > 0) {
                        results = top.map(p => ({ ...p }));
                        console.warn('RAG fallback: using top active products as context');
                    }
                } catch (e) {
                    console.error('Final fallback fetching top products failed:', e);
                }
            }

            // Nutrition-specific fallback: if still empty and user asks about sugar/calories, try scanning descriptions for sugar-related strings
            const lowerQ = (userQuestion || '').toLowerCase();
            const wantsSugar = /\b(đường|sugar|calo|calories|ít đường|không đường)\b/i.test(lowerQ);
            if (( !results || results.length === 0 ) && wantsSugar) {
                try {
                    // find products whose description or title mention sugar/calories keywords
                    const nutQuery = {
                        deleted: false,
                        status: 'active',
                        $or: [
                            { description: { $regex: 'đường|không đường|ít đường|calo|calories', $options: 'i' } },
                            { title: { $regex: 'đường|không đường|ít đường|calo|calories', $options: 'i' } }
                        ]
                    };
                    const candidates = await Product.find(nutQuery).lean();
                    // extract sugar grams or detect 'không đường'
                    const parsed = candidates.map(p => {
                        const desc = String(p.description || '');
                        const lowerDesc = desc.toLowerCase();
                        let sugarVal = Number.POSITIVE_INFINITY;
                        // 'không đường' or 'khong duong' phrases
                        if (/kh[oô]ng\s+đ[uư]ờng/i.test(lowerDesc) || /no\s+sugar/i.test(lowerDesc)) {
                            sugarVal = 0;
                        } else {
                            // try to extract 'đường: 5g' or '5 g đường' patterns
                            const m1 = desc.match(/đường[^0-9\n\r\,\.;:]*([0-9]+(?:[\.,][0-9]+)?)\s*(g|gram|grams)?/i);
                            const m2 = desc.match(/([0-9]+(?:[\.,][0-9]+)?)\s*(g|gram|grams)\s*(đường|sugar)/i);
                            const m = m1 || m2;
                            if (m && m[1]) {
                                const val = parseFloat(String(m[1]).replace(',', '.'));
                                if (!isNaN(val)) sugarVal = val;
                            }
                        }
                        return { product: p, sugar: sugarVal };
                    });
                    // sort: 0 (no sugar) first, then ascending sugar numeric, then infinity
                    parsed.sort((a,b) => {
                        if (a.sugar === b.sugar) return 0;
                        if (a.sugar === 0) return -1;
                        if (b.sugar === 0) return 1;
                        if (!isFinite(a.sugar)) return 1;
                        if (!isFinite(b.sugar)) return -1;
                        return a.sugar - b.sugar;
                    });
                    results = parsed.slice(0, topK).map(p => ({ ...p.product, _sugar: p.sugar }));
                } catch (e) {
                    console.error('Nutrition fallback failed:', e);
                }
            }

            // Build the context string
            const stripHtml = (s = '') => String(s).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
            const context = (results || []).map(p => {
                const desc = stripHtml(p.description || '');
                // Try to extract explicit 'thành phần' / ingredients from description
                const ingMatch = desc.match(/(?:thành phần|ingredients|composition)[:\s\-]*([^\.\n\r]+)/i);
                const ingredients = ingMatch ? ingMatch[1].trim() : '';
                const ingredientLine = ingredients ? `Thành phần: ${ingredients}\n` : '';
                return `Tên: ${p.title}\nGiá: ${p.price}đ\nTồn kho: ${p.stock}\n${ingredientLine}Mô tả: ${desc}\nID: ${p._id}\n`;
            }).join('\n---\n');

            let system = 'Bạn là trợ lý bán hàng cho một cửa hàng trực tuyến. Dưới đây là các sản phẩm phù hợp từ kho hàng (dựa trên truy vấn tìm kiếm/embedding):\n';
            system += context;
            system += '\n\nHãy trả lời ngắn gọn, chính xác và nếu có thể dẫn nguồn bằng ID sản phẩm.';

            // _callChatAPI expects { system, messages } where messages is an array of { role, content }
            const reply = await this._callChatAPI({
                system,
                messages: [{ role: 'user', content: userQuestion }]
            });
            if (reply) return reply;
            return null;
        } catch (e) {
            console.error('generateRAGProductAnswer failed:', e);
            return null;
        }
    }

    // Tìm kiếm sản phẩm chỉ theo từ khóa (title, description), không dùng embedding
    async searchProducts(query, filters = {}, options = {}) {
        const topK = options.topK || 10;
        try {
            // small helper to escape regex metachars
            const _escapeRegex = (s) => (s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            // Nếu query là tên sản phẩm ngắn, ưu tiên tìm chính xác và bắt đầu bằng query
            if (query && String(query).trim().length > 0) {
                const qTrim = String(query).trim();
                // Exact title match (case-insensitive)
                try {
                    const exact = await Product.find({
                        title: { $regex: `^${_escapeRegex(qTrim)}$`, $options: 'i' },
                        deleted: false,
                        status: 'active'
                    }).limit(topK).lean();
                    if (exact && exact.length > 0) return exact;
                } catch (e) { /* ignore exact match errors */ }

                // Prefix match: title starts with query
                try {
                    const prefix = await Product.find({
                        title: { $regex: `^${_escapeRegex(qTrim)}`, $options: 'i' },
                        deleted: false,
                        status: 'active'
                    }).limit(topK).lean();
                    if (prefix && prefix.length > 0) return prefix;
                } catch (e) { /* ignore prefix match errors */ }
            }

            // Fallback: regex search on title/description
            const searchQuery = { deleted: false, status: 'active' };
            if (query) {
                searchQuery.$or = [
                    { title: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } }
                ];
            }
            if (filters.categoryId) searchQuery.product_category_id = filters.categoryId;
            if (filters.priceRange) {
                if (filters.priceRange.min !== undefined) searchQuery.price = { $gte: filters.priceRange.min };
                if (filters.priceRange.max !== undefined) searchQuery.price = { ...searchQuery.price, $lte: filters.priceRange.max };
            }
            if (filters.inStock) searchQuery.stock = { $gt: 0 };

            const products = await Product.find(searchQuery).sort({ featured: -1, position: 1 }).limit(topK);
            return products;
        } catch (error) {
            console.error('Error searching products:', error);
            return [];
        }
    }

    // Tìm kiếm danh mục
    async searchCategories(query) {
        try {
            const searchQuery = {
                deleted: false,
                status: 'active'
            };
            
            if (query) {
                searchQuery.$or = [
                    { title: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } }
                ];
            }
            
            const categories = await ProductCategory.find(searchQuery)
                .sort({ position: 1 })
                .limit(5);
                
            return categories;
        } catch (error) {
            console.error('Error searching categories:', error);
            return [];
        }
    }

    // Đề xuất sản phẩm dựa trên context
    async getRecommendations(context = {}) {
        try {
            const query = {
                deleted: false,
                status: 'active',
                stock: { $gt: 0 }
            };
            
            // Nếu có danh mục yêu thích
            if (context.preferredCategory) {
                query.product_category_id = context.preferredCategory;
            }
            
            // Nếu có khoảng giá
            if (context.priceRange) {
                query.price = {
                    $gte: context.priceRange.min || 0,
                    $lte: context.priceRange.max || 999999999
                };
            }
            
            const recommendations = await Product.find(query)
                .sort({ featured: -1, 'createdBy.createdAt': -1 })
                .limit(5);
                
            return recommendations;
        } catch (error) {
            console.error('Error getting recommendations:', error);
            return [];
        }
    }

    // Helper methods cho intent detection
    isGreeting(message) {
        // Chỉ nhận diện greeting nếu câu ngắn và bắt đầu bằng từ chào hỏi
        const greetings = ['xin chào', 'hello', 'hi', 'chào', 'chào bạn', 'xin chào bạn'];
        const norm = (message || '').trim().toLowerCase();
        // Chỉ nhận greeting nếu câu có độ dài < 20 ký tự và bắt đầu bằng từ chào hỏi
        return greetings.some(greeting => norm.startsWith(greeting) && norm.length <= 20);
    }
    
    isFarewell(message) {
        const farewells = ['tạm biệt', 'goodbye', 'bye', 'hẹn gặp lại', 'cảm ơn'];
        return farewells.some(farewell => message.includes(farewell));
    }
    
    isProductSearch(message) {
        const productKeywords = ['tìm', 'mua', 'sản phẩm', 'hàng', 'item', 'product'];
        return productKeywords.some(keyword => message.includes(keyword));
    }
    
    isCategoryInquiry(message) {
        const categoryKeywords = ['danh mục', 'loại', 'category', 'thể loại'];
        return categoryKeywords.some(keyword => message.includes(keyword));
    }
    
    isPriceInquiry(message) {
        const priceKeywords = ['giá', 'bao nhiêu', 'price', 'cost', 'tiền'];
        return priceKeywords.some(keyword => message.includes(keyword));
    }
    
    isStockCheck(message) {
        const stockKeywords = ['còn hàng', 'tồn kho', 'stock', 'available', 'có không'];
        return stockKeywords.some(keyword => message.includes(keyword));
    }
    
    isProductComparison(message) {
        const comparisonKeywords = ['so sánh', 'khác nhau', 'compare', 'difference'];
        return comparisonKeywords.some(keyword => message.includes(keyword));
    }
    
    isRecommendationRequest(message) {
        const recommendationKeywords = ['đề xuất', 'gợi ý', 'recommend', 'suggest', 'nên mua'];
        return recommendationKeywords.some(keyword => message.includes(keyword));
    }

    // Detect nutrition / low-sugar inquiries
    // isNutritionInquiry(message) {
    //     if (!message) return false;
    //     const kw = ['ít đường', 'không đường', 'ít calo', 'ít calories', 'ít đường hơn', 'thành phần', 'calo', 'đường', 'nutrition', 'sugar'];
    //     const lower = message.toLowerCase();
    //     return kw.some(k => lower.includes(k));
    // }
        isNutritionInquiry(msg) {
            return /(ít\s+đường|không\s+đường|đường|sugar|calo|calorie|nutrition)/i.test(msg);
        }

    // Basic intent analyzer -> returns intent, confidence and entities
    // async analyzeIntent(message) {
    //     const text = (message || '').toString().trim();
    //     const lower = text.toLowerCase();

    //     // Quick checks
    //     if (!text || text.length === 0) {
    //         return { intent: this.intents.GENERAL_QUESTION, confidence: 0.3, entities: [] };
    //     }

    //     if (this.isGreeting(lower)) return { intent: this.intents.GREETING, confidence: 0.98, entities: [] };
    //     // Nutrition-related queries should prefer RAG/recommendation behavior
    //     if (this.isNutritionInquiry(lower)) {
    //         const entities = this.extractProductEntities(text);
    //         return { intent: this.intents.RECOMMENDATION, confidence: 0.95, entities };
    //     }
    //     if (this.isFarewell(lower)) return { intent: this.intents.FAREWELL, confidence: 0.98, entities: [] };
    //     if (this.isProductComparison(lower)) {
    //         const entities = this.extractProductEntities(text);
    //         return { intent: this.intents.PRODUCT_COMPARISON, confidence: 0.9, entities };
    //     }
    //     if (this.isProductSearch(lower)) {
    //         const entities = this.extractProductEntities(text);
    //         return { intent: this.intents.PRODUCT_SEARCH, confidence: 0.85, entities };
    //     }
    //     if (this.isCategoryInquiry(lower)) {
    //         const entities = this.extractCategoryEntities(text);
    //         return { intent: this.intents.CATEGORY_INFO, confidence: 0.85, entities };
    //     }
    //     if (this.isPriceInquiry(lower)) {
    //         const entities = this.extractPriceEntities(text);
    //         return { intent: this.intents.PRICE_INQUIRY, confidence: 0.9, entities };
    //     }
    //     if (this.isStockCheck(lower)) {
    //         const entities = this.extractProductEntities(text);
    //         return { intent: this.intents.STOCK_CHECK, confidence: 0.9, entities };
    //     }
    //     if (this.isRecommendationRequest(lower)) {
    //         const entities = this.extractRecommendationEntities(text);
    //         return { intent: this.intents.RECOMMENDATION, confidence: 0.85, entities };
    //     }

    //     // Default: general question
    //     const defaultEntities = this.extractProductEntities(text);
    //     return { intent: this.intents.GENERAL_QUESTION, confidence: 0.5, entities: defaultEntities };
    // }
async analyzeIntent(message) {
    const text = (message || '').toString();
    const lower = text.toLowerCase();

    // Nutrition-specific
    if (this.isNutritionInquiry(lower)) {
        return { intent: this.intents.NUTRITION_INFO, entities: this.extractProductEntities(text), confidence: 0.95 };
    }

    // Greetings / Farewell
    if (/chào|hello|hi/i.test(lower)) return { intent: this.intents.GREETING, entities: [], confidence: 0.98 };
    if (/tạm biệt|bye/i.test(lower)) return { intent: this.intents.FAREWELL, entities: [], confidence: 0.98 };

    // Comparison / price / stock
    if (/so sánh|compare/i.test(lower)) return { intent: this.intents.PRODUCT_COMPARISON, entities: this.extractProductEntities(text), confidence: 0.9 };
    if (/giá|bao nhiêu/i.test(lower)) return { intent: this.intents.PRICE_INQUIRY, entities: this.extractPriceEntities(text), confidence: 0.9 };
    if (/còn hàng|stock/i.test(lower)) return { intent: this.intents.STOCK_CHECK, entities: this.extractProductEntities(text), confidence: 0.9 };

    // Recommendation / category
    if (/gợi ý|đề xuất/i.test(lower)) return { intent: this.intents.RECOMMENDATION, entities: this.extractRecommendationEntities(text), confidence: 0.85 };
    if (/danh mục|loại/i.test(lower)) return { intent: this.intents.CATEGORY_INFO, entities: this.extractCategoryEntities(text), confidence: 0.85 };

    // Special-case: user asks for "all products"
    if ((/tất cả|tat ca|danh sách|danh sach/i).test(lower) && (/sản phẩm|san pham|sp/i).test(lower)) {
        return { intent: this.intents.PRODUCT_SEARCH, entities: [{ type: this.entities.PRODUCT_NAME, value: '__ALL_PRODUCTS__' }], confidence: 0.9 };
    }

    // Product search fallback
    if (/sản phẩm|product/i.test(lower)) return { intent: this.intents.PRODUCT_SEARCH, entities: this.extractProductEntities(text), confidence: 0.85 };

    // Default: general question (include product-entity fallback)
    return { intent: this.intents.GENERAL_QUESTION, entities: this.extractProductEntities(text), confidence: 0.5 };
}
    // Extract entities từ message
    extractProductEntities(message) {
        // Logic để extract tên sản phẩm, thương hiệu, tính năng
        const entities = [];
        const norm = (message || '').toLowerCase();
        // Detect generic "all products" queries like "tất cả sản phẩm", "danh sách sản phẩm"
        if ((/tất cả|tat ca|danh sách|danh sach/i).test(norm) && (/sản phẩm|san pham|sp/i).test(norm)) {
            entities.push({
                type: this.entities.PRODUCT_NAME,
                value: '__ALL_PRODUCTS__'
            });
            return entities;
        }
        
        // Tìm tên sản phẩm (có thể cải thiện bằng NLP)
        const productPatterns = [
            /(?:tìm|mua|sản phẩm)\s+([^,\s]+)/i,
            /([^,\s]+)\s+(?:giá|bao nhiêu)/i
        ];
        
        productPatterns.forEach(pattern => {
            const match = message.match(pattern);
            if (match) {
                entities.push({
                    type: this.entities.PRODUCT_NAME,
                    value: match[1]
                });
            }
        });
        
        // Fallback: if no product entity extracted, use the whole message as a keyword
        if (entities.length === 0 && message && message.trim().length > 0) {
            entities.push({ type: this.entities.PRODUCT_NAME, value: message.trim() });
        }

        return entities;
    }
    
    extractCategoryEntities(message) {
        const entities = [];
        const categoryPatterns = [
            /(?:danh mục|loại)\s+([^,\s]+)/i,
            /([^,\s]+)\s+(?:có gì|gồm)/i
        ];
        
        categoryPatterns.forEach(pattern => {
            const match = message.match(pattern);
            if (match) {
                entities.push({
                    type: this.entities.CATEGORY_NAME,
                    value: match[1]
                });
            }
        });
        
        return entities;
    }
    
    extractPriceEntities(message) {
        const entities = [];
        const pricePatterns = [
            /(?:giá|bao nhiêu)\s+([^,\s]+)/i,
            /([^,\s]+)\s+(?:giá|bao nhiêu)/i
        ];
        
        pricePatterns.forEach(pattern => {
            const match = message.match(pattern);
            if (match) {
                entities.push({
                    type: this.entities.PRODUCT_NAME,
                    value: match[1]
                });
            }
        });
        
        return entities;
    }
    
    extractRecommendationEntities(message) {
        const entities = [];
        const recommendationPatterns = [
            /(?:đề xuất|gợi ý)\s+([^,\s]+)/i,
            /([^,\s]+)\s+(?:nên mua|tốt)/i
        ];
        
        recommendationPatterns.forEach(pattern => {
            const match = message.match(pattern);
            if (match) {
                entities.push({
                    type: this.entities.CATEGORY_NAME,
                    value: match[1]
                });
            }
        });
        
        return entities;
    }

    // Generate responses
    generateGreetingResponse() {
        const greetings = [
            "Xin chào! Tôi là trợ lý AI của cửa hàng. Tôi có thể giúp bạn tìm kiếm sản phẩm, tư vấn mua hàng hoặc trả lời các câu hỏi. Bạn cần gì ạ?",
            "Chào bạn! Tôi là chatbot thông minh, sẵn sàng hỗ trợ bạn tìm kiếm và mua sản phẩm. Bạn muốn tìm gì hôm nay?",
            "Xin chào! Tôi có thể giúp bạn: tìm kiếm sản phẩm, so sánh giá, kiểm tra tồn kho và đưa ra gợi ý mua hàng. Bạn cần hỗ trợ gì?"
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
    }
    
    generateFarewellResponse() {
        const farewells = [
            "Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi! Chúc bạn một ngày tốt lành!",
            "Hẹn gặp lại bạn! Nếu cần hỗ trợ gì thêm, đừng ngại liên hệ lại nhé!",
            "Tạm biệt! Chúc bạn mua sắm vui vẻ và hài lòng với sản phẩm!"
        ];
        return farewells[Math.floor(Math.random() * Math.floor(farewells.length))];
    }
    
    async generateProductSearchResponse(entities) {
        if (entities.length === 0) {
            return "Bạn muốn tìm sản phẩm gì? Hãy cho tôi biết tên sản phẩm, danh mục hoặc tính năng bạn quan tâm.";
        }

        const productEntity = entities.find(e => e.type === this.entities.PRODUCT_NAME);
        // If user asked for all products, return top products
        if (productEntity && productEntity.value === '__ALL_PRODUCTS__') {
            const topProducts = await this.searchProducts('', {}, { topK: 10 });
            if (topProducts.length > 0) {
                let response = `Đây là một số sản phẩm hiện có trong cửa hàng:\n\n`;
                topProducts.forEach((product, index) => {
                    response += `${index + 1}. ${product.title} - ${product.price.toLocaleString('vi-VN')}đ`;
                    if (product.stock > 0) response += ` (Còn hàng)`; else response += ` (Hết hàng)`;
                    response += '\n';
                });
                response += '\nBạn muốn xem chi tiết sản phẩm nào?';
                return response;
            } else {
                return 'Xin lỗi, hiện tại cửa hàng chưa có sản phẩm để hiển thị.';
            }
        }
        if (productEntity) {
            const products = await this.searchProducts(productEntity.value);
            if (products.length > 0) {
                let response = `Tôi tìm thấy ${products.length} sản phẩm phù hợp với "${productEntity.value}":\n\n`;
                products.forEach((product, index) => {
                    response += `${index + 1}. ${product.title} - ${product.price.toLocaleString('vi-VN')}đ`;
                    if (product.stock > 0) {
                        response += ` (Còn hàng)`;
                    } else {
                        response += ` (Hết hàng)`;
                    }
                    response += '\n';
                });
                response += '\nBạn muốn xem chi tiết sản phẩm nào?';
                return response;
            } else {
                return `Xin lỗi, tôi không tìm thấy sản phẩm nào phù hợp với "${productEntity.value}". Bạn có thể thử tìm kiếm với từ khóa khác hoặc xem các danh mục sản phẩm của chúng tôi.`;
            }
        }
        
        return "Bạn có thể cho tôi biết cụ thể hơn về sản phẩm bạn muốn tìm không?";
    }
    // ---------------- NUTRITION INFO ----------------
// 🔹 NEW
async generateNutritionInfo(productName) {
    const products = await this.searchProducts(productName);
    if (!products || products.length === 0) return `Không tìm thấy sản phẩm "${productName}".`;

    const p = products[0];
    const desc = (p.description || '').toLowerCase();

    // Extract sugar/calo từ description
    let sugar = null, calo = null;
    const mSugar = desc.match(/([0-9]+)\s*(g|gram)?\s*(đường|sugar)/i);
    if (/không\s+đường|no sugar/i.test(desc)) sugar = 0;
    else if (mSugar) sugar = mSugar[1];

    const mCalo = desc.match(/([0-9]+)\s*(k?calo|calories?)/i);
    if (mCalo) calo = mCalo[1];

    let response = `Thông tin dinh dưỡng của "${p.title}":\n`;
    if (sugar !== null) response += `- Đường: ${sugar}g\n`;
    if (calo !== null) response += `- Calories: ${calo}\n`;
    response += `- Thành phần/mô tả: ${p.description}`;
    return response;
}
    async generateCategoryInfoResponse(entities) {
        if (entities.length === 0) {
            const categories = await this.searchCategories();
            let response = "Chúng tôi có các danh mục sản phẩm sau:\n\n";
            categories.forEach((category, index) => {
                response += `${index + 1}. ${category.title}`;
                if (category.description) {
                    response += `: ${category.description}`;
                }
                response += '\n';
            });
            response += '\nBạn muốn xem sản phẩm trong danh mục nào?';
            return response;
        }
        
        const categoryEntity = entities.find(e => e.type === this.entities.CATEGORY_NAME);
        if (categoryEntity) {
            const categories = await this.searchCategories(categoryEntity.value);
            if (categories.length > 0) {
                const category = categories[0];
                const products = await this.searchProducts('', { categoryId: category._id.toString() });
                
                let response = `Danh mục "${category.title}":\n`;
                if (category.description) {
                    response += `${category.description}\n\n`;
                }
                response += `Có ${products.length} sản phẩm trong danh mục này.\n\n`;
                
                if (products.length > 0) {
                    response += "Một số sản phẩm tiêu biểu:\n";
                    products.slice(0, 3).forEach((product, index) => {
                        response += `${index + 1}. ${product.title} - ${product.price.toLocaleString('vi-VN')}đ\n`;
                    });
                }
                
                return response;
            }
        }
        
        return "Bạn muốn xem thông tin về danh mục nào? Tôi có thể giúp bạn khám phá các danh mục sản phẩm của chúng tôi.";
    }
    
    async generatePriceInquiryResponse(entities) {
        if (entities.length === 0) {
            return "Bạn muốn biết giá của sản phẩm nào? Hãy cho tôi biết tên sản phẩm cụ thể.";
        }
        
        const productEntity = entities.find(e => e.type === this.entities.PRODUCT_NAME);
        if (productEntity) {
            const products = await this.searchProducts(productEntity.value);
            if (products.length > 0) {
                const product = products[0];
                let response = `Sản phẩm "${product.title}":\n`;
                response += `Giá: ${product.price.toLocaleString('vi-VN')}đ`;
                
                if (product.discountPercentage && product.discountPercentage > 0) {
                    const discountedPrice = product.price * (1 - product.discountPercentage / 100);
                    response += `\nGiá khuyến mãi: ${discountedPrice.toLocaleString('vi-VN')}đ (Giảm ${product.discountPercentage}%)`;
                }
                
                if (product.stock > 0) {
                    response += `\nTình trạng: Còn hàng (${product.stock} sản phẩm)`;
                } else {
                    response += `\nTình trạng: Hết hàng`;
                }
                
                return response;
            } else {
                return `Xin lỗi, tôi không tìm thấy sản phẩm "${productEntity.value}". Bạn có thể kiểm tra lại tên sản phẩm hoặc tìm kiếm với từ khóa khác.`;
            }
        }
        
        return "Bạn có thể cho tôi biết tên sản phẩm cụ thể để tôi kiểm tra giá không?";
    }
    
    async generateStockCheckResponse(entities) {
        if (entities.length === 0) {
            return "Bạn muốn kiểm tra tồn kho của sản phẩm nào? Hãy cho tôi biết tên sản phẩm.";
        }
        
        const productEntity = entities.find(e => e.type === this.entities.PRODUCT_NAME);
        if (productEntity) {
            const products = await this.searchProducts(productEntity.value);
            if (products.length > 0) {
                const product = products[0];
                let response = `Sản phẩm "${product.title}":\n`;
                
                if (product.stock > 0) {
                    response += `✅ Còn hàng: ${product.stock} sản phẩm`;
                    if (product.stock < 5) {
                        response += ` (Số lượng có hạn!)`;
                    }
                } else {
                    response += `❌ Hết hàng`;
                }
                
                response += `\nGiá: ${product.price.toLocaleString('vi-VN')}đ`;
                
                return response;
            } else {
                return `Xin lỗi, tôi không tìm thấy sản phẩm "${productEntity.value}". Bạn có thể kiểm tra lại tên sản phẩm.`;
            }
        }
        
        return "Bạn có thể cho tôi biết tên sản phẩm để kiểm tra tồn kho không?";
    }
    
    async generateProductComparisonResponse(entities) {
        if (entities.length < 2) {
            return "Để so sánh sản phẩm, bạn cần cho tôi biết ít nhất 2 sản phẩm. Ví dụ: 'So sánh iPhone 14 và Samsung Galaxy S23'";
        }
        
        const productNames = entities
            .filter(e => e.type === this.entities.PRODUCT_NAME)
            .map(e => e.value);
        
        if (productNames.length >= 2) {
            const products = [];
            for (const name of productNames.slice(0, 3)) { // Giới hạn 3 sản phẩm
                const found = await this.searchProducts(name);
                if (found.length > 0) {
                    products.push(found[0]);
                }
            }
            
            if (products.length >= 2) {
                let response = "So sánh sản phẩm:\n\n";
                products.forEach((product, index) => {
                    response += `${index + 1}. ${product.title}\n`;
                    response += `   Giá: ${product.price.toLocaleString('vi-VN')}đ\n`;
                    response += `   Tồn kho: ${product.stock > 0 ? 'Còn hàng' : 'Hết hàng'}\n`;
                    if (product.description) {
                        response += `   Mô tả: ${product.description.substring(0, 100)}...\n`;
                    }
                    response += '\n';
                });
                
                response += "Bạn muốn xem chi tiết sản phẩm nào?";
                return response;
            }
        }
        
        return "Tôi không thể tìm thấy đủ sản phẩm để so sánh. Bạn có thể thử lại với tên sản phẩm cụ thể hơn.";
    }
    
    async generateRecommendationResponse(entities, context) {
        let response = "Dựa trên sở thích của bạn, tôi đề xuất các sản phẩm sau:\n\n";
        
        const recommendations = await this.getRecommendations(context);
        
        if (recommendations.length > 0) {
            recommendations.forEach((product, index) => {
                response += `${index + 1}. ${product.title}\n`;
                response += `   Giá: ${product.price.toLocaleString('vi-VN')}đ\n`;
                if (product.discountPercentage && product.discountPercentage > 0) {
                    response += `   Khuyến mãi: Giảm ${product.discountPercentage}%\n`;
                }
                response += `   Tồn kho: ${product.stock > 0 ? 'Còn hàng' : 'Hết hàng'}\n\n`;
            });
            
            response += "Bạn có muốn xem chi tiết sản phẩm nào không?";
        } else {
            response = "Hiện tại tôi chưa có đủ thông tin để đưa ra gợi ý cụ thể. Bạn có thể cho tôi biết thêm về sở thích hoặc ngân sách của mình không?";
        }
        
        return response;
    }
    
    generateGeneralResponse() {
        const responses = [
            "Tôi hiểu câu hỏi của bạn. Bạn có thể cho tôi biết cụ thể hơn về vấn đề bạn gặp phải không?",
            "Tôi có thể giúp bạn tìm kiếm sản phẩm, tư vấn mua hàng, kiểm tra giá và tồn kho. Bạn cần hỗ trợ gì?",
            "Nếu bạn có câu hỏi về sản phẩm, hãy cho tôi biết tên sản phẩm cụ thể. Tôi sẽ cố gắng giúp bạn tốt nhất!"
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // Master response generator: mọi câu hỏi đều dùng embedding để lấy top-k sản phẩm liên quan, sau đó gửi context + câu hỏi sang Gemini
    async generateResponse(intentAnalysis, context = {}) {
        try {
            const userQ = context.originalMessage || context.userMessage || '';
            // Lấy embedding của câu hỏi, so sánh với embedding sản phẩm, lấy top-k
            const topK = 5;
            const queryEmb = await this._callEmbeddingAPI(userQ);
            let results = [];
            if (queryEmb) {
                results = await this.findNearestByEmbedding(queryEmb, topK);
            }
            // Nếu không có kết quả embedding, fallback keyword search
            if (!results || results.length === 0) {
                const fallback = await this.searchProducts(userQ, {}, { topK });
                results = (fallback || []).map(p => ({ ...p }));
            }
            // Nếu vẫn không có, lấy top sản phẩm nổi bật
            if (!results || results.length === 0) {
                const top = await Product.find({ deleted: false, status: 'active' }).sort({ featured: -1, position: 1 }).limit(topK).lean();
                if (top && top.length > 0) results = top.map(p => ({ ...p }));
            }
            // Build context cho Gemini
            const stripHtml = (s = '') => String(s).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
            const contextStr = (results || []).map(p => {
                const desc = stripHtml(p.description || '');
                return `Tên: ${p.title}\nGiá: ${p.price}đ\nTồn kho: ${p.stock}\nMô tả: ${desc}\nID: ${p._id}`;
            }).join('\n---\n');
            let system = 'Bạn là trợ lý bán hàng cho một cửa hàng trực tuyến. Dưới đây là các sản phẩm phù hợp từ kho hàng (dựa trên truy vấn tìm kiếm/embedding):\n';
            system += contextStr;
            system += '\n\nHãy trả lời ngắn gọn, chính xác và nếu có thể dẫn nguồn bằng ID sản phẩm.';
            // Gửi context + câu hỏi sang Gemini
            const reply = await this._callChatAPI({
                system,
                messages: [{ role: 'user', content: userQ }]
            });
            if (reply) return reply;
            return 'Xin lỗi, tôi chưa có đủ dữ liệu để trả lời câu hỏi này.';
        } catch (e) {
            console.error('generateResponse failed:', e);
            return 'Xin lỗi, tôi chưa có đủ dữ liệu để trả lời câu hỏi này.';
        }
    }
}

module.exports = new AIChatbotHelper();
