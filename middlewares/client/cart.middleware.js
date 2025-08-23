const Cart = require("../../models/cart.model");

module.exports.cartId = async (req, res, next) => {
  let cart;
  if (!req.cookies.cartId) {
    cart = new Cart();
    await cart.save();

    const expiresTime = 1000 * 60 * 60 * 24 * 365;

    res.cookie("cartId", cart.id, {
      expires: new Date(Date.now() + expiresTime)
    });
  } else {
    cart = await Cart.findOne({
      _id: req.cookies.cartId
    });

    // Nếu không tìm thấy cart, tạo mới
    if (!cart) {
      cart = new Cart();
      await cart.save();
      res.cookie("cartId", cart.id, {
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365)
      });
    }
  }

  // Đảm bảo cart luôn tồn tại và có products là mảng
  cart.totalQuantity = Array.isArray(cart.products)
    ? cart.products.reduce((sum, item) => sum + item.quantity, 0)
    : 0;
  res.locals.miniCart = cart;

  next();
}