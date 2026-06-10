import Groq from "groq-sdk";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = "llama-3.3-70b-versatile";

const stripJsonFences = (text) => {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
};

export const optimizeCode = async (code, language) => {
  const prompt = `
You are a senior software engineer.

Analyze this ${language} code.

Return ONLY valid JSON with NO markdown fences, NO extra text, NO explanation.

{
  "currentCodeEfficiencyInPercentage": <number 0-100>,
  "timeComplexity": "<string>",
  "spaceComplexity": "<string>",
  "issues": ["<string>", ...],
  "suggestions": ["<string>", ...],
  "optimizedCode": "<string>"
}

Code:
${code}
`;

  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.2,
  });

  return completion.choices[0]?.message?.content || "{}";
};

export const checkOptimization = asyncHandler(async (req, res) => {
  const { code, language } = req.body;

  if (!code || !language) {
    throw new ApiError(400, "Code and language are required");
  }

  try {
    const raw = await optimizeCode(code, language);

    const clean = stripJsonFences(raw);

    const parsedResult = JSON.parse(clean);

    return res
      .status(200)
      .json(new ApiResponse(200, parsedResult, "Optimized ⚡"));
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Error while optimizing code",
    );
  }
});

export const streamChat = asyncHandler(async (req, res) => {
  const { message, history } = req.body;

  if (!message || message.trim() === "") {
    throw new ApiError(400, "Message is required");
  }

  const recentHistory = (history || []).slice(-20);

  const historyText = recentHistory
    .filter((msg) => msg.text)
    .map((msg) => `${msg.role === "ai" ? "Assistant" : "User"}: ${msg.text}`)
    .join("\n");

  const prompt = `
You are an intelligent AI assistant for Vercodex, a real-time code editor.

Responsibilities:
- Answer programming questions
- Explain CS concepts
- Help with DSA
- Help with System Design
- Help with AI/ML
- Generate code
- Debug code
- Explain complexity

User Message:
${message}

Conversation History:
${historyText}

`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2048,
    });

    const response =
      completion.choices?.[0]?.message?.content ||
      "Sorry, I couldn't generate a response.";

    return res
      .status(200)
      .json(new ApiResponse(200, { message: response }, "Success"));
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Error while sending response",
    );
  }
});
