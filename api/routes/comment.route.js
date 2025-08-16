const express = require('express');
const router = express.Router();
const controller = require("../controllers/comment.controller");
const authMiddleware = require("../../middlewares/client/apiAuth.middleware");
const permissionMiddleware = require("../../middlewares/client/permission.middleware");
const { commentLimiter } = require('../../middlewares/rateLimiter');

// Routes cơ bản
router.post("/create", commentLimiter, authMiddleware.requireAuth, controller.create);
router.get("/product/:product_id", controller.getByProduct);
router.put("/:id", authMiddleware.requireAuth, controller.update);
router.delete("/:id", authMiddleware.requireAuth, permissionMiddleware.checkCommentPermission('delete'), controller.delete);
router.get("/replies/:parent_id", controller.getReplies);

// Các routes AI moderation đã được loại bỏ:
// - /stats
// - /reset-stats  
// - /cleanup-cache

module.exports = router;
