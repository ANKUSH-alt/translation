const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function extractText(filePath, mimeType) {
    // PDF extraction using pdf-parse (server-safe)
    if (mimeType === 'application/pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        try {
            const data = await pdfParse(dataBuffer);
            const text = (data && data.text) ? data.text : '';

            // If extracted text is sufficient, return it
            if (text && text.trim().length >= 20) {
                return text;
            }

            // Otherwise, fall back to OCR via pdftoppm + Tesseract
            console.log('PDF text empty or too small — falling back to OCR...');
            return await ocrPdfPages(filePath);
        } catch (error) {
            console.error('Error extracting PDF text, attempting OCR fallback:', error.message);
            // Try OCR as last resort
            try {
                return await ocrPdfPages(filePath);
            } catch (ocrError) {
                console.error('OCR fallback also failed:', ocrError.message);
                throw new Error("Failed to extract text from PDF. The file may be corrupted.");
            }
        }

    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;

    } else if (mimeType.startsWith('image/')) {
        const { data: { text: ocrText } } = await Tesseract.recognize(filePath, 'eng');
        return ocrText;

    } else if (mimeType === 'text/plain') {
        return fs.readFileSync(filePath, 'utf8');
    } else {
        throw new Error('Unsupported file type: ' + mimeType);
    }
}

/**
 * Convert PDF pages to images using pdftoppm (from poppler),
 * then run Tesseract OCR on each page image.
 */
async function ocrPdfPages(pdfPath) {
    const tmpDir = path.join(path.dirname(pdfPath), `ocr_tmp_${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });

    try {
        // Convert PDF pages to images using pdftoppm
        const outputPrefix = path.join(tmpDir, 'page');
        try {
            execSync(`pdftoppm -png -r 300 "${pdfPath}" "${outputPrefix}"`, {
                timeout: 300000 // 300 second timeout (5 minutes)
            });
        } catch (execError) {
            console.error('pdftoppm failed. It might not be installed on the server:', execError.message);
            throw new Error('PDF OCR failed: System dependency "poppler-utils" (pdftoppm) is missing on the server. Please use a Docker-based deployment or a different environment.');
        }

        // Get all generated page images
        const pageFiles = fs.readdirSync(tmpDir)
            .filter(f => f.endsWith('.png'))
            .sort();

        if (pageFiles.length === 0) {
            throw new Error('No page images generated from PDF');
        }

        console.log(`Generated ${pageFiles.length} page image(s) for OCR...`);

        // Run OCR on each page
        let fullText = '';
        for (const pageFile of pageFiles) {
            const imagePath = path.join(tmpDir, pageFile);
            console.log(`Running OCR on ${pageFile}...`);
            const { data: { text } } = await Tesseract.recognize(imagePath, 'eng');
            fullText += text + '\n';
        }

        return fullText.trim();
    } finally {
        // Clean up temp directory
        try {
            const files = fs.readdirSync(tmpDir);
            for (const file of files) {
                fs.unlinkSync(path.join(tmpDir, file));
            }
            fs.rmdirSync(tmpDir);
        } catch (e) {
            console.warn('Failed to clean up OCR temp files:', e.message);
        }
    }
}

module.exports = { extractText };
