const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testModels() {
    const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro', 'gemini-1.0-pro'];
    for (const modelName of models) {
        console.log(`Testing model: ${modelName}...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello, respond with 'OK' if you see this.");
            const response = await result.response;
            console.log(`✅ Model ${modelName} worked! Response: ${response.text().trim()}`);
        } catch (e) {
            console.log(`❌ Model ${modelName} failed: ${e.message}`);
        }
    }
}

testModels();
