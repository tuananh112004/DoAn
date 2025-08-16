// class CommentManager {
//     constructor(productId) {
//         this.productId = productId;
//         this.currentPage = 1;
//         this.commentsPerPage = 5;
//         console.log("CommentManager initialized with product ID:", this.productId); // Debug log
//         this.init();
//     }

//     init() {
//         this.loadComments();
//         this.bindEvents();
//     }

//     bindEvents() {
//         // Form tạo comment
//         const commentForm = document.getElementById('commentForm');
//         if (commentForm) {
//             commentForm.addEventListener('submit', (e) => this.handleCreateComment(e));
//         }

//         // Load more comments
//         document.addEventListener('click', (e) => {
//             if (e.target.classList.contains('load-more-comments')) {
//                 this.loadMoreComments();
//             }
//             if (e.target.classList.contains('reply-btn')) {
//                 this.showReplyForm(e.target.dataset.commentId);
//             }
//             if (e.target.classList.contains('edit-btn')) {
//                 this.showEditForm(e.target.dataset.commentId);
//             }
//             if (e.target.classList.contains('delete-btn')) {
//                 this.deleteComment(e.target.dataset.commentId);
//             }
//             if (e.target.classList.contains('submit-reply')) {
//                 this.handleCreateReply(e);
//             }
//             if (e.target.classList.contains('submit-edit')) {
//                 this.handleUpdateComment(e);
//             }
//         });
//     }

//     async loadComments() {
//         try {
//             const response = await fetch(`/comments/product/${this.productId}?page=${this.currentPage}&limit=${this.commentsPerPage}`);
//             const data = await response.json();
            
//             if (data.success) {
//                 this.renderComments(data.comments);
//                 this.renderPagination(data.pagination);
//             } else {
//                 this.showError('Không thể tải bình luận');
//             }
//         } catch (error) {
//             console.error('Error loading comments:', error);
//             this.showError('Có lỗi xảy ra khi tải bình luận');
//         }
//     }

//     renderComments(comments) {
//         const commentsList = document.getElementById('commentsList');
        
//         if (this.currentPage === 1) {
//             commentsList.innerHTML = '';
//         }

//         if (comments.length === 0 && this.currentPage === 1) {
//             commentsList.innerHTML = '<p class="text-center text-muted">Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>';
//             return;
//         }

//         comments.forEach(comment => {
//             const commentElement = this.createCommentElement(comment);
//             commentsList.appendChild(commentElement);
//         });
//     }

//     createCommentElement(comment) {
//         const commentDiv = document.createElement('div');
//         commentDiv.className = 'comment-item card mb-3';
//         commentDiv.dataset.commentId = comment._id;

//         const stars = '⭐'.repeat(comment.rating);
//         const createdAt = new Date(comment.createdAt).toLocaleDateString('vi-VN');
//         const isOwner = comment.user_id._id === window.currentUserId; // Cần set currentUserId từ server

//         commentDiv.innerHTML = `
//             <div class="card-body">
//                 <div class="d-flex justify-content-between align-items-start mb-2">
//                     <div class="d-flex align-items-center">
//                         <img src="${comment.user_id.avatar || '/images/default-avatar.png'}" 
//                              alt="${comment.user_id.fullName}" 
//                              class="rounded-circle me-2" 
//                              style="width: 40px; height: 40px; object-fit: cover;">
//                         <div>
//                             <h6 class="mb-0">${comment.user_id.fullName}</h6>
//                             <small class="text-muted">${createdAt}</small>
//                         </div>
//                     </div>
//                     <div class="rating">
//                         <span class="text-warning">${stars}</span>
//                     </div>
//                 </div>
                
//                 <div class="comment-content mb-3">
//                     <p class="mb-0">${this.escapeHtml(comment.content)}</p>
//                 </div>

