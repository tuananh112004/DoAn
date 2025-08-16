// const Product = require("../../models/product.model");
// const ProductCategory = require("../../models/product-category.model");
// const Account = require("../../models/account.model");

// const createTree = require("../../helper/createTree");
// const filterStatusHelper = require("../../helper/filterStatus");
// const searchHelper = require("../../helper/search");
// const pagination = require("../../helper/pagination");
// const systemConfig = require("../../config/system");

// //[GET] /admin/product
// module.exports.index = async(req,res)=>{
//     const filterStatus = filterStatusHelper(req.query);
    
//     let objSearch = searchHelper(req.query);

//     let find = {
//         deleted: false
//     };
//     if(req.query.status) {
//         find.status = req.query.status;
//     }
//     if(req.query.keyword) {
//         find.title = objSearch.regex;
//     }
    
//     let sort={};
//     if(req.query.sortKey && req.query.sortValue !=""){
//         sort[req.query.sortKey] = req.query.sortValue;
//     }
//     else{
//         sort.position = "desc";
//     }
//     let initPagination = {
//         currentPage: 1,
//         limitItem: 5
//     }
//     let countProduct = await Product.count(find);
//     const paginationObject = pagination(initPagination,req.query,countProduct);
//     const products = await Product.find(find)
//         .sort(sort)
//         .limit(paginationObject.limitItem)
//         .skip(paginationObject.skip);

    
//     for(const product of products){

//         //Lấy ra người tạo
//         const userCreate = await Account.findOne({
//             _id: product.createdBy.account_id
//         });
//         if(userCreate){
//             product.createdBy.accountFullName = userCreate.fullName;
//         }

//          //Lấy ra người sửa
//         const updatedUserid = product.updatedBy.slice(-1)[0];
//         if(updatedUserid){
//             const updatedUser = await Account.findOne({_id: updatedUserid.account_id});
//             if(updatedUser){
//                 updatedUserid.accountFullName = updatedUser.fullName;
//             }
//         }
//     }

   



//     if(countProduct > 0 && products.length == 0){
//         let hrefString = "";
//         for(let key in req.query){
//             if(key != "page"){
//                 hrefString += `&${key}=${req.query[key]}`;
//             }
//         }
//         const href = `${req.baseUrl}?page=1${hrefString}`;
       
//         res.redirect(href);   
//     }
//     else{
        
//         res.render("admin/pages/products/index.pug",{
//             pageTitle: "Danh sách sản phẩm",
//             products: products,
//             filterStatus: filterStatus,
//             keyword: objSearch.keyword,
//             pagination: paginationObject
//         });
//      }
    

// }

// //[PATCH] /admin/product/change-status/:status/:id
// module.exports.changeStatus = async(req,res)=>{
//     if(res.locals.role.permission.includes("products_edit")){
//         const status = req.params.status;
//         const id = req.params.id;


//         const updatedBy = {
//             account_id: res.locals.user.id,
//             updatedAt: Date()
//         };


//         await Product.updateOne({_id:id},{status:status,$push:{ updatedBy: updatedBy}});
//         req.flash("success", "Cập nhật trạng thái thành công!");
//         res.redirect("back");
//     }
//     else{
//         req.flash("error", "Không có quyền chỉnh sửa");
//         res.redirect("back");
//     }
    
    
// }
// //[PATCH] /admin/product/change-multi
// module.exports.changeMulti = async(req,res)=>{
//     const type = req.body.type;
//     const ids = req.body.ids.split(", ");
//     const updatedBy = {
//         account_id: res.locals.user.id,
//         updatedAt: Date()
//     };
//     switch(type){
//         case "active":
//         case "inactive":
//             await Product.updateMany({_id:{$in:ids}},{status:type,$push:{ updatedBy: updatedBy}});
//             req.flash("success", `Cập nhật trạng thái thành công ${ids.length} bản ghi!`);
//             break;
//         case "delete":
//             await Product.updateMany({_id:{$in:ids}},{deleted:true});
//             req.flash("success", `Xóa thành công ${ids.length} bản ghi!`);
//             break;
//         case "change-position":
//             console.log("123");
//             for(const item of ids){
//                 const [id, position] = item.split("-");
//                 console.log(id);
//                 console.log(position);
//                 await Product.updateOne({_id:id},{position:position,$push:{ updatedBy: updatedBy}});
//             }
//             req.flash("success", `Thay đổi vị trí thành công ${ids.length} bản ghi!`);
//             break;

//         default:
//             break;
//     }
    
//     res.redirect("back");
// }

// //[PATCH] /admin/product/delete
// module.exports.delete = async(req,res)=>{
//     const id = req.params.id;
//     console.log(req);
//     await Product.updateOne({_id:id},{
//         deleted:true,
//         deletedBy:{
//             account_id: res.locals.user.id,
//             deletedAt: new Date()
//         }
//     });
//     res.redirect("back");
// }

