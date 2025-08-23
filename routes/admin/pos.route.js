const express = require('express');
const router = express.Router();
const controller = require("../../controllers/admin/pos.controller");
const { requireAuth } = require("../../middlewares/admin/auth.middleware");

router.get("/", requireAuth, controller.index);
router.get("/lookup-by-barcode", requireAuth, controller.lookupByBarcode);
router.post("/order", requireAuth, controller.createOrder);

module.exports = router;


