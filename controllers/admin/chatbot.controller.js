const Chatbot = require('../../models/chatbot.model');
const AITraining = require('../../models/ai-training.model');
const Product = require('../../models/product.model');
const ProductCategory = require('../../models/product-category.model');

class AdminChatbotController {
    // Dashboard - Thống kê tổng quan
    async getDashboard(req, res) {
        try {
            const [
                totalSessions,
                activeSessions,
                totalMessages,
                totalTrainingData,
                recentChats,
                popularIntents,
                userSatisfaction
            ] = await Promise.all([
                Chatbot.countDocuments(),
                Chatbot.countDocuments({ status: 'active' }),
                Chatbot.aggregate([
                    { $unwind: '$messages' },
                    { $count: 'total' }
                ]),
                AITraining.countDocuments(),
                Chatbot.find({ status: 'active' })
                    .sort({ updatedAt: -1 })
                    .limit(5)
                    .populate('userId', 'username email'),
                Chatbot.aggregate([
                    { $unwind: '$messages' },
                    { $match: { 'messages.role': 'assistant' } },
                    { $group: { _id: '$messages.metadata.intent', count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                    { $limit: 5 }
                ]),
                Chatbot.aggregate([
                    { $match: { 'feedback.rating': { $exists: true } } },
                    { $group: { _id: null, avgRating: { $avg: '$feedback.rating' } } }
                ])
            ]);

            const totalMessagesCount = totalMessages[0]?.total || 0;
            const avgRating = userSatisfaction[0]?.avgRating || 0;

            res.json({
                success: true,
                data: {
                    totalSessions,
                    activeSessions,
                    totalMessages: totalMessagesCount,
                    totalTrainingData,
                    recentChats,
                    popularIntents,
                    userSatisfaction: Math.round(avgRating * 10) / 10
                }
            });
        } catch (error) {
            console.error('Error getting chatbot dashboard:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get dashboard data'
            });
        }
    }

    // Danh sách các session chat
    async getChatSessions(req, res) {
        try {
            const { page = 1, limit = 20, status, userId } = req.query;
            const skip = (page - 1) * limit;

            const query = {};
            if (status) query.status = status;
            if (userId) query.userId = userId;

            const [sessions, total] = await Promise.all([
                Chatbot.find(query)
                    .populate('userId', 'username email')
                    .sort({ updatedAt: -1 })
                    .skip(skip)
                    .limit(parseInt(limit)),
                Chatbot.countDocuments(query)
            ]);

            res.json({
                success: true,
                data: {
                    sessions,
                    pagination: {
                        current: parseInt(page),
                        total: Math.ceil(total / limit),
                        totalItems: total
                    }
                }
            });
        } catch (error) {
            console.error('Error getting chat sessions:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get chat sessions'
            });
        }
    }

