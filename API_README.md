# API Documentation

## Tổng quan
API này được chuyển đổi từ các controller client của project manage-product. Tất cả các endpoint đều trả về JSON response.

## Base URL
```
http://localhost:3000/api
```

## Authentication
Một số endpoint yêu cầu xác thực thông qua middleware `authMiddleware.requireAuth`. Token được lưu trong cookie `tokenUser`.

## Endpoints

### 1. Home API
- **GET** `/home` - Lấy danh sách sản phẩm nổi bật và mới nhất

### 2. Product API
- **GET** `/products` - Lấy danh sách tất cả sản phẩm
- **GET** `/products/:slugProduct` - Lấy chi tiết sản phẩm theo slug
- **GET** `/products/category/:slugCategory` - Lấy sản phẩm theo danh mục

### 3. Cart API
- **GET** `/cart` - Lấy thông tin giỏ hàng
- **POST** `/cart/add/:productId` - Thêm sản phẩm vào giỏ hàng
- **DELETE** `/cart/delete/:productId` - Xóa sản phẩm khỏi giỏ hàng
- **PUT** `/cart/update/:productId/:quantity` - Cập nhật số lượng sản phẩm

### 4. User API
- **POST** `/user/register` - Đăng ký tài khoản
- **POST** `/user/login` - Đăng nhập
- **POST** `/user/logout` - Đăng xuất
- **POST** `/user/password/forgot` - Quên mật khẩu
- **POST** `/user/password/otp` - Xác thực OTP
- **POST** `/user/password/reset` - Đặt lại mật khẩu
- **GET** `/user/info` - Lấy thông tin người dùng (yêu cầu auth)

### 5. Checkout API
- **GET** `/checkout` - Lấy thông tin checkout
- **POST** `/checkout` - Tạo đơn hàng
- **GET** `/checkout/success/:id` - Lấy thông tin đơn hàng thành công
- **GET** `/checkout/vnpay-return` - Callback từ VNPay

### 6. Comment API
- **POST** `/comments/create` - Tạo bình luận (yêu cầu auth)
- **GET** `/comments/product/:product_id` - Lấy bình luận theo sản phẩm
- **PUT** `/comments/:id` - Cập nhật bình luận (yêu cầu auth)
- **DELETE** `/comments/:id` - Xóa bình luận (yêu cầu auth)
- **GET** `/comments/replies/:parent_id` - Lấy phản hồi của bình luận

### 7. Search API
- **GET** `/search?keyword=...` - Tìm kiếm sản phẩm

### 8. Chat API
- **GET** `/chat/:roomChatId` - Lấy tin nhắn trong phòng chat

### 9. Users API (yêu cầu auth)
- **GET** `/users/not-friend` - Lấy danh sách người dùng chưa kết bạn
- **GET** `/users/request` - Lấy danh sách lời mời kết bạn
- **GET** `/users/accept` - Lấy danh sách lời mời đã chấp nhận
- **GET** `/users/friend` - Lấy danh sách bạn bè

### 10. Rooms Chat API (yêu cầu auth)
- **GET** `/rooms-chat` - Lấy thông tin phòng chat hỗ trợ
- **GET** `/rooms-chat/create` - Tạo phòng chat mới
- **POST** `/rooms-chat/create` - Tạo phòng chat mới

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Dữ liệu trả về
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Thông báo lỗi",
  "error": "Chi tiết lỗi (nếu có)"
}
```

## Status Codes
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Ví dụ sử dụng

### Đăng ký tài khoản
```bash
curl -X POST http://localhost:3000/api/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "fullName": "Nguyễn Văn A"
  }'
```

### Lấy danh sách sản phẩm
```bash
curl http://localhost:3000/api/products
```

### Thêm sản phẩm vào giỏ hàng
```bash
curl -X POST http://localhost:3000/api/cart/add/productId123 \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 2
  }'
```

## Lưu ý
- Tất cả các endpoint đều sử dụng JSON response thay vì render template
- Middleware xác thực vẫn được giữ nguyên từ project gốc
- Socket.IO vẫn hoạt động bình thường cho các tính năng real-time
- Các validation và helper function vẫn được sử dụng như cũ
