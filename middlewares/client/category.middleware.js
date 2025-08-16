const productCategory = require("../../models/product-category.model");
const createTree = require("../../helper/createTree");

module.exports.category = async (req,res,next)=>{
    const category = await productCategory.find({deleted: false});
    const categoryLayout = createTree(category);

    res.locals.categoryLayout = categoryLayout;

    next();
}