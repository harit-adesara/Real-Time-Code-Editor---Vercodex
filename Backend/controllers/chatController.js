import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.js";
import { Room } from "../models/room.js";
import { Members } from "../models/roomMembers.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Chat } from "../models/chat.js";
import { getIO } from "../socket/index.js";
import mongoose from "mongoose";

const sendMessage = asyncHandler(async (req, res) => {
  try {
    const { roomId, content } = req.body;

    const io = getIO();

    const senderId = req.user._id;

    if (!roomId || !content || content.trim() === "") {
      throw new ApiError(404, "Room ID and Content are required");
    }

    const room = await Room.findById(roomId);

    if (!room) {
      throw new ApiError(404, "Room not found");
    }

    const isMember = await Members.findOne({
      roomId: roomId,
      userId: senderId,
      isDeleted: false,
    });

    if (!isMember) {
      throw new ApiError(404, "You are not member of this room");
    }

    const message = await Chat.create({
      roomId,
      senderId,
      content: content?.trim() || "",
    });

    io.to(roomId.toString()).emit("new-message", {
      _id: message._id,
      senderId: message.senderId,
      username: req.user.username,
      content: message.content,
      createdAt: message.createdAt,
    });

    return res.status(200).json(new ApiResponse(200, {}, "Message sent"));
  } catch (error) {
    throw new ApiError(
      error.statusCode || 404,
      error.message || "Error while sending msg",
    );
  }
});

const getMessage = asyncHandler(async (req, res) => {
  try {
    const { roomId } = req.params;
    const { cursor } = req.query;

    if (!roomId) {
      throw new ApiError(404, "Room ID is required");
    }

    let filter = {
      roomId: roomId,
      isDeleted: false,
      hiddenFor: { $ne: req.user._id },
    };

    if (cursor) {
      filter._id = { $lt: cursor };
    }

    const chat = await Chat.find(filter)
      .populate("senderId", "username")
      .sort({ _id: 1 });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          chat,
          nextCursor: chat.length > 0 ? chat[chat.length - 1]._id : null,
          user: req.user._id,
        },
        "Messages fetched",
      ),
    );
  } catch (error) {
    throw new ApiError(
      error.statusCode || 404,
      error.message || "Error while getting messages",
    );
  }
});

const editMessage = asyncHandler(async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    const userId = req.user._id;

    const io = getIO();

    if (!content || content.trim() === "") {
      throw new ApiError(404, "Content is required");
    }

    const message = await Chat.findById(messageId);

    if (!message) {
      throw new ApiError(404, "Message not found");
    }

    if (message.senderId.toString() !== userId.toString()) {
      throw new ApiError(404, "Only message owner can edit this");
    }

    const diff = Date.now() - new Date(message.createdAt).getTime();
    const limit = 60 * 60 * 1000;

    if (diff > limit) {
      throw new ApiError(404, "Edit time limit exceeded");
    }

    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    io.to(message.roomId.toString()).emit("edit-message", {
      _id: message._id,
      content: content,
      roomId: message.roomId,
      senderId: message.senderId,
      editedAt: message.editedAt,
    });

    return res.status(200).json(new ApiResponse(200, {}, "Message edited"));
  } catch (error) {
    throw new ApiError(
      error.statusCode || 404,
      error.message || "Error while editing message",
    );
  }
});

const deleteMessageEveryone = asyncHandler(async (req, res) => {
  try {
    const { roomId } = req.params;
    const { chatId } = req.query;

    if (!roomId || !chatId) {
      throw new ApiError(404, "Room ID and chat ID is required");
    }

    const msg = await Chat.findById(chatId);

    const io = getIO();

    if (msg.senderId.toString() !== req.user._id.toString()) {
      throw new ApiError(404, "You can not delete this message");
    }

    const chat = await Chat.findOneAndUpdate(
      {
        roomId,
        _id: chatId,
        isDeleted: false,
      },
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: req.user._id,
      },
      {
        new: true,
      },
    );

    if (!chat) {
      throw new ApiError(404, "Error while deleting message");
    }

    io.to(roomId.toString()).emit("delete-everyone", {
      _id: chat._id,
      senderId: chat.senderId,
      content: chat.content,
      roomId: roomId,
      deletedAt: chat.deletedAt,
      deletedBy: chat.deletedBy,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { chat }, "Message deleted successfully"));
  } catch (error) {
    throw new ApiError(
      error.statusCode || 404,
      error.message || "Error while deleting",
    );
  }
});

const deleteForMe = asyncHandler(async (req, res) => {
  try {
    const { messageIds } = req.body;
    const { roomId } = req.body;
    const userId = req.user._id;

    if (messageIds.length === 0) {
      throw new ApiError(404, "Messages are required");
    }

    const io = getIO();

    if (!userId) {
      throw new ApiError(404, "User ID is required");
    }

    const room = await Room.findById(roomId);

    if (!room) {
      throw new ApiError(404, "Room not found");
    }

    const message = await Chat.updateMany(
      { _id: { $in: messageIds } },
      {
        $addToSet: {
          hiddenFor: userId,
        },
      },
    );

    io.to(userId.toString()).emit("delete-for-me", {
      message,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Messages are deleted"));
  } catch (error) {
    throw new ApiError(
      error.statusCode || 404,
      error.message || "Error while deleting message",
    );
  }
});

export {
  sendMessage,
  getMessage,
  editMessage,
  deleteMessageEveryone,
  deleteForMe,
};