//                 <div class="comment-actions">
//                     <button class="btn btn-sm btn-outline-primary reply-btn" data-comment-id="${comment._id}">
//                         <i class="fas fa-reply"></i> Trả lời
//                     </button>
//                     ${isOwner ? `
//                         <button class="btn btn-sm btn-outline-secondary edit-btn" data-comment-id="${comment._id}">
//                             <i class="fas fa-edit"></i> Sửa
//                         </button>
//                         <button class="btn btn-sm btn-outline-danger delete-btn" data-comment-id="${comment._id}">
//                             <i class="fas fa-trash"></i> Xóa
//                         </button>
//                     ` : ''}
//                 </div>

//                 ${comment.replies && comment.replies.length > 0 ? `
//                     <div class="replies mt-3">
//                         <h6>Phản hồi:</h6>
//                         ${comment.replies.map(reply => this.createReplyElement(reply)).join('')}
//                     </div>
//                 ` : ''}

//                 <div class="reply-form mt-3" id="replyForm-${comment._id}" style="display: none;">
//                     <div class="card">
//                         <div class="card-body">
//                             <h6>Trả lời bình luận:</h6>
//                             <textarea class="form-control mb-2" rows="2" placeholder="Viết phản hồi..."></textarea>
//                             <div class="d-flex gap-2">
//                                 <button class="btn btn-primary btn-sm submit-reply" data-comment-id="${comment._id}">Gửi</button>
//                                 <button class="btn btn-secondary btn-sm cancel-reply" data-comment-id="${comment._id}">Hủy</button>
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 <div class="edit-form mt-3" id="editForm-${comment._id}" style="display: none;">
//                     <div class="card">
//                         <div class="card-body">
//                             <h6>Sửa bình luận:</h6>
//                             <select class="form-control mb-2" name="rating">
//                                 <option value="5" ${comment.rating === 5 ? 'selected' : ''}>⭐⭐⭐⭐⭐ (5 sao)</option>
//                                 <option value="4" ${comment.rating === 4 ? 'selected' : ''}>⭐⭐⭐⭐ (4 sao)</option>
//                                 <option value="3" ${comment.rating === 3 ? 'selected' : ''}>⭐⭐⭐ (3 sao)</option>
//                                 <option value="2" ${comment.rating === 2 ? 'selected' : ''}>⭐⭐ (2 sao)</option>
//                                 <option value="1" ${comment.rating === 1 ? 'selected' : ''}>⭐ (1 sao)</option>
//                             </select>
//                             <textarea class="form-control mb-2" rows="3" placeholder="Nội dung bình luận...">${this.escapeHtml(comment.content)}</textarea>
//                             <div class="d-flex gap-2">
//                                 <button class="btn btn-primary btn-sm submit-edit" data-comment-id="${comment._id}">Cập nhật</button>
//                                 <button class="btn btn-secondary btn-sm cancel-edit" data-comment-id="${comment._id}">Hủy</button>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         `;

//         return commentDiv;
//     }

//     createReplyElement(reply) {
//         const stars = '⭐'.repeat(reply.rating);
//         const createdAt = new Date(reply.createdAt).toLocaleDateString('vi-VN');
//         const isOwner = reply.user_id._id === window.currentUserId;

//         return `
//             <div class="reply-item card mb-2 ms-4">
//                 <div class="card-body py-2">
//                     <div class="d-flex justify-content-between align-items-start">
//                         <div class="d-flex align-items-center">
//                             <img src="${reply.user_id.avatar || '/images/default-avatar.png'}" 
//                                  alt="${reply.user_id.fullName}" 
//                                  class="rounded-circle me-2" 
//                                  style="width: 30px; height: 30px; object-fit: cover;">
//                             <div>
//                                 <h6 class="mb-0 small">${reply.user_id.fullName}</h6>
//                                 <small class="text-muted">${createdAt}</small>
//                             </div>
//                         </div>
//                         <div class="rating">
//                             <span class="text-warning small">${stars}</span>
//                         </div>
//                     </div>
//                     <p class="mb-0 mt-2">${this.escapeHtml(reply.content)}</p>
//                     ${isOwner ? `
//                         <div class="mt-2">
//                             <button class="btn btn-sm btn-outline-danger delete-btn" data-comment-id="${reply._id}">
//                                 <i class="fas fa-trash"></i> Xóa
//                             </button>
//                         </div>
//                     ` : ''}
//                 </div>
//             </div>
//         `;
//     }

