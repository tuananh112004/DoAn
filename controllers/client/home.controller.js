const Product = require("../../models/product.model");

const productsHelper = require("../../helper/product");

//[GET] /
module.exports.index = async (req,res)=>{
 // Hiển thị danh sách sản phẩm nổi bật
  const productsFeatured = await Product.find({
    featured: "1",
    deleted: false,
    status: "active"
  }).limit(6);

  const newProductsFeatured = productsHelper.priceNewProducts(productsFeatured);
  // Hết Hiển thị danh sách sản phẩm nổi bật
  
  //Hiển thị danh sách sản phẩm mới nhất
  const newProducts = await Product.find({
    deleted: false,
    status: "active"
  }).sort({ position: "desc" }).limit(6);

  const newProductsNew = productsHelper.priceNewProducts(newProducts);
  //Hết Hiển thị danh sách sản phẩm mới nhất




    res.render("client/pages/home/index.pug",{
        productsFeatured: newProductsFeatured,
        productsNew: newProductsNew
    })
};