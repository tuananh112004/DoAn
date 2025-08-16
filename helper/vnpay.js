const crypto = require("crypto");
const moment = require("moment");


// Helper function to sort object keys
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (let key of keys) {
    sorted[key] = obj[key];
  }
  return sorted;
}

function createPaymentUrl(orderId, amount, orderInfo) {
  const date = new Date();
  const createDate = moment(date).format("YYYYMMDDHHmmss");
  console.log("orderId"   , orderId);
  console.log("amount"    , orderId.amount);
  console.log("orderInfo" , orderId.orderInfo);
  const vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: "VH92V83I",
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: orderId.orderId, // Sử dụng orderId từ tham số
    vnp_OrderInfo: orderId.orderInfo,
    vnp_OrderType: "billpayment",
    vnp_Amount: orderId.amount * 100,
    // Ưu tiên dùng returnUrl truyền vào, fallback về route phía client render nếu không có
    vnp_ReturnUrl: orderId.returnUrl || "http://localhost:3000/checkout/vnpay-return",
    vnp_IpAddr: "127.0.0.1",
    vnp_CreateDate: createDate,
  };
//  vnp_TmnCode: "VH92V83I", // mã merchant
//   vnp_HashSecret: "FI8DNHRRIWNQ3WB4RVMJ4ZTYKQGTLMJG",
//   vnp_Url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
//   // Sửa lại đường dẫn trả về để khớp với route handler của bạn
//   vnp_ReturnUrl: "http://localhost:3000/checkout/vnpay-return"
// };
  const sortedParams = sortObject(vnp_Params);
  
  // Sửa lỗi: Mã hóa URL giá trị khi tạo chuỗi `signData`
  let signData = "";
  const queryParams = [];

  for (const key in sortedParams) {
    if (Object.prototype.hasOwnProperty.call(sortedParams, key)) {
      const value = sortedParams[key];
      // Mã hóa URL cho `value` trước khi nối vào signData
      signData += `${key}=${encodeURIComponent(value)}&`;
      queryParams.push(`${key}=${encodeURIComponent(value)}`);
    }
  }

  // Remove the trailing '&'
  signData = signData.slice(0, -1);
  const queryString = queryParams.join("&");

  const hmac = crypto.createHmac("sha512", "FI8DNHRRIWNQ3WB4RVMJ4ZTYKQGTLMJG");
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  const paymentUrl = `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?${queryString}&vnp_SecureHash=${signed}`;
  console.log("Signature:", signed);
  return paymentUrl;
}

module.exports = {
  createPaymentUrl
};