//     renderPagination(pagination) {
//         const paginationDiv = document.getElementById('commentsPagination');
        
//         if (pagination.total <= 1) {
//             paginationDiv.innerHTML = '';
//             return;
//         }

//         let paginationHtml = '<nav><ul class="pagination justify-content-center">';
        
//         // Previous button
//         if (pagination.current > 1) {
//             paginationHtml += `<li class="page-item"><a class="page-link" href="#" data-page="${pagination.current - 1}">Trước</a></li>`;
//         }

//         // Page numbers
//         for (let i = 1; i <= pagination.total; i++) {
//             const activeClass = i === pagination.current ? 'active' : '';
//             paginationHtml += `<li class="page-item ${activeClass}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
//         }

//         // Next button
//         if (pagination.current < pagination.total) {
//             paginationHtml += `<li class="page-item"><a class="page-link" href="#" data-page="${pagination.current + 1}">Sau</a></li>`;
//         }

//         paginationHtml += '</ul></nav>';

//         paginationDiv.innerHTML = paginationHtml;

//         // Bind pagination events
//         paginationDiv.addEventListener('click', (e) => {
//             if (e.target.classList.contains('page-link')) {
//                 e.preventDefault();
//                 const page = parseInt(e.target.dataset.page);
//                 this.currentPage = page;
//                 this.loadComments();
//             }
//         });
//     }

//     async handleCreateComment(e) {
//         e.preventDefault();
        
//         const form = e.target;
//         const formData = new FormData(form);
//         const content = formData.get('content');
//         const rating = formData.get('rating');

//         if (!content.trim()) {
//             this.showError('Vui lòng nhập nội dung bình luận');
//             return;
//         }

//         console.log("Sending product_id:", this.productId); // Debug log
//         try {
//             const response = await fetch('/comments/create', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({
//                     content,
//                     rating: parseInt(rating),
//                     product_id: this.productId
//                 })
//             });

//             const data = await response.json();

//             if (data.success) {
//                 this.showSuccess('Bình luận đã được tạo thành công');
//                 form.reset();
//                 this.currentPage = 1;
//                 this.loadComments();
//             } else {
//                 this.showError(data.message || 'Có lỗi xảy ra khi tạo bình luận');
//             }
//         } catch (error) {
//             console.error('Error creating comment:', error);
//             this.showError('Có lỗi xảy ra khi tạo bình luận');
//         }
//     }

//     showReplyForm(commentId) {
//         const replyForm = document.getElementById(`replyForm-${commentId}`);
//         replyForm.style.display = 'block';
//     }

//     async handleCreateReply(e) {
//         const commentId = e.target.dataset.commentId;
//         const replyForm = document.getElementById(`replyForm-${commentId}`);
//         const textarea = replyForm.querySelector('textarea');
//         const content = textarea.value.trim();

//         if (!content) {
//             this.showError('Vui lòng nhập nội dung phản hồi');
//             return;
//         }

//         try {
//             const response = await fetch('/comments/create', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({
//                     content,
//                     rating: 5,
//                     product_id: this.productId,
//                     parent_id: commentId
//                 })
//             });

//             const data = await response.json();

//             if (data.success) {
//                 this.showSuccess('Phản hồi đã được tạo thành công');
//                 replyForm.style.display = 'none';
//                 textarea.value = '';
//                 this.loadComments();
//             } else {
//                 this.showError(data.message || 'Có lỗi xảy ra khi tạo phản hồi');
//             }
//         } catch (error) {
//             console.error('Error creating reply:', error);
//             this.showError('Có lỗi xảy ra khi tạo phản hồi');
//         }
//     }

