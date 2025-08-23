const Product = require("../../models/product.model");
const productsHelper = require("../../helper/product");
const ProductCategory = require("../../models/product-category.model");

//[GET] /api/products
module.exports.index = async (req, res) => {
  try {
    const products = await Product.find({status: "active", deleted: false}).sort({position: "desc"});
    const newProducts = productsHelper.priceNewProducts(products);

    res.json({
      success: true,
      data: {
        products: newProducts
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

//[GET] /api/products/:slugProduct
module.exports.detail = async (req, res) => {
  try {
    const slug = req.params.slugProduct;

    const product = await Product.findOne({
      slug: slug,
      deleted: false,
      status: "active"
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm"
      });
    }

    if(product.product_category_id){
      const Category = await ProductCategory.findOne({
        _id: product.product_category_id,
        deleted: false,
        status: "active"
      });
      product.category = Category;
    }
    
    product.priceNew = productsHelper.priceNewProduct(product);

    res.json({
      success: true,
      data: {
        product: product
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

// [GET] /api/products/category/:slugCategory
module.exports.category = async (req, res) => {
  try {
    const slugCategory = req.params.slugCategory;

    const category = await ProductCategory.findOne({
      slug: slugCategory,
      deleted: false,
      status: "active"
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy danh mục"
      });
    }

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

    res.json({
      success: true,
      data: {
        category: category,
        products: newProducts
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

//[GET] /api/products/categories
module.exports.categories = async (req, res) => {
  try {
    const categories = await ProductCategory.find({
      deleted: false,
      status: "active"
    }).sort({ position: "desc" });

    res.json({
      success: true,
      data: {
        categories: categories
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
