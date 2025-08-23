const ProductCategory = require("../../models/product-category.model");
const Order = require("../../models/order.model");


//[GET] /admin/dashboard
module.exports.dashboard = async (req, res) => {
    // Thống kê số lượng sản phẩm từng danh mục cho biểu đồ cột và tròn
    const Product = require('../../models/product.model');
    const allCategories = await ProductCategory.find({ deleted: false }).lean();
    const allProducts = await Product.find({ deleted: false }).lean();
    let categoryProductStats = [];
    let totalProductCount = allProducts.length;
    for (const cat of allCategories) {
      const count = allProducts.filter(p => String(p.product_category_id) === String(cat._id)).length;
      categoryProductStats.push({ category: cat.title, count });
    }
    // ...existing code...
    const statistic = {
      categoryProduct: {
        total: 0,
        active: 0,
        inactive: 0,
      },
      product: {
        total: 0,
        active: 0,
        inactive: 0,
      },
      account: {
        total: 0,
        active: 0,
        inactive: 0,
      },
      user: {
        total: 0,
        active: 0,
        inactive: 0,
      },
    };
  
    statistic.categoryProduct.total = await ProductCategory.count({
      deleted: false
    });
  
    statistic.categoryProduct.active = await ProductCategory.count({
      status: "active",
      deleted: false
    });
  
    statistic.categoryProduct.inactive = await ProductCategory.count({
      status: "inactive",
      deleted: false
    });
    // Thống kê doanh thu theo ngày, tháng, năm
    const query = req.query || {};
    let filter = { status: 'paid' };
    // Nếu chọn ngày thì lọc theo ngày
    let groupType = 'all';
    if (query.date) {
      const selectedDate = new Date(query.date);
      const start = new Date(selectedDate);
      start.setHours(0,0,0,0);
      const end = new Date(selectedDate);
      end.setHours(23,59,59,999);
      filter.createdAt = { $gte: start, $lte: end };
      groupType = 'day';
    }
    // Nếu chọn tháng thì lọc theo tháng, group theo ngày
    else if (query.month) {
      const [year, month] = query.month.split('-');
      const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
      const end = new Date(year, month, 0, 23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
      groupType = 'month';
    }
    // Nếu chọn năm thì lọc theo năm
    else if (query.year) {
      const year = parseInt(query.year);
      const start = new Date(year, 0, 1, 0, 0, 0, 0);
      const end = new Date(year, 11, 31, 23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
      groupType = 'year';
    }
    // Nếu không chọn gì thì lấy toàn bộ đơn hàng
    const orders = await Order.find(filter);
    const groupRevenue = (orders) => {
      const byDay = {};
      const byMonth = {};
      const byYear = {};
      let total = 0;
      let from = null;
      let to = null;
      orders.forEach(order => {
        const date = new Date(order.createdAt);
        const day = date.toISOString().slice(0, 10);
        const month = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const amount = order.totalAmount || 0;
        total += amount;
        if (!from || date < from) from = date;
        if (!to || date > to) to = date;
        byDay[day] = (byDay[day] || 0) + amount;
        byMonth[month] = (byMonth[month] || 0) + amount;
        byYear[year] = (byYear[year] || 0) + amount;
      });
      return {
        total,
        from: from ? from.toISOString().slice(0, 10) : '',
        to: to ? to.toISOString().slice(0, 10) : '',
        byDay: Object.entries(byDay).map(([date, amount]) => ({ date, amount })),
        byMonth: Object.entries(byMonth).map(([month, amount]) => ({ month, amount })),
        byYear: Object.entries(byYear).map(([year, amount]) => ({ year, amount })),
      };
    };
    const revenue = groupRevenue(orders);
    // Nếu chọn tháng, chỉ truyền dữ liệu byDay cho biểu đồ
    statistic.revenue = groupType === 'month'
      ? { ...revenue, byDay: revenue.byDay }
      : revenue;
    res.render("admin/pages/dashboard/index", {
  pageTitle: "Tổng quan",
  statistic: { ...statistic, categoryProductStats },
  query: query
    });
}