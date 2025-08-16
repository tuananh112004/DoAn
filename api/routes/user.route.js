const express = require('express');
const router = express.Router();
const controller = require("../controllers/user.controller");
const authMiddleware = require("../../middlewares/client/apiAuth.middleware");
const validate = require("../../validates/client/user.validate");

router.post("/register", validate.registerPost, controller.registerPost);
router.post("/login", validate.loginPost, controller.loginPost);
router.post("/logout", controller.logout);
router.post("/password/forgot", validate.forgotPasswordPost, controller.forgotPasswordPost);
router.post("/password/otp", controller.otpPasswordPost);
router.post("/password/reset", validate.resetPassword, controller.resetPasswordPost);
router.get("/info", authMiddleware.requireAuth, controller.infoUser);

module.exports = router;
