# PDF Math Translate - Web Application

Ứng dụng web dịch PDF với khả năng bảo toàn định dạng và biểu thức toán học. Được phát triển dựa trên dự án [PDFMathTranslate](https://github.com/Byaidu/PDFMathTranslate).

## Tính năng

- Dịch PDF từ nhiều nguồn ngôn ngữ khác nhau
- Hỗ trợ nhiều dịch vụ dịch thuật (Google, DeepL, OpenAI, v.v.)
- Bảo toàn định dạng, bố cục và biểu thức toán học
- Tùy chọn dịch theo phạm vi trang
- Tùy chọn nâng cao (số luồng, bỏ qua font subsetting, v.v.)
- Xem trước PDF trực tiếp trong trình duyệt
- Tải PDF từ máy tính hoặc từ đường dẫn

## Yêu cầu hệ thống

- Python 3.8+ 
- Node.js 16+
- npm hoặc yarn

## Cài đặt

### 1. Cài đặt thư viện Python

```bash
pip install -r requirements.txt
```

### 2. Cài đặt thư viện Node.js

```bash
npm install
cd frontend
npm install
cd ..
```

### 3. Build frontend

```bash
cd frontend
npm run build
cd ..
```

## Chạy ứng dụng

### Chạy cả frontend và backend

```bash
npm start
```

Ứng dụng sẽ khởi động tại http://localhost:3000 và tự động chạy Flask backend.

### Chạy riêng từng phần

**Backend (Flask API)**
```bash
cd backend
python app.py
```

**Frontend (React)**
```bash
cd frontend
npm start
```

**Node.js Server (chỉ proxy, không chạy Flask)**
```bash
node server.js
```

## API Endpoints

- `GET /api/services` - Lấy danh sách dịch vụ và ngôn ngữ hỗ trợ
- `POST /api/upload` - Tải lên file PDF
- `POST /api/url` - Lấy file PDF từ URL
- `POST /api/translate` - Dịch file PDF
- `GET /api/status/:sessionId` - Kiểm tra trạng thái dịch
- `POST /api/cancel/:sessionId` - Hủy quá trình dịch
- `GET /api/download/:filePath` - Tải xuống file đã dịch

## Cấu trúc dự án

```
pdf_translate/
├── backend/           # Flask API backend
│   └── app.py         # Main Flask application
├── frontend/          # React frontend
│   ├── public/        # Static files
│   ├── src/           # React source code
│   └── package.json   # Frontend dependencies
├── uploads/           # Upload directory
├── outputs/           # Output directory
├── server.js          # Node.js proxy server
├── package.json       # Main package.json
└── README.md          # This file
```

## Môi trường triển khai

Ứng dụng có thể được triển khai lên các dịch vụ hosting như:

- Heroku
- Vercel
- Netlify
- AWS
- Google Cloud

### Biến môi trường

- `PORT` - Cổng cho Node.js server (mặc định: 3000)
- `FLASK_API_URL` - URL đến Flask API (mặc định: http://localhost:5000)
- `REACT_APP_API_URL` - URL đến API từ frontend (mặc định: http://localhost:5000)

## Giấy phép

MIT License 