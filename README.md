# 🌐 LingoShift: Next-Gen AI Translation Engine

![LingoShift Banner](https://img.shields.io/badge/LingoShift-AI--Translation-blueview?style=for-the-badge&logo=translate&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![Node.js](https://img.shields.io/badge/Node.js-20-green?style=for-the-badge&logo=node.js)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel)
![Render](https://img.shields.io/badge/Render-Backend-46E3B7?style=for-the-badge&logo=render&logoColor=white)

Breaking language barriers with precision AI. LingoShift is a powerful, full-stack document translation suite that leverages **Llama 3.1** models to provide context-aware, formatting-preserving translations for multiple file formats.

---

## ✨ Features

- 📄 **Multi-Format Support**: Seamlessly translate PDF, DOCX, TXT, and Image files.
- 🧠 **Context-Aware AI**: Powered by Groq-hosted Llama 3.1 for high-fidelity translation.
- 🖼️ **OCR Integration**: Built-in Tesseract OCR for text extraction from scanned documents and images.
- 📐 **Format Preservation**: Advanced logic to maintain your document's original structure and style.
- 🚀 **Cloud Native**: Scalable architecture deployed on Render (Backend) and Vercel (Frontend).
- 🎨 **Premium UI**: Ultra-modern, responsive interface with framer-motion animations and dark-mode aesthetics.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)

### Backend
- **Server**: [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
- **Extraction**: `pdf-parse`, `mammoth`, `tesseract.js`
- **AI Engine**: [Groq API](https://groq.com/) (OpenAI SDK Compatible)
- **File Generation**: `pdfkit`, `docx`

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- System dependency: `poppler-utils` (for PDF OCR)

### 1. Backend Setup
```bash
cd backend
npm install
# Set up .env with GROQ_API_KEY
npm start
```

### 2. Frontend Setup
```bash
cd frontend
npm install
# Set up .env.local with NEXT_PUBLIC_API_URL
npm run dev
```

---

## 📦 Deployment

LingoShift is optimized for cloud deployment:
- **Backend**: Hosted on [Render.com](https://render.com)
- **Frontend**: Hosted on [Vercel.com](https://vercel.com)

---

## 🛡️ License
Distrubuted under the MIT License. See `LICENSE` for more information.

---
*Built with ❤️ by the LingoShift Team*
