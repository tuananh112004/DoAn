import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Pagination } from 'react-bootstrap';
import { MyUserContext } from '../../contexts/Contexts';
import axios from '../../configs/Apis';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';
import './CommentSection.css';

const CommentSection = ({ productId }) => {
  const [user] = useContext(MyUserContext);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalComments, setTotalComments] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const commentsPerPage = 5;

  useEffect(() => {
    if (productId) {
      loadComments();
    }
  }, [productId, currentPage]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/comments/product/${productId}?page=${currentPage}&limit=${commentsPerPage}`);
      
      if (response.data.success) {
        setComments(response.data.comments);
        setTotalPages(response.data.pagination.total);
        setTotalComments(response.data.pagination.totalItems);
      } else {
        setError('Không thể tải bình luận');
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi tải bình luận');
      console.error('Error loading comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentCreated = (newComment) => {
    setShowSuccess(true);
    setSuccessMessage('Bình luận đã được tạo thành công!');
    setCurrentPage(1); // Reset to first page
    loadComments();
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowSuccess(false);
      setSuccessMessage('');
    }, 3000);
  };

  const handleCommentUpdated = () => {
    setShowSuccess(true);
    setSuccessMessage('Bình luận đã được cập nhật thành công!');
    loadComments();
    
    setTimeout(() => {
      setShowSuccess(false);
      setSuccessMessage('');
    }, 3000);
  };

  const handleCommentDeleted = () => {
    setShowSuccess(true);
    setSuccessMessage('Bình luận đã được xóa thành công!');
    loadComments();
    
    setTimeout(() => {
      setShowSuccess(false);
      setSuccessMessage('');
    }, 3000);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const items = [];
    
    // Previous button
    if (currentPage > 1) {
      items.push(
        <Pagination.Prev 
          key="prev" 
          onClick={() => handlePageChange(currentPage - 1)}
        />
      );
    }

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      items.push(
        <Pagination.Item
          key={i}
          active={i === currentPage}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Pagination.Item>
      );
    }

    // Next button
    if (currentPage < totalPages) {
      items.push(
        <Pagination.Next 
          key="next" 
          onClick={() => handlePageChange(currentPage + 1)}
        />
      );
    }

    return (
      <div className="d-flex justify-content-center mt-4">
        <Pagination>{items}</Pagination>
      </div>
    );
  };

  if (loading && currentPage === 1) {
    return (
      <Container className="my-5">
        <Row>
          <Col>
            <Card>
              <Card.Body className="text-center">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Đang tải...</span>
                </div>
                <p className="mt-2">Đang tải bình luận...</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h4 className="mb-0">
                Bình luận sản phẩm 
                <span className="text-muted ms-2">({totalComments})</span>
              </h4>
            </Card.Header>
            <Card.Body>
              {/* Success Alert */}
              {showSuccess && (
                <Alert variant="success" dismissible onClose={() => setShowSuccess(false)}>
                  {successMessage}
                </Alert>
              )}

              {/* Error Alert */}
              {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              {/* Comment Form */}
              {user ? (
                <CommentForm 
                  productId={productId} 
                  onCommentCreated={handleCommentCreated}
                />
              ) : (
                <Alert variant="info">
                  Vui lòng <a href="/login">đăng nhập</a> để viết bình luận
                </Alert>
              )}

              <hr />

              {/* Comments List */}
              <div className="comments-list">
                {comments.length === 0 ? (
                  <div className="text-center text-muted py-4">
                    <p>Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>
                  </div>
                ) : (
                  comments.map(comment => (
                    <CommentItem
                      key={comment._id}
                      comment={comment}
                      productId={productId}
                      onCommentUpdated={handleCommentUpdated}
                      onCommentDeleted={handleCommentDeleted}
                      onCommentCreated={handleCommentCreated}
                    />
                  ))
                )}
              </div>

              {/* Pagination */}
              {renderPagination()}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CommentSection;