//     showEditForm(commentId) {
//         const editForm = document.getElementById(`editForm-${commentId}`);
//         editForm.style.display = 'block';
//     }

//     async handleUpdateComment(e) {
//         const commentId = e.target.dataset.commentId;
//         const editForm = document.getElementById(`editForm-${commentId}`);
//         const textarea = editForm.querySelector('textarea');
//         const ratingSelect = editForm.querySelector('select');
        
//         const content = textarea.value.trim();
//         const rating = parseInt(ratingSelect.value);

//         if (!content) {
//             this.showError('Vui lòng nhập nội dung bình luận');
//             return;
//         }

//         try {
//             const response = await fetch(`/comments/${commentId}`, {
//                 method: 'PUT',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({
//                     content,
//                     rating
//                 })
//             });

//             const data = await response.json();

//             if (data.success) {
//                 this.showSuccess('Bình luận đã được cập nhật thành công');
//                 editForm.style.display = 'none';
//                 this.loadComments();
//             } else {
//                 this.showError(data.message || 'Có lỗi xảy ra khi cập nhật bình luận');
//             }
//         } catch (error) {
//             console.error('Error updating comment:', error);
//             this.showError('Có lỗi xảy ra khi cập nhật bình luận');
//         }
//     }

//     async deleteComment(commentId) {
//         if (!confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
//             return;
//         }

//         try {
//             const response = await fetch(`/comments/${commentId}`, {
//                 method: 'DELETE'
//             });

//             const data = await response.json();

//             if (data.success) {
//                 this.showSuccess('Bình luận đã được xóa thành công');
//                 this.loadComments();
//             } else {
//                 this.showError(data.message || 'Có lỗi xảy ra khi xóa bình luận');
//             }
//         } catch (error) {
//             console.error('Error deleting comment:', error);
//             this.showError('Có lỗi xảy ra khi xóa bình luận');
//         }
//     }

//     showSuccess(message) {
//         // Tạo toast notification
//         const toast = document.createElement('div');
//         toast.className = 'alert alert-success alert-dismissible fade show position-fixed';
//         toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
//         toast.innerHTML = `
//             ${message}
//             <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
//         `;
//         document.body.appendChild(toast);

//         // Tự động ẩn sau 3 giây
//         setTimeout(() => {
//             toast.remove();
//         }, 3000);
//     }

//     showError(message) {
//         // Tạo toast notification
//         const toast = document.createElement('div');
//         toast.className = 'alert alert-danger alert-dismissible fade show position-fixed';
//         toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
//         toast.innerHTML = `
//             ${message}
//             <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
//         `;
//         document.body.appendChild(toast);

//         // Tự động ẩn sau 3 giây
//         setTimeout(() => {
//             toast.remove();
//         }, 3000);
//     }

//     escapeHtml(text) {
//         const div = document.createElement('div');
//         div.textContent = text;
//         return div.innerHTML;
//     }
// }

// // Khởi tạo CommentManager khi trang được load
// document.addEventListener('DOMContentLoaded', function() {
//     // Lấy product ID từ URL hoặc data attribute
//     const productId = document.querySelector('[data-product-id]')?.dataset.productId;
//     console.log("Product ID from data attribute:", productId); // Debug log
//     if (productId) {
//         window.commentManager = new CommentManager(productId);
//     } else {
//         console.error("Product ID not found!");
//     }
// }); 



class CommentManager {
    constructor(productId) {
        this.productId = productId;
        this.currentPage = 1;
        this.commentsPerPage = 5;
        this.loading = false; // tránh spam request
        console.log("CommentManager initialized with product ID:", this.productId);
        this.init();
    }

    init() {
        this.loadComments();
        this.bindEvents();
    }

