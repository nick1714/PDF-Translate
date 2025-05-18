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

### 1. Clone repository và cài đặt thư viện Python

```bash
# Clone repository
git clone https://github.com/your-username/pdf_translate.git
cd pdf_translate

# Tạo và kích hoạt môi trường ảo (tùy chọn nhưng khuyến nghị)
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# Cài đặt thư viện Python
pip install -r requirements.txt
```

### 2. Cài đặt thư viện Node.js cho web app

```bash
# Di chuyển đến thư mục myserver
cd myserver

# Cài đặt dependencies cho Node.js server
npm install

# Cài đặt dependencies cho React frontend
cd frontend
npm install
cd ..

# Trở về thư mục gốc
cd ..
```

### 3. Build frontend

```bash
cd myserver/frontend
npm run build
cd ../..
```

## Chạy ứng dụng

### Phương pháp 1: Sử dụng giao diện Gradio

```bash
# Từ thư mục gốc
python gui.py
```
Ứng dụng sẽ khởi động tại http://localhost:7860 với giao diện Gradio.

### Phương pháp 2: Sử dụng giao diện Web (React + Flask)

**Chạy backend (Flask API)**
```bash
# Từ thư mục gốc
cd backend
python app.py
```
Backend API sẽ chạy tại http://localhost:5000

**Chạy Node.js server và frontend (Khuyến nghị)**
```bash
# Mở terminal mới và đi đến thư mục myserver
cd myserver
node server.js
```
Web app sẽ khởi động tại http://localhost:3000 và tự động kết nối với Flask backend.

### Sử dụng như command line tool

```bash
python pdf_translate.py --help
# Ví dụ: dịch file PDF
python pdf_translate.py input.pdf --lang-in en --lang-out zh --service google
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
├── pdf2zh/               # Package cốt lõi
│   ├── __init__.py       # File khởi tạo package
│   ├── high_level.py     # API cấp cao
│   ├── translator.py     # Các dịch vụ dịch thuật
│   ├── config.py         # Cấu hình
│   ├── doclayout.py      # Xử lý layout tài liệu
│   └── ...               # Các module khác
├── backend/              # Flask API backend
│   └── app.py            # API Flask chính
├── myserver/             # Node.js + React
│   ├── frontend/         # React frontend
│   │   ├── public/       # Static files
│   │   ├── src/          # React source code
│   │   └── package.json  # Frontend dependencies
│   ├── server.js         # Node.js server 
│   └── package.json      # Node.js dependencies
├── uploads/              # Thư mục chứa file tải lên
├── outputs/              # Thư mục chứa file đầu ra
├── gui.py                # Giao diện Gradio
├── pdf_translate.py      # Command line interface
├── requirements.txt      # Thư viện Python
└── README.md             # File này
```

## Dịch vụ dịch thuật hỗ trợ

- Google Translate
- Bing Translator
- DeepL
- DeepLX
- Ollama
- Xinference
- Azure OpenAI
- OpenAI
- Zhipu
- ModelScope
- Silicon
- Gemini
- Azure Translator
- Tencent
- Dify
- AnythingLLM
- Argos
- Grok
- Groq
- Deepseek
- Qwen-MT
- Và nhiều dịch vụ khác

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
