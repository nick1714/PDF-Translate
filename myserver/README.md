# PDF Translate Web Server

Đây là phần web server của ứng dụng PDF Math Translate, giúp chạy giao diện web và kết nối với backend Python.

## Cấu trúc thư mục

```
myserver/
├── frontend/           # Frontend React
│   ├── public/         # Tệp tĩnh
│   │   ├── index.html  # HTML chính
│   │   └── manifest.json # Cấu hình PWA
│   ├── src/            # Mã nguồn React
│   │   ├── App.js      # Component chính
│   │   ├── App.css     # Styles chính
│   │   ├── index.js    # Entry point
│   │   └── index.css   # Global styles
│   └── package.json    # Phụ thuộc frontend
├── server.js           # Node.js server
└── package.json        # Package.json chính
```

## Cách sử dụng

### 1. Cài đặt

```bash
# Cài đặt dependencies cho server Node.js
npm install

# Cài đặt dependencies cho frontend React
cd frontend
npm install
cd ..
```

### 2. Build frontend

```bash
cd frontend
npm run build
cd ..
```

### 3. Chạy server

```bash
npm start
```

Server sẽ chạy tại http://localhost:3000 và tự động khởi động backend Python.

## Đường dẫn đến mã nguồn Python

Server này được thiết kế để làm việc với mã nguồn Python trong thư mục cha:

- Backend: `../backend/app.py`
- Thư mục upload: `../uploads/`
- Thư mục output: `../outputs/`

## API Endpoints

- `GET /api/services` - Lấy danh sách dịch vụ và ngôn ngữ hỗ trợ
- `POST /api/upload` - Tải lên file PDF
- `POST /api/url` - Lấy file PDF từ URL
- `POST /api/translate` - Dịch file PDF
- `GET /api/status/:sessionId` - Kiểm tra trạng thái dịch
- `POST /api/cancel/:sessionId` - Hủy quá trình dịch
- `GET /api/download/:filePath` - Tải xuống file đã dịch 