import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.js";
import { Room } from "../models/room.js";
import { Members } from "../models/roomMembers.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Chat } from "../models/chat.js";
import { Node } from "../models/node.js";
import { getIO } from "../socket/index.js";
import mongoose from "mongoose";
import { redis } from "../db/redis.js";

const createFile = asyncHandler(async (req, res) => {
  try {
    const { roomId, parentId, name } = req.body;

    const io = getIO();

    const exists = await Node.findOne({
      roomId,
      parentId,
      name,
      type: "file",
      isDeleted: false,
    });

    if (exists) {
      throw new ApiError(404, "File not created already have with that name");
    }

    const file = await Node.create({
      roomId,
      parentId,
      name,
      type: "file",
      content: "",
    });

    io.to(roomId.toString()).emit("new-file", {
      _id: file._id,
      name: file.name,
      roomId: file.roomId,
      type: file.type,
      parentId: file.parentId,
    });

    await redis.del(`room_${roomId}`);

    return res.status(200).json(new ApiResponse(200, { file }, "File created"));
  } catch (error) {
    throw new ApiError(
      error.statusCode || 404,
      error.message || "File not created",
    );
  }
});

const createFolder = asyncHandler(async (req, res) => {
  try {
    const { roomId, parentId, name } = req.body;

    const exists = await Node.findOne({
      roomId,
      parentId,
      name,
      type: "folder",
      isDeleted: false,
    });

    if (exists) {
      throw new ApiError(
        404,
        "Folder not created because same name folder already there",
      );
    }

    const folder = await Node.create({
      roomId,
      parentId,
      name,
      type: "folder",
    });

    const io = getIO();

    io.to(roomId.toString()).emit("new-folder", {
      _id: folder._id,
      name: folder.name,
      roomId: folder.roomId,
      type: folder.type,
      parentId: folder.parentId,
    });

    await redis.del(`room_${roomId}`);

    return res
      .status(200)
      .json(new ApiResponse(200, { folder }, "Folder created successfully"));
  } catch (error) {
    throw new ApiError(
      error.statusCode || 404,
      error.message || "Folder not created",
    );
  }
});

const updateContent = asyncHandler(async (req, res) => {
  try {
    const { nodeId, content } = req.body;

    const existingNode = await Node.findById(nodeId);

    if (!existingNode) {
      return res.status(404).json(new ApiResponse(200, {}, "File not found"));
    }

    if (existingNode.content === content) {
      return res.json(new ApiResponse(200, {}, "No changes are detected"));
    }

    existingNode.content = content;
    await existingNode.save();

    return res.status(200).json(new ApiResponse(200, {}, "File updated"));
  } catch (error) {
    throw new ApiError(
      error.statusCode || 404,
      error.message || "Error while saving file",
    );
  }
});

const renameNode = async (req, res) => {
  try {
    const { nodeId, name } = req.body;

    const node = await Node.findById(nodeId);

    if (!node) {
      throw new ApiError(404, "Node not found");
    }

    const duplicate = await Node.findOne({
      roomId: node.roomId,
      parentId: node.parentId,
      name,
      isDeleted: false,
      _id: { $ne: nodeId },
    });

    if (duplicate) {
      throw new ApiError(404, "This name folder or file already exsists");
    }

    node.name = name;
    await node.save();

    const io = getIO();

    io.to(node.roomId.toString()).emit("rename-node", {
      _id: nodeId,
      newName: node.name,
      type: node.type,
      parentId: node.parentId,
    });

    await redis.del(`room_${roomId}`);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Renamed successsfully"));
  } catch (error) {
    throw new ApiError(
      error.statusCode || 404,
      error.message || "Error while renaming",
    );
  }
};

const getTree = asyncHandler(async (req, res) => {
  try {
    const { roomId } = req.params;

    if (!roomId) {
      throw new ApiError(404, "Room ID is required");
    }

    const cacheKey = `room_${roomId}`;

    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      return res
        .status(200)
        .json(new ApiResponse(200, { nodes: cachedData }, "Nodes fetched"));
    }

    const nodes = await Node.find({
      roomId,
      isDeleted: false,
    });

    await redis.set(cacheKey, nodes, {
      ex: 300,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { nodes }, "Nodes fetched"));
  } catch (error) {
    throw new ApiError(
      error.statusCode || 404,
      error.message || "Error while fetching nodes",
    );
  }
});

const deleteNode = asyncHandler(async (req, res) => {
  try {
    const { nodeId } = req.params;

    const node = await Node.findById(nodeId);

    if (!node) {
      throw new ApiError(404, "File or Folder not found");
    }

    const descendants = [];

    async function getDescendants(parentId) {
      const children = await Node.find({
        parentId,
        isDeleted: false,
      });

      for (const child of children) {
        descendants.push(child._id);

        if (child.type === "folder") {
          await getDescendants(child._id);
        }
      }
    }

    if (node.type === "folder") {
      await getDescendants(node._id);
    }

    const deletedIds = [node._id, ...descendants];

    await Node.updateMany(
      {
        _id: {
          $in: [node._id, ...descendants],
        },
      },
      {
        $set: {
          isDeleted: true,
        },
      },
    );

    const io = getIO();

    io.to(node.roomId.toString()).emit("delete-node", {
      deletedNodeIds: deletedIds,
    });

    await redis.del(`room_${roomId}`);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Deleted successfully"));
  } catch (error) {
    throw new ApiError(
      error.statusCode || 404,
      error.message || "Error while deleting",
    );
  }
});

export {
  createFile,
  createFolder,
  updateContent,
  renameNode,
  getTree,
  deleteNode,
};
