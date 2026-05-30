import mongoose, { Schema } from "mongoose";

const fileCommitSchema = new Schema(
  {
    nodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Node",
      required: true,
      index: true,
    },

    msg: {
      type: String,
      required: true,
    },

    commitNumber: {
      type: Number,
      required: true,
    },

    lastContent: {
      type: String,
      default: null,
    },

    type: {
      type: String,
      enum: ["SNAPSHOT", "DIFF"],
      required: true,
    },

    snapshotContent: {
      type: String,
      default: null,
    },

    diff: {
      type: String,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

fileCommitSchema.index({ nodeId: 1, commitNumber: -1 });
fileCommitSchema.index({ nodeId: 1, type: 1 });

const File = mongoose.model("File", fileCommitSchema);

export { File };
