const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { extractText } = require('./services/extraction');
const { translateText } = require('./services/translation');
const { generateFile } = require('./services/generation');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5001;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Health check for Render
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', environment: process.env.NODE_ENV });
});

// Use /tmp for Vercel serverless environment
const UPLOADS_DIR = process.env.NODE_ENV === 'production' ? '/tmp' : 'uploads/';

// Setup Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Routes
app.post('/api/translate', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { targetLanguage, outputFormat, ocrLanguage } = req.body;
        const filePath = req.file.path;
        const mimeType = req.file.mimetype;

        // 1. Extract Text
        console.log(`Extracting text from ${req.file.originalname}...`);
        const { text: extractedText, highlightedImageUrl } = await extractText(filePath, mimeType, { 
            ocrLanguage: ocrLanguage || 'eng' 
        });

        // 1.5. Clean OCR Text using Expert Multi-Pass Pipeline
        const { cleanOcrText } = require('./services/ocrCleaning');
        console.log(`Cleaning OCR Text from ${req.file.originalname}...`);
        const cleanedText = await cleanOcrText(extractedText, ocrLanguage || 'eng');

        // 2. Translate Text
        console.log(`Translating to ${targetLanguage}...`);
        const translatedText = await translateText(cleanedText, targetLanguage);

        // 3. Generate Translated File
        console.log(`Generating ${outputFormat} file...`);
        const { fileName, filePath: finalPath } = await generateFile(translatedText, outputFormat || 'txt', req.file.originalname, targetLanguage);

        // Clean up uploaded file
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.json({
            message: 'Translation successful',
            downloadUrl: `/api/download/${fileName}`,
            fileName,
            translatedText, // Added for preview feature
            extractedText,  // Return extracted text to frontend
            highlightedImageUrl // Optional highlighted bounding box image URL
        });

    } catch (error) {
        console.error('Translation error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});

app.get('/api/download/:filename', (req, res) => {
    const fileName = req.params.filename;
    const filePath = path.join(UPLOADS_DIR, fileName);


    if (fs.existsSync(filePath)) {
        res.download(filePath, (err) => {
            if (err) {
                console.error('Download error:', err);
            }
            // Optional: delete file after download to save space
            // fs.unlinkSync(filePath);
        });
    } else {
        res.status(404).json({ error: 'File not found' });
    }
});

// Only start the server if not running in Vercel (production) or if running on Render
if (process.env.NODE_ENV !== 'production' || process.env.RENDER) {
    // Ensure uploads directory exists if not using /tmp
    if (UPLOADS_DIR !== '/tmp' && !fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    const server = app.listen(port, () => {
        console.log(`Backend server running on port ${port}`);
    });
    // Set server timeout to 10 minutes (600,000 ms)
    server.timeout = 600000;
}

module.exports = app;


