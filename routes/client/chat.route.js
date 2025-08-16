const express = require('express');
const router = express.Router();
const controller = require("../../controllers/client/chat.controller");
const chatMidddleware = require("../../middlewares/client/chat.middleware");

router.get("/:roomChatId",chatMidddleware.isAccess,controller.index);


module.exports = router;