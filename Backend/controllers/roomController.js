import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.js";
import { Room } from "../models/room.js";
import { Notification } from "../models/notification.js";
import { Members } from "../models/roomMembers.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose, { get } from "mongoose";
import { nanoid } from "nanoid";
import { getIO } from "../socket/index.js";
import bcrypt from "bcryptjs";

const createCode = () => {
  return nanoid(10).toUpperCase();
};

const createRoom = asyncHandler(async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      throw new ApiError(404, "Name and password required");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const room = await Room.create(
        [
          {
            name,
            password,
            roomCode: createCode(),
            ownerId: req.user._id,
          },
        ],
        { session },
      );

      const member = await Members.create(
        [
          {
            roomId: room[0]._id,
            userId: req.user._id,
            role: "Owner",
            joinedAt: new Date(),
          },
        ],
        { session },
      );

      await session.commitTransaction();
      session.endSession();

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { room: room[0], memeber: member[0] },
            "Room created successfully",
          ),
        );
    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      if (error.code === 11000) {
        throw new ApiError(
          500,
          "Failed to generate unique room code. Please try again.",
        );
      }

      throw new ApiError(404, "Error while creating room");
    }
  } catch (error) {
    throw new ApiError(
      error.statusCode || 404,
      error.message || "Error in creating room",
    );
  }
});

const joinRoomPassword = asyncHandler(async (req, res) => {
  try {
    const { roomCode, password } = req.body;

    if (!roomCode || !password) {
      throw new ApiError(400, "Room code and password are required");
    }

    const room = await Room.findOne({ roomCode, isDeleted: false });

    if (!room) {
      throw new ApiError(404, "Room not found");
    }

    const check = await bcrypt.compare(password, room.password);

    if (!check) {
      throw new ApiError(404, "Password is incorrect");
    }

    const exists = await Members.findOne({
      roomId: room._id,
      userId: req.user._id,
      isDeleted: false,
    });

    if (exists) {
      throw new ApiError(409, "Already registered in room");
    }

    const deletedMember = await Members.findOne({
      roomId: room._id,
      userId: req.user._id,
      isDeleted: true,
    });

    let member;

    if (deletedMember) {
      deletedMember.isDeleted = false;
      member = await deletedMember.save();
    } else {
      member = await Members.create({
        roomId: room._id,
        userId: req.user._id,
        role: "Member",
        isDeleted: false,
      });
    }

    const io = getIO();

    io.to(room._id.toString()).emit("member-joined", {
      userId: {
        username: req.user.username,
        _id: req.user._id,
      },
      role: member.role,
      username: req.user.username,
      roomId: room._id,
    });

    io.to(req.user._id.toString()).emit("join-room", {
      roomId: room._id,
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { member },
          deletedMember
            ? "User rejoined successfully"
            : "User joined successfully",
        ),
      );
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Error while joining room",
    );
  }
});

const sendInvitationToJoinRoom = asyncHandler(async (req, res) => {
  try {
    const { roomId, username } = req.body;

    if (!roomId || !username) {
      throw new ApiError(404, "Room ID and username is required");
    }

    const room = await Room.findById(roomId);

    if (!room) {
      throw new ApiError(404, "Room is not found");
    }

    const io = getIO();

    if (room.ownerId.toString() !== req.user._id.toString()) {
      throw new ApiError(404, "Only room owner can send invitation");
    }

    const user = await User.findOne({ username });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user._id.toString() === req.user._id.toString()) {
      throw new ApiError(400, "You cannot invite yourself");
    }

    const exists = await Members.findOne({
      roomId: room._id,
      userId: user._id,
      isDeleted: false,
    });

    if (exists) {
      throw new ApiError(409, "User already joined room");
    }

    const notification = await Notification.create({
      receiverId: user._id,
      senderId: req.user._id,
      type: "ROOM_INVITE",
      title: "Room Invitation",
      message: `${req.user.username} invited you to join ${room.name}`,
      roomId: room._id,
      metadata: {
        roomCode: room.roomCode,
      },
    });

    io.to(user._id.toString()).emit("new-invitation", {
      _id: notification._id,
      roomId: room._id,
      title: "Room Invitation",
      type: "ROOM_INVITE",
      roomName: room.name,
      metadata: {
        roomCode: room.roomCode,
      },
      receiverId: user._id,
      message: `${req.user.username} invited you to join ${room.name}`,
      senderId: {
        username: req.user.username,
      },
      createdAt: notification.createdAt,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, notification, "Invitation sent"));
  } catch (error) {
    throw new ApiError(
      error.statusCode || 404,
      error.message || "Error while sending invitation",
    );
  }
});

