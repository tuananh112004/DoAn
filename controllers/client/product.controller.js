const Product = require("../../models/product.model");
const productsHelper = require("../../helper/product");
const ProductCategory = require("../../models/product-category.model");

//[GET] /
module.exports.index = async (req, res) => {
      const products = await Product.find({status: "active", deleted: false}).sort({position: "desc"});
      const newProducts = productsHelper.priceNewProducts(products);



      res.render("client/pages/products/index", {
        pageTitle: "Danh sách sản phẩm",
        products: newProducts
      });
}
//[GET] /detail/:slugProduct
module.exports.detail = async (req, res) => {
  const slug = req.params.slugProduct;

  const product = await Product.findOne({
    slug:slug,
    deleted:false,
    status: "active"
  });
  if(product.product_category_id){
    const Category = await ProductCategory.findOne({
      _id: product.product_category_id,
      deleted:false,
      status: "active"
    });
    product.category = Category;
  }
  product.priceNew = productsHelper.priceNewProduct(product);



  console.log("User in product detail:", req.user); // Debug log
  res.render("client/pages/products/detail",{
    product:product,
    user: req.user || null
  });
}

// [GET] /products/:slugCategory
module.exports.category = async (req, res) => {
  const slugCategory = req.params.slugCategory;

  const category = await ProductCategory.findOne({
    slug: slugCategory,
    deleted: false,
    status: "active"
  });

  const getSubCategory = async (parentId) => {
    const subs = await ProductCategory.find({
      parent_id: parentId,
      deleted: false,
      status: "active"
    });
    let allSubs = [...subs];
    for(const sub of subs){
      const child = await getSubCategory(sub.id);
      allSubs = allSubs.concat(child);
    }
    return allSubs;
  }

  const listSubCategory = await getSubCategory(category.id);
  const listSubCategoryID = listSubCategory.map(item=>item.id);



  const products = await Product.find({
    product_category_id: {$in: [category.id,...listSubCategoryID]},
    status: "active",
    deleted: false
  }).sort({ position: "desc" });

  const newProducts = productsHelper.priceNewProducts(products);

  res.render("client/pages/products/index", {
    pageTitle: category.title,
    products: newProducts
  });
}
