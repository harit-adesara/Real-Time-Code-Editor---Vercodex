import { mongoose, Schema } from "mongoose";
import bcrypt from "bcryptjs";

const roomSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    roomCode: {
      type: String,
      required: true,
      unique: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

roomSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  this.password = await bcrypt.hash(this.password, 10);
});

roomSchema.methods.isPasswordCorrect = async function (password) {
  if (!password) {
    return false;
  }
  return await bcrypt.compare(password, this.password);
};

export const Room = mongoose.model("Room", roomSchema);
