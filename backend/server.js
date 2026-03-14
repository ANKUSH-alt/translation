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

app.use(cors());
app.use(express.json());

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

        const { targetLanguage, outputFormat } = req.body;
        const filePath = req.file.path;
        const mimeType = req.file.mimetype;

        // 1. Extract Text
        console.log(`Extracting text from ${req.file.originalname}...`);
        const extractedText = await extractText(filePath, mimeType);

        // 2. Translate Text
        console.log(`Translating to ${targetLanguage}...`);
        const translatedText = await translateText(extractedText, targetLanguage);

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
            translatedText // Added for preview feature
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

const server = app.listen(port, () => {
    console.log(`Backend server running on port ${port}`);
});

// Set server timeout to 10 minutes (600,000 ms)
server.timeout = 600000;

module.exports = app;

