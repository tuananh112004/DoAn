const mongoose = require("mongoose");

const aiTrainingSchema = new mongoose.Schema({
    // Loại dữ liệu training
    type: {
        type: String,
        enum: ['product', 'category', 'faq', 'intent', 'response'],
        required: true
    },
    
    // Nội dung training
    content: {
        input: String,        // Câu hỏi/input từ user
        output: String,       // Câu trả lời/response
        variations: [String], // Các biến thể của câu hỏi
        keywords: [String]    // Từ khóa quan trọng
    },
    
    // Liên kết với dữ liệu
    reference: {
        productId: String,
        categoryId: String,
        source: String
    },
    
    // Metadata AI
    ai: {
        intent: String,           // Ý định của user
        entities: [String],       // Các entity được nhận diện
        confidence: Number,       // Độ tin cậy
        trainingScore: Number     // Điểm training
    },
    
    // Trạng thái và cải thiện
    status: {
        type: String,
        enum: ['active', 'training', 'archived'],
        default: 'active'
    },
    
    // Thống kê sử dụng
    usage: {
        timesUsed: {
            type: Number,
            default: 0
        },
        lastUsed: Date,
        successRate: Number
    },
    
    // Feedback từ user
    feedback: [{
        userId: String,
        rating: Number,
        comment: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    
    createdAt: {
        type: Date,
        default: Date.now
    },
    
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes
aiTrainingSchema.index({ type: 1, status: 1 });
aiTrainingSchema.index({ 'content.keywords': 1 });
aiTrainingSchema.index({ 'ai.intent': 1 });

const AITraining = mongoose.model("AITraining", aiTrainingSchema, "ai-training");

module.exports = AITraining;
