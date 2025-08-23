const express = require('express');
const multer = require("multer");
const router = express.Router();
const upload = multer();
const uploadCloud = require("../../middlewares/admin/uploadCloud.middleware");
const controller = require("../../controllers/admin/product-category.controller");
const permissionMiddleware = require("../../middlewares/client/permission.middleware");

// Routes cần quyền xem danh mục
router.get("/", permissionMiddleware.checkCategoryPermission('view'), controller.index);

// Routes cần quyền tạo danh mục
router.get("/create", permissionMiddleware.checkCategoryPermission('create'), controller.create);
router.post("/create",
            upload.single("thumbnail"),
            uploadCloud.upload,
            permissionMiddleware.checkCategoryPermission('create'),
            controller.createPost);

// Routes cần quyền chỉnh sửa danh mục
router.get("/edit/:id", permissionMiddleware.checkCategoryPermission('edit'), controller.edit);
router.patch("/edit/:id",
            upload.single("thumbnail"),
            uploadCloud.upload,
            permissionMiddleware.checkCategoryPermission('edit'),
            controller.editPatch);

module.exports = router;