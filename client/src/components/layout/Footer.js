import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer className="bg-dark text-light py-4 mt-5">
      <Container>
        <Row>
          <Col md={6}>
            <h5>Manage Product</h5>
            <p className="mb-0">
              Hệ thống quản lý sản phẩm và bán hàng trực tuyến
            </p>
          </Col>
          <Col md={6} className="text-md-end">
            <p className="mb-0">
              © 2024 Manage Product. All rights reserved.
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
