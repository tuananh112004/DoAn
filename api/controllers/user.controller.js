const generate = require("../../helper/generate");
const User = require("../../models/user.model");
const Cart = require("../../models/cart.model");
const ForgotPassword = require("../../models/forgotPassword.model");
const md5 = require("md5");
const sendMailHelper = require("../../helper/sendmail");

// Centralize cookie options to ensure set and clear use identical attributes
function getTokenCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  const options = {
    path: "/",
    httpOnly: true,
    sameSite: isProduction ? "lax" : "lax",
  };
  if (isProduction) {
    options.secure = true;
  }
  if (process.env.COOKIE_DOMAIN) {
    options.domain = process.env.COOKIE_DOMAIN;
  }
  return options;
}

// //[POST] /api/user/register
// module.exports.registerPost = async (req, res) => {
//   try {
//     const exitEmail = await User.findOne({
//       email: req.body.email,
//       deleted: false
//     });
    
//     if(exitEmail){
//       return res.status(400).json({
//         success: false,
//         message: "Email đã tồn tại"
//       });
//     }
    
//     req.body.password = md5(req.body.password);
//     const user = new User(req.body);
//     user.statusOnline = "online";
//     await user.save();
    
//     res.cookie("tokenUser", user.tokenUser, getTokenCookieOptions());

//     res.json({
//       success: true,
//       message: "Đăng ký thành công",
//       data: {
//         user: {
//           id: user._id,
//           email: user.email,
//           fullName: user.fullName,
//           tokenUser: user.tokenUser
//         }
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Lỗi server",
//       error: error.message
//     });
//   }
// };

//[POST] /api/user/login
// module.exports.loginPost = async (req, res) => {
//   try {
//     const user = await User.findOne({
//       email: req.body.email,
//       deleted: false
//     });
    
//     if(!user){
//       return res.status(400).json({
//         success: false,
//         message: "Email không tồn tại"
//       });
//     }
    
//     if(md5(req.body.password) != user.password){
//       return res.status(400).json({
//         success: false,
//         message: "Sai mật khẩu"
//       });
//     }
    
//     if(user.status == "inactive"){
//       return res.status(400).json({
//         success: false,
//         message: "Tài khoản đang bị khóa"
//       });
//     }
    
//     res.cookie("tokenUser", user.tokenUser, getTokenCookieOptions());
    
//     await User.updateOne(
//       {
//         _id: user.id
//       },
//       {
//         statusOnline: "online"
//       }
//     );
    
//     _io.once('connection', (socket) => {
//       socket.broadcast.emit("SERVER_RETURN_ONLINE_STATUS", user.id);
//     });

//     await Cart.updateOne({
//       _id: req.cookies.cartId
//     },
//     {
//       user_id: user.id
//     });

//     res.json({
//       success: true,
//       message: "Đăng nhập thành công",
//       data: {
//         user: {
//           id: user._id,
//           email: user.email,
//           fullName: user.fullName,
//           tokenUser: user.tokenUser
//         }
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Lỗi server",
//       error: error.message
//     });
//   }
// };

//[POST] /api/user/logout
// module.exports.logout = async (req, res) => {
//   try {
//     // clear must use the same options (path/domain/sameSite/secure) as set
//     res.clearCookie("tokenUser", getTokenCookieOptions());
    
//     if (res.locals.user) {
//       await User.updateOne(
//         {
//           _id: res.locals.user.id
//         },
//         {
//           statusOnline: "offline"
//         }
//       );
      
//       _io.once('connection', (socket) => {
//         socket.broadcast.emit("SERVER_RETURN_OFFLINE_STATUS", res.locals.user.id);
//       });
//     }

