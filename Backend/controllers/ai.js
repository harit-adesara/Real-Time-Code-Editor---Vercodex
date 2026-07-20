import { GoogleGenAI } from "@google/genai";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODEL = "gemini-3.1-flash-lite";

const generate = async (
  prompt,
  { temperature = 0.5, maxOutputTokens, responseSchema } = {},
) => {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      temperature,
      ...(maxOutputTokens ? { maxOutputTokens } : {}),
      ...(responseSchema
        ? { responseMimeType: "application/json", responseSchema }
        : {}),
    },
  });

  return response.text || "";
};

const optimizationSchema = {
  type: "object",
  properties: {
    currentCodeEfficiencyInPercentage: { type: "number" },
    timeComplexity: { type: "string" },
    spaceComplexity: { type: "string" },
    issues: { type: "array", items: { type: "string" } },
    suggestions: { type: "array", items: { type: "string" } },
    optimizedCode: { type: "string" },
  },
  required: [
    "currentCodeEfficiencyInPercentage",
    "timeComplexity",
    "spaceComplexity",
    "issues",
    "suggestions",
    "optimizedCode",
  ],
  propertyOrdering: [
    "currentCodeEfficiencyInPercentage",
    "timeComplexity",
    "spaceComplexity",
    "issues",
    "suggestions",
    "optimizedCode",
  ],
};

export const optimizeCode = async (code, language) => {
  const prompt = `
You are a senior software engineer.

Analyze this ${language} code and produce an optimization report.

Instructions: Give issues, suggestions and optimization if possible. Do not give any fake data. currentCodeEfficiencyInPercentage must be a number between 0 and 100.

Code:
${code}
`;

  const text = await generate(prompt, {
    temperature: 0.2,
    responseSchema: optimizationSchema,
  });
  return text || "{}";
};

export const checkOptimization = asyncHandler(async (req, res) => {
  const { code, language } = req.body;

  if (!code || !language) {
    throw new ApiError(400, "Code and language are required");
  }

  try {
    const raw = await optimizeCode(code, language);

    const parsedResult = JSON.parse(raw);

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

  console.log(history);

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
- Simply said this line -> [I can not give you answer related this field] to any messages which is not related to this field

User Message:
${message}

Conversation History:
${historyText}

`;

  try {
    const text = await generate(prompt, {
      temperature: 0.7,
      maxOutputTokens: 2048,
    });

    const response = text || "Sorry, I couldn't generate a response.";

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

export const inlineSuggestions = asyncHandler(async (req, res) => {
  try {
    const { codeBefore = "", codeAfter = "", language } = req.body;

    if (!language) {
      throw new ApiError(404, "Language is required");
    }

    const trimmedBefore = codeBefore.split("\n").slice(-80).join("\n");
    const trimmedAfter = codeAfter.split("\n").slice(0, 40).join("\n");

    const prompt = `
  You are a inline code completion engine embedded in a code editor. Given the code immediately before and after the cursor, output ONLY the exact text that should be inserted at the cursor to continue the code naturally.

Rules:
- Output raw code only. No markdown fences, no explanations, no comments about what you're doing.
- Do not repeat any code that already exists in "before" or "after".
- Match the existing indentation, style, and naming conventions exactly.
- Keep completions short and focused — usually one line or one small block, not an entire file.
- If the cursor is mid-line, continue that line; do not add a newline unless the logical completion requires one.
- If there is nothing sensible to complete, output nothing.

Data:
 - Language: ${language}

 - Code Before Cursor: ${trimmedBefore}

 - Code After Cursor: ${trimmedAfter}

 Return ONLY the code that should be inserted at the cursor.
Do NOT repeat any text already present in codeAfter.

  `;

    const raw = await generate(prompt, {
      temperature: 0.2,
      maxOutputTokens: 140,
    });

    const response = raw
      .replace(/^```[\w]*\n?/, "")
      .replace(/```$/, "")
      .trim();

    return res
      .status(200)
      .json(new ApiResponse(200, { message: response }, "Success"));
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Error in inline suggestion",
    );
  }
});
