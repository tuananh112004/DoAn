const rateLimit = require('express-rate-limit');

// Hàm tạo key mặc định từ IP
const ipKeyGenerator = (req) => req.ip;

// Giới hạn tạo comment: 5 comment/phút/user
const commentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Bạn đã tạo quá nhiều comment. Vui lòng đợi một lúc."
    });
  },
  keyGenerator: (req) => {
    return req.user ? req.user._id.toString() : ipKeyGenerator(req);
  },
  skip: (req) => req.user && req.user.role === 'admin'
});

// Giới hạn chung cho API: 100 requests/phút/IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Quá nhiều yêu cầu. Vui lòng thử lại sau."
    });
  },
  keyGenerator: ipKeyGenerator
});

// Giới hạn đăng nhập: 5 lần/phút/IP
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau."
    });
  },
  keyGenerator: ipKeyGenerator,
  skip: (req) => req.user && req.user.role === 'admin'
});

// Giới hạn upload file: 10 files/phút/user
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Quá nhiều file được upload. Vui lòng thử lại sau."
    });
  },
  keyGenerator: (req) => {
    return req.user ? req.user._id.toString() : ipKeyGenerator(req);
  },
  skip: (req) => req.user && req.user.role === 'admin'
});

module.exports = {
  commentLimiter,
  apiLimiter,
  loginLimiter,
  uploadLimiter
};
