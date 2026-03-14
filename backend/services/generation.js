const { jsPDF } = require("jspdf");
const { Document, Packer, Paragraph, TextRun } = require("docx");
const fs = require('fs');
const path = require('path');

async function generateFile(text, format, originalName, targetLanguage = 'English') {
    const fileName = `translated_${Date.now()}_${path.parse(originalName).name}.${format}`;
    const filePath = path.join(__dirname, '../uploads', fileName);

    const getFontPath = (lang) => {
        const lowerLang = lang?.toLowerCase() || '';
        if (lowerLang.includes('hindi') || lowerLang.includes('marathi') || lowerLang.includes('nepali')) {
            return path.join(__dirname, '../NotoSansDevanagari.ttf');
        } else if (lowerLang.includes('chinese') || lowerLang.includes('japanese') || lowerLang.includes('korean') || lowerLang.includes('arabic') || lowerLang.includes('russian')) {
            return path.join(__dirname, '../NotoSans-Regular.ttf');
        }
        return path.join(__dirname, '../NotoSans-Regular.ttf');
    };

    const fontPath = getFontPath(targetLanguage);
    const hasFont = fs.existsSync(fontPath);

    if (format === 'txt') {
        fs.writeFileSync(filePath, text);
    } else if (format === 'pdf') {
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
                doc.fontSize(11).fillColor('#1f2937').text(text, {
                    align: 'justify',
                    lineGap: 5,
                    paragraphGap: 10,
                    features: { kern: false } // Disable kerning to fix xCoordinate crash with Noto fonts
                });

                doc.end();
                writeStream.on('finish', () => resolve({ fileName, filePath }));
                writeStream.on('error', reject);
            } catch (err) {
                reject(err);
            }
        });
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
    } else {
        throw new Error('Unsupported output format: ' + format);
    }

    return { fileName, filePath };
}

module.exports = { generateFile };
