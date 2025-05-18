from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import sys
import uuid
import json
import asyncio
import tempfile
from pathlib import Path

# Thêm thư mục gốc vào đường dẫn để import module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pdf2zh.high_level import translate
from pdf2zh.doclayout import ModelInstance, DocLayoutModel
from pdf2zh.config import ConfigManager
from pdf2zh.translator import (
    GoogleTranslator,
    BingTranslator,
    DeepLTranslator,
    DeepLXTranslator,
    OllamaTranslator,
    XinferenceTranslator,
    AzureOpenAITranslator,
    OpenAITranslator,
    ZhipuTranslator,
    ModelScopeTranslator,
    SiliconTranslator,
    GeminiTranslator,
    AzureTranslator,
    TencentTranslator,
    DifyTranslator,
    AnythingLLMTranslator,
    ArgosTranslator,
    GrokTranslator,
    GroqTranslator,
    DeepseekTranslator,
    OpenAIlikedTranslator,
    QwenMtTranslator,
)

# Khởi tạo ModelInstance 
if ModelInstance.value is None:
    ModelInstance.value = DocLayoutModel.load_available()

app = Flask(__name__)
CORS(app)

# Ánh xạ dịch vụ dịch thuật
service_map = {
    "google": GoogleTranslator,
    "bing": BingTranslator,
    "deepl": DeepLTranslator,
    "deeplx": DeepLXTranslator,
    "ollama": OllamaTranslator,
    "xinference": XinferenceTranslator,
    "azure-openai": AzureOpenAITranslator,
    "openai": OpenAITranslator,
    "zhipu": ZhipuTranslator,
    "modelscope": ModelScopeTranslator,
    "silicon": SiliconTranslator,
    "gemini": GeminiTranslator,
    "azure": AzureTranslator,
    "tencent": TencentTranslator,
    "dify": DifyTranslator,
    "anythingllm": AnythingLLMTranslator,
    "argos": ArgosTranslator,
    "grok": GrokTranslator,
    "groq": GroqTranslator,
    "deepseek": DeepseekTranslator,
    "openailiked": OpenAIlikedTranslator,
    "qwen-mt": QwenMtTranslator,
}

# Ánh xạ ngôn ngữ
lang_map = {
    "Simplified Chinese": "zh",
    "Traditional Chinese": "zh-TW",
    "English": "en",
    "French": "fr",
    "German": "de",
    "Japanese": "ja",
    "Korean": "ko",
    "Russian": "ru",
    "Spanish": "es",
    "Italian": "it",
    "Vietnamese": "vi",
}

# Thư mục lưu trữ file
UPLOAD_FOLDER = os.path.abspath('uploads')
OUTPUT_FOLDER = os.path.abspath('outputs')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Dictionary lưu trữ trạng thái dịch
translation_status = {}
cancellation_events = {}

@app.route('/api/services', methods=['GET'])
def get_services():
    return jsonify({
        "services": list(service_map.keys()),
        "languages": list(lang_map.keys())
    })

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'Không tìm thấy file'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Không có file được chọn'}), 400
    
    # Tạo ID phiên duy nhất
    session_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_FOLDER, f"{session_id}_{file.filename}")
    file.save(file_path)
    
    return jsonify({
        'success': True, 
        'session_id': session_id,
        'file_path': file_path
    })

