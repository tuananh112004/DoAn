const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    product_id: {
        type: String,
        required: true
    },
    user_id: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        default: 5
    },
    parent_id: {
        type: String,
        default: null
    },
    status: {
        type: String,
        default: "active"
    },
    deleted: {
        type: Boolean,
        default: false
    },
    deletedAt: Date,
    deletedBy: {
        user_id: String,
        deletedAt: Date
    },
    // AI Moderation fields
    aiModeration: {
        isChecked: {
            type: Boolean,
            default: false
        },
        isViolation: {
            type: Boolean,
            default: false
        },
        violationType: {
            type: String,
            default: null
        },
        flagged: {
            type: Boolean,
            default: false
        },
        categories: {
            type: Object,
            default: {}
        },
        scores: {
            type: Object,
            default: {}
        },
        moderatedAt: {
            type: Date,
            default: null
        }
    }
}, {
    timestamps: true
});

const Comment = mongoose.model("Comment", commentSchema, "comments");

module.exports = Comment; 