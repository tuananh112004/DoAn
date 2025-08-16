const express = require('express');
const router = express.Router();
const controller = require("../../controllers/client/comment.controller");
const authMiddleware = require("../../middlewares/client/auth.middleware");

// Tạo comment mới (yêu cầu đăng nhập)
router.post("/create", authMiddleware.requireAuth, controller.create);

// Lấy danh sách comment theo sản phẩm
router.get("/product/:product_id", controller.getByProduct);

// Lấy danh sách replies của một comment
router.get("/replies/:parent_id", controller.getReplies);

// Cập nhật comment (yêu cầu đăng nhập)
router.put("/:id", authMiddleware.requireAuth, controller.update);

// Xóa comment (yêu cầu đăng nhập)
router.delete("/:id", authMiddleware.requireAuth, controller.delete);

module.exports = router; 