import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { MyCartContext } from '../../../contexts/Contexts';

const CartPage = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [cartCounter, cartDispatch] = useContext(MyCartContext);

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '{}');
    const items = Object.values(cart);
    setCartItems(items);
  }, [cartCounter]);

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(productId);
      return;
    }

    const cart = JSON.parse(localStorage.getItem('cart') || '{}');
    if (cart[productId]) {
      cart[productId].quantity = newQuantity;
      localStorage.setItem('cart', JSON.stringify(cart));
      cartDispatch({ type: 'update' });
    }
  };

  const removeItem = (productId) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '{}');
    delete cart[productId];
    localStorage.setItem('cart', JSON.stringify(cart));
    cartDispatch({ type: 'update' });
  };

  const clearCart = () => {
    localStorage.removeItem('cart');
    cartDispatch({ type: 'update' });
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  const handleCheckout = () => {
    if (cartItems.length > 0) {
      navigate('/checkout');
    }
  };

  if (cartItems.length === 0) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <h2>Giỏ hàng trống</h2>
          <p className="text-muted mb-4">
            Bạn chưa có sản phẩm nào trong giỏ hàng
          </p>
          <Button variant="primary" onClick={() => navigate('/products')}>
            Tiếp tục mua sắm
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h1 className="mb-4">Giỏ hàng</h1>
      
      <Row>
        <Col lg={8}>
          {cartItems.map((item) => (
            <Card key={item.id} className="mb-3">
              <Card.Body>
                <Row className="align-items-center">
                  <Col md={2}>
                    <img 
                      src={item.thumbnail} 
                      alt={item.title}
                      className="img-fluid rounded"
                      style={{ height: '80px', objectFit: 'cover' }}
                    />
                  </Col>
                  
                  <Col md={4}>
                    <h6 className="mb-1">{item.title}</h6>
                    <p className="text-muted mb-0">
                      ${item.price?.toLocaleString()}
                    </p>
                  </Col>
                  
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Số lượng:</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                        style={{ width: '80px' }}
                      />
                    </Form.Group>
                  </Col>
                  
                  <Col md={2}>
                    <p className="h6 mb-0">
                      ${(item.price * item.quantity).toLocaleString()}
                    </p>
                  </Col>
                  
                  <Col md={1}>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                    >
                      ×
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          ))}
          
          <div className="d-flex justify-content-between">
            <Button variant="outline-secondary" onClick={clearCart}>
              Xóa tất cả
            </Button>
            <Button variant="outline-primary" onClick={() => navigate('/products')}>
              Tiếp tục mua sắm
            </Button>
          </div>
        </Col>
        
        <Col lg={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Tổng đơn hàng</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <span>Tạm tính:</span>
                <span>${calculateSubtotal().toLocaleString()}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Phí vận chuyển:</span>
                <span>Miễn phí</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-3">
                <strong>Tổng cộng:</strong>
                <strong className="text-primary">
                  ${calculateSubtotal().toLocaleString()}
                </strong>
              </div>
              
              <Button 
                variant="primary" 
                size="lg" 
                className="w-100"
                onClick={handleCheckout}
              >
                Tiến hành thanh toán
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CartPage;
