const pdfParse = require('pdf-parse');
console.log('pdf-parse exports:', Object.keys(pdfParse));

const fs = require('fs');
const path = require('path');

// Test if it works as a function (standard way)
async function probe() {
    try {
        console.log('Trying standard function call...');
        // Just a dummy buffer
        const dummyBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\nview\n<< /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Count 0 /Kids [ ] >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');
        const result = await pdfParse(dummyBuffer);
        console.log('Standard call successful');
    } catch (e) {
        console.log('Standard call failed:', e.message);
    }

    try {
        console.log('\nTrying class-based approach...');
        if (pdfParse.PDFParse) {
            const parser = new pdfParse.PDFParse({ data: Buffer.from([]) });
            console.log('Class-based instantiation successful');
            console.log('PDFParse instance keys:', Object.keys(parser));
        } else {
            console.log('PDFParse class not found in exports');
        }
    } catch (e) {
        console.log('Class-based approach failed:', e.message);
    }
}

probe();
