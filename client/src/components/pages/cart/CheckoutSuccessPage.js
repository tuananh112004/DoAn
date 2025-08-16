import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Container, Card, Alert, Table, Button } from "react-bootstrap";
import api, { endpoints } from "../../../configs/Apis";

const CheckoutSuccessPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const getDiscountedPrice = (it) => {
    const priceNew = it?.priceNew;
    if (priceNew != null) return Number(priceNew);
    const price = it?.price;
    const discount = it?.discountPercentage ?? 0;
    if (price == null) return 0;
    return Number(price * (1 - discount / 100));
  };

  const getItemTotal = (it) => {
    const total = it?.totalPrice;
    if (total != null) return Number(total);
    const unit = getDiscountedPrice(it);
    const qty = Number(it?.quantity ?? 0);
    return Number(unit * qty);
  };

  useEffect(() => {
    const load = async () => {
      try {
        if (!id) {
          setError("Thiếu mã đơn hàng");
          return;
        }
        const res = await api.get(`${endpoints.checkout}/success/${id}`);
        if (res.data?.success) {
          console.log(res.data.data.order);
          setOrder(res.data.data.order);
        } else {
          setError(res.data?.message || "Không thể tải đơn hàng");
        }
      } catch (e) {
        setError(e.response?.data?.message || e.message || "Lỗi tải đơn hàng");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <Container className="py-5">Đang tải...</Container>;

  if (error) return (
    <Container className="py-5">
      <Alert variant="danger">{error}</Alert>
      <Button as={Link} to="/">Về trang chủ</Button>
    </Container>
  );

  if (!order) return null;

  return (
    <Container className="py-5">
      <Card>
        <Card.Header>Đặt hàng thành công</Card.Header>
        <Card.Body>
          <Alert variant="success">Cảm ơn bạn! Đơn hàng đã được thanh toán.</Alert>
          <p><strong>Mã đơn hàng:</strong> {order._id}</p>
          <Table bordered responsive>
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
              {order.products?.map((item, idx) => (
                <tr key={`${item.product_id}-${idx}`}>
                  <td>{idx + 1}</td>
                  <td>
                    {item?.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        width={64}
                      />
                    ) : (
                      <span>-</span>
                    )}
                  </td>
                  <td>{item?.title || '-'}</td>
                  <td>${getDiscountedPrice(item).toLocaleString()}</td>
                  <td>{item.quantity}</td>
                  <td>${getItemTotal(item).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </Table>
            <div className="d-flex justify-content-between">
            <div>
              <strong>Tổng đơn hàng: </strong>${Number(order.totalPrice ?? order.totalAmount ?? 0).toLocaleString()}
            </div>
            <Button as={Link} to="/products" variant="primary">Tiếp tục mua sắm</Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CheckoutSuccessPage;


