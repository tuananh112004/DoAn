module.exports.detail = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).send('Không tìm thấy đơn hàng');
    res.render('admin/pages/order/detail', { order });
  } catch (error) {
    res.status(500).send('Lỗi server');
  }
};
// Controller quản lý đơn hàng admin
const Order = require('../../models/order.model');
const Product = require('../../models/product.model');

module.exports.list = async (req, res) => {
  try {
  const orders = await Order.find({ status: { $in: ["cod_pending", "vnpay_pending"] } }).sort({ createdAt: -1 });
    res.render('admin/pages/order/index', { orders });
  } catch (error) {
    res.status(500).send('Lỗi server');
  }
};

module.exports.confirm = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).send('Không tìm thấy đơn hàng');
    order.status = 'paid';
    await order.save();
    // Có thể trừ kho ở đây nếu cần
    res.redirect('/admin/order');
  } catch (error) {
    res.status(500).send('Lỗi server');
  }
};
