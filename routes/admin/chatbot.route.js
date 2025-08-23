const express = require('express');
const router = express.Router();
const chatbotController = require('../../controllers/admin/chatbot.controller');
const authMiddleware = require('../../middlewares/admin/auth.middleware');

// Áp dụng middleware xác thực cho tất cả routes
router.use(authMiddleware.requireAuth);

// Dashboard
router.get('/dashboard', chatbotController.getDashboard);

// Quản lý chat sessions
router.get('/sessions', chatbotController.getChatSessions);
router.get('/sessions/:sessionId', chatbotController.getChatSession);
router.delete('/sessions/:sessionId', chatbotController.deleteChatSession);

// Quản lý training data
router.get('/training', chatbotController.getTrainingData);
router.post('/training', chatbotController.createTrainingData);
router.put('/training/:id', chatbotController.updateTrainingData);
router.delete('/training/:id', chatbotController.deleteTrainingData);

// Tự động tạo training data
router.post('/training/generate-products', chatbotController.generateTrainingFromProducts);
router.post('/training/generate-categories', chatbotController.generateTrainingFromCategories);

// Thống kê chi tiết
router.get('/stats', chatbotController.getDetailedStats);

// Export data
router.get('/export', chatbotController.exportTrainingData);

module.exports = router;
