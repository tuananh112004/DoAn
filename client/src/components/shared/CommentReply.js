import React, { useState, useContext } from 'react';
import { Card, Button, Badge, Row, Col, Image, Alert } from 'react-bootstrap';
import { MyUserContext } from '../../contexts/Contexts';
import axios from '../../configs/Apis';

const CommentReply = ({ reply, productId, onCommentUpdated, onCommentDeleted, onCommentCreated }) => {
  const [user] = useContext(MyUserContext);
  const [deleting, setDeleting] = useState(false);

  const isOwner = user && reply.user_id._id === user._id;
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

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phản hồi này?')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await axios.delete(`/comments/${reply._id}`);

      if (response.data.success) {
        onCommentDeleted();
      } else {
        alert(response.data.message || 'Có lỗi xảy ra khi xóa phản hồi');
      }
    } catch (error) {
      console.error('Error deleting reply:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Có lỗi xảy ra khi xóa phản hồi');
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="reply-item mb-2 ms-4">
      <Card className="border-light">
        <Card.Body className="py-2">
          {/* Reply Header */}
          <Row className="mb-2">
            <Col xs="auto">
              <Image
                src={reply.user_id.avatar || '/images/default-avatar.png'}
                alt={reply.user_id.fullName}
                roundedCircle
                width={30}
                height={30}
                style={{ objectFit: 'cover' }}
              />
            </Col>
            <Col>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="mb-1 small">{reply.user_id.fullName}</h6>
                  <small className="text-muted">
                    {formatDate(reply.createdAt)}
                  </small>
                </div>
                <div className="text-end">
                  <div className="text-warning mb-1 small">
                    {renderStars(reply.rating)}
                  </div>
                  {reply.status === 'inactive' && (
                    <Badge bg="warning" className="small">
                      Chờ kiểm duyệt
                    </Badge>
                  )}
                </div>
              </div>
            </Col>
          </Row>

          {/* Reply Content */}
          <div className="reply-content mb-2">
            <p className="mb-0 small">{reply.content}</p>
            
            {/* Moderation Status for Reply */}
            {reply.aiModeration && reply.aiModeration.isChecked && (
              <div className="mt-2">
                {reply.aiModeration.isViolation ? (
                  <Alert variant="warning" className="py-1 mb-0 small">
                    <i className="fas fa-exclamation-triangle me-1"></i>
                    <strong>Phản hồi đang chờ kiểm duyệt</strong>
                    <br />
                    <small>
                      Loại vi phạm: <code>{reply.aiModeration.violationType}</code>
                    </small>
                  </Alert>
                ) : (
                  <div className="text-success small">
                    <i className="fas fa-check-circle me-1"></i>
                    Đã được kiểm tra
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reply Actions */}
          {canModify && (
            <div className="reply-actions">
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
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default CommentReply;