//     res.json({
//       success: true,
//       message: "Đăng xuất thành công"
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Lỗi server",
//       error: error.message
//     });
//   }
// };
// [POST] /api/user/register
module.exports.registerPost = async (req, res) => {
  try {
    const exitEmail = await User.findOne({ email: req.body.email, deleted: false });
    if (exitEmail) {
      return res.status(400).json({ success: false, message: "Email đã tồn tại" });
    }

    req.body.password = md5(req.body.password);
    const user = new User(req.body);
    user.statusOnline = "online";
    await user.save();

    res.cookie("tokenUser", user.tokenUser, getTokenCookieOptions());

    res.json({
      success: true,
      message: "Đăng ký thành công",
      data: {
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          tokenUser: user.tokenUser,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};

// [POST] /api/user/login
module.exports.loginPost = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email, deleted: false });
    if (!user) return res.status(400).json({ success: false, message: "Email không tồn tại" });
    if (md5(req.body.password) != user.password)
      return res.status(400).json({ success: false, message: "Sai mật khẩu" });
    if (user.status == "inactive")
      return res.status(400).json({ success: false, message: "Tài khoản đang bị khóa" });

    res.cookie("tokenUser", user.tokenUser, getTokenCookieOptions());

    await User.updateOne({ _id: user.id }, { statusOnline: "online" });
    _io.once("connection", (socket) => {
      socket.broadcast.emit("SERVER_RETURN_ONLINE_STATUS", user.id);
    });

    await Cart.updateOne({ _id: req.cookies.cartId }, { user_id: user.id });

    res.json({
      success: true,
      message: "Đăng nhập thành công",
      data: {
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          tokenUser: user.tokenUser,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};

// [POST] /api/user/logout
module.exports.logout = async (req, res) => {
  try {
    console.log("Cookie trước khi clear:", req.cookies.tokenUser);
    res.clearCookie("tokenUser", getTokenCookieOptions());
    console.log("Đã gửi header clear cookie");

    if (res.locals.user) {
      await User.updateOne({ _id: res.locals.user.id }, { statusOnline: "offline" });
      _io.once("connection", (socket) => {
        socket.broadcast.emit("SERVER_RETURN_OFFLINE_STATUS", res.locals.user.id);
      });
    }

    res.json({ success: true, message: "Đăng xuất thành công" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};
//[POST] /api/user/password/forgot
module.exports.forgotPasswordPost = async (req, res) => {
  try {
    const email = req.body.email;
    const user = await User.findOne({
      email: email,
      deleted: false
    });
    
    if(!user){
      return res.status(400).json({
        success: false,
        message: "Email không tồn tại"
      });
    }
    
    //Tạo mã OTP và lưu vào collection
    const otp = generate.generateRandomNumber(6);

    const forgotPasswordObject = {
      email: email,
      otp: otp,
      expireAt: Date.now()
    }

    const forgotPassword = new ForgotPassword(forgotPasswordObject);
    await forgotPassword.save();

    //Gửi mã OTP qua email
    const subject = `Mã OTP xác minh lấy lại mật khẩu`;
    const html = `
    Mã OTP xác minh lấy lại mật khẩu là <b>${otp}</b>. Thời hạn sử dụng là 3 phút. Lưu ý không được để lộ mã OTP.
    `;

    sendMailHelper.sendMail(email, subject, html);
    
    res.json({
      success: true,
      message: "Mã OTP đã được gửi đến email của bạn",
      data: {
        email: email
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message
    });
  }
};

//[POST] /api/user/password/otp
module.exports.otpPasswordPost = async (req, res) => {
  try {
    const email = req.body.email;
    const otp = req.body.otp;

    const result = await ForgotPassword.findOne({
      email: email,
      otp: otp
    });
    
    if(!result){
      return res.status(400).json({
        success: false,
        message: "Sai OTP"
      });
    }
    
    const user = await User.findOne({
      email: email
    });
    
    res.cookie("tokenUser", user.tokenUser, getTokenCookieOptions());
    
    res.json({
      success: true,
      message: "Xác thực OTP thành công",
      data: {
        tokenUser: user.tokenUser
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message
    });
  }
};

//[POST] /api/user/password/reset
module.exports.resetPasswordPost = async (req, res) => {
  try {
    const password = req.body.password;
    
    await User.updateOne({
      tokenUser: req.cookies.tokenUser
    },{
      password: md5(password)
    });
    
    res.json({
      success: true,
      message: "Đặt lại mật khẩu thành công"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message
    });
  }
};

//[GET] /api/user/info
module.exports.infoUser = async (req, res) => {
  try {
    if (!res.locals.user) {
      return res.status(401).json({
        success: false,
        message: "Chưa đăng nhập"
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: res.locals.user._id,
          email: res.locals.user.email,
          fullName: res.locals.user.fullName,
          phone: res.locals.user.phone,
          address: res.locals.user.address
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message
    });
  }
};
