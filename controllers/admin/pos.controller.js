const Product = require("../../models/product.model");
const Order = require("../../models/order.model");
const systemConfig = require("../../config/system");

module.exports.index = async (req, res) => {
    res.render("admin/pages/pos/index", {
        pageTitle: "Bán hàng (Quét mã)"
    });
};

module.exports.lookupByBarcode = async (req, res) => {
    try {
        const { barcode } = req.query;
        if (!barcode) {
            return res.status(400).json({ message: "Thiếu mã vạch" });
        }
        const product = await Product.findOne({ barcode: String(barcode).trim(), deleted: false, status: "active" });
        if (!product) {
            return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
        }
        return res.json({
            id: product.id,
            title: product.title,
            price: product.price,
            discountPercentage: product.discountPercentage || 0,
            stock: product.stock,
            thumbnail: product.thumbnail || ""
        });
    } catch (e) {
        return res.status(500).json({ message: "Lỗi server" });
    }
};

module.exports.createOrder = async (req, res) => {
    try {
        const { cart_id, userInfo, products } = req.body;
        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ message: "Giỏ hàng trống" });
        }

        // Basic stock check
        for (const item of products) {
            const prod = await Product.findOne({ _id: item.product_id, deleted: false });
            if (!prod) {
                return res.status(400).json({ message: `Sản phẩm không hợp lệ: ${item.product_id}` });
            }
            if (typeof item.quantity !== 'number' || item.quantity < 1) {
                return res.status(400).json({ message: "Số lượng không hợp lệ" });
            }
            if (prod.stock < item.quantity) {
                return res.status(400).json({ message: `Không đủ hàng: ${prod.title}` });
            }
        }

        // const order = new Order({
        //     cart_id: cart_id || "",
        //     userInfo: userInfo || {},
        //     products: products.map(p => ({
        //         product_id: p.product_id,
        //         price: p.price,
        //         discountPercentage: p.discountPercentage || 0,
        //         quantity: p.quantity
        //     }))
        // });
        const orderProducts = products.map(p => ({
            product_id: p.product_id,
            price: p.price,
            discountPercentage: p.discountPercentage || 0,
            quantity: p.quantity
          }));
          
          // Tính tổng tiền
          const totalAmount = orderProducts.reduce((sum, p) => {
            const discount = p.discountPercentage ? (p.price * p.discountPercentage) / 100 : 0;
            const finalPrice = p.price - discount;
            return sum + finalPrice * p.quantity;
          }, 0);
          
          const order = new Order({
            cart_id: cart_id || "",
            userInfo: userInfo || {},
            products: orderProducts,
            totalAmount: totalAmount
            
          });
          
          console.log("order:", order);
          await order.save();
          
        console.log("orderdddddddddddddddddddddđ",order);
        await order.save();

        // Deduct stock
        for (const item of products) {
            await Product.updateOne({ _id: item.product_id }, { $inc: { stock: -item.quantity } });
        }

        return res.json({ message: "Tạo hóa đơn thành công", order_id: order.id });
    } catch (e) {
        return res.status(500).json({ message: "Lỗi server" });
    }
};


