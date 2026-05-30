import { Worker } from "bullmq";
import { redis } from "../db/redis.js";
// import dotenv from "dotenv";

// dotenv.config({
//   path: "./.env",
// });

import {
  commitVersion,
  restoreVersion,
} from "../controllers/versioningController.js";

import { acquireLock, releaseLock } from "../db/bullmq.js";
import { ApiError } from "./apiError.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const versionWorker = new Worker(
  "version-queue",

  async (job) => {
    const { name, data } = job;
    const { nodeId } = data;

    let lock = await acquireLock(nodeId);

    while (!lock) {
      await sleep(100);

      lock = await acquireLock(nodeId);
    }

    try {
      if (name === "commit") {
        return await commitVersion({
          nodeId: data.nodeId,
          userId: data.userId,
          msg: data.msg,
          content: data.content,
        });
      }

      if (name === "restore") {
        return await restoreVersion({
          nodeId: data.nodeId,
          commitNumber: data.commitNumber,
        });
      }

      throw Error("Unknown job type");
    } catch (err) {
      throw err;
    } finally {
      await releaseLock(nodeId);
    }
  },

  {
    connection: {
      url: process.env.UPSTASH_REDIS_URL,
    },
  },
);

export { versionWorker };
