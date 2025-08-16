const ProductCategory = require("../../models/product-category.model");


const createTree = require("../../helper/createTree");

//[GET] /admin/products-category
module.exports.index = async(req,res)=>{
    const find = {
        deleted: false
    }
    const records = await ProductCategory.find(find);
    const newRecords = createTree(records);
    res.render("admin/pages/product-category/index.pug",{
        pageTitle: "Danh sách sản phẩm",
        records: newRecords
    });
}
//[GET] /admin/products-category/create
module.exports.create = async(req,res)=>{
    const find = {
        deleted: false
    }
    const records = await ProductCategory.find(find);
    const newRecords = createTree(records);
    res.render("admin/pages/product-category/create.pug",{
        pageTitle: "Danh sách sản phẩm",
        records: newRecords
    });
}
//[POST] /admin/products-category/create
module.exports.createPost = async(req,res)=>{
   if(req.body.position == ""){
        const cnt = await ProductCategory.countDocuments();
        req.body.position = cnt + 1;
    }
    else{
        req.body.position = parseInt(req.body.position);
    }
    const newProduct = new ProductCategory(req.body);
    await newProduct.save();
    res.redirect(`back`);

}

//[GET] /admin/products-category/edit/:id
module.exports.edit = async(req,res)=>{
    const id = req.params.id;
    const product = await ProductCategory.findOne({_id:id,deleted:false});
    const records = await ProductCategory.find({deleted:false});
    const newRecords = createTree(records);
    res.render("admin/pages/product-category/edit",{
        data: product,
        records: newRecords
    })
}

//[PATCH] /admin/products-category/edit/:id
module.exports.editPatch = async(req,res)=>{
    const id = req.params.id;
    req.body.position = parseInt(req.body.position);
    if(req.file && req.file.filename){
        req.body.thumbnail = `/uploads/${req.file.filename}`;
    }
    await ProductCategory.updateOne({_id:id},req.body);

    res.redirect("back");
}
