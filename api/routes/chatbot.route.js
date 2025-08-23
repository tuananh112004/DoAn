const express = require('express');
const router = express.Router();
const chatbotController = require('../../controllers/client/chatbot.controller');

// Khởi tạo session chat mới
router.post('/start', chatbotController.startChat);

// Gửi tin nhắn và nhận phản hồi từ AI
router.post('/message', chatbotController.sendMessage.bind(chatbotController));

// Lấy lịch sử chat
router.get('/history/:sessionId', chatbotController.getChatHistory.bind(chatbotController));

// Lấy các session chat của user
router.get('/user/:userId', chatbotController.getUserChats.bind(chatbotController));

// Đánh giá chất lượng response
router.post('/rate-response', chatbotController.rateResponse.bind(chatbotController));

// Đánh giá toàn bộ cuộc hội thoại
router.post('/rate-chat', chatbotController.rateChat.bind(chatbotController));

// Kết thúc session chat
router.put('/end/:sessionId', chatbotController.endChat.bind(chatbotController));

// Tìm kiếm sản phẩm trực tiếp
router.get('/search-products', chatbotController.searchProducts.bind(chatbotController));

// Lấy danh mục sản phẩm
router.get('/categories', chatbotController.getCategories.bind(chatbotController));

// Lấy đề xuất sản phẩm
router.get('/recommendations', chatbotController.getRecommendations.bind(chatbotController));

module.exports = router;
