import React, { useState, useContext } from 'react';
import { Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { MyUserContext } from '../../contexts/Contexts';
import axios from '../../configs/Apis';

const CommentForm = ({ productId, onCommentCreated, parentId = null, onCancel }) => {
  const [user] = useContext(MyUserContext);
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [moderationResult, setModerationResult] = useState(null);

  const isReply = parentId !== null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Vui lòng nhập nội dung bình luận');
      return;
    }

    setSubmitting(true);
    setError(null);
    setModerationResult(null);

    try {
      const commentData = {
        content: content.trim(),
        product_id: productId,
        rating: isReply ? 5 : rating, // Replies don't have rating
        parent_id: parentId
      };

      const response = await axios.post('/comments/create', commentData);

      if (response.data.success) {
        // Kiểm tra kết quả moderation
        if (response.data.isModerated) {
          setModerationResult({
            type: 'warning',
            message: response.data.message,
            violationType: response.data.violationType
          });
        } else {
          setModerationResult({
            type: 'success',
            message: response.data.message
          });
        }
        
        setContent('');
        setRating(5);
        onCommentCreated(response.data.comment);
        
        // If this is a reply form, close it
        if (isReply && onCancel) {
          onCancel();
        }
      } else {
        setError(response.data.message || 'Có lỗi xảy ra khi tạo bình luận');
      }
    } catch (err) {
      console.error('Error creating comment:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Có lỗi xảy ra khi tạo bình luận');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const renderModerationAlert = () => {
    if (!moderationResult) return null;

    return (
      <Alert variant={moderationResult.type} dismissible onClose={() => setModerationResult(null)}>
        <div className="d-flex align-items-center">
          {moderationResult.type === 'warning' && (
            <i className="fas fa-exclamation-triangle me-2"></i>
          )}
          {moderationResult.type === 'success' && (
            <i className="fas fa-check-circle me-2"></i>
          )}
          <div>
            <strong>{moderationResult.type === 'warning' ? 'Chú ý:' : 'Thành công:'}</strong>
            <br />
            {moderationResult.message}
            {moderationResult.violationType && (
              <small className="d-block mt-1">
                Loại vi phạm: <code>{moderationResult.violationType}</code>
              </small>
            )}
          </div>
        </div>
      </Alert>
    );
  };

  return (
    <div className="comment-form mb-4">
      <Form onSubmit={handleSubmit}>
        {/* Moderation Result Alert */}
        {renderModerationAlert()}

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {!isReply && (
          <Row className="mb-3">
            <Col sm={6}>
              <Form.Group>
                <Form.Label>Đánh giá:</Form.Label>
                <Form.Select
                  value={rating}
                  onChange={(e) => setRating(parseInt(e.target.value))}
                  disabled={submitting}
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5 sao)</option>
                  <option value={4}>⭐⭐⭐⭐ (4 sao)</option>
                  <option value={3}>⭐⭐⭐ (3 sao)</option>
                  <option value={2}>⭐⭐ (2 sao)</option>
                  <option value={1}>⭐ (1 sao)</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        )}

        <Form.Group className="mb-3">
          <Form.Label>
            {isReply ? 'Nội dung phản hồi:' : 'Nội dung bình luận:'}
          </Form.Label>
          <Form.Control
            as="textarea"
            rows={isReply ? 2 : 3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              isReply 
                ? "Viết phản hồi của bạn..." 
                : "Viết bình luận của bạn..."
            }
            disabled={submitting}
            required
          />
          <Form.Text className="text-muted">
            {isReply ? 'Phản hồi sẽ được kiểm tra tự động' : 'Bình luận sẽ được kiểm tra tự động để đảm bảo nội dung phù hợp'}
          </Form.Text>
        </Form.Group>

        <div className="d-flex gap-2">
          <Button 
            type="submit" 
            variant="primary" 
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Đang gửi...
              </>
            ) : (
              isReply ? 'Gửi phản hồi' : 'Gửi bình luận'
            )}
          </Button>
          
          {isReply && (
            <Button 
              type="button" 
              variant="secondary" 
              onClick={handleCancel}
              disabled={submitting}
            >
              Hủy
            </Button>
          )}
        </div>
      </Form>
    </div>
  );
};

export default CommentForm;
