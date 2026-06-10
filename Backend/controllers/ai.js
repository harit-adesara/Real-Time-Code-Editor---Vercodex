import { GoogleGenAI, Language } from "@google/genai";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

const ai = new GoogleGenAI({
  apiKey: process.env.gemini_key,
});

export const optimizeCode = async (code, language) => {
  const prompt = `You are a senior software engineer.

Analyze this ${language} code.

Return JSON in this format i will do JSON.parse direct on your response of js language so give according it support that:

{ 
  "currentCodeEfficiencyInPercentage":"",
  "timeComplexity": "",
  "spaceComplexity": "",
  "issues": [],
  "suggestions": [],
  "optimizedCode": ""
}

Code:
${code}
`;

  const res = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return res.text;
};

export const checkOptimization = asyncHandler(async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code || !language || code.trim() === "" || language.trim() === "") {
      throw new ApiError(404, "Code or Language is required");
    }

    const result = await optimizeCode(code, language);

    const parsedResult = JSON.parse(result);

    return res
      .status(200)
      .json(new ApiResponse(200, parsedResult, "Optimized ⚡"));
  } catch (error) {
    throw new ApiError(
      error.statusCode || 404,
      error.message || "Error while optimizing",
    );
  }
});

export const streamChat = asyncHandler(async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === "") {
      throw new ApiError(404, "Content is required to send message");
    }

    const prompt = `
You are an intelligent AI assistant for Vercodex, real time code editor website.

Your responsibilities:
- Answer programming questions.
- Explain computer science concepts.
- Help with DSA, system design, web development, AI/ML, databases, DevOps, and software engineering.
- Generate code when requested.
- Debug code provided by the user.
- Explain algorithms and complexity.
- Provide clear, concise, and accurate answers.

Guidelines:
- Use markdown for code blocks.
- When generating code, provide complete working examples.
- Explain important trade-offs when relevant.
- Prefer practical examples.
- Keep responses concise unless the user asks for details.

User Message:
${message}
`;

    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Transfer-Encoding", "chunked");

    const stream = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    for await (const chunk of stream) {
      console.log(chunk.text);
      res.write(chunk.text);
    }

    res.end();
  } catch (error) {
    if (!res.headersSent) {
      throw new ApiError(
        error.statusCode || 500,
        error.message || "Internal Server Error",
      );
    } else {
      res.end();
    }
  }
});
