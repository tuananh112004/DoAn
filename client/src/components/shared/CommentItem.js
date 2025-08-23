import React, { useState, useContext } from 'react';
import { Card, Button, Badge, Row, Col, Image, Alert } from 'react-bootstrap';
import { MyUserContext } from '../../contexts/Contexts';
import axios from '../../configs/Apis';
import CommentForm from './CommentForm';
import CommentReply from './CommentReply';

const CommentItem = ({ comment, productId, onCommentUpdated, onCommentDeleted, onCommentCreated }) => {
  const [user] = useContext(MyUserContext);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = user && comment.user_id._id === user._id;
  const isAdmin = user && user.role === 'admin';
  const canModify = isOwner || isAdmin;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStars = (rating) => {
    return '⭐'.repeat(rating);
  };

  const handleReply = () => {
    setShowReplyForm(!showReplyForm);
  };

  const handleEdit = () => {
    setShowEditForm(!showEditForm);
  };

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await axios.delete(`/comments/${comment._id}`);

      if (response.data.success) {
        onCommentDeleted();
      } else {
        alert(response.data.message || 'Có lỗi xảy ra khi xóa bình luận');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Có lỗi xảy ra khi xóa bình luận');
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleReplyCreated = (newReply) => {
    setShowReplyForm(false);
    onCommentCreated(newReply);
  };

  const handleEditCancel = () => {
    setShowEditForm(false);
  };

  const handleEditSuccess = () => {
    setShowEditForm(false);
    onCommentUpdated();
  };

  return (
    <div className="comment-item mb-4">
      <Card>
        <Card.Body>
          {/* Comment Header */}
          <Row className="mb-3">
            <Col xs="auto">
              <Image
                src={comment.user_id.avatar || '/images/default-avatar.png'}
                alt={comment.user_id.fullName}
                roundedCircle
                width={40}
                height={40}
                style={{ objectFit: 'cover' }}
              />
            </Col>
            <Col>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="mb-1">{comment.user_id.fullName}</h6>
                  <small className="text-muted">
                    {formatDate(comment.createdAt)}
                  </small>
                </div>
                <div className="text-end">
                  <div className="text-warning mb-1">
                    {renderStars(comment.rating)}
                  </div>
                  {comment.status === 'inactive' && (
                    <Badge bg="warning" className="small">
                      Chờ kiểm duyệt
                    </Badge>
                  )}
                </div>
              </div>
            </Col>
          </Row>

          {/* Comment Content */}
          <div className="comment-content mb-3">
            <p className="mb-0">{comment.content}</p>
            
            {/* Moderation Status */}
            {comment.aiModeration && comment.aiModeration.isChecked && (
              <div className="mt-2">
                {comment.aiModeration.isViolation ? (
                  <Alert variant="warning" className="py-2 mb-0 small">
                    <i className="fas fa-exclamation-triangle me-1"></i>
                    <strong>Bình luận đang chờ kiểm duyệt</strong>
                    <br />
                    <small>
                      Loại vi phạm: <code>{comment.aiModeration.violationType}</code>
                      {comment.aiModeration.source && (
                        <span className="ms-2">
                          (Kiểm tra: {comment.aiModeration.source})
                        </span>
                      )}
                    </small>
                  </Alert>
                ) : (
                  <div className="text-success small">
                    <i className="fas fa-check-circle me-1"></i>
                    Đã được kiểm tra và chấp thuận
                    {comment.aiModeration.source && (
                      <span className="ms-2">
                        (Kiểm tra: {comment.aiModeration.source})
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Comment Actions */}
          <div className="comment-actions d-flex gap-2">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={handleReply}
              disabled={showReplyForm}
            >
              <i className="fas fa-reply me-1"></i>
              Trả lời
            </Button>

            {canModify && (
              <>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={handleEdit}
                  disabled={showEditForm}
                >
                  <i className="fas fa-edit me-1"></i>
                  Sửa
                </Button>

                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                      Đang xóa...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-trash me-1"></i>
                      Xóa
                    </>
                  )}
                </Button>
              </>
            )}
          </div>

          {/* Reply Form */}
          {showReplyForm && (
            <div className="mt-3">
              <CommentForm
                productId={productId}
                parentId={comment._id}
                onCommentCreated={handleReplyCreated}
                onCancel={() => setShowReplyForm(false)}
              />
            </div>
          )}

          {/* Edit Form */}
          {showEditForm && (
            <div className="mt-3">
              <CommentEditForm
                comment={comment}
                onEditSuccess={handleEditSuccess}
                onCancel={handleEditCancel}
              />
            </div>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="replies mt-3">
              <h6 className="text-muted mb-3">
                <i className="fas fa-reply me-2"></i>
                Phản hồi ({comment.replies.length})
              </h6>
              {comment.replies.map(reply => (
                <CommentReply
                  key={reply._id}
                  reply={reply}
                  productId={productId}
                  onCommentUpdated={onCommentUpdated}
                  onCommentDeleted={onCommentDeleted}
                  onCommentCreated={onCommentCreated}
                />
              ))}
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

// CommentEditForm component for editing comments
const CommentEditForm = ({ comment, onEditSuccess, onCancel }) => {
  const [content, setContent] = useState(comment.content);
  const [rating, setRating] = useState(comment.rating);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Vui lòng nhập nội dung bình luận');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await axios.put(`/comments/${comment._id}`, {
        content: content.trim(),
        rating
      });

      if (response.data.success) {
        onEditSuccess();
      } else {
        setError(response.data.message || 'Có lỗi xảy ra khi cập nhật bình luận');
      }
    } catch (err) {
      console.error('Error updating comment:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Có lỗi xảy ra khi cập nhật bình luận');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="edit-form">
      <Card className="border-primary">
        <Card.Header className="bg-primary text-white">
          <h6 className="mb-0">Sửa bình luận</h6>
        </Card.Header>
        <Card.Body>
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            <div className="mb-3">
              <label className="form-label">Đánh giá:</label>
              <select
                className="form-select"
                value={rating}
                onChange={(e) => setRating(parseInt(e.target.value))}
                disabled={submitting}
              >
                <option value={5}>⭐⭐⭐⭐⭐ (5 sao)</option>
                <option value={4}>⭐⭐⭐⭐ (4 sao)</option>
                <option value={3}>⭐⭐⭐ (3 sao)</option>
                <option value={2}>⭐⭐ (2 sao)</option>
                <option value={1}>⭐ (1 sao)</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Nội dung bình luận:</label>
              <textarea
                className="form-control"
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Nội dung bình luận..."
                disabled={submitting}
                required
              />
            </div>

            <div className="d-flex gap-2">
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    Đang cập nhật...
                  </>
                ) : (
                  'Cập nhật'
                )}
              </button>
              
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onCancel}
                disabled={submitting}
              >
                Hủy
              </button>
            </div>
          </form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default CommentItem;
