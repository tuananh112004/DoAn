const generate = require("../../helper/generate");
const User = require("../../models/user.model");
const Cart = require("../../models/cart.model");
const ForgotPassword = require("../../models/forgotPassword.model");
const md5 = require("md5");
const sendMailHelper = require("../../helper/sendmail");



//[GET] /user/register
module.exports.index = async (req,res)=>{
    res.render("client/pages/user/register")
}

//[POST] /user/register
module.exports.registerPost = async (req,res)=>{
    console.log(req.body);
    const exitEmail = await User.findOne({
        email: req.body.email,
        deleted: false
    });
    if(exitEmail){
        req.flash("error","Email đã tồn tại");
        res.redirect("back");
        return;
    }
    req.body.password = md5(req.body.password);
    const user = new User(req.body);
    user.statusOnline = "online";
    await user.save();
    console.log(user);
    res.cookie("tokenUser",user.tokenUser);

    res.redirect("/");
}

//[GET] /user/login
module.exports.login = async (req,res)=>{
    res.render("client/pages/user/login")
}

//[POST] /user/login
module.exports.loginPost = async (req,res)=>{
    const user = await User.findOne({
        email: req.body.email,
        deleted: false
    });
    if(!user){
        req.flash("error","Email không tồn tại");
        res.redirect("back");
        return;
    }
    if(md5(req.body.password) != user.password){
        req.flash("error","Sai mật khẩu");
        res.redirect("back");
        return;
    }
    if(user.status == "inactive"){
        req.flash("error","Tài khoản đang bị khóa");
        res.redirect("back");
        return;
    }
    res.cookie("tokenUser",user.tokenUser);
    
    await User.updateOne(
        {
            _id: user.id
        },
        {
            statusOnline: "online"
    });
    _io.once('connection', (socket) => {
        socket.broadcast.emit("SERVER_RETURN_ONLINE_STATUS",user.id);
    });

    await Cart.updateOne({
        _id: req.cookies.cartId
    },
    {
        user_id: user.id
    })
    res.redirect("/");
    
}

//[GET] /user/logout
module.exports.logout = async (req,res)=>{
    res.clearCookie("tokenUser");
    await User.updateOne(
        {
            _id: res.locals.user.id
        },
        {
            statusOnline: "offline"
    })
    _io.once('connection', (socket) => {
        socket.broadcast.emit("SERVER_RETURN_OFFLINE_STATUS",res.locals.user.id);
    });
    res.redirect("/");
}

//[GET] /user/password/forgot
module.exports.forgotPassword = async (req,res)=>{
    res.render("client/pages/user/forgot-password");
}

//[POST] /user/password/forgot
module.exports.forgotPasswordPost = async (req,res)=>{
    const email = req.body.email;
    const user = await User.findOne({
        email: email,
        deleted: false
    });
    if(!user){
        req.flash("error","Email không tồn tại");
        res.redirect("back");
        return;
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
    res.redirect(`/user/password/otp?email=${email}`);
}

//[GET] /user/password/otp
module.exports.otpPassword = async (req,res)=>{
    const email = req.query.email;

    res.render("client/pages/user/otp-password.pug",{
        pageTitle: "Nhập mã OTP",
        email: email
    })

}

//[POST] /user/password/otp
module.exports.otpPasswordPost = async (req,res)=>{
    const email = req.body.email;
    const otp = req.body.otp;

    const result = await ForgotPassword.findOne({
        email: email,
        otp: otp
    })
    if(!result){
        req.flash("error", "Sai OTP");
        res.redirect("back");
        return;
    }
    const user = await User.findOne({
        email: email
    });
    res.cookie("tokenUser", user.tokenUser);
    res.redirect("/user/password/reset");
}

//[GET] /user/password/reset
module.exports.resetPassword = async (req,res)=>{
    res.render("client/pages/user/reset-password");
}

//[POST] /user/password/reset
module.exports.resetPasswordPost = async (req,res)=>{
    const password = req.body.password;
    await User.updateOne({
        tokenUser: req.cookies.tokenUser
    },{
        password: md5(password)
    })
    res.redirect("/");
}

//[GET] /user/info
module.exports.infoUser = async (req,res)=>{
    res.render("client/pages/user/info");
}



