# AI Language Translator

A full-stack web application that translates PDF, DOCX, TXT, and Images into 100+ languages using OpenAI.

## Tech Stack
- **Frontend**: Next.js, Tailwind CSS, Framer Motion, Lucide React
- **Backend**: Node.js, Express, Multer, PDF-Parse, Mammoth, Tesseract.js, OpenAI SDK (Groq Provider)
- **AI Model**: **Llama 3.1 8B Instant** (Primary) with Automatic Fallbacks
- **File Generation**: PDFKit (optimized), docx

## Prerequisites
- Node.js (v18 or higher)
- Groq API Key (added to `backend/.env`)

## Setup Instructions

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
``` 

## Features
- Drag & Drop file upload (up to 50MB)
- Text extraction from multiple formats
- OCR for images
- AI-powered context-aware translation
- Preserve formatting for DOCX/PDF
- Download translated results in multiple formats