    bindEvents() {
        // Form tạo comment
        const commentForm = document.getElementById('commentForm');
        if (commentForm) {
            commentForm.addEventListener('submit', (e) => this.handleCreateComment(e));
        }

        // Các event động
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('load-more-comments')) {
                this.loadMoreComments();
            }
            if (e.target.classList.contains('reply-btn')) {
                this.showReplyForm(e.target.dataset.commentId);
            }
            if (e.target.classList.contains('cancel-reply')) {
                this.hideReplyForm(e.target.dataset.commentId);
            }
            if (e.target.classList.contains('edit-btn')) {
                this.showEditForm(e.target.dataset.commentId);
            }
            if (e.target.classList.contains('cancel-edit')) {
                this.hideEditForm(e.target.dataset.commentId);
            }
            if (e.target.classList.contains('delete-btn')) {
                this.deleteComment(e.target.dataset.commentId);
            }
            if (e.target.classList.contains('submit-reply')) {
                this.handleCreateReply(e);
            }
            if (e.target.classList.contains('submit-edit')) {
                this.handleUpdateComment(e);
            }
        });
    }

    async loadComments() {
        if (this.loading) return; // ngăn spam request
        this.loading = true;

        try {
            const response = await fetch(`/comments/product/${this.productId}?page=${this.currentPage}&limit=${this.commentsPerPage}`);
            const data = await response.json();

            if (data.success) {
                this.renderComments(data.comments);
                this.renderPagination(data.pagination);
            } else {
                this.showError('Không thể tải bình luận');
            }
        } catch (error) {
            console.error('Error loading comments:', error);
            this.showError('Có lỗi xảy ra khi tải bình luận');
        } finally {
            this.loading = false;
        }
    }

    renderComments(comments) {
        const commentsList = document.getElementById('commentsList');

        if (this.currentPage === 1) {
            commentsList.innerHTML = '';
        }

        if (comments.length === 0 && this.currentPage === 1) {
            commentsList.innerHTML = '<p class="text-center text-muted">Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>';
            return;
        }

        comments.forEach(comment => {
            const commentElement = this.createCommentElement(comment);
            commentsList.appendChild(commentElement);
        });
    }

    createCommentElement(comment) {
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment-item card mb-3';
        commentDiv.dataset.commentId = comment._id;

        const stars = '⭐'.repeat(comment.rating);
        const createdAt = new Date(comment.createdAt).toLocaleDateString('vi-VN');
        const isOwner = comment.user_id._id === window.currentUserId;

        commentDiv.innerHTML = `
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div class="d-flex align-items-center">
                        <img src="${comment.user_id.avatar || '/images/default-avatar.png'}" 
                             alt="${comment.user_id.fullName}" 
                             class="rounded-circle me-2" 
                             style="width: 40px; height: 40px; object-fit: cover;">
                        <div>
                            <h6 class="mb-0">${comment.user_id.fullName}</h6>
                            <small class="text-muted">${createdAt}</small>
                        </div>
                    </div>
                    <div class="rating">
                        <span class="text-warning">${stars}</span>
                    </div>
                </div>
                
                <div class="comment-content mb-3">
                    <p class="mb-0">${this.escapeHtml(comment.content)}</p>
                </div>

                <div class="comment-actions">
                    <button class="btn btn-sm btn-outline-primary reply-btn" data-comment-id="${comment._id}">
                        <i class="fas fa-reply"></i> Trả lời
                    </button>
                    ${isOwner ? `
                        <button class="btn btn-sm btn-outline-secondary edit-btn" data-comment-id="${comment._id}">
                            <i class="fas fa-edit"></i> Sửa
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-btn" data-comment-id="${comment._id}">
                            <i class="fas fa-trash"></i> Xóa
                        </button>
                    ` : ''}
                </div>

                ${comment.replies && comment.replies.length > 0 ? `
                    <div class="replies mt-3">
                        <h6>Phản hồi:</h6>
                        ${comment.replies.map(reply => this.createReplyElement(reply)).join('')}
                    </div>
                ` : ''}

                <div class="reply-form mt-3" id="replyForm-${comment._id}" style="display: none;">
                    <div class="card">
                        <div class="card-body">
                            <h6>Trả lời bình luận:</h6>
                            <textarea class="form-control mb-2" rows="2" placeholder="Viết phản hồi..."></textarea>
                            <div class="d-flex gap-2">
                                <button class="btn btn-primary btn-sm submit-reply" data-comment-id="${comment._id}">Gửi</button>
                                <button class="btn btn-secondary btn-sm cancel-reply" data-comment-id="${comment._id}">Hủy</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="edit-form mt-3" id="editForm-${comment._id}" style="display: none;">
                    <div class="card">
                        <div class="card-body">
                            <h6>Sửa bình luận:</h6>
                            <select class="form-control mb-2" name="rating">
                                <option value="5" ${comment.rating === 5 ? 'selected' : ''}>⭐⭐⭐⭐⭐ (5 sao)</option>
                                <option value="4" ${comment.rating === 4 ? 'selected' : ''}>⭐⭐⭐⭐ (4 sao)</option>
                                <option value="3" ${comment.rating === 3 ? 'selected' : ''}>⭐⭐⭐ (3 sao)</option>
                                <option value="2" ${comment.rating === 2 ? 'selected' : ''}>⭐⭐ (2 sao)</option>
                                <option value="1" ${comment.rating === 1 ? 'selected' : ''}>⭐ (1 sao)</option>
                            </select>
                            <textarea class="form-control mb-2" rows="3" placeholder="Nội dung bình luận...">${this.escapeHtml(comment.content)}</textarea>
                            <div class="d-flex gap-2">
                                <button class="btn btn-primary btn-sm submit-edit" data-comment-id="${comment._id}">Cập nhật</button>
                                <button class="btn btn-secondary btn-sm cancel-edit" data-comment-id="${comment._id}">Hủy</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        return commentDiv;
    }

    createReplyElement(reply) {
        const stars = '⭐'.repeat(reply.rating);
        const createdAt = new Date(reply.createdAt).toLocaleDateString('vi-VN');
        const isOwner = reply.user_id._id === window.currentUserId;

        return `
            <div class="reply-item card mb-2 ms-4">
                <div class="card-body py-2">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="d-flex align-items-center">
                            <img src="${reply.user_id.avatar || '/images/default-avatar.png'}" 
                                 alt="${reply.user_id.fullName}" 
                                 class="rounded-circle me-2" 
                                 style="width: 30px; height: 30px; object-fit: cover;">
                            <div>
                                <h6 class="mb-0 small">${reply.user_id.fullName}</h6>
                                <small class="text-muted">${createdAt}</small>
                            </div>
                        </div>
                        <div class="rating">
                            <span class="text-warning small">${stars}</span>
                        </div>
                    </div>
                    <p class="mb-0 mt-2">${this.escapeHtml(reply.content)}</p>
                    ${isOwner ? `
                        <div class="mt-2">
                            <button class="btn btn-sm btn-outline-danger delete-btn" data-comment-id="${reply._id}">
                                <i class="fas fa-trash"></i> Xóa
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderPagination(pagination) {
        const paginationDiv = document.getElementById('commentsPagination');

        if (pagination.total <= 1) {
            paginationDiv.innerHTML = '';
            return;
        }

        let paginationHtml = '<nav><ul class="pagination justify-content-center">';

        if (pagination.current > 1) {
            paginationHtml += `<li class="page-item"><a class="page-link" href="#" data-page="${pagination.current - 1}">Trước</a></li>`;
        }

        for (let i = 1; i <= pagination.total; i++) {
            const activeClass = i === pagination.current ? 'active' : '';
            paginationHtml += `<li class="page-item ${activeClass}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
        }

        if (pagination.current < pagination.total) {
            paginationHtml += `<li class="page-item"><a class="page-link" href="#" data-page="${pagination.current + 1}">Sau</a></li>`;
        }

        paginationHtml += '</ul></nav>';
        paginationDiv.innerHTML = paginationHtml;

        paginationDiv.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                this.currentPage = page;
                this.loadComments();
            });
        });
    }

    async handleCreateComment(e) {
        e.preventDefault();

        const form = e.target;
        const formData = new FormData(form);
        const content = formData.get('content');
        const rating = formData.get('rating');

        if (!content.trim()) {
            this.showError('Vui lòng nhập nội dung bình luận');
            return;
        }

        try {
            const response = await fetch('/comments/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    rating: parseInt(rating),
                    product_id: this.productId
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess('Bình luận đã được tạo thành công');
                form.reset();
                this.currentPage = 1;
                this.loadComments();
            } else {
                this.showError(data.message || 'Có lỗi xảy ra khi tạo bình luận');
            }
        } catch (error) {
            console.error('Error creating comment:', error);
            this.showError('Có lỗi xảy ra khi tạo bình luận');
        }
    }

    showReplyForm(commentId) {
        const replyForm = document.getElementById(`replyForm-${commentId}`);
        replyForm.style.display = 'block';
    }

    hideReplyForm(commentId) {
        const replyForm = document.getElementById(`replyForm-${commentId}`);
        replyForm.style.display = 'none';
    }

    async handleCreateReply(e) {
        const commentId = e.target.dataset.commentId;
        const replyForm = document.getElementById(`replyForm-${commentId}`);
        const textarea = replyForm.querySelector('textarea');
        const content = textarea.value.trim();

        if (!content) {
            this.showError('Vui lòng nhập nội dung phản hồi');
            return;
        }

        try {
            const response = await fetch('/comments/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    rating: 5,
                    product_id: this.productId,
                    parent_id: commentId
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess('Phản hồi đã được tạo thành công');
                replyForm.style.display = 'none';
                textarea.value = '';
                this.loadComments();
            } else {
                this.showError(data.message || 'Có lỗi xảy ra khi tạo phản hồi');
            }
        } catch (error) {
            console.error('Error creating reply:', error);
            this.showError('Có lỗi xảy ra khi tạo phản hồi');
        }
    }

    showEditForm(commentId) {
        const editForm = document.getElementById(`editForm-${commentId}`);
        editForm.style.display = 'block';
    }

    hideEditForm(commentId) {
        const editForm = document.getElementById(`editForm-${commentId}`);
        editForm.style.display = 'none';
    }

    async handleUpdateComment(e) {
        const commentId = e.target.dataset.commentId;
        const editForm = document.getElementById(`editForm-${commentId}`);
        const textarea = editForm.querySelector('textarea');
        const ratingSelect = editForm.querySelector('select');

        const content = textarea.value.trim();
        const rating = parseInt(ratingSelect.value);

        if (!content) {
            this.showError('Vui lòng nhập nội dung bình luận');
            return;
        }

        try {
            const response = await fetch(`/comments/${commentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, rating })
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess('Bình luận đã được cập nhật thành công');
                editForm.style.display = 'none';
                this.loadComments();
            } else {
                this.showError(data.message || 'Có lỗi xảy ra khi cập nhật bình luận');
            }
        } catch (error) {
            console.error('Error updating comment:', error);
            this.showError('Có lỗi xảy ra khi cập nhật bình luận');
        }
    }

    async deleteComment(commentId) {
        if (!confirm('Bạn có chắc chắn muốn xóa bình luận này?')) return;

        try {
            const response = await fetch(`/comments/${commentId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess('Bình luận đã được xóa thành công');
                this.loadComments();
            } else {
                this.showError(data.message || 'Có lỗi xảy ra khi xóa bình luận');
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
            this.showError('Có lỗi xảy ra khi xóa bình luận');
        }
    }

    showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'alert alert-success alert-dismissible fade show position-fixed';
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        toast.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    showError(message) {
        const toast = document.createElement('div');
        toast.className = 'alert alert-danger alert-dismissible fade show position-fixed';
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        toast.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const productId = document.querySelector('[data-product-id]')?.dataset.productId;
    console.log("Product ID from data attribute:", productId);
    if (productId) {
        window.commentManager = new CommentManager(productId);
    } else {
        console.error("Product ID not found!");
    }
});
