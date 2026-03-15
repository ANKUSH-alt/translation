const { Document, Packer, Paragraph, TextRun } = require("docx");
const fs = require('fs');
const path = require('path');

async function generateFile(text, format, originalName, targetLanguage = 'English') {
    const fileName = `translated_${Date.now()}_${path.parse(originalName).name}.${format}`;
    const UPLOADS_DIR = process.env.NODE_ENV === 'production' ? '/tmp' : path.join(__dirname, '../uploads');
    const filePath = path.join(UPLOADS_DIR, fileName);


    const getFontPath = (lang) => {
        const lowerLang = lang?.toLowerCase() || '';
        if (lowerLang.includes('hindi') || lowerLang.includes('marathi') || lowerLang.includes('nepali')) {
            return path.join(__dirname, '../NotoSansDevanagari.ttf');
        } else if (lowerLang.includes('arabic')) {
            return path.join(__dirname, '../SFArabic.ttf');
        } else if (lowerLang.includes('chinese') || lowerLang.includes('japanese') || lowerLang.includes('korean') || lowerLang.includes('russian')) {
            return path.join(__dirname, '../NotoSans-Regular.ttf');
        }
        return path.join(__dirname, '../NotoSans-Regular.ttf');
    };

    const fontPath = getFontPath(targetLanguage);
    const hasFont = fs.existsSync(fontPath);

    if (format === 'txt') {
        fs.writeFileSync(filePath, text);
    } else if (format === 'pdf') {
        const lowerLang = targetLanguage?.toLowerCase() || '';
        // Use jsPDF for complex/problematic scripts to avoid fontkit crashes and ensure rendering
        const useJsPDF = lowerLang.includes('hindi') || lowerLang.includes('marathi') || 
                        lowerLang.includes('nepali') || lowerLang.includes('arabic');

        if (useJsPDF) {
            const { jsPDF } = require("jspdf");
            const doc = new jsPDF();
            
            if (hasFont) {
                const fontBytes = fs.readFileSync(fontPath);
                const fontBase64 = fontBytes.toString('base64');
                const fontName = path.basename(fontPath);
                doc.addFileToVFS(fontName, fontBase64);
                doc.addFont(fontName, 'CustomFont', 'normal');
                doc.setFont('CustomFont');
            }

            const isRTL = lowerLang.includes('arabic');

            // Title
            doc.setTextColor(79, 70, 229); // #4f46e5
            doc.setFontSize(18);
            if (isRTL) {
                doc.text('Translated Document', 105, 20, { align: 'center' });
            } else {
                doc.text('Translated Document', 105, 20, { align: 'center' });
            }

            // Content
            doc.setTextColor(31, 41, 55); // #1f2937
            doc.setFontSize(11);
            
            // Split text to fit page width
            const splitText = doc.splitTextToSize(text, 180);
            
            if (isRTL) {
                // For Arabic, jsPDF needs help with line placement for RTL
                doc.text(splitText, 195, 40, { align: 'right' });
            } else {
                doc.text(splitText, 15, 40);
            }

            doc.save(filePath);
            return { fileName, filePath };
        }
 else {
            // Original PDFKit logic for simpler scripts (faster, better layout features)
            const PDFDocument = require('pdfkit');

            return new Promise((resolve, reject) => {
                try {
                    const doc = new PDFDocument({ 
                        autoFirstPage: false,
                        margins: { top: 72, left: 72, bottom: 72, right: 72 } 
                    });
                    const writeStream = fs.createWriteStream(filePath);
                    doc.pipe(writeStream);
                    doc.addPage();

                    if (hasFont) {
                        doc.font(fontPath);
                    } else {
                        doc.font('Helvetica');
                    }

                    // Title
                    doc.fontSize(18).fillColor('#4f46e5').text('Translated Document', { align: 'center' });
                    doc.moveDown(2);

                    // Content
                    try {
                        doc.fontSize(11).fillColor('#1f2937').text(text, {
                            align: 'justify',
                            lineGap: 5,
                            paragraphGap: 10,
                            features: [] // Disable all OpenType features to prevent xCoordinate crash
                        });
                    } catch (renderError) {
                        console.error('PDF rendering error with custom font, falling back to Helvetica:', renderError);
                        try {
                            // Fallback: try rendering with Helvetica (will show squares for non-Latin, but won't crash)
                            doc.font('Helvetica');
                            doc.fontSize(11).fillColor('#1f2937').text(text);
                        } catch (fallbackError) {
                            console.error('Final PDF rendering fallback failed:', fallbackError);
                            // If everything fails, at least provide a message
                            doc.text('Error rendering document content. Please try a different format.');
                        }
                    }

                    doc.end();
                    writeStream.on('finish', () => resolve({ fileName, filePath }));
                    writeStream.on('error', reject);
                } catch (err) {
                    reject(err);
                }
            });
        }
    } else if (format === 'docx') {
        const paragraphs = text.split('\n').map(line => {
            return new Paragraph({
                children: [
                    new TextRun({
                        text: line.trim(),
                        size: 24, // 12pt
                        font: "Roboto" // DOCX will try to use the name, though embedding is complex
                    }),
                ],
                spacing: {
                    after: 200,
                }
            });
        });

        try {
            const doc = new Document({
                sections: [{
                    properties: {},
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "Translated Document",
                                    bold: true,
                                    size: 36, // 18pt
                                    color: "4f46e5",
                                    font: "Roboto"
                                }),
                            ],
                            alignment: "center",
                            spacing: { after: 400 }
                        }),
                        ...paragraphs
                    ],
                }],
            });
            const buffer = await Packer.toBuffer(doc);
            fs.writeFileSync(filePath, buffer);
        } catch (docxError) {
            console.error('DOCX generation error:', docxError);
            // Fallback to simple text file if DOCX fails
            const txtPath = filePath.replace('.docx', '.txt');
            fs.writeFileSync(txtPath, text);
            return { fileName: path.basename(txtPath), filePath: txtPath };
        }
    } else {
        throw new Error('Unsupported output format: ' + format);
    }

    return { fileName, filePath };
}

module.exports = { generateFile };
