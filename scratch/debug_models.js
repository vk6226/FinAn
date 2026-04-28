const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  try {
    const models = await genAI.listModels();
    console.log("✅ Success! Your key can access 27hese models:");
    models.models.forEach((m) => {
      console.log(`- ${m.name} (Supports: ${m.supportedGenerationMethods.join(", ")})`);
    });
  } catch (err) {
    console.error("❌ Error listing models:", err.message);
    if (err.message.includes("403")) {
      console.error("Hint: Your API key might not have the 'Generative Language API' enabled.");
    }
  }
}

listModels();
