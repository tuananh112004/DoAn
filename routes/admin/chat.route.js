const express = require("express");
const router = express.Router();
const controller = require("../../controllers/admin/chat.controller");
const authMiddleware = require("../../middlewares/admin/auth.middleware");

router.use(authMiddleware.requireAuth);

router.get("/support", controller.support);
router.get("/:roomChatId", controller.room);

module.exports = router; 