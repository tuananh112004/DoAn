import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Alert, Pagination } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import ProductItem from '../../shared/ProductItem';
import axios from '../../../configs/Apis';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const currentPage = parseInt(searchParams.get('page')) || 1;
  const query = searchParams.get('q') || '';

  useEffect(() => {
    setSearchTerm(query);
  }, [query]);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query.trim()) {
        setProducts([]);
        setTotalPages(1);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          q: query,
          page: currentPage,
          limit: 12
        });

        const response = await axios.get(`/search?${params}`);
        
        if (response.data.success) {
          setProducts(response.data.data.products || []);
          setTotalPages(response.data.data.totalPages || 1);
        } else {
          setError('Không thể tìm kiếm sản phẩm');
        }
      } catch (err) {
        setError('Lỗi kết nối server');
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query, currentPage]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      const newParams = new URLSearchParams();
      newParams.set('q', searchTerm.trim());
      newParams.set('page', '1');
      setSearchParams(newParams);
    }
  };

  const handlePageChange = (page) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page);
    setSearchParams(newParams);
  };

  return (
    <Container className="py-5">
      {/* Search Form */}
      <Row className="mb-4">
        <Col>
          <Form onSubmit={handleSearch}>
            <Row>
              <Col md={8}>
                <Form.Control
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Col>
              <Col md={4}>
                <Button 
                  variant="primary" 
                  type="submit" 
                  className="w-100"
                  disabled={!searchTerm.trim()}
                >
                  Tìm kiếm
                </Button>
              </Col>
            </Row>
          </Form>
        </Col>
      </Row>

      {/* Search Results */}
      {query && (
        <Row className="mb-4">
          <Col>
            <h2>
              Kết quả tìm kiếm cho "{query}"
              {products.length > 0 && (
                <span className="text-muted"> ({products.length} sản phẩm)</span>
              )}
            </h2>
          </Col>
        </Row>
      )}

      {loading && (
        <Row>
          <Col>
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          </Col>
        </Row>
      )}

      {error && (
        <Row>
          <Col>
            <Alert variant="danger">{error}</Alert>
          </Col>
        </Row>
      )}

      {!loading && !error && query && products.length === 0 && (
        <Row>
          <Col>
            <div className="text-center py-5">
              <h3>Không tìm thấy sản phẩm</h3>
              <p className="text-muted">
                Không có sản phẩm nào phù hợp với từ khóa "{query}"
              </p>
              <p className="text-muted">
                Hãy thử tìm kiếm với từ khóa khác
              </p>
            </div>
          </Col>
        </Row>
      )}

      {!loading && !error && products.length > 0 && (
        <>
          <Row>
            {products.map((product) => (
              <Col key={product._id} lg={3} md={4} sm={6} className="mb-4">
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
      )}

      {!query && !loading && (
        <Row>
          <Col>
            <div className="text-center py-5">
              <h3>Bắt đầu tìm kiếm</h3>
              <p className="text-muted">
                Nhập từ khóa vào ô tìm kiếm để tìm sản phẩm bạn muốn
              </p>
            </div>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default SearchPage;
