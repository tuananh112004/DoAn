import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Pagination, Alert } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import ProductItem from '../../shared/ProductItem';
import axios from '../../../configs/Apis';

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);

  const currentPage = parseInt(searchParams.get('page')) || 1;
  const currentCategory = searchParams.get('category') || '';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch products
        const productParams = new URLSearchParams({
          page: currentPage,
          limit: 12
        });
        
        if (currentCategory) {
          productParams.append('category', currentCategory);
        }
        
        const productsResponse = await axios.get(`/products?${productParams}`);
        
        if (productsResponse.data.success) {
          setProducts(productsResponse.data.data.products || []);
          setTotalPages(productsResponse.data.data.totalPages || 1);
        }
        
        // Fetch categories
        const categoriesResponse = await axios.get('/products/category');
        if (categoriesResponse.data.success) {
          setCategories(categoriesResponse.data.data || []);
        }
        
      } catch (err) {
        setError('Lỗi kết nối server');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, currentCategory]);

  const handleCategoryChange = (categoryId) => {
    const newParams = new URLSearchParams(searchParams);
    if (categoryId) {
      newParams.set('category', categoryId);
    } else {
      newParams.delete('category');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handlePageChange = (page) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page);
    setSearchParams(newParams);
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

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row>
        {/* Sidebar */}
        <Col lg={3} md={4} className="mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Danh mục</h5>
            </div>
            <div className="card-body">
              <Form.Select 
                value={currentCategory} 
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.title}
                  </option>
                ))}
              </Form.Select>
            </div>
          </div>
        </Col>

        {/* Products */}
        <Col lg={9} md={8}>
          <h2 className="mb-4">
            Sản phẩm
            {currentCategory && (
              <span className="text-muted">
                - {categories.find(c => c._id === currentCategory)?.title}
              </span>
            )}
          </h2>

          {products.length > 0 ? (
            <>
              <Row>
                {products.map((product) => (
                  <Col key={product._id} lg={4} md={6} sm={6} className="mb-4">
                    <ProductItem product={product} />
                  </Col>
                ))}
              </Row>

              {/* Pagination */}
              {totalPages > 1 && (
                <Row className="mt-4">
                  <Col>
                    <Pagination className="justify-content-center">
                      <Pagination.First 
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                      />
                      <Pagination.Prev 
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      />
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => 
                          page === 1 || 
                          page === totalPages || 
                          Math.abs(page - currentPage) <= 2
                        )
                        .map((page, index, array) => (
                          <React.Fragment key={page}>
                            {index > 0 && array[index - 1] !== page - 1 && (
                              <Pagination.Ellipsis />
                            )}
                            <Pagination.Item
                              active={page === currentPage}
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </Pagination.Item>
                          </React.Fragment>
                        ))
                      }
                      
                      <Pagination.Next 
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      />
                      <Pagination.Last 
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                      />
                    </Pagination>
                  </Col>
                </Row>
              )}
            </>
          ) : (
            <div className="text-center py-5">
              <h3>Không tìm thấy sản phẩm</h3>
              <p className="text-muted">
                Hãy thử chọn danh mục khác hoặc quay lại sau
              </p>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default ProductsPage;
