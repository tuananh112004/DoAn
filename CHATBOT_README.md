# 🤖 AI Chatbot System - Hệ thống Chatbot Thông minh

## 📋 Tổng quan

Hệ thống AI Chatbot được xây dựng để tư vấn và hỗ trợ người dùng sử dụng dữ liệu sản phẩm thực tế của cửa hàng. Chatbot có khả năng:

- 🔍 **Tìm kiếm sản phẩm** thông minh
- 📂 **Thông tin danh mục** sản phẩm
- 💰 **Tư vấn giá** và khuyến mãi
- 📦 **Kiểm tra tồn kho** sản phẩm
- ⚖️ **So sánh sản phẩm** với nhau
- 💡 **Đề xuất sản phẩm** phù hợp
- 🎯 **Nhận diện ý định** người dùng
- 📚 **Học hỏi** từ tương tác

## 🏗️ Kiến trúc hệ thống

### Backend (Node.js + Express + MongoDB)
```
├── models/
│   ├── chatbot.model.js          # Model lưu trữ chat sessions
│   └── ai-training.model.js      # Model training data
├── controllers/
│   ├── client/chatbot.controller.js    # Client API controller
│   └── admin/chatbot.controller.js     # Admin management controller
├── helper/
│   └── aiChatbot.js              # AI logic và xử lý
└── routes/
    ├── api/routes/chatbot.route.js     # Client API routes
    └── admin/chatbot.route.js          # Admin routes
```

### Frontend (React)
```
├── components/shared/
│   ├── AIChatbot.js              # Chatbot component chính
│   ├── AIChatbot.css             # Styles cho chatbot
│   ├── ChatbotToggle.js          # Toggle button
│   └── ChatbotToggle.css         # Styles cho toggle
```

## 🚀 Cài đặt và chạy

### 1. Cài đặt dependencies
```bash
# Backend
npm install

# Frontend
cd client
npm install
```

### 2. Khởi động hệ thống
```bash
# Development mode
npm run dev

# Hoặc chạy riêng lẻ
npm run server    # Backend (port 3000)
npm run client    # Frontend (port 3001)
```

## 📱 Sử dụng

### Cho người dùng cuối
1. **Mở chatbot**: Click vào nút "🤖 AI Trợ lý" ở góc phải dưới
2. **Bắt đầu chat**: Gửi tin nhắn đầu tiên
3. **Tương tác**: Hỏi về sản phẩm, giá, tồn kho, v.v.
4. **Đánh giá**: Đánh giá chất lượng câu trả lời

### Ví dụ câu hỏi
- "Tìm sản phẩm iPhone"
- "Danh mục điện thoại có gì?"
- "iPhone 14 giá bao nhiêu?"
- "iPhone 14 còn hàng không?"
- "So sánh iPhone 14 và Samsung Galaxy S23"
- "Đề xuất sản phẩm cho tôi"

## 🔧 Quản trị (Admin)

### Truy cập admin panel
```
http://localhost:3000/admin/chatbot
```

### Tính năng quản trị
- 📊 **Dashboard**: Thống kê tổng quan
- 💬 **Quản lý chat sessions**: Xem, xóa các cuộc hội thoại
- 🧠 **Training Data**: Quản lý dữ liệu huấn luyện AI
- 📈 **Thống kê chi tiết**: Phân tích hiệu suất
- 🔄 **Auto-generation**: Tự động tạo training data từ sản phẩm

### Tạo training data tự động
```bash
# Tạo từ sản phẩm
POST /admin/chatbot/training/generate-products

# Tạo từ danh mục
POST /admin/chatbot/training/generate-categories
```

## 🧠 AI Features

### Intent Recognition
- **product_search**: Tìm kiếm sản phẩm
- **category_info**: Thông tin danh mục
- **price_inquiry**: Hỏi về giá
- **stock_check**: Kiểm tra tồn kho
- **product_comparison**: So sánh sản phẩm
- **recommendation**: Đề xuất sản phẩm
- **greeting**: Chào hỏi
- **farewell**: Tạm biệt

### Entity Extraction
- **product_name**: Tên sản phẩm
- **category_name**: Tên danh mục
- **price_range**: Khoảng giá
- **brand**: Thương hiệu
- **feature**: Tính năng

