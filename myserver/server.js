const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const cors = require('cors');
const fs = require('fs');
const morgan = require('morgan');

// Tạo ứng dụng Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); // Logging

// Phục vụ tệp tĩnh từ thư mục build của React
app.use(express.static(path.join(__dirname, 'frontend/build')));

// API proxy đến Flask backend
app.use('/api', async (req, res) => {
  // Chuyển tiếp tất cả các request API đến Flask backend
  try {
    const url = `http://localhost:5000${req.url}`;
    const method = req.method.toLowerCase();
    const headers = {
      'Content-Type': req.headers['content-type'] || 'application/json',
    };
    
    let fetchOptions = {
      method,
      headers,
    };
    
    // Thêm body nếu phương thức không phải GET
    if (method !== 'get' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }
    
    // Chuyển tiếp tất cả các request đến Flask backend
    const fetch = await import('node-fetch').then(module => module.default);
    const response = await fetch(url, fetchOptions);
    const data = await response.json();
    
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Lỗi khi chuyển tiếp đến Flask backend:', error);
    res.status(500).json({ error: 'Lỗi kết nối với backend' });
  }
});

// Xử lý file upload
const multer = require('multer');
const upload = multer({ dest: '../uploads/' }); // Đường dẫn mới, chỉ về thư mục gốc

app.post('/api/upload', upload.single('file'), (req, res) => {
  // Chuyển tiếp yêu cầu upload đến Flask backend
  const formData = new FormData();
  formData.append('file', fs.createReadStream(req.file.path));
  
  fetch('http://localhost:5000/api/upload', {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    // Xóa tệp tạm sau khi đã chuyển tiếp
    fs.unlinkSync(req.file.path);
    res.json(data);
  })
  .catch(error => {
    console.error('Lỗi khi chuyển tiếp tệp:', error);
    res.status(500).json({ error: 'Lỗi khi xử lý tệp' });
  });
});

// Hàm để bắt đầu Flask backend
function startFlaskBackend() {
  const flaskProcess = spawn('python', ['../backend/app.py'], { // Đường dẫn mới
    stdio: 'inherit'
  });
  
  flaskProcess.on('error', (err) => {
    console.error('Lỗi khi khởi động Flask backend:', err);
  });
  
  flaskProcess.on('close', (code) => {
    console.log(`Flask backend đã dừng với mã: ${code}`);
    // Thử khởi động lại sau 5 giây nếu bị lỗi
    if (code !== 0) {
      console.log('Đang thử khởi động lại Flask backend...');
      setTimeout(startFlaskBackend, 5000);
    }
  });
  
  return flaskProcess;
}

// Phục vụ frontend React cho tất cả các đường dẫn khác
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});

// Khởi động server
let flaskProcess = null;
app.listen(PORT, () => {
  console.log(`Node.js server đang chạy tại http://localhost:${PORT}`);
  // Khởi động Flask backend
  flaskProcess = startFlaskBackend();
});

// Xử lý khi Node.js server bị tắt
process.on('SIGINT', () => {
  console.log('Đang tắt server...');
  if (flaskProcess) {
    flaskProcess.kill();
  }
  process.exit();
}); 