// //[GET] /create
// module.exports.createGet = async(req,res)=>{
//     const find = {
//         deleted: false
//     }
//     const records = await ProductCategory.find(find);
//     const newRecords = createTree(records);
//     res.render("admin/pages/products/create.pug",{
//         pageTitle: "Create a new one",
//         records: newRecords
//     });
// }

// //[POST] /create
// module.exports.createPOST = async(req,res)=>{
//     req.body.price = parseInt(req.body.price);
//     req.body.discountPercentage = parseInt(req.body.discountPercentage);
//     req.body.stock = parseInt(req.body.stock);
//     if(req.body.position == ""){
//         const cnt = await Product.countDocuments();
//         req.body.position = cnt + 1;
//     }
//     else{
//         req.body.position = parseInt(req.body.position);
//     }
//     req.body.createdBy = {
//         account_id : res.locals.user.id
//     }
//     const newProduct = new Product(req.body);
//     await newProduct.save();
//     req.flash("success", `Tao moi thành công 1 bản ghi!`);
//     res.redirect(`/${systemConfig.prefixAdmin}/products`);
// }

// //[GET] /edit/:id
// module.exports.edit = async(req,res)=>{
//     const id = req.params.id;
//     const product = await Product.findOne({_id:id,deleted:false});
//     const find = {
//         deleted: false
//     }
//     const records = await ProductCategory.find(find);
//     const newRecords = createTree(records);
//     res.render("admin/pages/products/edit",{
//         product: product,
//         records: newRecords
//     })
   
// }

// //[PATCH] /edit/:id
// module.exports.editPatch = async(req,res)=>{
//     const id = req.params.id;
//     req.body.price = parseInt(req.body.price);
//     req.body.discountPercentage = parseFloat(req.body.discountPercentage);
//     req.body.stock = parseInt(req.body.stock);
//     req.body.position = parseInt(req.body.position);
//     if(req.file && req.file.filename){
//         req.body.thumbnail = `/uploads/${req.file.filename}`;
//     }

//     const updatedBy = {
//         account_id: res.locals.user.id,
//         updatedAt: Date()
//     };


//     await Product.updateOne({_id:id},{
//         ...req.body,
//         $push: {updatedBy: updatedBy}
//     });

//     res.redirect("back");
// }
// //[GET] /detail
// module.exports.detail = async(req,res)=>{
//     try {
//         const id = req.params.id;
//         const product = await Product.findOne({_id:id,deleted:false});
//         res.render("admin/pages/products/detail",{
//             product: product
//         })
//     } catch (error) {
//         res.redirect(`/${systemConfig.prefixAdmin}/products`);
//     }
// }
const Product = require("../../models/product.model");
const ProductCategory = require("../../models/product-category.model");
const Account = require("../../models/account.model");

const createTree = require("../../helper/createTree");
const filterStatusHelper = require("../../helper/filterStatus");
const searchHelper = require("../../helper/search");
const pagination = require("../../helper/pagination");
const systemConfig = require("../../config/system");

//[GET] /admin/product
module.exports.index = async(req,res)=>{
    const filterStatus = filterStatusHelper(req.query);
    
    let objSearch = searchHelper(req.query);

    let find = {
        deleted: false
    };
    if(req.query.status) {
        find.status = req.query.status;
    }
    if(req.query.keyword) {
        find.title = objSearch.regex;
    }
    
    let sort={};
    if(req.query.sortKey && req.query.sortValue !=""){
        sort[req.query.sortKey] = req.query.sortValue;
    }
    else{
        sort.position = "desc";
    }
    let initPagination = {
        currentPage: 1,
        limitItem: 5
    }
    let countProduct = await Product.count(find);
    const paginationObject = pagination(initPagination,req.query,countProduct);
    const products = await Product.find(find)
        .sort(sort)
        .limit(paginationObject.limitItem)
        .skip(paginationObject.skip);

    
    for(const product of products){

        //Lấy ra người tạo
        const userCreate = await Account.findOne({
            _id: product.createdBy.account_id
        });
        if(userCreate){
            product.createdBy.accountFullName = userCreate.fullName;
        }

         //Lấy ra người sửa
        const updatedUserid = product.updatedBy.slice(-1)[0];
        if(updatedUserid){
            const updatedUser = await Account.findOne({_id: updatedUserid.account_id});
            if(updatedUser){
                updatedUserid.accountFullName = updatedUser.fullName;
            }
        }
    }

   



    if(countProduct > 0 && products.length == 0){
        let hrefString = "";
        for(let key in req.query){
            if(key != "page"){
                hrefString += `&${key}=${req.query[key]}`;
            }
        }
        const href = `${req.baseUrl}?page=1${hrefString}`;
       
        res.redirect(href);   
    }
    else{
        
        res.render("admin/pages/products/index.pug",{
            pageTitle: "Danh sách sản phẩm",
            products: products,
            filterStatus: filterStatus,
            keyword: objSearch.keyword,
            pagination: paginationObject
        });
     }
    

}

