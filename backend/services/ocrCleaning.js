const { OpenAI } = require('openai');
const { applyDictionary, applyTypographyFixes, detectDocumentType, getProfile } = require('./dictionary');

let openaiClient = null;
if (process.env.GROQ_API_KEY) {
    openaiClient = new OpenAI({
        baseURL: 'https://api.groq.com/openai/v1',
        apiKey: process.env.GROQ_API_KEY,
        timeout: 300000
    });
}

// Prefer larger model for accuracy, fall back to smaller for speed/rate limits
const FALLBACK_MODELS = [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'llama-3.1-70b-versatile'
];

const MAX_CHUNK_SIZE = 2500; // characters per chunk
const CHUNK_OVERLAP = 200;   // overlap to preserve context at boundaries

// ─── PASS 1 PROMPT: Character-Level & Semantic OCR Fixes ────────────────
const PASS1_SYSTEM_PROMPT = `You are a HIGH-PRECISION OCR post-correction system.

YOUR TASK: 
1. Fix OBVIOUS character misreads (0→o, 1→l, etc.) that produce non-words.
2. SEMANTIC CORRECTION: Identify real words that are clearly incorrect in context (e.g., "The car sat on the mat" -> "The cat sat on the mat"). Only change these if the semantic error is obvious.

You must be EXTREMELY CONSERVATIVE. Only correct a word if you are 100% certain it is an OCR error.

FIX ONLY THESE — and ONLY when the result is clearly a non-word:
• Misread characters: 0→o, 1→l, 5→S, 8→B, rn→m, cl→d (ONLY if the original is not a real word)
• Long s (ſ) → s, ligature artifacts (ﬁ→fi, ﬂ→fl, ﬀ→ff)
• Broken words with hyphens at line breaks: "Fran- cisco" → "Francisco"
• Handwriting stroke errors that produce non-words: "tbe"→"the", "aud"→"and", "frorn"→"from"
• Accents ONLY in known words: "devocion"→"devoción" (Spanish)

DO NOT CORRECT THESE — LEAVE THEM AS-IS:
• Any word that IS a real word, even if it seems unusual
• Names — do NOT guess or change names
• Words you are unsure about
• Grammar or style issues
• Unusual but valid spellings
• Words that could be correct in context

EXAMPLES OF OVER-CORRECTION (DO NOT DO THIS):
• "since" → "since" ✓ (already correct, leave it)
• "affect" → "effect" ✗ (both are real words — DO NOT change)
• "their" → "there" ✗ (both are real words — DO NOT change)
• "lead" → "led" ✗ (both are real words — DO NOT change)

THE GOLDEN RULE: Only change a real word if it is SEMANTICALLY IMPOSSIBLE in the given context.
For historical documents, PREFER historically accurate spellings (e.g., "zeloso", "hazer", "dixo") over modern ones.

Return ONLY the corrected text. No explanations.`;

// ─── PASS 4 PROMPT: Grammatical Correctness ───────────────────────────
const PASS4_SYSTEM_PROMPT = `You are a professional grammar and linguistic editor.

YOUR TASK: Ensure the text is grammatically correct while strictly adhering to the original meaning and style.
1. Fix punctuation and minor grammatical agreement issues.
2. Ensure consistent verb tenses and agreement.
3. DO NOT paraphrase or rewrite the text.
4. FOR HISTORICAL DOCUMENTS: 
   - STRICTLY PRESERVE archaic spellings (e.g., "zeloso", "hazer", "plaça", "dixo"). 
   - Do NOT modernize these to modern equivalents. 
   - Only fix clear grammatical errors that are not part of the period's style.

Return ONLY the grammatically correct text. No explanations.`;

// ─── PASS 2 PROMPT: Minimal Structural Cleanup ──────────────────────────
const PASS2_SYSTEM_PROMPT = `You are a MINIMAL OCR structural cleanup system.

YOUR ONLY TASK: Fix EXACT word duplicates caused by OCR. Nothing else.

FIX ONLY THESE:
1. EXACT WORD DUPLICATES: Remove when the SAME word appears twice in a row.
   Example: "the the cat" → "the cat"
   Example: "went went to" → "went to"

2. CAPITALIZATION: Fix ONLY sentence-start capitalization if clearly wrong.

DO NOT DO ANY OF THESE:
• DO NOT change any word to a different word
• DO NOT merge separate words (e.g., "to day" must stay "to day")
• DO NOT fix grammar
• DO NOT change names
• DO NOT remove words unless they are exact consecutive duplicates
• DO NOT add words
• DO NOT change meaning

If the text has no exact duplicates, return it COMPLETELY UNCHANGED.
When in doubt, return the text UNCHANGED.

Return ONLY the text. No explanations.`;

