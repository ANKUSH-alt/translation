const fs = require('fs');
const path = require('path');
const { extractText } = require('./services/extraction');
const sharp = require('sharp');

async function createSampleImage() {
    const svgText = `
    <svg width="400" height="200">
        <rect width="100%" height="100%" fill="white"/>
        <text x="50" y="80" font-family="Arial" font-size="30" fill="black">Hello OCR World</text>
        <text x="50" y="140" font-family="Arial" font-size="20" fill="gray">Testing bounding boxes</text>
    </svg>`;
    
    const outputPath = path.join(__dirname, 'test_sample.png');
    await sharp(Buffer.from(svgText))
        .png()
        .toFile(outputPath);
        
    return outputPath;
}

async function runTest() {
    console.log('Generating test image...');
    const imagePath = await createSampleImage();
    
    console.log(`Test image generated at: ${imagePath}`);
    
    console.log('Testing extraction service...');
    try {
        const result = await extractText(imagePath, 'image/png');
        console.log('--- Extraction Result ---');
        console.log(`Text:\n${result.text}`);
        console.log(`Highlighted Image URL: ${result.highlightedImageUrl}`);
        
        if (result.highlightedImageUrl) {
            console.log(`Check for highlighted image: ${imagePath.replace('.png', '_highlighted.png')}`);
        }
    } catch (e) {
        console.error('Test failed:', e);
    }
}

runTest();
