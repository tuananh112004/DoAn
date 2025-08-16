import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import ProductItem from '../../shared/ProductItem';
import axios from '../../../configs/Apis';

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/home');
        
        if (response.data.success) {
          setFeaturedProducts(response.data.data.productsFeatured || []);
          setNewProducts(response.data.data.productsNew || []);

        } else {
          setError('Không thể tải dữ liệu trang chủ');
        }
      } catch (err) {
        setError('Lỗi kết nối server');
        console.error('Error fetching home data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      {/* Hero Section */}
      <Row className="mb-5">
        <Col>
          <div className="text-center">
            <h1 className="display-4 mb-3">Chào mừng đến với Manage Product</h1>
            <p className="lead">
              Khám phá các sản phẩm chất lượng cao với giá cả hợp lý
            </p>
          </div>
        </Col>
      </Row>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <Row className="mb-5">
          <Col>
            <h2 className="mb-4">Sản phẩm nổi bật</h2>
            <Row>
              {featuredProducts.map((product) => (
                <Col key={product._id} lg={3} md={4} sm={6} className="mb-4">
                  <ProductItem product={product} />
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      )}

      {/* New Products */}
      {newProducts.length > 0 && (
        <Row>
          <Col>
            <h2 className="mb-4">Sản phẩm mới</h2>
            <Row>
              {newProducts.map((product) => (
                <Col key={product._id} lg={3} md={4} sm={6} className="mb-4">
                  <ProductItem product={product} />
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      )}

      {/* Empty State */}
      {featuredProducts.length === 0 && newProducts.length === 0 && (
        <Row>
          <Col>
            <div className="text-center py-5">
              <h3>Chưa có sản phẩm nào</h3>
              <p className="text-muted">
                Hãy quay lại sau để xem các sản phẩm mới
              </p>
            </div>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default HomePage;
