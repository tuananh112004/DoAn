const express = require("express");
const router = express.Router();
const controller = require("../../controllers/admin/dashboard.controller");

// Dashboard cho phép truy cập cơ bản cho admin (không yêu cầu quyền cụ thể)
router.get("/", controller.dashboard);

module.exports = router;