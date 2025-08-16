const Cart = require("../../models/cart.model");
const Product = require("../../models/product.model");
const productsHelper = require("../../helper/product");

// [POST] /api/cart/add/:productId
module.exports.addPost = async (req, res) => {
  try {
    let cartId = req.cookies.cartId;
    const productId = req.params.productId; // keep as string to match Cart schema
    const quantity = parseInt(req.body.quantity);

    if (!cartId) {
      const newCart = new Cart();
      await newCart.save();
      const expiresTime = 1000 * 60 * 60 * 24 * 365;
      res.cookie("cartId", newCart.id, { expires: new Date(Date.now() + expiresTime) });
      cartId = newCart.id;
    }

    // Tìm cart và update nếu sản phẩm đã tồn tại, nếu không thì thêm mới
    let cart = await Cart.findOne({ _id: cartId });
    if (!cart) {
      cart = new Cart();
      await cart.save();
      const expiresTime = 1000 * 60 * 60 * 24 * 365;
      res.cookie("cartId", cart.id, { expires: new Date(Date.now() + expiresTime) });
    }

    const existingItem = cart.products.find(p => String(p.product_id) === String(productId));

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.products.push({ product_id: String(productId), quantity });
    }

    await cart.save();

    res.json({
      success: true,
      message: "Thêm sản phẩm vào giỏ hàng thành công!"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message
    });
  }
};

// [GET] /api/cart
module.exports.cart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ _id: req.cookies.cartId });

    if (!cart) {
      cart = new Cart();
      await cart.save();
      const expiresTime = 1000 * 60 * 60 * 24 * 365;
      res.cookie("cartId", cart.id, { expires: new Date(Date.now() + expiresTime) });
    }

    if (cart.products && cart.products.length > 0) {
      // Hợp nhất số lượng nếu có trùng product_id (phòng trường hợp dữ liệu cũ bị lỗi)
      const mergedById = new Map();
      for (const p of cart.products) {
        const key = String(p.product_id);
        const prev = mergedById.get(key) || 0;
        mergedById.set(key, prev + (Number(p.quantity) || 0));
      }
      const normalized = Array.from(mergedById.entries()).map(([product_id, quantity]) => ({ product_id, quantity }));

      if (normalized.length !== cart.products.length) {
        await Cart.updateOne({ _id: cart._id }, { products: normalized });
        cart.products = normalized;
      }

      // Lấy thông tin sản phẩm
      for (const item of cart.products) {
        const productInfo = await Product.findOne({ _id: item.product_id });
        if (productInfo) {
          productInfo.priceNew = productsHelper.priceNewProduct(productInfo);
          item.productInfo = productInfo;
          item.totalPrice = item.quantity * productInfo.priceNew;
        }
      }
    }

    cart.totalPrice = cart.products.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

    res.json({
      success: true,
      data: { cart }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message
    });
  }
};

// [DELETE] /api/cart/delete/:productId
module.exports.delete = async (req, res) => {
  try {
    const cartId = req.cookies.cartId;
    const productId = req.params.productId;

    await Cart.updateOne(
      { _id: cartId },
      { $pull: { products: { product_id: String(productId) } } }
    );

    res.json({
      success: true,
      message: "Đã xóa sản phẩm khỏi giỏ hàng!"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message
    });
  }
};

// [PUT] /api/cart/update/:productId/:quantity
module.exports.update = async (req, res) => {
  try {
    let cartId = req.cookies.cartId;
    const productId = req.params.productId;
    const quantity = parseInt(req.params.quantity);

    if (!cartId) {
      const newCart = new Cart();
      await newCart.save();
      const expiresTime = 1000 * 60 * 60 * 24 * 365;
      res.cookie("cartId", newCart.id, { expires: new Date(Date.now() + expiresTime) });
      cartId = newCart.id;
    }

    await Cart.updateOne(
      { _id: cartId, 'products.product_id': String(productId) },
      { $set: { 'products.$.quantity': quantity } }
    );

    res.json({
      success: true,
      message: "Cập nhật số lượng thành công"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message
    });
  }
};
