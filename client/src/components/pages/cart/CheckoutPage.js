import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Form, Button, Alert } from "react-bootstrap";
import api, { endpoints } from "../../../configs/Apis";
import { useNavigate } from "react-router-dom";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ fullName: "", phone: "", address: "", paymentMethod: "cod" });

  useEffect(() => {
    const syncAndFetch = async () => {
      try {
        // Đồng bộ giỏ hàng từ localStorage lên server một cách idempotent
        const local = JSON.parse(localStorage.getItem("cart") || "{}");
        const items = Object.values(local);
        // Xóa giỏ local NGAY LẬP TỨC để tránh effect chạy 2 lần (StrictMode) gây cộng dồn
        if (items.length > 0) {
          localStorage.removeItem("cart");
        }
        if (items.length > 0) {
          // Lấy giỏ hàng hiện tại trên server trước
          const serverCartRes = await api.get(`${endpoints.cart}`);
          const serverCart = serverCartRes.data?.data?.cart;
          const serverQuantityByProductId = new Map(
            (serverCart?.products || []).map((p) => [p.product_id, p.quantity])
          );

          for (const it of items) {
            const existsOnServer = serverQuantityByProductId.has(it.id);
            if (existsOnServer) {
              // Đặt số lượng chính xác theo local
              await api.put(`${endpoints.cart}/update/${it.id}/${it.quantity}`);
            } else {
              // Thêm mới nếu chưa có
              await api.post(`${endpoints.cart}/add/${it.id}`, { quantity: it.quantity });
            }
          }
        }

        // Lấy chi tiết giỏ hàng đã tính khuyến mãi/tổng tiền từ server
        const res = await api.get(`${endpoints.checkout}`);
        if (res.data?.success) {
          console.log("resssssssssssssssssssss", res.data.data.cart);
          setCart(res.data.data.cart);
        } else {
          setError(res.data?.message || "Không thể tải giỏ hàng");
        }
      } catch (e) {
        setError(e.response?.data?.message || e.message || "Lỗi tải giỏ hàng");
      } finally {
        setLoading(false);
      }
    };
    syncAndFetch();
    // Lưu ý: không thêm dependency để tránh StrictMode gọi 2 lần ở dev gây cộng dồn
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post(`${endpoints.checkout}`, form);
      if (res.data?.success) {
        const data = res.data.data;
        if (form.paymentMethod === "cod") {
          // Dọn giỏ hàng local sau khi đặt COD thành công
          localStorage.removeItem("cart");
          navigate(`/checkout/success/${data.orderId}`);
        } else if (form.paymentMethod === "vnpay" && data.paymentUrl) {
          window.location.href = data.paymentUrl;
        }
      } else {
        setError(res.data?.message || "Đặt hàng thất bại");
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Đặt hàng thất bại");
    }
  };

  if (loading) return <Container className="py-5">Đang tải...</Container>;

  if (!cart || cart?.products?.length === 0) {
    return (
      <Container className="py-5">
        <Alert variant="warning">Giỏ hàng trống. Vui lòng thêm sản phẩm trước khi thanh toán.</Alert>
        <Button onClick={() => navigate("/products")}>Mua sắm ngay</Button>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h1 className="mb-4">Đặt hàng</h1>
      {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
      <Row>
        <Col lg={8}>
          <Card className="mb-3">
            <Card.Header>Thông tin đơn hàng</Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <table className="table table-bordered mb-0">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Ảnh</th>
                      <th>Tên</th>
                      <th>Giá</th>
                      <th>SL</th>
                      <th>Tổng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.products.map((item, idx) => (
                      <tr key={`${item.product_id}-${idx}`}>
                        <td>{idx + 1}</td>
                        <td>
                          {item?.productInfo?.thumbnail ? (
                            <img
                              src={item.productInfo.thumbnail}
                              alt={item.productInfo.title}
                              width={64}
                            />
                          ) : (
                            <span>-</span>
                          )}
                        </td>
                        <td>{item?.productInfo?.title || '-'}</td>
                        <td>${Number(item?.productInfo?.priceNew || 0).toLocaleString()}</td>
                        <td>{item.quantity}</td>
                        <td>${Number(item.totalPrice || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card>
            <Card.Header>Thông tin khách hàng</Card.Header>
            <Card.Body>
              <Form onSubmit={placeOrder}>
                <Form.Group className="mb-3">
                  <Form.Label>Họ tên</Form.Label>
                  <Form.Control name="fullName" value={form.fullName} onChange={handleChange} required />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Số điện thoại</Form.Label>
                  <Form.Control name="phone" value={form.phone} onChange={handleChange} required />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Địa chỉ</Form.Label>
                  <Form.Control name="address" value={form.address} onChange={handleChange} required />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Hình thức thanh toán</Form.Label>
                  <div>
                    <Form.Check
                      inline
                      type="radio"
                      name="paymentMethod"
                      id="pm-cod"
                      value="cod"
                      label="Thanh toán khi nhận hàng (COD)"
                      checked={form.paymentMethod === "cod"}
                      onChange={handleChange}
                    />
                    <Form.Check
                      inline
                      type="radio"
                      name="paymentMethod"
                      id="pm-vnpay"
                      value="vnpay"
                      label="Thanh toán qua VNPay"
                      checked={form.paymentMethod === "vnpay"}
                      onChange={handleChange}
                    />
                  </div>
                </Form.Group>

                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>Tổng đơn hàng: </strong>${cart.totalPrice}
                  </div>
                  <Button type="submit" variant="success">
                    ĐẶT HÀNG
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CheckoutPage;


