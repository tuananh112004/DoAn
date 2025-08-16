const express = require('express');
const router = express.Router();
const controller = require("../controllers/users.controller");
const authMiddleware = require("../../middlewares/client/apiAuth.middleware");

router.get("/not-friend", authMiddleware.requireAuth, controller.notFriend);
router.get("/request", authMiddleware.requireAuth, controller.request);
router.get("/accept", authMiddleware.requireAuth, controller.accept);
router.get("/friend", authMiddleware.requireAuth, controller.friend);

module.exports = router;
