# PDF Translate Vietnamese Extension

An extended PDF translation application built on top of the original [PDFMathTranslate](https://github.com/Byaidu/PDFMathTranslate) project.

This repository focuses on:

- adding Vietnamese translation support
- providing practical user interfaces for running the translation workflow
- exposing the translation flow through Gradio and a web interface

The core PDF parsing, layout preservation, and translation engine are still based on the upstream project. In other words, this repository is an integration and extension layer rather than a complete rewrite of the original engine.

## Overview

This project helps translate PDF documents while trying to preserve:

- document layout
- mathematical expressions
- bilingual and mono-language output formats

It supports multiple translation services and offers three ways to use the project:

1. Gradio interface
2. Web interface (React + Flask)
3. Command-line interface

## Scope Of This Fork

To avoid confusion, this is the exact scope of the work in this repository:

- The original core engine comes from `PDFMathTranslate`.
- This fork extends the project to support Vietnamese translation scenarios.
- This fork adds and adapts runnable interfaces, especially:
  - `gui.py` for Gradio
  - `backend/app.py` for Flask API
  - `myserver/frontend/` for the React web UI

If you are evaluating the project architecture, think of it like this:

- `pdf2zh/` is the engine room
- `gui.py`, `backend/`, and `myserver/frontend/` are the dashboards and control panels

## Features

- Translate PDF files from local uploads or remote URLs
- Preserve formatting, layout, and mathematical expressions as much as possible
- Generate two output variants:
  - mono-language PDF
  - dual-language PDF
- Support page-range based translation
- Support multiple translation providers
- Support advanced runtime options such as threading, cache control, and font handling
- Provide both Gradio and web-based interfaces
- Add Vietnamese as a supported target language in the workflow

## System Requirements

- Python 3.8 or newer
- Node.js 16 or newer
- `npm` or `yarn`

## Project Structure

```text
pdf_translate/
├── pdf2zh/                  # Core engine inherited from the upstream project
│   ├── __init__.py
│   ├── high_level.py
│   ├── translator.py
│   ├── config.py
│   ├── doclayout.py
│   ├── converter.py
│   ├── pdfinterp.py
│   └── ...
├── backend/
│   └── app.py               # Flask API for the web mode
├── myserver/
│   ├── package.json         # Node.js dependencies for the server layer
│   ├── server.js            # Express server for production-style serving
│   └── frontend/
│       ├── package.json     # React dependencies
│       ├── public/
│       └── src/
├── gui.py                   # Gradio interface entry point
├── pdf_translate.py         # CLI entry point
├── requirements.txt         # Python dependencies
└── README.md
```

## Installation

### 1. Clone The Repository

```bash
git clone https://github.com/your-username/pdf_translate.git
cd pdf_translate
```

### 2. Create And Activate A Python Virtual Environment

Windows:

```bash
python -m venv venv
venv\Scripts\activate
```

Linux/macOS:

```bash
python -m venv venv
source venv/bin/activate
```

### 3. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 4. Install Node.js Dependencies For The Web UI

```bash
cd myserver
npm install

cd frontend
npm install
cd ../..
```

### 5. Optional: Build The React Frontend

This step is required if you want to serve the built frontend through `myserver/server.js`.

```bash
cd myserver/frontend
npm run build
cd ../..
```

## Usage

### Gradio Mode

### Start

From the repository root:

```bash
python gui.py
```

The Gradio interface usually starts at:

- `http://localhost:7860`

### What This Mode Uses

- `gui.py`
- `pdf2zh/` core modules
- `requirements.txt` Python dependencies

### Files Generated In This Mode

Gradio stores working files and outputs in:

- `pdf2zh_files/`

That directory contains:

- copied input PDFs
- mono output PDFs
- dual output PDFs

### Gradio Options Explained

The Gradio interface exposes several execution options. Here is what they mean in practical terms:

- `Type`
  - `File`: upload a local PDF from your machine
  - `Link`: download a PDF from a URL before translating

- `Service`
  - Chooses which translation backend will translate the extracted text
  - Examples include `google`, `deepl`, `openai`, `gemini`, `ollama`, and others
  - The actual quality, speed, cost, and credential requirements depend on the provider you select

- `Translate from`
  - Source language of the original PDF content
  - Example: `English`

- `Translate to`
  - Target language of the translation output
  - Example: `Vietnamese`

- `Pages`
  - `All`: translate the entire PDF
  - `First`: translate only the first page
  - `First 5 pages`: translate the first five pages
  - `Others`: manually enter page numbers or ranges

- `Page range`
  - Used when `Pages = Others`
  - Example values:
    - `1,3,5`
    - `2-8`
    - `1,4-6,10`

- `number of threads`
  - Controls how many worker threads are used for translation tasks
  - Higher values may improve speed, but they can also increase CPU and memory usage
  - If you imagine the translator as a team of workers, this option chooses how many workers can handle tasks in parallel

- `Skip font subsetting`
  - When disabled, the output PDF embeds only the necessary font pieces
  - When enabled, font subsetting is skipped
  - Meaning at runtime:
    - may improve compatibility in some PDF viewers or workflows
    - may make the output file larger

- `Ignore cache`
  - Forces the system to retranslate content instead of reusing cached translation results
  - Useful when:
    - you changed model settings
    - you changed prompt behavior
    - you want a clean rerun

- `Custom Prompt`
  - Used only for LLM-style providers that support custom prompting
  - Lets you influence translation style or wording

- `Use BabelDOC`
  - Uses the experimental BabelDOC-based backend path instead of the standard path
  - Useful for experimentation, but behavior may differ from the default translation path

- Service-specific credential fields
  - Some providers require API keys, endpoints, model names, or host values
  - These fields appear dynamically depending on the selected service

### Output Files

After translation, Gradio returns:

- `*-mono.pdf`
  - translated PDF only

- `*-dual.pdf`
  - bilingual PDF, typically combining source and translated content

### Web Mode

This is the recommended mode if you want a browser-based workflow with a separate frontend and backend.

### Start The Flask Backend

Open Terminal 1:

```bash
cd backend
python app.py
```

The Flask API usually starts at:

- `http://localhost:5000`

### Start The React Frontend

Open Terminal 2:

```bash
cd myserver/frontend
npm start
```

The React app usually starts at:

- `http://localhost:3000`

### What This Mode Uses

- `backend/app.py`
- `myserver/frontend/src/`
- `myserver/frontend/public/`
- `pdf2zh/` core modules

### Files Generated In This Mode

When started as documented above, Flask stores files in:

- `backend/uploads/`
- `backend/outputs/`

Those folders are used for:

- uploaded source PDFs
- per-session translated outputs

### Web UI Options Explained

The web interface exposes nearly the same runtime concepts as the Gradio UI:

- `Upload from computer` / `Upload from URL`
  - defines where the source PDF comes from

- `Service`
  - chooses the translation backend

- `From language`
  - source language

- `To language`
  - target language, including `Vietnamese`

- `Page range`
  - `All`, `First`, `First 5 pages`, or custom pages

- `Threads`
  - controls parallel work during translation

- `Skip font subsetting`
  - may improve compatibility, but can increase output size

- `Ignore cache`
  - forces fresh translation instead of reusing cached results

- `Custom prompt`
  - available for LLM-capable providers

- `Use BabelDOC`
  - switches to the experimental translation path

- Provider-specific environment values
  - used for API keys, models, endpoints, or host configuration

### Translation Flow In Web Mode

This is the actual execution flow:

1. The frontend uploads a local file or sends a URL to the Flask backend.
2. The backend stores the input file under `backend/uploads/`.
3. The backend starts translation in a background thread.
4. Progress is exposed through a status endpoint.
5. Output files are written to `backend/outputs/<session_id>/`.
6. The frontend lets the user download mono and dual PDFs.

That means the web UI is mainly a control panel, while the heavy PDF processing still happens inside the Python core.

### CLI Mode

You can also use the project from the command line.

### Basic Help

```bash
python pdf_translate.py --help
```

### Example

```bash
python pdf_translate.py paper.pdf --lang-in en --lang-out vi --service google
```

### Common CLI Options

- `files`
  - one or more input PDF files

- `--lang-in`
  - source language code, for example `en`

- `--lang-out`
  - target language code, for example `vi`

- `--service`
  - translation service name
  - example: `google`, `openai`, `gemini`, `ollama`

- `--pages`
  - page selection string
  - example: `1,3,5-8`

- `--output`
  - output directory for generated PDFs

- `--thread`
  - number of worker threads

- `--interactive`
  - starts the Gradio interface instead of direct CLI translation

- `--share`
  - enables Gradio sharing mode

- `--prompt`
  - path to a prompt template file

- `--babeldoc`
  - uses the experimental BabelDOC backend

- `--skip-subset-fonts`
  - skips font subsetting

- `--ignore-cache`
  - forces fresh translation

- `--compatible`
  - converts the input PDF to PDF/A first to improve compatibility in some cases

## Supported Translation Services

The repository exposes multiple providers through the UI and backend, including:

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

Availability depends on:

- installed dependencies
- provider credentials
- selected runtime mode
- local environment configuration

## API Endpoints

The Flask backend exposes the following endpoints:

- `GET /api/services`
  - returns available translation services and languages

- `POST /api/upload`
  - uploads a PDF file

- `POST /api/url`
  - downloads a PDF from a URL

- `POST /api/translate`
  - starts the translation process

- `GET /api/status/<session_id>`
  - returns translation progress and status

- `POST /api/cancel/<session_id>`
  - requests cancellation of an active translation job

- `GET /api/download/<file_path>`
  - downloads a generated output PDF

## Environment Variables

Common variables used by the project include:

- `PORT`
  - port for the Node.js server
  - default: `3000`

- `FLASK_API_URL`
  - backend URL used by the Node.js server
  - default: `http://localhost:5000`

- `REACT_APP_API_URL`
  - backend URL used by the React frontend
  - default: `http://localhost:5000`

Provider-specific variables depend on the selected translation service. For example:

- OpenAI-style providers may require API keys and model names
- self-hosted providers may require a host or endpoint URL
- enterprise providers may require both an endpoint and a credential key

## Important Notes

- This repository is not a replacement for the original `PDFMathTranslate` engine.
- The core translation and PDF reconstruction logic still relies on the upstream project architecture.
- Vietnamese support and the runnable interfaces are the main custom focus of this repository.
- Output quality depends heavily on:
  - source PDF quality
  - selected translation provider
  - page complexity
  - mathematical layout density

## License

This repository continues to depend on the upstream project. Please review the original project license and all third-party service terms before production use.
