/**
 * Test script for OCR post-correction pipeline
 * Run: node test_ocr_cleaning.js
 */
require('dotenv').config();
const { cleanOcrText } = require('./services/ocrCleaning');

const testCases = [
    {
        name: 'Character errors (0→o, 1→l)',
        input: 'The c0mputer pr0gram ran with n0 err0rs and printed "He11o W0r1d".',
        expectedContains: ['computer', 'program', 'no', 'errors', 'Hello', 'World']
    },
    {
        name: 'Broken/split words',
        input: 'San Fran- cisco is a beau- tiful city in Cali- fornia.',
        expectedContains: ['Francisco', 'beautiful', 'California']
    },
    {
        name: 'Duplicate fragments',
        input: 'FRANCISCO CISCO went to the the store to buy some items items.',
        expectedNotContains: ['CISCO went', 'the the', 'items items']
    },
    {
        name: 'Spanish OCR errors (Historical Preservation Default)',
        input: 'El zel0so defensor de la devocion sagrada.',
        language: 'spa',
        expectedContains: ['zeloso', 'devoción']
    },
    {
        name: 'Already correct text',
        input: 'This is a perfectly correct sentence with no errors.',
        expectedContains: ['This is a perfectly correct sentence with no errors']
    },
    {
        name: 'Long s and ligatures',
        input: 'The ſtudent found the ofﬁcial document in the ofﬂine ﬁle.',
        expectedContains: ['student', 'official', 'offline', 'file']
    },
    {
        name: 'Handwriting: confused letterforms & stroke errors',
        input: 'Tbe stndent went to tbe library aud fonnd a book frorn tbe shelf.',
        expectedContains: ['The', 'student', 'the', 'and', 'found', 'from']
    },
    {
        name: 'Handwriting: split words from gaps',
        input: 'I we nt to th e store bec ause I nee ded so me milk.',
        expectedContains: ['went', 'the', 'because', 'needed', 'some']
    },
    {
        name: 'Historical Spanish: Preservation mode',
        input: 'El zel0so defensor de la fe hizo haz0r una gran plaç4.',
        language: 'spa',
        expectedContains: ['zeloso', 'hazer', 'plaça']
    },
    {
        name: 'Semantic correction: Word in context',
        input: 'The car sat on the mat and purred loudly.',
        expectedContains: ['cat sat on the mat']
    },
    {
        name: 'Grammatical correctness: Agreement',
        input: 'The students goes to the library every day.',
        expectedContains: ['students go to the library']
    }
];

async function runTests() {
    console.log('═══════════════════════════════════════');
    console.log('  OCR Post-Correction Pipeline Tests   ');
    console.log('═══════════════════════════════════════\n');

    let passed = 0;
    let failed = 0;

    for (const tc of testCases) {
        console.log(`\n▶ Test: ${tc.name}`);
        console.log(`  Input:    "${tc.input}"`);

        try {
            const result = await cleanOcrText(tc.input, tc.language || 'eng');
            console.log(`  Output:   "${result}"`);

            let testPassed = true;

            if (tc.expectedContains) {
                for (const expected of tc.expectedContains) {
                    if (!result.includes(expected)) {
                        console.log(`  ✗ Missing expected: "${expected}"`);
                        testPassed = false;
                    }
                }
            }

            if (tc.expectedNotContains) {
                for (const unexpected of tc.expectedNotContains) {
                    if (result.includes(unexpected)) {
                        console.log(`  ✗ Should not contain: "${unexpected}"`);
                        testPassed = false;
                    }
                }
            }

            if (testPassed) {
                console.log(`  ✅ PASSED`);
                passed++;
            } else {
                console.log(`  ❌ FAILED`);
                failed++;
            }
        } catch (error) {
            console.log(`  ❌ ERROR: ${error.message}`);
            failed++;
        }
    }

    console.log('\n═══════════════════════════════════════');
    console.log(`  Results: ${passed} passed, ${failed} failed`);
    console.log('═══════════════════════════════════════\n');
}

runTests();
