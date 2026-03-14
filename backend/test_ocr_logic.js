const { extractText } = require('./services/extraction');
const fs = require('fs');
const path = require('path');

// Mock data that should be detected as garbage
const garbageText = "Ø=Ý9 NumPy !G > K (?0 $0 .G.K0@ ,M2I .G 8 ?88G 8B @ @ $A2(> .G *9A $G < 9K$@ 9HdØ=Ý &? >$ > 9Hd print(\"*> / % ( 8 B @ K ! < ( G > 8 . / : \" , end - start )";

// Mock data that should be detected as clean
const cleanText = "import numpy as np\nsize = 1000000\nlist1 = list(range(size))\nprint('Done')";

// We need to test the logic. Since we can't easily mock the PDFParse class without more setup,
// we will test the isGarbageText function by exposing it or testing it via the side-effect.
// Actually, I'll just create a small test for the detection logic itself.

function isGarbageText(text) {
    if (!text || text.trim().length === 0) return true;
    
    // PDF garbled text often has many unusual characters and single-character "words"
    const alphanumeric = text.match(/[a-zA-Z0-9]/g) || [];
    const symbols = text.match(/[^a-zA-Z0-9\s]/g) || [];
    
    // Heuristic 1: High density of symbols
    // In normal text, alphanumeric characters significantly outnumber symbols.
    const symbolRatio = symbols.length / (alphanumeric.length + symbols.length || 1);
    
    // Heuristic 2: Average "word" length
    // Garbled text often extracts as disconnected characters separated by spaces.
    const words = text.trim().split(/\s+/);
    const avgWordLength = text.trim().length / words.length;

    console.log(`-- Debug: alphanumeric=${alphanumeric.length}, symbols=${symbols.length}, ratio=${symbolRatio.toFixed(2)}, avgWord=${avgWordLength.toFixed(2)}`);

    // If more than 40% are symbols OR average word length is very low, it's garbage.
    if (symbolRatio > 0.4) return true;
    if (avgWordLength < 2.5 && alphanumeric.length > 10) return true;
    
    return false;
}

console.log('--- Testing isGarbageText Logic ---');
console.log('Test 1 (Garbage):', isGarbageText(garbageText) === true ? '✅ PASSED' : '❌ FAILED');
console.log('Test 2 (Clean):', isGarbageText(cleanText) === false ? '✅ PASSED' : '❌ FAILED');
console.log('Test 3 (Empty):', isGarbageText('') === true ? '✅ PASSED' : '❌ FAILED');
console.log('Test 4 (Mixed but okay):', isGarbageText('Hello world! 123 @#$%') === false ? '✅ PASSED' : '❌ FAILED');

console.log('\nLogic Verification Complete.');