//[PATCH] /admin/product/change-status/:status/:id
module.exports.changeStatus = async(req,res)=>{
    if(res.locals.role.permission.includes("products_edit")){
        const status = req.params.status;
        const id = req.params.id;


        const updatedBy = {
            account_id: res.locals.user.id,
            updatedAt: Date()
        };


        await Product.updateOne({_id:id},{status:status,$push:{ updatedBy: updatedBy}});
        req.flash("success", "Cập nhật trạng thái thành công!");
        res.redirect("back");
    }
    else{
        req.flash("error", "Không có quyền chỉnh sửa");
        res.redirect("back");
    }
    
    
}
//[PATCH] /admin/product/change-multi
module.exports.changeMulti = async(req,res)=>{
    const type = req.body.type;
    const ids = req.body.ids.split(", ");
    const updatedBy = {
        account_id: res.locals.user.id,
        updatedAt: Date()
    };
    switch(type){
        case "active":
        case "inactive":
            await Product.updateMany({_id:{$in:ids}},{status:type,$push:{ updatedBy: updatedBy}});
            req.flash("success", `Cập nhật trạng thái thành công ${ids.length} bản ghi!`);
            break;
        case "delete":
            await Product.updateMany({_id:{$in:ids}},{deleted:true});
            req.flash("success", `Xóa thành công ${ids.length} bản ghi!`);
            break;
        case "change-position":
            console.log("123");
            for(const item of ids){
                const [id, position] = item.split("-");
                console.log(id);
                console.log(position);
                await Product.updateOne({_id:id},{position:position,$push:{ updatedBy: updatedBy}});
            }
            req.flash("success", `Thay đổi vị trí thành công ${ids.length} bản ghi!`);
            break;

        default:
            break;
    }
    
    res.redirect("back");
}

//[PATCH] /admin/product/delete
module.exports.delete = async(req,res)=>{
    const id = req.params.id;
    console.log(req);
    await Product.updateOne({_id:id},{
        deleted:true,
        deletedBy:{
            account_id: res.locals.user.id,
            deletedAt: new Date()
        }
    });
    res.redirect("back");
}

//[GET] /create
module.exports.createGet = async(req,res)=>{
    const find = {
        deleted: false
    }
    const records = await ProductCategory.find(find);
    const newRecords = createTree(records);
    res.render("admin/pages/products/create.pug",{
        pageTitle: "Create a new one",
        records: newRecords
    });
}

//[POST] /create
module.exports.createPOST = async(req,res)=>{
    req.body.price = parseInt(req.body.price);
    req.body.discountPercentage = parseInt(req.body.discountPercentage);
    req.body.stock = parseInt(req.body.stock);
    if(req.body.barcode){
        req.body.barcode = String(req.body.barcode).trim();
    }
    if(req.body.position == ""){
        const cnt = await Product.countDocuments();
        req.body.position = cnt + 1;
    }
    else{
        req.body.position = parseInt(req.body.position);
    }
    req.body.createdBy = {
        account_id : res.locals.user.id
    }
    const newProduct = new Product(req.body);
    await newProduct.save();
    req.flash("success", `Tao moi thành công 1 bản ghi!`);
    res.redirect(`/${systemConfig.prefixAdmin}/products`);
}

//[GET] /edit/:id
module.exports.edit = async(req,res)=>{
    const id = req.params.id;
    const product = await Product.findOne({_id:id,deleted:false});
    const find = {
        deleted: false
    }
    const records = await ProductCategory.find(find);
    const newRecords = createTree(records);
    res.render("admin/pages/products/edit",{
        product: product,
        records: newRecords
    })
   
}

//[PATCH] /edit/:id
module.exports.editPatch = async(req,res)=>{
    const id = req.params.id;
    req.body.price = parseInt(req.body.price);
    req.body.discountPercentage = parseFloat(req.body.discountPercentage);
    req.body.stock = parseInt(req.body.stock);
    if(req.body.barcode){
        req.body.barcode = String(req.body.barcode).trim();
    }
    req.body.position = parseInt(req.body.position);
    if(req.file && req.file.filename){
        req.body.thumbnail = `/uploads/${req.file.filename}`;
    }

    const updatedBy = {
        account_id: res.locals.user.id,
        updatedAt: Date()
    };


    await Product.updateOne({_id:id},{
        ...req.body,
        $push: {updatedBy: updatedBy}
    });

    res.redirect("back");
}
//[GET] /detail
module.exports.detail = async(req,res)=>{
    try {
        const id = req.params.id;
        const product = await Product.findOne({_id:id,deleted:false});
        res.render("admin/pages/products/detail",{
            product: product
        })
    } catch (error) {
        res.redirect(`/${systemConfig.prefixAdmin}/products`);
    }
}