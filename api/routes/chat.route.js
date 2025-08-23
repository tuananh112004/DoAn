const express = require('express');
const router = express.Router();
const controller = require("../controllers/chat.controller");

router.get("/:roomChatId", controller.index);

module.exports = router;