/**
 * Split long text into overlapping chunks for processing
 */
function chunkText(text, maxSize = MAX_CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
    if (text.length <= maxSize) return [text];

    const chunks = [];
    let start = 0;

    while (start < text.length) {
        let end = Math.min(start + maxSize, text.length);

        // Try to break at a sentence or word boundary
        if (end < text.length) {
            const lastPeriod = text.lastIndexOf('.', end);
            const lastNewline = text.lastIndexOf('\n', end);
            const bestBreak = Math.max(lastPeriod, lastNewline);

            if (bestBreak > start + maxSize * 0.5) {
                end = bestBreak + 1;
            } else {
                const lastSpace = text.lastIndexOf(' ', end);
                if (lastSpace > start + maxSize * 0.5) {
                    end = lastSpace + 1;
                }
            }
        }

        chunks.push(text.slice(start, end));

        // Next chunk starts with overlap for context continuity
        start = end - (end < text.length ? overlap : 0);
    }

    return chunks;
}

/**
 * Reassemble chunks, deduplicating overlap regions
 */
function reassembleChunks(processedChunks, originalChunks) {
    if (processedChunks.length === 1) return processedChunks[0];

    let result = processedChunks[0];

    for (let i = 1; i < processedChunks.length; i++) {
        // Find the best merge point by looking for overlapping text
        const chunk = processedChunks[i];
        const overlapSize = Math.min(CHUNK_OVERLAP, result.length, chunk.length);

        // Try to find matching text in the overlap region
        let bestMatch = -1;
        const searchRegion = result.slice(-overlapSize * 2);

        for (let len = overlapSize; len >= 20; len -= 10) {
            const needle = chunk.slice(0, len);
            const idx = searchRegion.indexOf(needle);
            if (idx !== -1) {
                bestMatch = result.length - (searchRegion.length - idx);
                break;
            }
        }

        if (bestMatch > 0) {
            // Merge at the matched overlap point
            const overlapStart = chunk.indexOf(result.slice(bestMatch));
            if (overlapStart >= 0) {
                result = result.slice(0, bestMatch) + chunk;
            } else {
                result = result.slice(0, bestMatch) + chunk;
            }
        } else {
            // No overlap found, just concatenate with a space
            result += ' ' + chunk;
        }
    }

    return result;
}

/**
 * Run a single AI cleaning pass
 */
async function runCleaningPass(text, systemPrompt, temperature, sourceLanguage, profileName = 'modern') {
    if (!openaiClient) {
        console.warn('Groq API key missing. Skipping OCR cleanup pass.');
        return text;
    }

    const langHint = sourceLanguage && sourceLanguage !== 'eng'
        ? `\nNote: The source text language is "${sourceLanguage}".`
        : '';
    
    const profileHint = `\nDocument Type Context: ${profileName}.`;

    const userPrompt = `${langHint}${profileHint}\n\nText:\n${text}`;

    let lastError = null;

    for (const model of FALLBACK_MODELS) {
        try {
            console.log(`  → OCR cleanup pass with model: ${model} (temp=${temperature})...`);
            const resp = await openaiClient.chat.completions.create({
                model: model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: temperature,
                max_tokens: 4096
            });

            let content = resp?.choices?.[0]?.message?.content;
            if (content) {
                content = content.trim();
                // Strip wrapping quotes if the model added them
                if (content.startsWith('"') && content.endsWith('"')) {
                    content = content.slice(1, -1);
                }
                return content;
            }
        } catch (error) {
            lastError = error;
            console.error(`  ✗ Error with model ${model}:`, error.message);

            if (error.status === 429 || error.status === 503 ||
                (error.message && (error.message.includes('rate_limit') || error.message.includes('overloaded')))) {
                console.warn(`  ⚠ Model ${model} rate-limited/overloaded. Falling back...`);
                continue;
            }

            if (error.message && error.message.includes('API_KEY_INVALID')) {
                console.error('  ✗ OCR cleanup: Invalid API Key.');
                break;
            }
        }
    }

    console.warn('  ⚠ Cleaning pass failed. Returning original text. Error:', lastError?.message);
    return text;
}

/**
 * Main OCR text cleaning function — multi-pass with chunking, dictionary, and document profiles
 * @param {string} text - Raw OCR text
 * @param {string} sourceLanguage - OCR language code (e.g., 'eng', 'spa', 'hin')
 * @returns {string} Cleaned text
 */
