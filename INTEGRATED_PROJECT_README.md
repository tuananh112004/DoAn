# 🚀 Hướng dẫn chạy Node.js và React trong cùng một project

## 📋 Tổng quan

Project này đã được tích hợp để chạy cả **Node.js backend** và **React frontend** trong cùng một thư mục. Backend cung cấp API cho frontend React sử dụng.

## 🏗️ Cấu trúc project

```
manage-product/
├── index.js                 # Server Node.js chính
├── package.json            # Dependencies cho backend
├── api/                    # API routes và controllers
├── controllers/            # Controllers gốc
├── models/                 # Database models
├── middlewares/            # Middlewares
├── client/                 # React frontend
│   ├── package.json        # Dependencies cho React
│   ├── public/
│   └── src/
│       ├── components/     # React components
│       ├── configs/        # API configuration
│       ├── contexts/       # React contexts
│       └── reducers/       # State reducers
└── views/                  # Pug templates (admin only)
```

## 🛠️ Cài đặt

### 1. Cài đặt dependencies cho backend
```bash
npm install
```

### 2. Cài đặt dependencies cho React client
```bash
cd client
npm install
cd ..
```

## 🚀 Chạy project

### Cách 1: Chạy riêng biệt (Development)

**Terminal 1 - Backend:**
```bash
npm start
# Server sẽ chạy tại http://localhost:3000
```

**Terminal 2 - React:**
```bash
cd client
npm start
# React sẽ chạy tại http://localhost:3001
```

### Cách 2: Chạy cùng lúc (Development)

```bash
npm run dev
# Backend: http://localhost:3000
# React: http://localhost:3001
```

### Cách 3: Production

```bash
# Build React app
cd client
npm run build
cd ..

# Chạy production server
npm start
# Cả backend và frontend sẽ chạy tại http://localhost:3000
```

## 📝 Scripts có sẵn

```json
{
  "start": "nodemon --inspect index.js",           // Chạy backend
  "dev": "concurrently \"npm run server\" \"npm run client\"", // Chạy cả 2
  "server": "nodemon --inspect index.js",          // Chạy backend
  "client": "cd client && npm start",              // Chạy React
  "build": "cd client && npm run build",           // Build React
  "install-client": "cd client && npm install"     // Cài đặt React dependencies
}
```

## 🔧 Cấu hình

### Backend API
- **Port:** 3000
- **API Base URL:** `http://localhost:3000/api/`
- **Admin Panel:** `http://localhost:3000/admin`

### React Frontend
- **Port:** 3001 (development)
- **Proxy:** Tự động proxy API calls đến backend
- **Build Output:** `client/build/`

## 🌐 Endpoints

### API Endpoints (Backend)
- `GET /api/home` - Trang chủ
- `GET /api/products` - Danh sách sản phẩm
- `GET /api/products/:slug` - Chi tiết sản phẩm
- `POST /api/user/login` - Đăng nhập
- `POST /api/user/register` - Đăng ký
- `GET /api/search` - Tìm kiếm sản phẩm
- Và nhiều endpoints khác...

### React Routes (Frontend)
- `/` - Trang chủ
- `/products` - Danh sách sản phẩm
- `/products/:slug` - Chi tiết sản phẩm
- `/cart` - Giỏ hàng
- `/login` - Đăng nhập
- `/register` - Đăng ký
- `/search` - Tìm kiếm

## 🔄 Workflow Development

1. **Backend Development:**
   - Chỉnh sửa files trong thư mục gốc
   - API endpoints trong `api/`
   - Models trong `models/`
   - Controllers trong `controllers/`

2. **Frontend Development:**
   - Chỉnh sửa React components trong `client/src/`
   - API calls trong `client/src/configs/Apis.js`
   - State management trong `client/src/contexts/`

3. **Database:**
   - MongoDB connection trong `config/database.js`
   - Models trong `models/`

## 🚨 Troubleshooting

### Lỗi PowerShell Execution Policy
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Lỗi Port đã được sử dụng
```bash
# Kill process trên port 3000
npx kill-port 3000

# Hoặc thay đổi port trong index.js
```

### Lỗi React không kết nối được API
- Kiểm tra backend có đang chạy không
- Kiểm tra proxy trong `client/package.json`
- Kiểm tra CORS settings trong backend

## 📦 Deployment

### Vercel (Recommended)
```bash
# Deploy backend
vercel

# Deploy React frontend
cd client
vercel
```

### Heroku
```bash
# Build React
cd client && npm run build && cd ..

# Deploy to Heroku
git push heroku main
```

## 🔐 Environment Variables

Tạo file `.env` trong thư mục gốc:
```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

## 📚 Tài liệu tham khảo

- [API Documentation](./API_README.md)
- [React Components](./REACT_COMPONENTS_README.md)
- [Conversion Summary](./CONVERSION_SUMMARY.md)

## 🤝 Contributing

1. Fork project
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## 📄 License

MIT License
