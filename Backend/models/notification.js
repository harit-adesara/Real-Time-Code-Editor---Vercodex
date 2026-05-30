import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    type: {
      type: String,
      enum: ["ROOM_INVITE", "KICK_OUT", "MESSAGE"],
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({ receiverId: 1 });

notificationSchema.index({
  receiverId: 1,
  isRead: 1,
});

notificationSchema.index({
  receiverId: 1,
  createdAt: -1,
});

export const Notification = mongoose.model("Notification", notificationSchema);
