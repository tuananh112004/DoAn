// Khởi tạo socket connection
var socket = io();

// Đợi socket kết nối
socket.on('connect', function() {
    console.log('🔌 Socket connected successfully:', socket.id);
});

socket.on('disconnect', function() {
    console.log('🔌 Socket disconnected');
});

// Export socket để có thể sử dụng ở file khác
window.socket = socket;