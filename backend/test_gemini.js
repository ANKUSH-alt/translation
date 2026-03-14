const { translateText } = require('./services/translation');

async function testGemini() {
    console.log('Testing Gemini Translation...');
    try {
        const text = "Hello, how are you today? I am testing the new Gemini translation service.";
        const targetLanguage = "Hindi";
        const translated = await translateText(text, targetLanguage);
        console.log('Original:', text);
        console.log('Target Language:', targetLanguage);
        console.log('Translated:', translated);
        
        if (translated && translated.length > 0) {
            console.log('✅ Gemini Translation Test PASSED');
        } else {
            console.log('❌ Gemini Translation Test FAILED');
        }
    } catch (error) {
        console.error('❌ Gemini Translation Test Error:', error.message);
    }
}

testGemini();
