const express = require('express');
const router = express.Router();
const controller = require("../controllers/roomsChat.controller");
const authMiddleware = require("../../middlewares/client/apiAuth.middleware");

router.get("/", authMiddleware.requireAuth, controller.index);
router.get("/create", authMiddleware.requireAuth, controller.create);
router.post("/create", authMiddleware.requireAuth, controller.createPost);

module.exports = router;
