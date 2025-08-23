module.exports.createPost = (req,res,next)=>{
    if(!req.body.title){
        req.flash("error", "Tao moi thành công 1 bản ghi!");
        res.redirect("back");
        return;
    }
    next();
}