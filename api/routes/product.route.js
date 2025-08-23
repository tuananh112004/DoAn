const express = require('express');
const router = express.Router();
const controller = require("../controllers/product.controller");
const permissionMiddleware = require("../../middlewares/client/permission.middleware");

// Routes không cần quyền - ai cũng có thể xem
router.get("/", controller.index);
router.get("/categories", controller.categories);
router.get("/:slugProduct", controller.detail);
router.get("/category/:slugCategory", controller.category);

module.exports = router;
