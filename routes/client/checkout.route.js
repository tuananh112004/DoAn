const express = require('express');
const router = express.Router();
const controller = require("../../controllers/client/checkout.controller");

// Thêm dòng log này để kiểm tra xem request có đi vào router này không
router.use((req, res, next) => {
    console.log("--> Request đã đi vào checkout.route.js");
    next(); // Rất quan trọng, phải gọi next() để request tiếp tục
});

router.get("/", controller.index);

router.post("/order", controller.order);

router.get("/success/:id", controller.success);

// Sửa đường dẫn ở đây để khớp với vnp_ReturnUrl trong vnpayConfig.js
router.get("/vnpay-return", controller.vnpayReturn);

module.exports = router;