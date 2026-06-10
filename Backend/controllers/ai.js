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

Return ONLY valid JSON with NO markdown fences, NO extra text, NO explanation.
The JSON must match this exact schema:

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

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

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
    if (!res.writableEnded) res.end();
  }
});

// import { GoogleGenAI } from "@google/genai";
// import { asyncHandler } from "../utils/asyncHandler.js";
// import { ApiError } from "../utils/apiError.js";
// import { ApiResponse } from "../utils/apiResponse.js";

// const ai = new GoogleGenAI({
//   apiKey: process.env.gemini_key,
// });

// // ── Gemini model to use across all calls ──────────────────────────────────────
// // "gemini-3-flash-preview" does NOT exist — it caused the 500 / 404 errors.
// // Use one of the valid model names below (pick whichever your API key supports):
// //   "gemini-2.0-flash"   ← recommended, fast + capable
// //   "gemini-1.5-flash"   ← fallback if 2.0 isn't on your plan
// const GEMINI_MODEL = "gemini-3-flash-preview";

// // ── Strip markdown code fences that Gemini sometimes wraps JSON in ────────────
// // e.g.  ```json\n{...}\n```  →  {...}
// const stripJsonFences = (text) => {
//   return text
//     .trim()
//     .replace(/^```(?:json)?\s*/i, "")
//     .replace(/\s*```$/, "")
//     .trim();
// };

// // ── Code optimisation (used internally + by the route handler) ────────────────
// export const optimizeCode = async (code, language) => {
//   const prompt = `You are a senior software engineer.

// Analyze this ${language} code.

// Return ONLY valid JSON with NO markdown fences, NO extra text, NO explanation.
// The JSON must match this exact schema:

// {
//   "currentCodeEfficiencyInPercentage": <number 0-100>,
//   "timeComplexity": "<string>",
//   "spaceComplexity": "<string>",
//   "issues": ["<string>", ...],
//   "suggestions": ["<string>", ...],
//   "optimizedCode": "<string>"
// }

// Code:
// ${code}
// `;

//   const res = await ai.models.generateContent({
//     model: GEMINI_MODEL,
//     contents: prompt,
//   });

//   return res.text;
// };

// // ── POST /vercodex/code/optimize ──────────────────────────────────────────────
// export const checkOptimization = asyncHandler(async (req, res) => {
//   const { code, language } = req.body;

//   if (!code || !language || code.trim() === "" || language.trim() === "") {
//     throw new ApiError(400, "Code and language are required");
//   }

//   let parsedResult;
//   try {
//     const raw = await optimizeCode(code, language);
//     const clean = stripJsonFences(raw);
//     parsedResult = JSON.parse(clean);
//   } catch (error) {
//     throw new ApiError(
//       error.statusCode || 500,
//       error.message || "Error while optimizing code",
//     );
//   }

//   return res
//     .status(200)
//     .json(new ApiResponse(200, parsedResult, "Optimized ⚡"));
// });

// // ── POST /vercodex/code/chatBot ───────────────────────────────────────────────
// export const streamChat = asyncHandler(async (req, res) => {
//   const { message } = req.body;

//   if (!message || message.trim() === "") {
//     throw new ApiError(400, "Message content is required");
//   }

//   const prompt = `
// You are an intelligent AI assistant for Vercodex, a real-time collaborative code editor.

// Your responsibilities:
// - Answer programming questions.
// - Explain computer science concepts.
// - Help with DSA, system design, web development, AI/ML, databases, DevOps, and software engineering.
// - Generate code when requested.
// - Debug code provided by the user.
// - Explain algorithms and complexity.
// - Provide clear, concise, and accurate answers.

// Guidelines:
// - Use markdown for code blocks.
// - When generating code, provide complete working examples.
// - Explain important trade-offs when relevant.
// - Prefer practical examples.
// - Keep responses concise unless the user asks for details.

// User Message:
// ${message}
// `;

//   res.setHeader("Content-Type", "text/plain; charset=utf-8");
//   res.setHeader("Transfer-Encoding", "chunked");
//   res.setHeader("X-Accel-Buffering", "no");
//   res.flushHeaders();

//   try {
//     const stream = await ai.models.generateContentStream({
//       model: GEMINI_MODEL,
//       contents: prompt,
//     });

//     for await (const chunk of stream) {
//       const text = chunk.text;
//       if (text) {
//         res.write(text);
//       }
//     }

//     res.end();
//   } catch (error) {
//     // Headers already sent — we can't change the status code, so just end
//     // the stream cleanly. The frontend detects truncated/empty streams.
//     console.error("streamChat Gemini error:", error);
//     if (!res.writableEnded) {
//       res.end();
//     }
//   }
// });
