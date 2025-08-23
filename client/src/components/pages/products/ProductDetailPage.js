import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Form } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { MyCartContext } from '../../../contexts/Contexts';
import axios from '../../../configs/Apis';
import CommentSection from '../../shared/CommentSection';

const ProductDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [cartCounter, cartDispatch] = useContext(MyCartContext);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/products/${slug}`);
        
        if (response.data.success) {
         console.log("sdddddddddđ",response.data.data.product);
          setProduct(response.data.data.product);
        } else {
          setError('Không tìm thấy sản phẩm');
        }
      } catch (err) {
        setError('Lỗi kết nối server');
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;

    const cart = JSON.parse(localStorage.getItem('cart') || '{}');
    const productId = product._id;
   
    if (cart[productId]) {
      cart[productId].quantity += quantity;
    } else {
      cart[productId] = {
        id: product._id,
        title: product.title,
        price: product.price * (1 - product.discountPercentage / 100) ?? product.price,
        thumbnail: product.thumbnail,
        quantity: quantity
      };
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    cartDispatch({ type: 'update' });
    
    // Show success message
    alert('Đã thêm sản phẩm vào giỏ hàng!');
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0) {
      setQuantity(value);
    }
  };

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

  if (error || !product) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          {error || 'Không tìm thấy sản phẩm'}
        </Alert>
        <Button variant="primary" onClick={() => navigate('/products')}>
          Quay lại danh sách sản phẩm
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row>
        {/* Product Images */}
        <Col lg={6} md={6} className="mb-4">
          <Card>
            <Card.Img 
              variant="top" 
              src={product.thumbnail} 
              alt={product.title}
              style={{ height: '400px', objectFit: 'cover' }}
            />
            {product.discountPercentage > 0 && (
              <Badge 
                bg="danger" 
                className="position-absolute top-0 end-0 m-3"
                style={{ fontSize: '1rem' }}
              >
                -{product.discountPercentage}%
              </Badge>
            )}
          </Card>
        </Col>

        {/* Product Info */}
        <Col lg={6} md={6}>
          <h1 className="mb-3">{product.title}</h1>
          
          <div className="mb-3">
            <span className="h3 text-primary me-3">
              ${Number(product.price * (1 - product.discountPercentage / 100) ?? product.price)?.toLocaleString()}
            </span>
            {product.discountPercentage > 0 && (
              <span className="h5 text-muted text-decoration-line-through">
                ${Number(product.price).toLocaleString()}
              </span>
            )}
          </div>

          <div className="mb-4">
            <h5>Mô tả sản phẩm:</h5>
            <p className="text-muted">
              {product.description || 'Chưa có mô tả cho sản phẩm này.'}
            </p>
          </div>

          <div className="mb-4">
            <h5>Thông tin sản phẩm:</h5>
            <ul className="list-unstyled">
              <li><strong>Danh mục:</strong> {product.category?.title || 'Chưa phân loại'}</li>
              <li><strong>Trạng thái:</strong> 
                <Badge bg={product.status === 'active' ? 'success' : 'secondary'} className="ms-2">
                  {product.status === 'active' ? 'Còn hàng' : 'Hết hàng'}
                </Badge>
              </li>
              {product.stock && (
                <li><strong>Số lượng:</strong> {product.stock}</li>
              )}
            </ul>
          </div>

          {product.status === 'active' && (
            <div className="mb-4">
              <Row>
                <Col sm={4}>
                  <Form.Group>
                    <Form.Label>Số lượng:</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={handleQuantityChange}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>
          )}

          <div className="d-grid gap-2">
            {product.status === 'active' ? (
              <Button 
                variant="primary" 
                size="lg"
                onClick={handleAddToCart}
              >
                Thêm vào giỏ hàng
              </Button>
            ) : (
              <Button variant="secondary" size="lg" disabled>
                Hết hàng
              </Button>
            )}
            
            <Button 
              variant="outline-primary" 
              onClick={() => navigate('/')}
            >
              Quay lại danh sách sản phẩm
            </Button>
          </div>
        </Col>
      </Row>

      {/* Comments Section */}
      <CommentSection productId={product._id} />
    </Container>
  );
};

export default ProductDetailPage;
