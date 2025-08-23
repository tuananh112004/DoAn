const User = require("../../models/user.model");

module.exports.requireAuth = async (req, res, next) => {
  try {
    let token = null;
    
    // Kiểm tra token từ cookie trước
    if (req.cookies.tokenUser) {
      token = req.cookies.tokenUser;
    }
    // Nếu không có cookie, kiểm tra header Authorization
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7); // Bỏ 'Bearer ' prefix
    }
    // Kiểm tra cookie 'token' (React app sử dụng)
    else if (req.cookies.token) {
      token = req.cookies.token;
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Chưa đăng nhập"
      });
    }
    
    // Tìm user theo token (kiểm tra cả tokenUser và token)
    const user = await User.findOne({
      $or: [
        { tokenUser: token },
        { token: token }
      ],
      deleted: false
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Token không hợp lệ"
      });
    }
    
    if (user.status === "inactive") {
      return res.status(403).json({
        success: false,
        message: "Tài khoản đang bị khóa"
      });
    }
    
    req.user = user;
    res.locals.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: "Lỗi xác thực",
      error: error.message
    });
  }
};