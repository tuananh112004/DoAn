const Product = require("../../models/product.model");
const productsHelper = require("../../helper/product");

//[GET] /api/search
module.exports.index = async (req, res) => {
  try {
    const rawKeyword = (req.query.keyword ?? req.query.q ?? "").toString().trim();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 12));
    let products = [];

    if (rawKeyword) {
      const keywordRegex = new RegExp(rawKeyword, "i");
      const find = { title: keywordRegex, deleted: false, status: "active" };

      const totalItems = await Product.countDocuments(find);
      const totalPages = Math.max(1, Math.ceil(totalItems / limit));
      const skip = (page - 1) * limit;

      const rows = await Product.find(find).limit(limit).skip(skip);
      products = productsHelper.priceNewProducts(rows);

      return res.json({
        success: true,
        data: {
          products,
          keyword: rawKeyword,
          pagination: {
            page,
            limit,
            totalItems,
            totalPages
          }
        }
      });
    }

    // No keyword provided -> return empty list
    return res.json({
      success: true,
      data: {
        products: [],
        keyword: "",
        pagination: { page: 1, limit, totalItems: 0, totalPages: 1 }
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