    // Chi tiết session chat
    async getChatSession(req, res) {
        try {
            const { sessionId } = req.params;

            const session = await Chatbot.findOne({ sessionId })
                .populate('userId', 'username email');

            if (!session) {
                return res.status(404).json({
                    success: false,
                    message: 'Chat session not found'
                });
            }

            res.json({
                success: true,
                data: session
            });
        } catch (error) {
            console.error('Error getting chat session:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get chat session'
            });
        }
    }

    // Xóa session chat
    async deleteChatSession(req, res) {
        try {
            const { sessionId } = req.params;

            const session = await Chatbot.findOne({ sessionId });
            if (!session) {
                return res.status(404).json({
                    success: false,
                    message: 'Chat session not found'
                });
            }

            await Chatbot.deleteOne({ sessionId });

            res.json({
                success: true,
                message: 'Chat session deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting chat session:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete chat session'
            });
        }
    }

    // Quản lý training data
    async getTrainingData(req, res) {
        try {
            const { page = 1, limit = 20, type, status } = req.query;
            const skip = (page - 1) * limit;

            const query = {};
            if (type) query.type = type;
            if (status) query.status = status;

            const [trainingData, total] = await Promise.all([
                AITraining.find(query)
                    .sort({ updatedAt: -1 })
                    .skip(skip)
                    .limit(parseInt(limit)),
                AITraining.countDocuments(query)
            ]);

            res.json({
                success: true,
                data: {
                    trainingData,
                    pagination: {
                        current: parseInt(page),
                        total: Math.ceil(total / limit),
                        totalItems: total
                    }
                }
            });
        } catch (error) {
            console.error('Error getting training data:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get training data'
            });
        }
    }

    // Tạo training data mới
    async createTrainingData(req, res) {
        try {
            const { type, input, output, variations, keywords, intent, entities } = req.body;

            if (!type || !input || !output) {
                return res.status(400).json({
                    success: false,
                    message: 'Type, input, and output are required'
                });
            }

            const trainingData = new AITraining({
                type,
                content: {
                    input,
                    output,
                    variations: variations || [input],
                    keywords: keywords || []
                },
                ai: {
                    intent: intent || 'general',
                    entities: entities || [],
                    confidence: 0.8,
                    trainingScore: 0.5
                }
            });

            await trainingData.save();

            res.json({
                success: true,
                message: 'Training data created successfully',
                data: trainingData
            });
        } catch (error) {
            console.error('Error creating training data:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create training data'
            });
        }
    }

    // Cập nhật training data
    async updateTrainingData(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const trainingData = await AITraining.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            );

            if (!trainingData) {
                return res.status(404).json({
                    success: false,
                    message: 'Training data not found'
                });
            }

            res.json({
                success: true,
                message: 'Training data updated successfully',
                data: trainingData
            });
        } catch (error) {
            console.error('Error updating training data:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update training data'
            });
        }
    }

    // Xóa training data
    async deleteTrainingData(req, res) {
        try {
            const { id } = req.params;

            const trainingData = await AITraining.findByIdAndDelete(id);
            if (!trainingData) {
                return res.status(404).json({
                    success: false,
                    message: 'Training data not found'
                });
            }

            res.json({
                success: true,
                message: 'Training data deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting training data:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete training data'
            });
        }
    }

    // Tự động tạo training data từ sản phẩm
    async generateTrainingFromProducts(req, res) {
        try {
            const products = await Product.find({ deleted: false, status: 'active' })
                .populate('product_category_id', 'title');

            let createdCount = 0;
            let updatedCount = 0;

            for (const product of products) {
                // Tạo training data cho tìm kiếm sản phẩm
                const searchVariations = [
                    `tìm ${product.title}`,
                    `mua ${product.title}`,
                    `${product.title} giá bao nhiêu`,
                    `${product.title} còn hàng không`,
                    `có ${product.title} không`
                ];

                for (const variation of searchVariations) {
                    const existing = await AITraining.findOne({
                        'content.input': { $regex: variation, $options: 'i' },
                        type: 'product'
                    });

                    if (!existing) {
                        const trainingData = new AITraining({
                            type: 'product',
                            content: {
                                input: variation,
                                output: `Tôi tìm thấy sản phẩm "${product.title}". Giá: ${product.price.toLocaleString('vi-VN')}đ. Tồn kho: ${product.stock > 0 ? 'Còn hàng' : 'Hết hàng'}.`,
                                variations: [variation],
                                keywords: [product.title, 'tìm', 'mua', 'giá', 'hàng']
                            },
                            reference: {
                                productId: product._id.toString(),
                                categoryId: product.product_category_id?._id?.toString() || '',
                                source: 'auto-generated'
                            },
                            ai: {
                                intent: 'product_search',
                                entities: ['product_name'],
                                confidence: 0.9,
                                trainingScore: 0.8
                            }
                        });

                        await trainingData.save();
                        createdCount++;
                    } else {
                        // Cập nhật training data hiện có
                        if (!existing.content.variations.includes(variation)) {
                            existing.content.variations.push(variation);
                            await existing.save();
                            updatedCount++;
                        }
                    }
                }
            }

            res.json({
                success: true,
                message: `Generated ${createdCount} new training data and updated ${updatedCount} existing ones`,
                data: { created: createdCount, updated: updatedCount }
            });
        } catch (error) {
            console.error('Error generating training data:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate training data'
            });
        }
    }

    // Tự động tạo training data từ danh mục
    async generateTrainingFromCategories(req, res) {
        try {
            const categories = await ProductCategory.find({ deleted: false, status: 'active' });

            let createdCount = 0;
            let updatedCount = 0;

            for (const category of categories) {
                const variations = [
                    `danh mục ${category.title}`,
                    `xem ${category.title}`,
                    `${category.title} có gì`,
                    `sản phẩm ${category.title}`,
                    `loại ${category.title}`
                ];

                for (const variation of variations) {
                    const existing = await AITraining.findOne({
                        'content.input': { $regex: variation, $options: 'i' },
                        type: 'category'
                    });

                    if (!existing) {
                        const trainingData = new AITraining({
                            type: 'category',
                            content: {
                                input: variation,
                                output: `Danh mục "${category.title}": ${category.description || 'Không có mô tả'}. Bạn có thể xem các sản phẩm trong danh mục này.`,
                                variations: [variation],
                                keywords: [category.title, 'danh mục', 'loại', 'sản phẩm']
                            },
                            reference: {
                                categoryId: category._id.toString(),
                                source: 'auto-generated'
                            },
                            ai: {
                                intent: 'category_info',
                                entities: ['category_name'],
                                confidence: 0.9,
                                trainingScore: 0.8
                            }
                        });

                        await trainingData.save();
                        createdCount++;
                    } else {
                        if (!existing.content.variations.includes(variation)) {
                            existing.content.variations.push(variation);
                            await existing.save();
                            updatedCount++;
                        }
                    }
                }
            }

            res.json({
                success: true,
                message: `Generated ${createdCount} new category training data and updated ${updatedCount} existing ones`,
                data: { created: createdCount, updated: updatedCount }
            });
        } catch (error) {
            console.error('Error generating category training data:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate category training data'
            });
        }
    }

    // Thống kê chi tiết
    async getDetailedStats(req, res) {
        try {
            const { startDate, endDate } = req.query;

            const dateFilter = {};
            if (startDate && endDate) {
                dateFilter.createdAt = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                };
            }

            const [
                dailyStats,
                intentStats,
                userStats,
                feedbackStats
            ] = await Promise.all([
                // Thống kê theo ngày
                Chatbot.aggregate([
                    { $match: dateFilter },
                    {
                        $group: {
                            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                            sessions: { $sum: 1 },
                            messages: { $sum: { $size: "$messages" } }
                        }
                    },
                    { $sort: { _id: 1 } }
                ]),

                // Thống kê theo intent
                Chatbot.aggregate([
                    { $unwind: '$messages' },
                    { $match: { 'messages.role': 'assistant' } },
                    {
                        $group: {
                            _id: '$messages.metadata.intent',
                            count: { $sum: 1 },
                            avgConfidence: { $avg: '$messages.metadata.confidence' }
                        }
                    },
                    { $sort: { count: -1 } }
                ]),

                // Thống kê theo user
                Chatbot.aggregate([
                    { $match: { ...dateFilter, userId: { $exists: true, $ne: null } } },
                    {
                        $group: {
                            _id: '$userId',
                            sessions: { $sum: 1 },
                            messages: { $sum: { $size: "$messages" } }
                        }
                    },
                    { $sort: { sessions: -1 } },
                    { $limit: 10 }
                ]),

                // Thống kê feedback
                Chatbot.aggregate([
                    { $match: { ...dateFilter, 'feedback.rating': { $exists: true } } },
                    {
                        $group: {
                            _id: null,
                            avgRating: { $avg: '$feedback.rating' },
                            totalFeedback: { $sum: 1 },
                            helpfulCount: { $sum: { $cond: ['$feedback.helpful', 1, 0] } }
                        }
                    }
                ])
            ]);

            res.json({
                success: true,
                data: {
                    dailyStats,
                    intentStats,
                    userStats,
                    feedbackStats: feedbackStats[0] || {}
                }
            });
        } catch (error) {
            console.error('Error getting detailed stats:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get detailed statistics'
            });
        }
    }

    // Export training data
    async exportTrainingData(req, res) {
        try {
            const { type, format = 'json' } = req.query;

            const query = {};
            if (type) query.type = type;

            const trainingData = await AITraining.find(query).sort({ createdAt: -1 });

            if (format === 'csv') {
                // Tạo CSV format
                const csvData = trainingData.map(item => ({
                    type: item.type,
                    input: item.content.input,
                    output: item.content.output,
                    intent: item.ai.intent,
                    confidence: item.ai.confidence,
                    status: item.status,
                    createdAt: item.createdAt
                }));

                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename=training-data.csv');
                
                // Simple CSV conversion
                const csv = csvData.map(row => 
                    Object.values(row).map(value => `"${value}"`).join(',')
                ).join('\n');
                
                res.send(csv);
            } else {
                res.json({
                    success: true,
                    data: trainingData
                });
            }
        } catch (error) {
            console.error('Error exporting training data:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to export training data'
            });
        }
    }
}

module.exports = new AdminChatbotController();
