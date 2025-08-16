const Product = require("../../models/product.model");
const productsHelper = require("../../helper/product");

//[GET] /api/home
module.exports.index = async (req, res) => {
  try {
    // Hiển thị danh sách sản phẩm nổi bật
    const productsFeatured = await Product.find({
      featured: "1",
      deleted: false,
      status: "active"
    }).limit(6);

    const newProductsFeatured = productsHelper.priceNewProducts(productsFeatured);
    
    //Hiển thị danh sách sản phẩm mới nhất
    const newProducts = await Product.find({
      deleted: false,
      status: "active"
    }).sort({ position: "desc" }).limit(6);

    const newProductsNew = productsHelper.priceNewProducts(newProducts);

    res.json({
      success: true,
      data: {
        productsFeatured: newProductsFeatured,
        productsNew: newProductsNew
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
