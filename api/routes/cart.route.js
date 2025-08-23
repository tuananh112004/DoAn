const express = require('express');
const router = express.Router();
const controller = require("../controllers/cart.controller");

router.get("/", controller.cart);
router.post("/add/:productId", controller.addPost);
router.delete("/delete/:productId", controller.delete);
router.put("/update/:productId/:quantity", controller.update);

module.exports = router;
