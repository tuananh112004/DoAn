const Cart = require("../../models/cart.model");
const Product = require("../../models/product.model");
const Order = require("../../models/order.model");
const productsHelper = require("../../helper/product");
const { createPaymentUrl } = require("../../helper/vnpay");
const crypto = require("crypto");
const querystring = require("qs");

// Tính tổng tiền (đã áp dụng giảm giá)
function calculateTotalAmount(orderProducts) {
  return orderProducts.reduce((sum, p) => {
    const discountedPrice = p.price * (1 - (p.discountPercentage || 0) / 100);
    return sum + discountedPrice * p.quantity;
  }, 0);
}

// Sắp xếp object để ký
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (let key of keys) {
    sorted[key] = obj[key];
  }
  return sorted;
}

// Deduct stock for all products in the order and clear the cart
async function deductStockAndClearCart(orderDoc) {
  // Decrement stock atomically to avoid race conditions
  for (const orderedItem of orderDoc.products) {
    const productId = orderedItem.product_id;
    const orderedQuantity = Number(orderedItem.quantity) || 0;
    if (!productId || orderedQuantity <= 0) continue;

    await Product.updateOne(
      { _id: productId },
      { $inc: { stock: -orderedQuantity } }
    );
  }

  // Clear cart after successful payment
  if (orderDoc.cart_id) {
    await Cart.updateOne({ _id: orderDoc.cart_id }, { products: [] });
  }
}

