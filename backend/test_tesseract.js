const Tesseract = require('tesseract.js');

async function testTesseract() {
    console.log('Testing Tesseract.js...');
    try {
        // Test with a very small base64 image of the letter 'A'
        const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
        const result = await Tesseract.recognize(testImage, 'eng');
        console.log('Tesseract test successful. Output:', result.data.text);
    } catch (error) {
        console.error('Tesseract test failed:', error);
    }
}

testTesseract();
