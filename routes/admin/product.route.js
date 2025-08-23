const express = require('express');
const router = express.Router();
const controller = require("../../controllers/admin/product.controller");
const validate = require("../../validates/admin/product.validate");
const multer  = require('multer')
const uploadCloud = require("../../middlewares/admin/uploadCloud.middleware");
const upload = multer();
const permissionMiddleware = require("../../middlewares/client/permission.middleware");
// Routes cần quyền xem sản phẩm
router.get("/", permissionMiddleware.checkProductPermission('view'), controller.index);
router.get("/detail/:id", permissionMiddleware.checkProductPermission('view'), controller.detail);

// Routes cần quyền tạo sản phẩm
router.get("/create", permissionMiddleware.checkProductPermission('create'), controller.createGet);
router.post("/create",
            upload.single('thumbnail'),
            uploadCloud.upload,
            validate.createPost,
            permissionMiddleware.checkProductPermission('create'),
            controller.createPOST
            );

// Routes cần quyền chỉnh sửa sản phẩm
router.get("/edit/:id", permissionMiddleware.checkProductPermission('edit'), controller.edit);
router.patch("/edit/:id",
            upload.single('thumbnail'),
            uploadCloud.upload,
            validate.createPost,
            permissionMiddleware.checkProductPermission('edit'),
            controller.editPatch
          );

// Routes cần quyền xóa sản phẩm
router.delete("/delete/:id", permissionMiddleware.checkProductPermission('delete'), controller.delete);

// Routes cần quyền chỉnh sửa (status và multi)
router.patch("/change-status/:status/:id", permissionMiddleware.checkProductPermission('edit'), controller.changeStatus);
router.patch("/change-multi", permissionMiddleware.checkProductPermission('edit'), controller.changeMulti);

module.exports = router;