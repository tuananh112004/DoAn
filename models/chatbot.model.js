const mongoose = require("mongoose");

const chatbotSchema = new mongoose.Schema({
    // Thông tin cuộc hội thoại
    sessionId: {
        type: String,
        required: true,
        index: true
    },
    userId: {
        type: String,
        default: null
    },
    
    // Nội dung chat
    messages: [{
        role: {
            type: String,
            enum: ['user', 'assistant', 'system'],
            required: true
        },
        content: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        metadata: {
            productId: String,
            categoryId: String,
            intent: String,
            confidence: Number
        }
    }],
    
    // Context và trạng thái
    context: {
        currentCategory: String,
        currentProduct: String,
        userPreferences: [String],
        searchHistory: [String],
        cartItems: [String]
    },
    
    // Training data và cải thiện
    feedback: {
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        helpful: Boolean,
        comment: String
    },
    
    // Metadata
    status: {
        type: String,
        enum: ['active', 'completed', 'archived'],
        default: 'active'
    },
    
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
chatbotSchema.index({ sessionId: 1, createdAt: -1 });
chatbotSchema.index({ userId: 1, createdAt: -1 });

const Chatbot = mongoose.model("Chatbot", chatbotSchema, "chatbots");

module.exports = Chatbot;
