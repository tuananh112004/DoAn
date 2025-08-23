import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../configs/Apis";

const VnpayReturnPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Lấy các query params từ URL
    const params = new URLSearchParams(window.location.search);
    // Gọi API xác nhận thanh toán VNPAY
    api.get(`/checkout/vnpay-return?${params.toString()}`)
      .then(res => {
        if (res.data?.success) {
          // Chuyển về trang chủ ngay lập tức
          navigate("/");
        } else {
          alert(res.data?.message || "Thanh toán thất bại");
          navigate("/");
        }
      })
      .catch(() => {
        alert("Lỗi xác nhận thanh toán");
        navigate("/");
      });
  }, [navigate]);

  return (
    <div style={{padding: 40, textAlign: "center"}}>
      <h2>Đang xác nhận thanh toán VNPAY...</h2>
      <p>Bạn sẽ được chuyển về trang chủ sau khi thanh toán thành công.</p>
    </div>
  );
};

export default VnpayReturnPage;
