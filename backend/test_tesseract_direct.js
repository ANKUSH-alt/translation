const Tesseract = require('tesseract.js');

async function test() {
    try {
        const { data: { text } } = await Tesseract.recognize('test_data.txt', 'eng');
        console.log(text);
    } catch(e) {
        console.error(e);
    }
}
test();
