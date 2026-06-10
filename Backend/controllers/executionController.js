import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.js";
import { Room } from "../models/room.js";
import { Members } from "../models/roomMembers.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Chat } from "../models/chat.js";
import { Node } from "../models/node.js";
import mongoose from "mongoose";
import axios from "axios";

const extensionMap = {
  cpp: "cpp",
  cxx: "cpp",
  cc: "cpp",

  c: "c",

  java: "java",

  py: "python",

  js: "javascript",
  ts: "typescript",

  cs: "csharp",

  go: "go",
};

const languageMap = {
  cpp: 54,
  c: 50,
  java: 62,
  python: 71,
  javascript: 63,
  typescript: 74,
  csharp: 51,
  go: 60,
};

function getExtension(filename) {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : null;
}

function getLanguageIdFromFile(filename) {
  const ext = getExtension(filename);

  if (!ext) {
    throw new Error("Invalid file name");
  }

  const langKey = extensionMap[ext];

  if (!langKey) {
    throw new Error("Unsupported file extension: " + ext);
  }

  const languageId = languageMap[langKey];

  if (!languageId) {
    throw new Error("Language not supported in Judge0");
  }

  return languageId;
}

async function runCode(sourceCode, languageId, stdin = "") {
  try {
    const response = await axios.post(
      "https://ce.judge0.com/submissions?base64_encoded=true&wait=true",
      {
        source_code: Buffer.from(sourceCode).toString("base64"),
        language_id: languageId,
        stdin: Buffer.from(stdin).toString("base64"),
      },
    );

    return response.data;
  } catch (err) {
    throw new Error("Judge0 execution failed");
  }
}

function decodeBase64(data) {
  if (!data) return "";

  return Buffer.from(data, "base64").toString("utf-8");
}

function formatResult(result) {
  const clean = (data) => {
    if (!data) return "";
    return Buffer.from(data, "base64").toString("utf-8").replace(/\r\n/g, "\n");
  };

  return {
    output: clean(result.stdout),
    error: clean(result.stderr) || clean(result.compile_output),
    status: result.status?.description || "Unknown",
    time: result.time,
    memory: result.memory,
  };
}

async function executeCode(filename, code, stdin = "") {
  const languageId = getLanguageIdFromFile(filename);

  const result = await runCode(code, languageId, stdin);

  return formatResult(result);
}

const runCodeController = asyncHandler(async (req, res) => {
  const { filename, code, stdin } = req.body;

  if (!filename || !code) {
    throw new ApiError(404, "File name and Code required");
  }

  const result = await executeCode(filename, code, stdin);

  return res
    .status(200)
    .json(new ApiResponse(200, { result }, "Output fetched"));
});

export { runCodeController };
