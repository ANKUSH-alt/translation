const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { createWorker } = require('tesseract.js');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const sharp = require('sharp');

async function preprocessImage(filePath) {
    const ext = path.extname(filePath);
    const preprocessedPath = filePath.replace(ext, `_preprocessed${ext}`);
    
    // Grayscale, normalize (threshold-like contrast stretch), and median filter for noise removal
    await sharp(filePath)
        .grayscale()
        .normalize()
        .median(3) // Noise reduction
        .toFile(preprocessedPath);
        
    return preprocessedPath;
}

async function createHighlightedImage(filePath, words) {
    const ext = path.extname(filePath);
    const highlightedPath = filePath.replace(ext, `_highlighted${ext}`);
    
    // Get image dimensions to setup SVG canvas
    const metadata = await sharp(filePath).metadata();
    
    // Create SVG overlays for bounding boxes
    // Tesseract words have bbox: { x0, y0, x1, y1 }
    let svgRects = '';
    for (const word of words) {
        if (!word.bbox) continue;
        const { x0, y0, x1, y1 } = word.bbox;
        const width = x1 - x0;
        const height = y1 - y0;
        svgRects += `<rect x="${x0}" y="${y0}" width="${width}" height="${height}" fill="none" stroke="red" stroke-width="2" />`;
    }
    
    const svgOverlay = `
    <svg width="${metadata.width}" height="${metadata.height}">
        ${svgRects}
    </svg>`;
    
    await sharp(filePath)
        .composite([{
            input: Buffer.from(svgOverlay),
            top: 0,
            left: 0
        }])
        .toFile(highlightedPath);
        
    return highlightedPath;
}

async function extractText(filePath, mimeType, options = {}) {
    const ocrLanguage = options.ocrLanguage || 'eng';

    if (mimeType === 'application/pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        try {
            const data = await pdfParse(dataBuffer);
            const text = (data && data.text) ? data.text : '';

            // If extracted text is sufficient, return it
            if (text && text.trim().length >= 20) {
                return { text: text, highlightedImageUrl: null };
            }

            // Otherwise, fall back to OCR via pdftoppm + Tesseract
            console.log('PDF text empty or too small — falling back to OCR...');
            return await ocrPdfPages(filePath, ocrLanguage);
        } catch (error) {
            console.error('Error extracting PDF text, attempting OCR fallback:', error.message);
            // Try OCR as last resort
            try {
                return await ocrPdfPages(filePath, ocrLanguage);
            } catch (ocrError) {
                console.error('OCR fallback also failed:', ocrError.message);
                throw new Error("Failed to extract text from PDF. The file may be corrupted.");
            }
        }

    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ path: filePath });
        return { text: result.value, highlightedImageUrl: null };

    } else if (mimeType.startsWith('image/')) {
        console.log('Preprocessing image for OCR...');
        const preprocessedPath = await preprocessImage(filePath);
        
        console.log(`Running OCR with language: ${ocrLanguage}...`);
        const worker = await createWorker(ocrLanguage);
        const { data } = await worker.recognize(preprocessedPath, {}, { blocks: true });
        await worker.terminate();
        
        // Clean up preprocessed file if different from original
        if (preprocessedPath !== filePath && fs.existsSync(preprocessedPath)) {
            try {
                fs.unlinkSync(preprocessedPath);
            } catch (e) {
                console.warn('Could not clean up preprocessed image:', e.message);
            }
        }
        
        // Extract words from blocks
        let words = [];
        if (data.blocks) {
            for (const block of data.blocks) {
                for (const para of block.paragraphs) {
                    for (const line of para.lines) {
                        for (const word of line.words) {
                            words.push(word);
                        }
                    }
                }
            }
        }
        
        let highlightedImageUrl = null;
        if (words.length > 0) {
            try {
                const highlightedPath = await createHighlightedImage(filePath, words);
                const fileName = path.basename(highlightedPath);
                highlightedImageUrl = `/api/download/${fileName}`;
            } catch (highlightError) {
                console.warn('Failed to generate highlighted image:', highlightError.message);
            }
        }
        
        return { text: data.text, highlightedImageUrl };

    } else if (mimeType === 'text/plain') {
        return { text: fs.readFileSync(filePath, 'utf8'), highlightedImageUrl: null };
    } else {
        throw new Error('Unsupported file type: ' + mimeType);
    }
}

/**
 * Convert PDF pages to images using pdftoppm (from poppler),
 * then run Tesseract OCR on each page image.
 */
async function ocrPdfPages(pdfPath, ocrLanguage) {
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

        const worker = await createWorker(ocrLanguage);
        
        // Run OCR on each page
        let fullText = '';
        for (const pageFile of pageFiles) {
            const imagePath = path.join(tmpDir, pageFile);
            console.log(`Running OCR on ${pageFile} with language ${ocrLanguage}...`);
            
            // Apply preprocessing to PDF page images as well
            const preprocessedPath = await preprocessImage(imagePath);
            
            const { data: { text } } = await worker.recognize(preprocessedPath);
            fullText += text + '\n';
        }

        await worker.terminate();

        return { text: fullText.trim(), highlightedImageUrl: null };
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