module.exports.index = async (req, res) => {
  try {
    let cart = await Cart.findOne({ _id: req.cookies.cartId });

    if (!cart || cart.products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Giỏ hàng trống"
      });
    }

    // Hợp nhất các mục trùng product_id để tránh bị nhân đôi giữa các lần đồng bộ
    const mergedById = new Map();
    for (const p of cart.products) {
      const prev = mergedById.get(p.product_id) || 0;
      mergedById.set(p.product_id, prev + (Number(p.quantity) || 0));
    }
    const normalized = Array.from(mergedById.entries()).map(([product_id, quantity]) => ({ product_id, quantity }));
    if (normalized.length !== cart.products.length) {
      await Cart.updateOne({ _id: cart._id }, { products: normalized });
      cart.products = normalized;
    }

    // Lấy thông tin sản phẩm theo lô và dựng DTO trả về
    const ids = cart.products.map(p => p.product_id);
    const products = await Product.find({ _id: { $in: ids } })
      .select("title thumbnail price discountPercentage");
    const byId = new Map(products.map(p => [p._id.toString(), p]));

    const productsDto = cart.products.map((item) => {
      const p = byId.get(item.product_id.toString());
      if (!p) {
        return { product_id: item.product_id, quantity: item.quantity, productInfo: null, totalPrice: 0 };
      }
      const priceNew = Number(productsHelper.priceNewProduct(p));
      return {
        product_id: item.product_id,
        quantity: item.quantity,
        productInfo: {
          title: p.title,
          thumbnail: p.thumbnail,
          price: p.price,
          discountPercentage: p.discountPercentage,
          priceNew
        },
        totalPrice: priceNew * Number(item.quantity || 0)
      };
    });

    const totalPrice = productsDto.reduce((sum, it) => sum + (Number(it.totalPrice) || 0), 0);

    res.json({
      success: true,
      data: {
        cart: { _id: cart._id, products: productsDto, totalPrice }
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

// [POST] /api/checkout
module.exports.order = async (req, res) => {
  try {
    const cartId = req.cookies.cartId;
    const userInfo = req.body;

    const cart = await Cart.findOne({ _id: cartId });
    if (!cart || cart.products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Giỏ hàng trống"
      });
    }

    const products = [];
    for (const product of cart.products) {
      const productInfo = await Product.findById(product.product_id);

      products.push({
        product_id: product.product_id,
        price: productInfo.price,
        discountPercentage: productInfo.discountPercentage,
        quantity: product.quantity,
        title: productInfo.title,
        thumbnail: productInfo.thumbnail,
      });
    }

    const totalAmount = calculateTotalAmount(products);
    const paymentMethod = req.body.paymentMethod;

    const order = new Order({
      cart_id: cartId,
      userInfo,
      products,
      totalAmount,
      status: paymentMethod === "cod" ? "cod_pending" : paymentMethod === "vnpay" ? "vnpay_pending" : "pending",
    });

    await order.save();

    if (paymentMethod === "cod") {
      // Đơn hàng COD sẽ có status là 'cod_pending' khi tạo, chỉ chuyển sang 'paid' khi xác nhận giao hàng
      res.json({
        success: true,
        message: "Đặt hàng thành công! Đơn hàng đang chờ xác nhận thanh toán COD.",
        data: {
          orderId: order._id,
          status: order.status
        }
      });

    } else if (paymentMethod === "vnpay") {
      const orderInfo = order._id.toString();
      const paymentUrl = createPaymentUrl({
        orderId: order._id.toString(),
        amount: totalAmount,
        orderInfo,
        returnUrl: "http://localhost:3000/api/checkout/vnpay-return",
      });
      res.json({
        success: true,
        message: "Chuyển hướng đến trang thanh toán VNPAY",
        data: {
          orderId: order._id,
          paymentUrl: paymentUrl,
          status: order.status
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Vui lòng chọn phương thức thanh toán!"
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message
    });
  }
};

// [GET] /api/checkout/success/:id
module.exports.success = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng"
      });
    }

    for (const product of order.products) {
      // Prefer data embedded in order to avoid missing refs
      const productInfo = await Product
        .findById(product.product_id)
        .select("title thumbnail price discountPercentage");

      const title = product.title || productInfo?.title || null;
      const thumbnail = product.thumbnail || productInfo?.thumbnail || null;
      const basePrice = product.price ?? productInfo?.price ?? 0;
      const baseDiscount = product.discountPercentage ?? productInfo?.discountPercentage ?? 0;

      product.productInfo = title || thumbnail ? { title, thumbnail, price: basePrice, discountPercentage: baseDiscount } : null;

      const computedPriceNew = Number(((basePrice * (100 - baseDiscount)) / 100).toFixed(0));
      const quantityNumber = Number(product.quantity) || 0;

      product.priceNew = computedPriceNew;
      product.totalPrice = computedPriceNew * quantityNumber;
    }

    order.totalPrice = order.products.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);

    res.json({
      success: true,
      data: {
        order: order
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

// [GET] /api/checkout/vnpay-return
module.exports.vnpayReturn = async (req, res) => {
  try {
    let vnp_Params = req.query;

    let secureHash = vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"]; // nếu có

    vnp_Params = sortObject(vnp_Params);

    const secretKey = process.env.VNP_HASH_SECRET || "FI8DNHRRIWNQ3WB4RVMJ4ZTYKQGTLMJG";

    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hash = crypto.createHmac("sha512", secretKey).update(signData).digest("hex");

      if (secureHash === hash) {
        if (vnp_Params["vnp_ResponseCode"] === "00") {
          // Cập nhật trạng thái đơn hàng và trừ kho, xóa giỏ hàng
          const orderId = vnp_Params["vnp_TxnRef"];

          const order = await Order.findById(orderId);
          if (!order) {
            return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
          }

          // Không đổi status, giữ nguyên 'vnpay_pending'. Chỉ xác nhận ở trang quản lý mới chuyển sang 'paid'.
          return res.redirect("http://localhost:3001/");
          // return res.json({
          //   success: true,
          //   message: "Thanh toán thành công!"
          // });
        } else {
          return res.json({
            success: false,
            message: "Giao dịch thất bại."
          });
        }
      } else {
      res.status(400).json({
        success: false,
        message: "Chữ ký không hợp lệ!"
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message
    });
  }
};
