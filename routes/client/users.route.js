const express = require('express');
const router = express.Router();
const controller = require("../../controllers/client/users.controller");
const authMidddleware = require("../../middlewares/client/auth.middleware");

router.get("/not-friend",authMidddleware.requireAuth,controller.notFriend);

router.get("/request",authMidddleware.requireAuth,controller.request);

router.get("/accept",authMidddleware.requireAuth,controller.accept);

router.get("/friends",authMidddleware.requireAuth,controller.friend);


module.exports = router;