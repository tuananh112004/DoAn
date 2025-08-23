const Chatbot = require('../../models/chatbot.model');
const AITraining = require('../../models/ai-training.model');
const aiHelper = require('../../helper/aiChatbot');
const crypto = require('crypto');

// Generate a UUID in a resilient way: prefer crypto.randomUUID(), fall back to uuid package, else a timestamp-based id
function genUuid() {
    if (typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    try {
        const { v4: uuidv4 } = require('uuid');
        return uuidv4();
    } catch (e) {
        return 'sess-' + Date.now() + '-' + Math.floor(Math.random() * 1e6);
    }
}

class ChatbotController {
    // Khởi tạo session chat mới
    async startChat(req, res) {
        try {
            const { userId } = req.body;
            const sessionId = genUuid();
            
            // Tạo session mới
            const newChat = new Chatbot({
                sessionId,
                userId: userId || null,
                messages: [{
                    role: 'system',
                    content: 'Xin chào! Tôi là trợ lý AI của cửa hàng. Tôi có thể giúp bạn tìm kiếm sản phẩm, tư vấn mua hàng hoặc trả lời các câu hỏi. Bạn cần gì ạ?',
                    timestamp: new Date()
                }]
            });
            
            await newChat.save();
            
            res.json({
                success: true,
                sessionId,
                message: 'Chat session started successfully',
                initialMessage: newChat.messages[0]
            });
        } catch (error) {
            console.error('Error starting chat:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to start chat session'
            });
        }
    }

    // Gửi tin nhắn và nhận phản hồi từ AI
  // Gửi tin nhắn và nhận phản hồi từ AI
async sendMessage(req, res) {
    try {
        const { sessionId, message, userId } = req.body;
        
        if (!sessionId || !message) {
            return res.status(400).json({
                success: false,
                message: 'Session ID and message are required'
            });
        }
        
        // Tìm session chat
        let chatSession = await Chatbot.findOne({ sessionId });
        if (!chatSession) {
            return res.status(404).json({
                success: false,
                message: 'Chat session not found'
            });
        }
        
        // Lưu tin nhắn của user
        const userMessage = {
            role: 'user',
            content: message,
            timestamp: new Date()
        };
        chatSession.messages.push(userMessage);
        
        // Phân tích intent
        const intentAnalysis = (await aiHelper.analyzeIntent(message)) || {};
        // Defensive: ensure entities is always an array to avoid .find/.map errors
        const entities = Array.isArray(intentAnalysis.entities) ? intentAnalysis.entities : [];
        // Keep intentAnalysis.entities consistent for other code paths
        intentAnalysis.entities = entities;

        // Gọi AI (truyền luôn lịch sử vào) — pass intentAnalysis and context as separate params
        const aiResponse = await aiHelper.generateResponse(
            intentAnalysis,
            {
                ...(chatSession.context || {}),
                originalMessage: message,
                messages: chatSession.messages   // 👈 thêm lịch sử
            }
        );

        // Lưu response
        const assistantMessage = {
            role: 'assistant',
            content: aiResponse,
            timestamp: new Date(),
            metadata: {
                intent: intentAnalysis.intent,
                confidence: intentAnalysis.confidence,
                entities: entities
            }
        };
        chatSession.messages.push(assistantMessage);

        // Update context
        // Ensure context object exists before setting fields
        chatSession.context = chatSession.context || {};
        if (intentAnalysis.intent === 'product_search' || intentAnalysis.intent === 'category_info') {
            const productEntity = entities.find(e => e.type === 'product_name');
            const categoryEntity = entities.find(e => e.type === 'category_name');

            if (productEntity) {
                chatSession.context.currentProduct = productEntity.value;
            }
            if (categoryEntity) {
                chatSession.context.currentCategory = categoryEntity.value;
            }
        }
        
        await chatSession.save();

        res.json({
            success: true,
            response: aiResponse,
            intent: intentAnalysis.intent,
            confidence: intentAnalysis.confidence,
            entities: intentAnalysis.entities,
            sessionId
        });

    } catch (error) {
        console.error('Error processing message:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process message'
        });
    }
}

    // Lấy lịch sử chat
    async getChatHistory(req, res) {
        try {
            const { sessionId } = req.params;
            
            const chatSession = await Chatbot.findOne({ sessionId });
            if (!chatSession) {
                return res.status(404).json({
                    success: false,
                    message: 'Chat session not found'
                });
            }
            
            res.json({
                success: true,
                messages: chatSession.messages,
                context: chatSession.context,
                sessionId
            });
            
        } catch (error) {
            console.error('Error getting chat history:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get chat history'
            });
        }
    }

    // Lấy các session chat của user
    async getUserChats(req, res) {
        try {
            const { userId } = req.params;
            
            const userChats = await Chatbot.find({ 
                userId,
                status: { $ne: 'archived' }
            }).sort({ updatedAt: -1 }).limit(20);
            
            res.json({
                success: true,
                chats: userChats.map(chat => ({
                    sessionId: chat.sessionId,
                    lastMessage: chat.messages[chat.messages.length - 1],
                    messageCount: chat.messages.length,
                    updatedAt: chat.updatedAt,
                    status: chat.status
                }))
            });
            
        } catch (error) {
            console.error('Error getting user chats:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get user chats'
            });
        }
    }

    // Đánh giá chất lượng response
    async rateResponse(req, res) {
        try {
            const { sessionId, messageIndex, rating, comment } = req.body;
            
            const chatSession = await Chatbot.findOne({ sessionId });
            if (!chatSession) {
                return res.status(404).json({
                    success: false,
                    message: 'Chat session not found'
                });
            }
            
            if (messageIndex >= 0 && messageIndex < chatSession.messages.length) {
                const message = chatSession.messages[messageIndex];
                if (message.role === 'assistant') {
                    // Cập nhật feedback cho message cụ thể
                    if (!message.feedback) {
                        message.feedback = {};
                    }
                    message.feedback.rating = rating;
                    message.feedback.comment = comment;
                    message.feedback.timestamp = new Date();
                    
                    await chatSession.save();
                    
                    res.json({
                        success: true,
                        message: 'Feedback recorded successfully'
                    });
                } else {
                    res.status(400).json({
                        success: false,
                        message: 'Can only rate assistant messages'
                    });
                }
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Invalid message index'
                });
            }
            
        } catch (error) {
            console.error('Error rating response:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to record feedback'
            });
        }
    }

    // Đánh giá toàn bộ cuộc hội thoại
    async rateChat(req, res) {
        try {
            const { sessionId, rating, helpful, comment } = req.body;
            
            const chatSession = await Chatbot.findOne({ sessionId });
            if (!chatSession) {
                return res.status(404).json({
                    success: false,
                    message: 'Chat session not found'
                });
            }
            
            chatSession.feedback = {
                rating,
                helpful,
                comment,
                timestamp: new Date()
            };
            
            await chatSession.save();
            
            res.json({
                success: true,
                message: 'Chat feedback recorded successfully'
            });
            
        } catch (error) {
            console.error('Error rating chat:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to record chat feedback'
            });
        }
    }

    // Kết thúc session chat
    async endChat(req, res) {
        try {
            const { sessionId } = req.params;
            
            const chatSession = await Chatbot.findOne({ sessionId });
            if (!chatSession) {
                return res.status(404).json({
                    success: false,
                    message: 'Chat session not found'
                });
            }
            
            chatSession.status = 'completed';
            await chatSession.save();
            
            res.json({
                success: true,
                message: 'Chat session ended successfully'
            });
            
        } catch (error) {
            console.error('Error ending chat:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to end chat session'
            });
        }
    }

    // Tìm kiếm sản phẩm trực tiếp
    async searchProducts(req, res) {
        try {
            const { query, categoryId, priceRange, inStock } = req.query;
            
            const filters = {};
            if (categoryId) filters.categoryId = categoryId;
            if (priceRange) {
                const [min, max] = priceRange.split('-').map(Number);
                filters.priceRange = { min, max };
            }
            if (inStock === 'true') filters.inStock = true;
            
            const products = await aiHelper.searchProducts(query, filters);
            
            res.json({
                success: true,
                products: products.map(product => ({
                    id: product._id,
                    title: product.title,
                    price: product.price,
                    discountPercentage: product.discountPercentage,
                    stock: product.stock,
                    thumbnail: product.thumbnail,
                    categoryId: product.product_category_id
                }))
            });
            
        } catch (error) {
            console.error('Error searching products:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to search products'
            });
        }
    }

    // Lấy danh mục sản phẩm
    async getCategories(req, res) {
        try {
            const { query } = req.query;
            
            const categories = await aiHelper.searchCategories(query);
            
            res.json({
                success: true,
                categories: categories.map(category => ({
                    id: category._id,
                    title: category.title,
                    description: category.description,
                    thumbnail: category.thumbnail
                }))
            });
            
        } catch (error) {
            console.error('Error getting categories:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get categories'
            });
        }
    }

    // Lấy đề xuất sản phẩm
    async getRecommendations(req, res) {
        try {
            const { preferredCategory, priceRange } = req.query;
            
            const context = {};
            if (preferredCategory) context.preferredCategory = preferredCategory;
            if (priceRange) {
                const [min, max] = priceRange.split('-').map(Number);
                context.priceRange = { min, max };
            }
            
            const recommendations = await aiHelper.getRecommendations(context);
            
            res.json({
                success: true,
                recommendations: recommendations.map(product => ({
                    id: product._id,
                    title: product.title,
                    price: product.price,
                    discountPercentage: product.discountPercentage,
                    stock: product.stock,
                    thumbnail: product.thumbnail
                }))
            });
            
        } catch (error) {
            console.error('Error getting recommendations:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get recommendations'
            });
        }
    }

    // Cập nhật training data
    async updateTrainingData(userInput, aiResponse, intentAnalysis) {
        try {
            // Tìm training data tương tự
            let trainingData = await AITraining.findOne({
                'content.input': { $regex: userInput, $options: 'i' },
                type: 'intent'
            });
            
            if (!trainingData) {
                // Tạo training data mới
                trainingData = new AITraining({
                    type: 'intent',
                    content: {
                        input: userInput,
                        output: aiResponse,
                        variations: [userInput],
                        keywords: this.extractKeywords(userInput)
                    },
                    ai: {
                        intent: intentAnalysis.intent,
                        entities: intentAnalysis.entities.map(e => e.type),
                        confidence: intentAnalysis.confidence,
                        trainingScore: 0.5
                    }
                });
            } else {
                // Cập nhật training data hiện có
                if (!trainingData.content.variations.includes(userInput)) {
                    trainingData.content.variations.push(userInput);
                }
                trainingData.ai.confidence = Math.max(trainingData.ai.confidence, intentAnalysis.confidence);
                trainingData.usage.timesUsed += 1;
                trainingData.usage.lastUsed = new Date();
            }
            
            await trainingData.save();
            
        } catch (error) {
            console.error('Error updating training data:', error);
        }
    }

    // Extract keywords từ input
    extractKeywords(input) {
        const stopWords = ['là', 'của', 'và', 'hoặc', 'từ', 'đến', 'với', 'cho', 'bởi', 'theo', 'như', 'khi', 'nếu', 'thì', 'mà', 'để', 'vì', 'nên', 'có', 'không', 'đã', 'sẽ', 'đang', 'vừa', 'mới', 'cũng', 'chỉ', 'còn', 'mãi', 'luôn', 'thường', 'hiếm', 'ít', 'nhiều', 'rất', 'quá', 'lắm', 'nhất', 'hơn', 'kém', 'bằng', 'trên', 'dưới', 'trong', 'ngoài', 'trước', 'sau', 'giữa', 'bên', 'cạnh', 'gần', 'xa', 'cao', 'thấp', 'lớn', 'nhỏ', 'dài', 'ngắn', 'rộng', 'hẹp', 'dày', 'mỏng', 'nặng', 'nhẹ', 'nóng', 'lạnh', 'ấm', 'mát', 'sáng', 'tối', 'đen', 'trắng', 'đỏ', 'xanh', 'vàng', 'nâu', 'tím', 'cam', 'hồng', 'xám', 'bạc', 'vàng', 'đồng', 'sắt', 'gỗ', 'nhựa', 'vải', 'giấy', 'thủy tinh', 'kim loại', 'đá', 'gạch', 'xi măng', 'sơn', 'keo', 'băng dính', 'dây', 'ốc', 'vít', 'đinh', 'búa', 'kìm', 'kéo', 'dao', 'thìa', 'dĩa', 'bát', 'cốc', 'chén', 'đĩa', 'khay', 'hộp', 'túi', 'balo', 'ví', 'mũ', 'áo', 'quần', 'váy', 'giày', 'dép', 'tất', 'khăn', 'gối', 'chăn', 'màn', 'rèm', 'thảm', 'gương', 'đèn', 'quạt', 'điều hòa', 'tủ', 'bàn', 'ghế', 'giường', 'tủ', 'kệ', 'giá', 'móc', 'treo', 'để', 'cất', 'sắp xếp', 'dọn dẹp', 'lau', 'rửa', 'giặt', 'ủi', 'may', 'thêu', 'vẽ', 'viết', 'đọc', 'nghe', 'xem', 'chơi', 'học', 'làm việc', 'nghỉ ngơi', 'ngủ', 'ăn', 'uống', 'đi', 'đứng', 'ngồi', 'nằm', 'chạy', 'nhảy', 'bơi', 'leo', 'trèo', 'đi bộ', 'chạy xe', 'đi xe', 'bay', 'bơi thuyền', 'đi tàu', 'đi máy bay', 'đi xe buýt', 'đi xe lửa', 'đi xe điện', 'đi xe đạp', 'đi xe máy', 'đi ô tô', 'đi taxi', 'đi grab', 'đi uber', 'đi xe ôm', 'đi xe ba gác', 'đi xe tải', 'đi xe khách', 'đi xe buýt', 'đi xe lửa', 'đi xe điện', 'đi xe đạp', 'đi xe máy', 'đi ô tô', 'đi taxi', 'đi grab', 'đi uber', 'đi xe ôm', 'đi xe ba gác', 'đi xe tải', 'đi xe khách'];
        
        const words = input.toLowerCase().split(/\s+/);
        const keywords = words.filter(word => 
            word.length > 2 && 
            !stopWords.includes(word) &&
            !/^[0-9]+$/.test(word)
        );
        
        return keywords.slice(0, 10); // Giới hạn 10 keywords
    }
}

module.exports = new ChatbotController();