const getNotifications = asyncHandler(async (req, res) => {
  try {
    const notifications = await Notification.find({
      receiverId: req.user._id,
      isDeleted: false,
    })
      .populate("senderId", "username")
      .populate("roomId", "name roomCode")
      .sort({ createdAt: -1 });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          notifications,
          "Notifications fetched successfully",
        ),
      );
  } catch (error) {
    throw new ApiError(
      error.statusCode || 404,
      error.message || "Error while fetching notification",
    );
  }
});

const getUnreadCount = asyncHandler(async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      receiverId: req.user._id,
      isRead: false,
      isDeleted: false,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { unreadCount }, "Unread count fetched"));
  } catch (error) {
    throw new ApiError(
      error.statusCode || 404,
      error.message || "Can not get unread count",
    );
  }
});

const markNotificationsRead = asyncHandler(async (req, res) => {
  try {
    await Notification.updateMany(
      {
        receiverId: req.user._id,
        isRead: false,
        isDeleted: false,
      },
      {
        $set: {
          isRead: true,
        },
      },
    );

    const io = getIO();

    io.to(req.user._id.toString()).emit("notifications-read", {
      all: true,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Notifications marked as read"));
  } catch (error) {
    throw new ApiError(
      error.statusCode || 404,
      error.message || "Error while marking notification as read",
    );
  }
});

const joinViaInvite = asyncHandler(async (req, res) => {
  const { roomCode, notificationId } = req.body;

  if (!roomCode || !notificationId) {
    throw new ApiError(400, "Room code and notification ID are required");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const notification =
      await Notification.findById(notificationId).session(session);

    if (!notification) {
      throw new ApiError(404, "Notification not found");
    }

    if (notification.isProcessed || notification.isDeleted) {
      throw new ApiError(404, "Already processed or deleted notification");
    }

    const room = await Room.findOne({
      roomCode,
      isDeleted: false,
    }).session(session);

    if (!room) {
      throw new ApiError(404, "Invalid invite");
    }

    const exists = await Members.findOne({
      roomId: room._id,
      userId: req.user._id,
      isDeleted: false,
    }).session(session);

    if (exists) {
      throw new ApiError(409, "Already joined room");
    }

    const deletedMember = await Members.findOne({
      roomId: room._id,
      userId: req.user._id,
      isDeleted: true,
    }).session(session);

    let member;

    if (deletedMember) {
      deletedMember.isDeleted = false;
      member = await deletedMember.save({ session });
    } else {
      member = await Members.create(
        [
          {
            roomId: room._id,
            userId: req.user._id,
            role: "Member",
            isDeleted: false,
          },
        ],
        { session },
      ).then((docs) => docs[0]);
    }

    notification.isProcessed = true;
    await notification.save({ session });

    await session.commitTransaction();
    session.endSession();

    const io = getIO();

    io.to(room._id.toString()).emit("member-joined", {
      userId: {
        username: req.user.username,
        _id: req.user._id,
      },
      role: member.role,
      username: req.user.username,
      roomId: room._id,
    });

    io.to(req.user._id.toString()).emit("join-room", {
      roomId: room._id,
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { room, member },
          deletedMember
            ? "Rejoined room successfully"
            : "Joined room successfully",
        ),
      );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    throw new ApiError(
      error.statusCode || 500,
      error.message || "Error while joining room",
    );
  }
});

// const joinViaInvite = asyncHandler(async (req, res) => {
//   try {
//     const { roomCode, notificationId } = req.body;

//     if (!roomCode || !notificationId) {
//       throw new ApiError(400, "Room code and notification ID are required");
//     }

//     const notification = await Notification.findById(notificationId);

//     if (!notification) {
//       throw new ApiError(404, "Notification not found");
//     }

//     if (notification.isProcessed || notification.isDeleted) {
//       throw new ApiError(404, "Already processed or deleted notification");
//     }

//     notification.isProcessed = true;
//     await notification.save();

//     const room = await Room.findOne({
//       roomCode,
//       isDeleted: false,
//     });

//     if (!room) {
//       throw new ApiError(404, "Invalid invite");
//     }

//     const exists = await Members.findOne({
//       roomId: room._id,
//       userId: req.user._id,
//       isDeleted: false,
//     });

//     if (exists) {
//       throw new ApiError(409, "Already joined room");
//     }

//     const deletedMember = await Members.findOne({
//       roomId: room._id,
//       userId: req.user._id,
//       isDeleted: true,
//     });

//     let member;

//     if (deletedMember) {
//       deletedMember.isDeleted = false;
//       member = await deletedMember.save();
//     } else {
//       member = await Members.create({
//         roomId: room._id,
//         userId: req.user._id,
//         role: "Member",
//         isDeleted: false,
//       });
//     }

//     const io = getIO();

//     io.to(room._id.toString()).emit("member-joined", {
//       userId: {
//         username: req.user.username,
//         _id: req.user._id,
//       },
//       role: member.role,
//       username: req.user.username,
//       roomId: room._id,
//     });

//     io.to(req.user._id.toString()).emit("join-room", {
//       roomId: room._id,
//     });

//     return res.status(200).json(
//       new ApiResponse(
//         200,
//         {
//           room,
//           member,
//         },
//         deletedMember
//           ? "Rejoined room successfully"
//           : "Joined room successfully",
//       ),
//     );
//   } catch (error) {
//     throw new ApiError(
//       error.statusCode || 500,
//       error.message || "Error while joining room",
//     );
//   }
// });

const softDeleteNotification = asyncHandler(async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        receiverId: req.user._id,
        isDeleted: false,
      },
      {
        $set: {
          isDeleted: true,
          isProcessed: true,
        },
      },
      {
        new: true,
      },
    );

    if (!notification) {
      throw new ApiError(404, "Notification not found");
    }

    const io = getIO();

    io.to(req.user._id.toString()).emit("notification-deleted", {
      notificationId,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Notification deleted successfully"));
  } catch (error) {
    throw new ApiError(
      error.statusCode || 404,
      error.message || "Error while deleting notification",
    );
  }
});

