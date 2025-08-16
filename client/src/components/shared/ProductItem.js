import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { MyCartContext } from '../../contexts/Contexts';
import { useContext } from 'react';

const ProductItem = ({ product }) => {
  const navigate = useNavigate();
  const [cartCounter, cartDispatch] = useContext(MyCartContext);

  const handleAddToCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '{}');
    const productId = product._id;
    
    if (cart[productId]) {
      cart[productId].quantity += 1;
    } else {
      cart[productId] = {
        id: product._id,
        title: product.title,
        price: product.price,
        thumbnail: product.thumbnail,
        quantity: 1
      };
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    cartDispatch({ type: 'update' });
  };

  const handleViewDetail = () => {
    navigate(`/products/${product.slug}`);
  };

  return (
    <Card className="h-100 product-card">
      <div className="position-relative">
        <Card.Img 
          variant="top" 
          src={product.thumbnail} 
          alt={product.title}
          style={{ height: '200px', objectFit: 'cover' }}
        />
        {product.discountPercentage > 0 && (
          <Badge 
            bg="danger" 
            className="position-absolute top-0 end-0 m-2"
          >
            -{product.discountPercentage}%
          </Badge>
        )}
      </div>
      
      <Card.Body className="d-flex flex-column">
        <Card.Title className="text-truncate">{product.title}</Card.Title>
        <Card.Text className="text-muted small mb-2">
          {product.description?.substring(0, 100)}...
        </Card.Text>
        
        <div className="mt-auto">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="h5 text-primary mb-0">
              ${product.price?.toLocaleString()}
            </span>
            {product.discountPercentage > 0 && (
              <small className="text-muted text-decoration-line-through">
                ${(product.price * (1 + product.discountPercentage / 100)).toLocaleString()}
              </small>
            )}
          </div>
          
          <div className="d-grid gap-2">
            <Button 
              variant="outline-primary" 
              size="sm"
              onClick={handleViewDetail}
            >
              Xem chi tiết
            </Button>
            <Button 
              variant="primary" 
              size="sm"
              onClick={handleAddToCart}
            >
              Thêm vào giỏ
            </Button>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProductItem;
