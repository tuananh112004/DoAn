const express = require("express");
const router = express.Router();
const multer  = require('multer')
const uploadCloud = require("../../middlewares/admin/uploadCloud.middleware");
const upload = multer();
const controller = require("../../controllers/admin/account.controller");
const permissionMiddleware = require("../../middlewares/client/permission.middleware");

// Routes cần quyền xem tài khoản
router.get("/", permissionMiddleware.checkAccountPermission('view'), controller.index);

// Routes cần quyền tạo tài khoản
router.get("/create", permissionMiddleware.checkAccountPermission('create'), controller.create);
router.post("/create",
            upload.single('avatar'),
            uploadCloud.upload,
            permissionMiddleware.checkAccountPermission('create'),
            controller.createPost);

// Routes cần quyền chỉnh sửa tài khoản
router.get("/edit/:id", permissionMiddleware.checkAccountPermission('edit'), controller.edit);
router.patch("/edit/:id",
            upload.single('avatar'),
            uploadCloud.upload,
            permissionMiddleware.checkAccountPermission('edit'),
            controller.editPatch);

module.exports = router;