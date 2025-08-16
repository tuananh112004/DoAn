const systemConfig = require("../../config/system");
const dashboardRoutes = require("./dashboard.route");
const productRoutes = require("./product.route");
const productCategoryRoutes = require("./product-category.route");
const roleRoutes = require("./role.route");
const accountRoutes = require("./account.route");
const authRoutes = require("./auth.route");
const myAccountRoutes = require("./myAccount.route");
const settingRoutes = require("./setting.route");
const chatRoutes = require("./chat.route");
const commentRoutes = require("./comment.route");
const posRoutes = require("./pos.route");
const authMiddleware = require("../../middlewares/admin/auth.middleware");
const authController = require("../../controllers/admin/auth.controller");

module.exports = (app) => {
    const PATH_ADMIN = "/" + systemConfig.prefixAdmin;

    app.get(PATH_ADMIN, authController.login)

    app.use(PATH_ADMIN + "/dashboard", authMiddleware.requireAuth, dashboardRoutes);

    app.use(PATH_ADMIN + "/products", authMiddleware.requireAuth, productRoutes);

    app.use(PATH_ADMIN + "/products-category", authMiddleware.requireAuth, productCategoryRoutes);

    app.use(PATH_ADMIN + "/roles", authMiddleware.requireAuth, roleRoutes);

    app.use(PATH_ADMIN + "/accounts", authMiddleware.requireAuth, accountRoutes);

    app.use(PATH_ADMIN + "/auth", authRoutes);

    app.use(PATH_ADMIN + "/my-account", authMiddleware.requireAuth, myAccountRoutes);

    app.use(PATH_ADMIN + "/settings", authMiddleware.requireAuth, settingRoutes);

    app.use(PATH_ADMIN + "/chat", authMiddleware.requireAuth, chatRoutes);

    app.use(PATH_ADMIN + "/comments", authMiddleware.requireAuth, commentRoutes);

    app.use(PATH_ADMIN + "/pos", authMiddleware.requireAuth, posRoutes);
}