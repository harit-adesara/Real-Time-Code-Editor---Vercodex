import { mongoose, Schema } from "mongoose";

const nodeSchema = new Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ["file", "folder"],
      required: true,
    },

    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Node",
      default: null,
      index: true,
    },

    content: {
      type: String,
      default: "",
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

nodeSchema.index({
  roomId: 1,
  parentId: 1,
});

const Node = mongoose.model("Node", nodeSchema);

export { Node };
