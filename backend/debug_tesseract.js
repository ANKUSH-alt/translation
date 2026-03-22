const { createWorker } = require('tesseract.js');
async function run() {
    console.log('Starting worker...');
    const worker = await createWorker('eng');
    const { data } = await worker.recognize('./test_sample.png', {}, { blocks: true });
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
    console.log('Words found via traversal:', words.length);
    if(words.length) console.log('First word:', words[0].text, words[0].bbox);
    await worker.terminate();
}
run();
