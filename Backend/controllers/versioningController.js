import DiffMatchPatch from "diff-match-patch";
import { Node } from "../models/node.js";
import { File } from "../models/content.js";
import { versionQueue, versionQueueEvents } from "../db/bullmq.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import dotenv from "dotenv";

dotenv.config({
  path: "./.env",
});

const dmp = new DiffMatchPatch();

const createDiff = (oldText, newText) => {
  const patches = dmp.patch_make(oldText, newText);

  return dmp.patch_toText(patches);
};

const applyDiff = (text, diff) => {
  const patches = dmp.patch_fromText(diff);

  const [newText] = dmp.patch_apply(patches, text);

  return newText;
};

const commitVersion = async ({ nodeId, userId, msg, content }) => {
  const node = await Node.findById(nodeId);

  if (!node) {
    throw new ApiError(404, "File not found");
  }

  const last = await File.findOne({
    nodeId,
  }).sort({
    commitNumber: -1,
  });

  const commitNumber = last ? last.commitNumber + 1 : 0;

  const currentContent = content;

  let previousContent = "";

  if (last) {
    if (last.type === "SNAPSHOT") {
      previousContent = last.snapshotContent;
    } else {
      previousContent = applyDiff(last.lastContent, last.diff);
    }
  }

  let type = "DIFF";
  let snapshotContent = null;
  let diff = null;

  if (commitNumber % 10 === 0) {
    type = "SNAPSHOT";

    snapshotContent = currentContent;
  } else {
    type = "DIFF";

    diff = createDiff(previousContent, currentContent);
  }

  await File.create({
    nodeId,
    msg,
    commitNumber,
    lastContent: previousContent,
    type,
    snapshotContent,
    diff,
    createdBy: userId,
  });

  node.content = currentContent;

  await node.save();

  return {
    commitNumber,
    type,
  };
};

const restoreVersion = async ({ nodeId, commitNumber }) => {
  const commit = await File.findOne({
    nodeId,
    commitNumber,
  });

  if (!commit) {
    throw new ApiError(404, "Commit not found");
  }

  let content = "";

  if (commit.type === "SNAPSHOT") {
    content = commit.snapshotContent;
  } else {
    content = applyDiff(commit.lastContent, commit.diff);
  }

  await Node.findByIdAndUpdate(nodeId, {
    content,
  });

  return content;
};

const commitFile = asyncHandler(async (req, res) => {
  try {
    const { nodeId, content, msg } = req.body;

    if (
      !nodeId ||
      !content ||
      content.trim() === "" ||
      !msg ||
      msg.trim() === ""
    ) {
      throw new ApiError(404, "Please give reuired fields");
    }

    const job = await versionQueue.add("commit", {
      nodeId,
      userId: req.user._id,
      content,
      msg,
    });

    const result = await job.waitUntilFinished(versionQueueEvents);

    return res.status(200).json(new ApiResponse(200, {}, "Commit completed"));
  } catch (error) {
    throw new ApiError(404, "Error while commiting");
  }
});

const restoreFile = asyncHandler(async (req, res) => {
  const { nodeId, commitNumber } = req.body;

  if (!nodeId) {
    throw new ApiError(404, "File ID is required");
  }

  const job = await versionQueue.add("restore", {
    nodeId,
    commitNumber: Number(commitNumber),
  });

  const result = await job.waitUntilFinished(versionQueueEvents);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        content: result,
      },
      "Restored",
    ),
  );
});

const commitGraph = asyncHandler(async (req, res) => {
  try {
    const { nodeId } = req.query;

    if (!nodeId) {
      throw new ApiError(404, "File ID required");
    }

    const details = await File.find({ nodeId: nodeId })
      .sort({
        commitNumber: 1,
      })
      .select("commitNumber createdBy createdAt")
      .populate("createdBy", "username");

    return res
      .status(200)
      .json(new ApiResponse(200, { graph: details }, "Graph deatils fetched"));
  } catch (error) {
    throw new ApiError(404, "Error while fetching graph details");
  }
});

const commitHistory = asyncHandler(async (req, res) => {
  try {
    const { nodeId } = req.query;

    if (!nodeId) {
      throw new ApiError(404, "Node ID is reuired");
    }

    const details = await File.find({ nodeId: nodeId })
      .sort({
        commitNumber: -1,
      })
      .select("commitNumber createdBy createdAt msg")
      .populate("createdBy", "username");

    return res
      .status(200)
      .json(
        new ApiResponse(200, { history: details }, "Commit history fetched"),
      );
  } catch (error) {
    throw new ApiError(404, "Error while fetching history");
  }
});

export {
  createDiff,
  applyDiff,
  commitVersion,
  restoreVersion,
  commitFile,
  restoreFile,
  commitGraph,
  commitHistory,
};