### Context Management
- Lưu trữ context cuộc hội thoại
- Theo dõi sở thích người dùng
- Ghi nhớ sản phẩm đang xem
- Lưu lịch sử tìm kiếm

## 📊 API Endpoints

### Client API
```
POST   /api/chatbot/start           # Khởi tạo chat session
POST   /api/chatbot/message         # Gửi tin nhắn
GET    /api/chatbot/history/:id     # Lịch sử chat
GET    /api/chatbot/user/:id        # Chat của user
POST   /api/chatbot/rate-response   # Đánh giá response
POST   /api/chatbot/rate-chat       # Đánh giá cuộc hội thoại
PUT    /api/chatbot/end/:id         # Kết thúc chat
GET    /api/chatbot/search-products # Tìm kiếm sản phẩm
GET    /api/chatbot/categories      # Lấy danh mục
GET    /api/chatbot/recommendations # Đề xuất sản phẩm
```

### Admin API
```
GET    /admin/chatbot/dashboard                    # Dashboard
GET    /admin/chatbot/sessions                     # Danh sách sessions
GET    /admin/chatbot/sessions/:id                 # Chi tiết session
DELETE /admin/chatbot/sessions/:id                 # Xóa session
GET    /admin/chatbot/training                     # Training data
POST   /admin/chatbot/training                     # Tạo training data
PUT    /admin/chatbot/training/:id                 # Cập nhật training data
DELETE /admin/chatbot/training/:id                 # Xóa training data
POST   /admin/chatbot/training/generate-products   # Tạo từ sản phẩm
POST   /admin/chatbot/training/generate-categories # Tạo từ danh mục
GET    /admin/chatbot/stats                        # Thống kê chi tiết
GET    /admin/chatbot/export                       # Export data
```

## 🎨 Customization

### Thay đổi giao diện
- Chỉnh sửa `AIChatbot.css` để thay đổi style
- Sửa `ChatbotToggle.css` để tùy chỉnh button
- Thay đổi emoji và icon trong component

### Thêm intent mới
1. Thêm intent vào `aiHelper.intents`
2. Tạo method nhận diện trong `aiHelper`
3. Thêm logic xử lý trong `generateResponse`
4. Cập nhật training data

### Thêm entity mới
1. Định nghĩa entity trong `aiHelper.entities`
2. Tạo method extract trong `aiHelper`
3. Cập nhật logic xử lý

## 📈 Performance & Monitoring

### Metrics theo dõi
- Số lượng chat sessions
- Tổng tin nhắn
- Độ chính xác intent recognition
- User satisfaction rating
- Response time
- Training data quality

### Optimization
- Sử dụng MongoDB indexes
- Caching training data
- Async processing
- Rate limiting
- Error handling

## 🔒 Security

### Authentication
- Admin routes yêu cầu đăng nhập
- Session validation
- Rate limiting cho API calls

### Data Protection
- Không lưu thông tin nhạy cảm
- Anonymize user data
- Secure API endpoints

## 🚨 Troubleshooting

### Lỗi thường gặp
1. **Chatbot không mở**: Kiểm tra console errors
2. **Không nhận response**: Kiểm tra API endpoints
3. **Intent recognition sai**: Cập nhật training data
4. **Performance chậm**: Kiểm tra database indexes

### Debug
```bash
# Backend logs
npm run server

# Frontend logs
cd client && npm start

# Database connection
mongo
use your_database
db.chatbots.find()
```

## 🔮 Roadmap

### Phase 1 (Hiện tại)
- ✅ Basic chatbot functionality
- ✅ Intent recognition
- ✅ Product search & recommendations
- ✅ Admin management

### Phase 2 (Tương lai)
- 🔄 Natural Language Processing (NLP)
- 🔄 Machine Learning integration
- 🔄 Multi-language support
- 🔄 Voice chat
- 🔄 Advanced analytics
- 🔄 A/B testing

### Phase 3 (Nâng cao)
- 🔄 Deep Learning models
- 🔄 Sentiment analysis
- 🔄 Predictive analytics
- 🔄 Integration với CRM
- 🔄 Omnichannel support

## 📞 Support

Nếu gặp vấn đề hoặc cần hỗ trợ:
1. Kiểm tra logs trong console
2. Xem documentation này
3. Tạo issue trên repository
4. Liên hệ team development

---

**Made with ❤️ by AI Development Team**
