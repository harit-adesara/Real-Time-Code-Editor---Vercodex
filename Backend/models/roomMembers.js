import { mongoose, Schema } from "mongoose";

const roomMembersSchema = new Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["Member", "Owner"],
      required: true,
      default: "Member",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

roomMembersSchema.index({ roomId: 1, userId: 1 }, { unique: true });
roomMembersSchema.index({ roomId: 1 });
roomMembersSchema.index({ userId: 1 });

export const Members = mongoose.model("roomMembers", roomMembersSchema);