const removeMember = asyncHandler(async (req, res) => {
  try {
    const { roomId, userId } = req.body;

    if (!roomId || !userId) {
      throw new ApiError(404, "Room ID and user ID is required");
    }

    const io = getIO();

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const room = await Room.findById(roomId).session(session);

      if (!room) {
        throw new ApiError(404, "Room not found");
      }

      if (room.ownerId.toString() !== req.user._id.toString()) {
        throw new ApiError(404, "Only owner can remove user");
      }

      if (userId === req.user._id.toString()) {
        throw new ApiError(404, "You can not remove yourself");
      }

      const user = await Members.findOneAndUpdate(
        { roomId, userId, isDeleted: false },
        {
          $set: {
            isDeleted: true,
          },
        },
        { new: true, session },
      );

      if (!user) {
        throw new ApiError(404, "Error while modifying user");
      }

      const notification = await Notification.create(
        [
          {
            receiverId: userId,
            senderId: req.user._id,
            type: "KICK_OUT",
            title: "Removed From Room",
            message: `You were removed from ${room.name}`,
            roomId: room._id,
          },
        ],
        { session },
      );

      await session.commitTransaction();
      session.endSession();

      io.to(roomId.toString()).emit("member-removed", {
        userId,
      });

      io.to(userId.toString()).emit("new-invitation", {
        _id: notification[0]._id,
        roomId: room._id,
        title: "Removed From Room",
        type: "KICK_OUT",
        roomName: room.name,
        metadata: {
          roomCode: room.roomCode,
        },
        receiverId: user._id,
        message: `You were removed from ${room.name}`,
        senderId: {
          username: req.user.username,
        },
        createdAt: notification[0].createdAt,
      });

      // io.to(userId.toString()).emit("kicked-out", {
      //   roomId,
      // });

      return res
        .status(200)
        .json(new ApiResponse(200, {}, "User removed successfully"));
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw new ApiError(
        error.statusCode || 404,
        error.message || "Error while removing user",
      );
    }
  } catch (error) {
    throw new ApiError(
      error.statusCode || 404,
      error.message || "Error while removing member",
    );
  }
});

