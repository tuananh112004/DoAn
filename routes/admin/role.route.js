const express = require("express");
const router = express.Router();
const controller = require("../../controllers/admin/role.controller");
const permissionMiddleware = require("../../middlewares/client/permission.middleware");

// Routes cần quyền xem nhóm quyền
router.get("/", permissionMiddleware.checkRolePermission('view'), controller.index);
router.get("/create", permissionMiddleware.checkRolePermission('create'), controller.create);
router.post("/create", permissionMiddleware.checkRolePermission('create'), controller.createPost);

// Routes cần quyền chỉnh sửa nhóm quyền
router.get("/edit/:id", permissionMiddleware.checkRolePermission('edit'), controller.edit);
router.patch("/edit/:id", permissionMiddleware.checkRolePermission('edit'), controller.editPatch);

// Routes cần quyền phân quyền
router.get("/permission", permissionMiddleware.checkRolePermission('permissions'), controller.permission);
router.patch("/permission", permissionMiddleware.checkRolePermission('permissions'), controller.permissionPatch);

module.exports = router;