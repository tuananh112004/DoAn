const Order = require('../../models/order.model');

// Helper to group revenue by day/month/year
function groupRevenue(orders) {
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
}

exports.getRevenueStatistic = async (req, res) => {
  try {
  const orders = await Order.find({ status: 'paid' });
    const revenue = groupRevenue(orders);
    res.json({ revenue });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy thống kê doanh thu' });
  }
};
