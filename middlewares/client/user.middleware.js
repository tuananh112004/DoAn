const User = require("../../models/user.model");

module.exports.infoUser = async (req, res, next) => {
    console.log("TokenUser from cookies:", req.cookies.tokenUser); // Debug log
    
    if(req.cookies.tokenUser){
        const user = await User.findOne({
            tokenUser: req.cookies.tokenUser,
            deleted: false
        }).select("-password");
        
        console.log("Found user:", user ? user.fullName : "No user found"); // Debug log
        
        if(user){
            res.locals.user = user;
            req.user = user;
        }
    }
    
    next();
}