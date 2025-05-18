import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { 
  Container, Box, Grid, Typography, Button, FormControl, 
  InputLabel, Select, MenuItem, FormGroup, FormControlLabel, 
  Checkbox, TextField, Radio, RadioGroup, Paper, Divider,
  CircularProgress, LinearProgress, Alert, AlertTitle
} from '@mui/material';
import { Document, Page } from 'react-pdf';
import { pdfjs } from 'react-pdf';

// Cấu hình worker cho react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  // Khai báo state cho form và dữ liệu
  const [fileType, setFileType] = useState('file');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [linkInput, setLinkInput] = useState('');
  const [services, setServices] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [selectedService, setSelectedService] = useState('Google');
  const [langFrom, setLangFrom] = useState('English');
  const [langTo, setLangTo] = useState('Simplified Chinese');
  const [pageRange, setPageRange] = useState('All');
  const [pageInput, setPageInput] = useState('');
  const [numThreads, setNumThreads] = useState(4);
  const [skipSubsetFonts, setSkipSubsetFonts] = useState(false);
  const [ignoreCache, setIgnoreCache] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [useBabeldoc, setUseBabeldoc] = useState(false);
  
  // State cho API keys và environment variables
  const [serviceEnvs, setServiceEnvs] = useState({});
  
  // State cho tiến trình dịch
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);
  const [translationMessage, setTranslationMessage] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [translationResult, setTranslationResult] = useState(null);
  const [translationError, setTranslationError] = useState(null);
  
  // State cho PDF preview
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  
  // Tải danh sách dịch vụ và ngôn ngữ từ API
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/services`);
        setServices(response.data.services);
        setLanguages(response.data.languages);
      } catch (error) {
        console.error('Lỗi khi tải dịch vụ:', error);
      }
    };
    
    fetchServices();
  }, []);
  
  // Kiểm tra tiến trình dịch
  useEffect(() => {
    let interval;
    
    if (sessionId && isTranslating) {
      interval = setInterval(async () => {
        try {
          const response = await axios.get(`${API_URL}/api/status/${sessionId}`);
          const statusData = response.data;
          
          setTranslationProgress(statusData.progress * 100);
          setTranslationMessage(statusData.message);
          
          if (statusData.status === 'completed') {
            setIsTranslating(false);
            setTranslationResult(statusData.result);
            clearInterval(interval);
          } else if (statusData.status === 'error' || statusData.status === 'cancelled') {
            setIsTranslating(false);
            setTranslationError(statusData.message);
            clearInterval(interval);
          }
        } catch (error) {
          console.error('Lỗi khi kiểm tra tiến trình:', error);
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionId, isTranslating]);
  
  // Xử lý thay đổi file
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFilePreview(URL.createObjectURL(selectedFile));
    }
  };
  
  // Xử lý thay đổi dịch vụ
  const handleServiceChange = (event) => {
    setSelectedService(event.target.value);
    // Reset environment variables
    setServiceEnvs({});
  };
  
  // Xử lý thay đổi loại file (upload hoặc link)
  const handleFileTypeChange = (event) => {
    setFileType(event.target.value);
  };
  
  // Xử lý thay đổi phạm vi trang
  const handlePageRangeChange = (event) => {
    setPageRange(event.target.value);
  };
  
  // Xử lý thay đổi environment variable
  const handleEnvChange = (key, value) => {
    setServiceEnvs({
      ...serviceEnvs,
      [key]: value
    });
  };
  
  // Xử lý sự kiện khi PDF document được tải
  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
  }
  
  // Xử lý chuyển trang trong PDF preview
  const changePage = (offset) => {
    setPageNumber(prevPageNumber => prevPageNumber + offset);
  };
  
  const previousPage = () => changePage(-1);
  const nextPage = () => changePage(1);
  
  // Xử lý upload file
  const handleUploadFile = async () => {
    try {
      setTranslationError(null);
      let filePath;
      
      if (fileType === 'file') {
        if (!file) {
          setTranslationError('Vui lòng chọn file PDF');
          return;
        }
        
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axios.post(`${API_URL}/api/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (response.data.success) {
          filePath = response.data.file_path;
          setSessionId(response.data.session_id);
        }
      } else {
        if (!linkInput) {
          setTranslationError('Vui lòng nhập đường dẫn đến file PDF');
          return;
        }
        
        const response = await axios.post(`${API_URL}/api/url`, {
          url: linkInput
        });
        
        if (response.data.success) {
          filePath = response.data.file_path;
          setSessionId(response.data.session_id);
        }
      }
      
      return filePath;
      
    } catch (error) {
      console.error('Lỗi khi upload file:', error);
      setTranslationError(error.response?.data?.error || 'Lỗi khi tải lên file');
      return null;
    }
  };
  
  // Xử lý bắt đầu dịch
  const handleTranslate = async () => {
    try {
      setIsTranslating(true);
      setTranslationProgress(0);
      setTranslationMessage('Đang tải lên file...');
      setTranslationResult(null);
      
      const filePath = await handleUploadFile();
      if (!filePath) {
        setIsTranslating(false);
        return;
      }
      
      setTranslationMessage('Đang chuẩn bị dịch...');
      
      const translateResponse = await axios.post(`${API_URL}/api/translate`, {
        file_path: filePath,
        service: selectedService,
        lang_from: langFrom,
        lang_to: langTo,
        page_range: pageRange,
        page_input: pageInput,
        threads: numThreads,
        skip_subset_fonts: skipSubsetFonts,
        ignore_cache: ignoreCache,
        prompt: customPrompt,
        use_babeldoc: useBabeldoc,
        service_envs: serviceEnvs
      });
      
      if (!translateResponse.data.success) {
        throw new Error(translateResponse.data.error || 'Lỗi không xác định');
      }
      
      setTranslationMessage('Đang dịch...');
      
    } catch (error) {
      console.error('Lỗi khi dịch:', error);
      setTranslationError(error.response?.data?.error || 'Lỗi khi dịch file');
      setIsTranslating(false);
    }
  };
  
  // Xử lý hủy dịch
  const handleCancelTranslation = async () => {
    if (sessionId) {
      try {
        await axios.post(`${API_URL}/api/cancel/${sessionId}`);
        setTranslationMessage('Đang hủy dịch...');
      } catch (error) {
        console.error('Lỗi khi hủy dịch:', error);
      }
    }
  };
  
  // Hiển thị phần form tùy chọn
  const renderOptionsForm = () => (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Tùy chọn dịch
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Dịch vụ</InputLabel>
            <Select
              value={selectedService}
              onChange={handleServiceChange}
              label="Dịch vụ"
            >
              {services.map(service => (
                <MenuItem key={service} value={service}>{service}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Từ ngôn ngữ</InputLabel>
            <Select
              value={langFrom}
              onChange={(e) => setLangFrom(e.target.value)}
              label="Từ ngôn ngữ"
            >
              {languages.map(lang => (
                <MenuItem key={lang} value={lang}>{lang}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Sang ngôn ngữ</InputLabel>
            <Select
              value={langTo}
              onChange={(e) => setLangTo(e.target.value)}
              label="Sang ngôn ngữ"
            >
              {languages.map(lang => (
                <MenuItem key={lang} value={lang}>{lang}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl component="fieldset">
            <Typography variant="subtitle2" gutterBottom>Phạm vi trang</Typography>
            <RadioGroup
              value={pageRange}
              onChange={handlePageRangeChange}
            >
              <FormControlLabel value="All" control={<Radio />} label="Tất cả" />
              <FormControlLabel value="First" control={<Radio />} label="Trang đầu" />
              <FormControlLabel value="First 5 pages" control={<Radio />} label="5 trang đầu" />
              <FormControlLabel value="Others" control={<Radio />} label="Tùy chỉnh" />
            </RadioGroup>
          </FormControl>
        </Grid>
        
        {pageRange === 'Others' && (
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nhập các trang (vd: 1,3,5-10)"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              helperText="Nhập số trang (vd: 1,3,5-10)"
            />
          </Grid>
        )}
      </Grid>
      
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Tùy chọn nâng cao
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Số luồng"
              type="number"
              value={numThreads}
              onChange={(e) => setNumThreads(e.target.value)}
              InputProps={{ inputProps: { min: 1, max: 16 } }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormGroup>
              <FormControlLabel
                control={<Checkbox checked={skipSubsetFonts} onChange={(e) => setSkipSubsetFonts(e.target.checked)} />}
                label="Bỏ qua font subsetting (có thể tăng tốc độ)"
              />
              <FormControlLabel
                control={<Checkbox checked={ignoreCache} onChange={(e) => setIgnoreCache(e.target.checked)} />}
                label="Bỏ qua cache (dịch lại từ đầu)"
              />
              <FormControlLabel
                control={<Checkbox checked={useBabeldoc} onChange={(e) => setUseBabeldoc(e.target.checked)} />}
                label="Sử dụng BabelDOC"
              />
            </FormGroup>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Custom Prompt (cho các dịch vụ LLM)"
              multiline
              rows={3}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
            />
          </Grid>
          
          {/* Hiển thị các trường API key và môi trường tùy theo dịch vụ */}
          {renderServiceSpecificFields()}
        </Grid>
      </Box>
    </Box>
  );
  
  // Hiển thị các trường API key và môi trường tùy theo dịch vụ
  const renderServiceSpecificFields = () => {
    // Lấy danh sách các trường cần thiết cho dịch vụ đã chọn
    // Đây là ví dụ, bạn cần thay đổi theo dịch vụ thực tế
    const serviceFields = {
      'OpenAI': [
        { key: 'OPENAI_API_KEY', label: 'API Key' },
        { key: 'OPENAI_MODEL', label: 'Model', default: 'gpt-3.5-turbo' }
      ],
      'Google': [],
      'DeepL': [
        { key: 'DEEPL_API_KEY', label: 'API Key' }
      ],
      'AzureOpenAI': [
        { key: 'AZURE_OPENAI_API_KEY', label: 'API Key' },
        { key: 'AZURE_OPENAI_ENDPOINT', label: 'Endpoint' },
        { key: 'AZURE_OPENAI_API_VERSION', label: 'API Version', default: '2023-05-15' }
      ],
      // Thêm các dịch vụ khác khi cần
    };
    
    const fields = serviceFields[selectedService] || [];
    
    if (fields.length === 0) return null;
    
    return (
      <Grid item xs={12}>
        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
          Cài đặt cho dịch vụ {selectedService}
        </Typography>
        <Grid container spacing={2}>
          {fields.map(field => (
            <Grid item xs={12} sm={6} key={field.key}>
              <TextField
                fullWidth
                label={field.label}
                type={field.key.includes('KEY') || field.key.includes('SECRET') ? 'password' : 'text'}
                value={serviceEnvs[field.key] || field.default || ''}
                onChange={(e) => handleEnvChange(field.key, e.target.value)}
              />
            </Grid>
          ))}
        </Grid>
      </Grid>
    );
  };
  
  // Hiển thị tiến trình dịch
  const renderTranslationProgress = () => {
    if (!isTranslating && !translationResult) return null;
    
    return (
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Tiến trình dịch
        </Typography>
        
        {isTranslating ? (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress variant="determinate" value={translationProgress} />
              </Box>
              <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" color="text.secondary">
                  {Math.round(translationProgress)}%
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {translationMessage}
            </Typography>
            <Button 
              variant="outlined" 
              color="secondary" 
              onClick={handleCancelTranslation}
              sx={{ mt: 2 }}
            >
              Hủy
            </Button>
          </Box>
        ) : translationResult ? (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              <AlertTitle>Dịch hoàn tất!</AlertTitle>
              File PDF đã được dịch thành công.
            </Alert>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Button 
                  fullWidth
                  variant="contained" 
                  color="primary"
                  component="a"
                  href={`${API_URL}/api/download/${translationResult.mono_path}`}
                  target="_blank"
                >
                  Tải xuống bản dịch (Mono)
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button 
                  fullWidth
                  variant="contained" 
                  color="secondary"
                  component="a"
                  href={`${API_URL}/api/download/${translationResult.dual_path}`}
                  target="_blank"
                >
                  Tải xuống bản dịch (Song ngữ)
                </Button>
              </Grid>
            </Grid>
          </Box>
        ) : null}
      </Box>
    );
  };
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        PDF Math Translate
      </Typography>
      <Typography variant="subtitle1" gutterBottom align="center">
        Dịch PDF với giao diện web
      </Typography>
      
      <Grid container spacing={4} sx={{ mt: 2 }}>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Tải lên PDF
            </Typography>
            
            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <RadioGroup
                row
                value={fileType}
                onChange={handleFileTypeChange}
              >
                <FormControlLabel value="file" control={<Radio />} label="Tải từ máy tính" />
                <FormControlLabel value="link" control={<Radio />} label="Tải từ đường dẫn" />
              </RadioGroup>
            </FormControl>
            
            {fileType === 'file' ? (
              <Box 
                sx={{ 
                  border: '2px dashed #1976d2', 
                  borderRadius: 2, 
                  p: 3, 
                  textAlign: 'center',
                  mb: 3
                }}
              >
                <input
                  accept="application/pdf"
                  style={{ display: 'none' }}
                  id="raised-button-file"
                  type="file"
                  onChange={handleFileChange}
                />
                <label htmlFor="raised-button-file">
                  <Button variant="contained" component="span">
                    Chọn file PDF
                  </Button>
                </label>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {file ? `Đã chọn: ${file.name}` : 'Chưa chọn file nào'}
                </Typography>
              </Box>
            ) : (
              <TextField
                fullWidth
                label="Đường dẫn đến file PDF"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                sx={{ mb: 3 }}
              />
            )}
            
            {renderOptionsForm()}
            
            {translationError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                <AlertTitle>Lỗi</AlertTitle>
                {translationError}
              </Alert>
            )}
            
            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              onClick={handleTranslate}
              disabled={isTranslating}
              sx={{ mt: 3 }}
            >
              {isTranslating ? <CircularProgress size={24} /> : 'Bắt đầu dịch'}
            </Button>
            
            {renderTranslationProgress()}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, minHeight: 700 }}>
            <Typography variant="h6" gutterBottom>
              Xem trước PDF
            </Typography>
            
            <Box sx={{ height: 600, overflow: 'auto', mb: 2 }}>
              {filePreview ? (
                <Document
                  file={filePreview}
                  onLoadSuccess={onDocumentLoadSuccess}
                >
                  <Page pageNumber={pageNumber} />
                </Document>
              ) : (
                <Box 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: '1px solid #eee',
                    borderRadius: 1
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Chọn file PDF để xem trước
                  </Typography>
                </Box>
              )}
            </Box>
            
            {numPages && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Button
                  disabled={pageNumber <= 1}
                  onClick={previousPage}
                  variant="outlined"
                  sx={{ mr: 2 }}
                >
                  Trang trước
                </Button>
                <Typography variant="body2">
                  Trang {pageNumber} / {numPages}
                </Typography>
                <Button
                  disabled={pageNumber >= numPages}
                  onClick={nextPage}
                  variant="outlined"
                  sx={{ ml: 2 }}
                >
                  Trang sau
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          PDF Math Translate - Dịch PDF với bố cục và toán học được giữ nguyên
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <a href="https://github.com/Byaidu/PDFMathTranslate" target="_blank" rel="noopener noreferrer">
            GitHub Repository
          </a>
        </Typography>
      </Box>
    </Container>
  );
}

export default App; 