const getTotalRoom = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;

    if (!userId) {
      throw new ApiError(404, "User ID is required");
    }

    const rooms = await Members.find({
      userId: userId,
      isDeleted: false,
    })
      .populate("roomId", "name roomCode")
      .sort({ joinedAt: -1 });

    return res
      .status(200)
      .json(new ApiResponse(200, { rooms }, "Rooms fetched successfully"));
  } catch (error) {
    throw new ApiError(
      error.statusCode || 404,
      error.message || "Error while fetching rooms",
    );
  }
});

const getUser = asyncHandler(async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      throw new ApiError(404, "Username is required");
    }

    const users = await User.find({
      username: {
        $regex: username,
        $options: "i",
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { users }, "User fetched"));
  } catch (error) {
    throw new ApiError(
      error.statusCode || 404,
      error.message || "Error while fectching user",
    );
  }
});

const leaveRoom = asyncHandler(async (req, res) => {
  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { roomId } = req.query;

      if (!roomId) {
        throw new ApiError(400, "Room ID is required");
      }

      const io = getIO();

      const roomDetail = await Room.findById(roomId).session(session);

      if (!roomDetail) {
        throw new ApiError(404, "Room not found");
      }

      const userId = req.user._id.toString();
      const ownerId = roomDetail.ownerId.toString();

      if (ownerId === userId) {
        roomDetail.isDeleted = true;
        await roomDetail.save({ session });

        await Members.updateMany(
          {
            roomId: roomId,
            isDeleted: false,
          },
          {
            $set: { isDeleted: true },
          },
          { session },
        );

        await session.commitTransaction();
        session.endSession();

        io.to(roomId.toString()).emit("room-deleted", {
          roomId,
        });

        return res.status(200).json(new ApiResponse(200, {}, "Room deleted"));
      }

      const memberUpdate = await Members.findOneAndUpdate(
        {
          roomId: roomId,
          userId: userId,
          isDeleted: false,
        },
        {
          $set: { isDeleted: true },
        },
        {
          new: true,
          session,
        },
      );

      if (!memberUpdate) {
        throw new ApiError(404, "Member not found in room");
      }

      await session.commitTransaction();
      session.endSession();

      io.to(roomId.toString()).emit("member-left", {
        userId: req.user._id,
        username: req.user.username,
      });

      return res
        .status(200)
        .json(new ApiResponse(200, {}, "Left successfully"));
    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      throw new ApiError(
        error.statusCode || 500,
        error.message || "Error while leaving room",
      );
    }
  } catch (error) {
    throw new ApiError(
      error.statusCode || 404,
      error.message || "Error while leaving room",
    );
  }
});

const getRoomDetail = asyncHandler(async (req, res) => {
  try {
    const { roomId } = req.query;

    if (!roomId) {
      throw new ApiError(404, "Room ID not found");
    }

    const roomDetail = await Members.find({ roomId: roomId, isDeleted: false })
      .populate("roomId", "name roomCode ownerId")
      .populate("userId", "username");

    return res
      .status(200)
      .json(new ApiResponse(200, { roomDetail }, "Room details fetched"));
  } catch (error) {
    throw new ApiError(
      error.statusCode || 404,
      error.message || "Error while fetching details",
    );
  }
});

const getTotalUserInRoom = asyncHandler(async (req, res) => {
  try {
    const { roomId } = req.query;

    if (!roomId) {
      throw new ApiError(404, "Room ID is needed");
    }

    const users = await Members.find({ roomId: roomId, isDeleted: false });

    return res
      .status(200)
      .json(new ApiResponse(200, { users }, "All room user fetched"));
  } catch (error) {
    throw new ApiError(
      error.statusCode || 404,
      error.message || "Error while fechting users",
    );
  }
});

// restore

export {
  createRoom,
  joinRoomPassword,
  sendInvitationToJoinRoom,
  getNotifications,
  getUnreadCount,
  markNotificationsRead,
  joinViaInvite,
  softDeleteNotification,
  removeMember,
  getTotalRoom,
  getUser,
  leaveRoom,
  getRoomDetail,
  getTotalUserInRoom,
};
