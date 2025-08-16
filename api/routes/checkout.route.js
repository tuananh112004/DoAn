const express = require('express');
const router = express.Router();
const controller = require("../controllers/checkout.controller");

router.get("/", controller.index);
router.post("/", controller.order);
router.get("/success/:id", controller.success);
router.get("/vnpay-return", controller.vnpayReturn);

module.exports = router;