@app.route('/api/url', methods=['POST'])
def process_url():
    import requests
    
    data = request.json
    if not data or 'url' not in data:
        return jsonify({'error': 'URL không hợp lệ'}), 400
    
    url = data['url']
    session_id = str(uuid.uuid4())
    
    try:
        response = requests.get(url, stream=True, timeout=30)
        response.raise_for_status()
        filename = os.path.basename(url)
        if not filename.lower().endswith('.pdf'):
            filename += '.pdf'
        
        file_path = os.path.join(UPLOAD_FOLDER, f"{session_id}_{filename}")
        with open(file_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
                
        return jsonify({
            'success': True, 
            'session_id': session_id,
            'file_path': file_path
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/translate', methods=['POST'])
def translate_pdf():
    data = request.json
    
    if not data or 'file_path' not in data:
        return jsonify({'error': 'Thiếu thông tin file'}), 400
    
    file_path = data['file_path']
    # Lấy tên dịch vụ từ request
    service_key = data.get('service', 'google')
    # Thêm dấu hai chấm để phù hợp với định dạng yêu cầu của TranslateConverter
    service_name = service_key + ":"
    lang_from = lang_map[data.get('lang_from', 'English')]
    lang_to = lang_map[data.get('lang_to', 'Simplified Chinese')]
    
    # Xử lý page_range
    page_range = data.get('page_range', 'All')
    if page_range == 'All':
        selected_page = None
    elif page_range == 'First':
        selected_page = [0]
    elif page_range == 'First 5 pages':
        selected_page = list(range(0, 5))
    else:
        # Xử lý tùy chỉnh trang từ page_input
        selected_page = []
        page_input = data.get('page_input', '')
        for p in page_input.split(','):
            if '-' in p:
                start, end = p.split('-')
                selected_page.extend(range(int(start) - 1, int(end)))
            else:
                try:
                    selected_page.append(int(p) - 1)
                except ValueError:
                    pass
    
    # Lấy các tùy chọn thực nghiệm
    threads = int(data.get('threads', 4))
    skip_subset_fonts = data.get('skip_subset_fonts', False)
    ignore_cache = data.get('ignore_cache', False)
    prompt = data.get('prompt', '')
    use_babeldoc = data.get('use_babeldoc', False)
    
    # Lấy thông tin xác thực cho dịch vụ
    env_data = data.get('service_envs', {})
    
    # Tạo đường dẫn đầu ra duy nhất
    session_id = os.path.basename(file_path).split('_', 1)[0]
    output_dir = os.path.join(OUTPUT_FOLDER, session_id)
    os.makedirs(output_dir, exist_ok=True)
    
    # Ghi log thông tin cho debug
    print(f"Session ID: {session_id}")
    print(f"Output directory: {output_dir}")
    
    # Tạo cancellation event
    cancellation_events[session_id] = asyncio.Event()
    translation_status[session_id] = {
        'status': 'processing',
        'progress': 0,
        'message': 'Đang bắt đầu dịch...'
    }
    
    # Tạo background task để dịch
    def background_translate():
        try:
            translator_class = service_map[service_key]  # Sử dụng service_key (không có dấu hai chấm) để tìm trong dictionary
            translator_instance = translator_class(
                lang_from,
                lang_to,
                "",
                envs=env_data,
                prompt=prompt if prompt else None,
                ignore_cache=ignore_cache,
            )
            
            # Progress callback
            def progress_callback(progress):
                translation_status[session_id] = {
                    'status': 'processing',
                    'progress': progress.n / progress.total if progress.total > 0 else 0,
                    'message': getattr(progress, 'desc', 'Đang dịch...')
                }
            
            # Thực hiện dịch
            try:
                translate(
                    files=[file_path],
                    pages=selected_page,
                    lang_in=lang_from,
                    lang_out=lang_to,
                    service=service_name,  # Sử dụng service_name (có dấu hai chấm) cho hàm translate
                    output=Path(output_dir),
                    thread=threads,
                    callback=progress_callback,
                    cancellation_event=cancellation_events[session_id],
                    envs=env_data,
                    prompt=prompt if prompt else None,
                    skip_subset_fonts=skip_subset_fonts,
                    ignore_cache=ignore_cache,
                    model=ModelInstance.value,
                )
            except Exception as e:
                import traceback
                error_details = traceback.format_exc()
                print(f"Lỗi dịch thuật chi tiết: {error_details}")
                raise Exception(f"Lỗi dịch thuật: {str(e)}")
            
            # Tìm các file đầu ra
            filename = os.path.splitext(os.path.basename(file_path).split('_', 1)[1])[0]
            file_mono = os.path.join(output_dir, f"{filename}-mono.pdf")
            file_dual = os.path.join(output_dir, f"{filename}-dual.pdf")
            
            # Kiểm tra nếu file không tồn tại
            if not os.path.exists(file_mono) or not os.path.exists(file_dual):
                # Tìm tất cả file trong thư mục output
                output_files = os.listdir(output_dir)
                mono_files = [f for f in output_files if f.endswith('-mono.pdf')]
                dual_files = [f for f in output_files if f.endswith('-dual.pdf')]
                
                if mono_files:
                    file_mono = os.path.join(output_dir, mono_files[0])
                if dual_files:
                    file_dual = os.path.join(output_dir, dual_files[0])
            
            # Ghi log đường dẫn file đầu ra
            print(f"File mono: {file_mono}, tồn tại: {os.path.exists(file_mono)}")
            print(f"File dual: {file_dual}, tồn tại: {os.path.exists(file_dual)}")
            
            # Tạo đường dẫn tương đối cho API
            rel_mono_path = os.path.join('outputs', session_id, os.path.basename(file_mono))
            rel_dual_path = os.path.join('outputs', session_id, os.path.basename(file_dual))
            
            translation_status[session_id] = {
                'status': 'completed',
                'progress': 1.0,
                'message': 'Dịch hoàn tất',
                'result': {
                    'mono_path': rel_mono_path.replace('\\', '/'),
                    'dual_path': rel_dual_path.replace('\\', '/')
                }
            }
        except asyncio.CancelledError:
            translation_status[session_id] = {
                'status': 'cancelled',
                'progress': 0,
                'message': 'Dịch bị hủy'
            }
        except Exception as e:
            translation_status[session_id] = {
                'status': 'error',
                'progress': 0,
                'message': f'Lỗi: {str(e)}'
            }
    
    # Chạy dịch trong luồng riêng
    import threading
    translation_thread = threading.Thread(target=background_translate)
    translation_thread.start()
    
    return jsonify({
        'success': True,
        'session_id': session_id,
        'message': 'Bắt đầu quá trình dịch'
    })

@app.route('/api/status/<session_id>', methods=['GET'])
def get_status(session_id):
    if session_id not in translation_status:
        return jsonify({'error': 'Không tìm thấy phiên dịch'}), 404
    
    return jsonify(translation_status[session_id])

@app.route('/api/cancel/<session_id>', methods=['POST'])
def cancel_translation(session_id):
    if session_id not in cancellation_events:
        return jsonify({'error': 'Không tìm thấy phiên dịch'}), 404
    
    cancellation_events[session_id].set()
    return jsonify({'success': True, 'message': 'Đã yêu cầu hủy dịch'})

@app.route('/api/download/<path:file_path>', methods=['GET'])
def download_file(file_path):
    # Ghi log thông tin
    print(f"Yêu cầu tải xuống file: {file_path}")
    print(f"Thư mục OUTPUT_FOLDER: {OUTPUT_FOLDER}")
    
    # Xác định loại file (mono hoặc dual)
    is_mono = "-mono.pdf" in file_path
    is_dual = "-dual.pdf" in file_path
    
    print(f"Loại file yêu cầu: {'mono' if is_mono else 'dual' if is_dual else 'không xác định'}")
    
    # Xử lý đường dẫn tương đối
    if not os.path.isabs(file_path):
        full_path = os.path.join(os.getcwd(), file_path)
    else:
        full_path = file_path
    
    print(f"Đường dẫn đầy đủ: {full_path}")
    
    # Kiểm tra nếu file tồn tại trong thư mục outputs
    if not os.path.exists(full_path):
        # Thử tìm file trong thư mục OUTPUT_FOLDER
        filename = os.path.basename(file_path)
        alternative_path = os.path.join(OUTPUT_FOLDER, filename)
        
        print(f"Tìm thấy trong đường dẫn thay thế: {alternative_path}")
        
        if os.path.exists(alternative_path):
            full_path = alternative_path
        else:
            # Liệt kê các file trong thư mục output nếu có
            if os.path.exists(OUTPUT_FOLDER):
                print(f"Nội dung thư mục output: {os.listdir(OUTPUT_FOLDER)}")
            
            # Kiểm tra session_id trong đường dẫn
            parts = file_path.split('/')
            for part in parts:
                session_dir = os.path.join(OUTPUT_FOLDER, part)
                if os.path.exists(session_dir) and os.path.isdir(session_dir):
                    print(f"Tìm thấy thư mục session: {session_dir}")
                    files = os.listdir(session_dir)
                    print(f"Nội dung thư mục session: {files}")
                    
                    # Tìm file phù hợp với loại yêu cầu (mono hoặc dual)
                    for file in files:
                        if (is_mono and file.endswith('-mono.pdf')) or (is_dual and file.endswith('-dual.pdf')):
                            full_path = os.path.join(session_dir, file)
                            print(f"Sử dụng file tìm thấy phù hợp với loại: {full_path}")
                            return send_file(full_path, as_attachment=True)
            
            return jsonify({'error': f'Không tìm thấy file: {file_path}'}), 404
    
    return send_file(full_path, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 