// Admin Chat JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const chatForm = document.querySelector('.chat-form');
    const messageInput = document.getElementById('messageInput');
    const chatContainer = document.querySelector('.chat-container');
    const chatMessages = document.querySelector('.chat-messages');

    // Join room chat khi vào trang
    if (chatContainer) {
        // Lấy room ID từ URL
        const roomId = window.location.pathname.split('/').pop();
        if (roomId && roomId !== 'support') {
            if (window.socket) {
                window.socket.emit('JOIN_ROOM', roomId);
            }
        }
    }

    if (chatForm && messageInput) {
        // Handle form submission
        chatForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const message = messageInput.value.trim();
            
            if (message) {
                // Send message via WebSocket
                if (window.socket) {
                    window.socket.emit('ADMIN_SEND_MESSAGE', {
                        content: message,
                        images: []
                    });
                }
                messageInput.value = '';
            }
        });

        // Handle typing indicator
        let typingTimer;
        messageInput.addEventListener('input', function() {
            if (window.socket) {
                window.socket.emit('ADMIN_SEND_TYPING', true);
                
                clearTimeout(typingTimer);
                typingTimer = setTimeout(() => {
                    window.socket.emit('ADMIN_SEND_TYPING', false);
                }, 1000);
            }
        });
    }

    // WebSocket connection
    if (typeof io !== 'undefined') {
        const socket = io();
        window.socket = socket;

        // Listen for incoming messages
        socket.on('SERVER_RETURN_MESSAGE', function(data) {
            addMessage(data);
        });

        // Listen for typing indicators
        socket.on('SERVER_RETURN_TYPING', function(data) {
            if (data.type) {
                showTypingIndicator(data.fullName);
            } else {
                hideTypingIndicator();
            }
        });
    }

    function addMessage(data) {
        const messageDiv = document.createElement('div');
        const isOutgoing = data.userId === window.currentUserId;
        
        messageDiv.className = isOutgoing ? 'message-outgoing' : 'message-incoming';
        
        const messageContent = `
            <div class="message-content">
                ${!isOutgoing ? `<div class="message-sender"><strong>${data.fullName}</strong>${data.isAdmin ? '<span class="badge badge-info ml-1">Admin</span>' : '<span class="badge badge-info ml-1">Khách hàng</span>'}</div>` : ''}
                ${data.content ? `<div class="message-text">${data.content}</div>` : ''}
                ${data.images && data.images.length > 0 ? `<div class="message-images">${data.images.map(img => `<img class="message-image" src="${img}" alt="Hình ảnh">`).join('')}</div>` : ''}
                <div class="message-time">${new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</div>
            </div>
        `;
        
        messageDiv.innerHTML = messageContent;
        chatMessages.appendChild(messageDiv);
        
        // Auto scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function showTypingIndicator(name) {
        let typingDiv = document.querySelector('.typing-indicator');
        if (!typingDiv) {
            typingDiv = document.createElement('div');
            typingDiv.className = 'typing-indicator message-incoming';
            typingDiv.innerHTML = `
                <div class="message-content">
                    <div class="message-text">
                        <em>${name} đang nhập tin nhắn...</em>
                    </div>
                </div>
            `;
            chatMessages.appendChild(typingDiv);
        }
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function hideTypingIndicator() {
        const typingDiv = document.querySelector('.typing-indicator');
        if (typingDiv) {
            typingDiv.remove();
        }
    }

    // Set current user ID for comparison
    if (document.querySelector('.chat-container')) {
        window.currentUserId = document.querySelector('.chat-container').getAttribute('data-current-user-id');
    }
}); 