async function cleanOcrText(text, sourceLanguage = 'eng') {
    if (!text || text.trim().length === 0) return "";
    if (!openaiClient) {
        console.warn('Groq API key missing. Skipping OCR cleanup.');
        return text;
    }

    // ─── 0. Document Type Detection & Profiling ──────────────────────────
    const profileKey = detectDocumentType(text, sourceLanguage);
    const profile = getProfile(profileKey);

    console.log(`\n╔══ OCR Post-Correction Pipeline ══╗`);
    console.log(`║ Input length: ${text.length} chars`);
    console.log(`║ Source language: ${sourceLanguage}`);
    console.log(`║ Document Type: ${profile.name}`);

    // ─── 1. Deterministic Layer: Dictionary & Typography ─────────────────
    console.log('── Step 1: Deterministic Processing ──');
    let processedText = applyTypographyFixes(text, profile);
    if (profile.useDictionary) {
        processedText = applyDictionary(processedText, profile.dictionaryName);
    }
    console.log(`  ✓ Deterministic layer complete\n`);

    // ─── 2. Chunking ───────────────────────────────────────────────────
    const chunks = chunkText(processedText);
    console.log(`║ Processing in ${chunks.length} chunk(s)`);
    console.log(`╚══════════════════════════════════╝\n`);

    // ─── PASS 1: Character-level OCR fixes ───────────────────────────────
    console.log('── Pass 1: Character-Level OCR Fixes ──');
    const pass1Results = [];
    for (let i = 0; i < chunks.length; i++) {
        console.log(`  Chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)...`);
        const cleaned = await runCleaningPass(chunks[i], PASS1_SYSTEM_PROMPT, 0.0, sourceLanguage, profile.name);
        pass1Results.push(cleaned);
    }

    const pass1Text = reassembleChunks(pass1Results, chunks);
    console.log(`  ✓ Pass 1 complete (${pass1Text.length} chars)\n`);

    // ─── PASS 2: Structural & entity cleanup ─────────────────────────────
    console.log('── Pass 2: Structural & Entity Cleanup ──');
    const pass2Chunks = chunkText(pass1Text);
    const pass2Results = [];
    for (let i = 0; i < pass2Chunks.length; i++) {
        console.log(`  Chunk ${i + 1}/${pass2Chunks.length} (${pass2Chunks[i].length} chars)...`);
        const cleaned = await runCleaningPass(pass2Chunks[i], PASS2_SYSTEM_PROMPT, 0.1, sourceLanguage, profile.name);
        pass2Results.push(cleaned);
    }

    let finalText = reassembleChunks(pass2Results, pass2Chunks);
    console.log(`  ✓ Pass 2 complete (${finalText.length} chars)\n`);

    // ─── PASS 3: Archaic/Historical Handling ───────────────────────────
    if (profileKey.startsWith('historical')) {
        const isPreserve = profile.postProcessing.preserveArchaic;
        console.log(`── Pass 3: Historical ${isPreserve ? 'Preservation' : 'Normalization'} ──`);
        
        const pass3Prompt = isPreserve
            ? `You are a specialist in historical text preservation. 
               Fix ONLY clear OCR character errors (e.g., "zel0so" -> "zeloso").
               STRICTLY PRESERVE historically accurate spellings like "zeloso", "hazer", "dixo", "plaça". 
               Do NOT modernize these words. Return ONLY corrected text.`
            : `You are a specialist in historical Spanish normalization. 
               Normalize archaic spellings to modern equivalents (e.g., "zeloso" -> "celoso", "hazer" -> "hacer")
               while preserving formal tone. Return ONLY corrected text.`;
        
        const pass3Chunks = chunkText(finalText);
        const pass3Results = [];
        for (let i = 0; i < pass3Chunks.length; i++) {
            const cleaned = await runCleaningPass(pass3Chunks[i], pass3Prompt, 0.1, sourceLanguage, profile.name);
            pass3Results.push(cleaned);
        }
        finalText = reassembleChunks(pass3Results, pass3Chunks);
        console.log(`  ✓ Pass 3 complete (${finalText.length} chars)\n`);
    }

    // ─── PASS 4: Grammatical Correctness ───────────────────────────────
    console.log('── Pass 4: Grammatical Correctness ──');
    const pass4Chunks = chunkText(finalText);
    const pass4Results = [];
    for (let i = 0; i < pass4Chunks.length; i++) {
        console.log(`  Chunk ${i + 1}/${pass4Chunks.length} (${pass4Chunks[i].length} chars)...`);
        const cleaned = await runCleaningPass(pass4Chunks[i], PASS4_SYSTEM_PROMPT, 0.1, sourceLanguage, profile.name);
        pass4Results.push(cleaned);
    }
    finalText = reassembleChunks(pass4Results, pass4Chunks);
    console.log(`  ✓ Pass 4 complete (${finalText.length} chars)\n`);

    console.log(`══ OCR Cleanup Done: ${text.length} → ${finalText.length} chars ══\n`);

    return finalText;
}

module.exports = { cleanOcrText };
