const express = require("express");
const router = express.Router();
const commentController = require("../../controllers/admin/comment.controller");
const authMiddleware = require("../../middlewares/admin/auth.middleware");

// Áp dụng middleware auth cho tất cả routes
router.use(authMiddleware.requireAuth);

// Danh sách comment vi phạm
router.get("/violations", commentController.getViolationComments);

// Duyệt comment
router.put("/:id/approve", commentController.approveComment);

// Từ chối comment
router.put("/:id/reject", commentController.rejectComment);

// Xóa vĩnh viễn comment
router.delete("/:id/delete-permanent", commentController.deletePermanent);

// Kiểm duyệt lại comment
router.post("/:id/remoderate", commentController.remoderateComment);

module.exports = router; 