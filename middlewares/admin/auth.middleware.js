const Account = require("../../models/account.model");
const Role = require("../../models/role.model");
const systemConfig = require("../../config/system");

module.exports.requireAuth = async (req, res, next) => {
    if (!req.cookies.token) {
        res.redirect(`/${systemConfig.prefixAdmin}/auth/login`);
        return;
    }
    
    try {
        const user = await Account.findOne({ token: req.cookies.token });
        if (!user) {
            res.redirect(`/${systemConfig.prefixAdmin}/auth/login`);
            return;
        }
        
        const role = await Role.findOne({ _id: user.role_id }).select("title permission");
        if (!role) {
            res.redirect(`/${systemConfig.prefixAdmin}/auth/login`);
            return;
        }
        
        // Gán user và role vào req để middleware phân quyền có thể sử dụng
        req.user = user;
        req.role = role;
        req.user.permission = role.permission; // Gán permission vào user object
        
        // Gán vào res.locals để view có thể sử dụng
        res.locals.user = user;
        res.locals.role = role;
        
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.redirect(`/${systemConfig.prefixAdmin}/auth/login`);
    }
};