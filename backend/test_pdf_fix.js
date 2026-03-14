const { extractText } = require('./services/extraction');
const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');

async function testExtraction() {
    console.log('Starting verification...');
    
    // 1. Create a simple PDF
    const doc = new jsPDF();
    const testText = 'Hello, this is a test PDF for AI Language Translator extraction verification.';
    doc.text(testText, 10, 10);
    const testFilePath = path.join(__dirname, 'test_pdf_fix.pdf');
    
    try {
        // Save PDF to buffer or file
        const arrayBuffer = doc.output('arraybuffer');
        fs.writeFileSync(testFilePath, Buffer.from(arrayBuffer));
        console.log('Test PDF created at:', testFilePath);

        // 2. Call extractText
        const extractedText = await extractText(testFilePath, 'application/pdf');
        console.log('Extracted text:', extractedText);

        // 3. Verify
        if (extractedText.includes('AI Language Translator')) {
            console.log('✅ Verification SUCCESSFUL: PDF text extracted correctly.');
        } else {
            console.log('❌ Verification FAILED: Extracted text does not match expected content.');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Verification FAILED with error:', error);
        process.exit(1);
    } finally {
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
            console.log('Test file cleaned up.');
        }
    }
}

testExtraction();
