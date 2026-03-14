/**
 * Translation service
 * - Uses Groq API via OpenAI compatible endpoint
 */
require('dotenv').config();
const OpenAI = require('openai');

let openaiClient = null;
if (process.env.GROQ_API_KEY) {
    openaiClient = new OpenAI({
        baseURL: 'https://api.groq.com/openai/v1',
        apiKey: process.env.GROQ_API_KEY,
        timeout: 300000 // 300 seconds (5 minutes)
    });
}

const FALLBACK_MODELS = [
    'llama-3.1-8b-instant',
    'llama-3.3-70b-versatile',
    'llama-3.1-70b-versatile'
];

async function translateText(text, targetLanguage) {
    if (!text || text.trim().length === 0) return "";

    let lastError = null;

    for (const model of FALLBACK_MODELS) {
        try {
            console.log(`Attempting translation with model: ${model}...`);
            const systemPrompt = `You are a professional translator. Preserve tone, formatting and return only the translated text.`;
            const userPrompt = `Translate the following text into ${targetLanguage}.\n\n${text}`;

            if (!openaiClient) {
                throw new Error('Groq API Key is missing.');
            }

            const resp = await openaiClient.chat.completions.create({
                model: model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.1,
                max_tokens: 2400
            });

            const content = resp?.choices?.[0]?.message?.content;
            if (content) {
                return content.trim();
            }
        } catch (error) {
            lastError = error;
            console.error(`Error with model ${model}:`, error.message);

            // If it's a rate limit (429) or overloaded (503), try the next model
            if (error.status === 429 || error.status === 503 || (error.message && (error.message.includes('rate_limit') || error.message.includes('overloaded')))) {
                console.warn(`Model ${model} limit reached or overloaded. Falling back...`);
                continue;
            }

            // For other critical errors (like invalid API key), stop immediately
            if (error.message && error.message.includes('API_KEY_INVALID')) {
                throw new Error('Translation provider: Invalid API Key. Please check your credentials.');
            }

            // If it's not a retryable error, throw it
            throw new Error(error.message || 'Translation failed');
        }
    }

    throw new Error(lastError?.message || 'Translation failed after all fallback attempts');
}

module.exports = { translateText };
