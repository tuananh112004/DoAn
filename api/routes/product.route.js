const express = require('express');
const router = express.Router();
const controller = require("../controllers/product.controller");
const permissionMiddleware = require("../../middlewares/client/permission.middleware");

// Routes cần quyền xem sản phẩm
router.get("/", permissionMiddleware.checkProductPermission('view'), controller.index);
router.get("/categories", permissionMiddleware.checkCategoryPermission('view'), controller.categories);
router.get("/:slugProduct", permissionMiddleware.checkProductPermission('view'), controller.detail);
router.get("/category/:slugCategory", permissionMiddleware.checkCategoryPermission('view'), controller.category);

module.exports = router;
