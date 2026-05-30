import { Queue, QueueEvents } from "bullmq";
import { redis } from "./redis.js";
import dotenv from "dotenv";

dotenv.config({
  path: "./.env",
});

export const versionQueue = new Queue("version-queue", {
  connection: {
    url: process.env.UPSTASH_REDIS_URL,
  },
});

export const versionQueueEvents = new QueueEvents("version-queue", {
  connection: {
    url: process.env.UPSTASH_REDIS_URL,
  },
});

const lockKey = (nodeId) => `lock:file:${nodeId}`;

export const acquireLock = async (nodeId) => {
  return await redis.set(lockKey(nodeId), "1", {
    nx: true,
    ex: 10,
  });
};

export const releaseLock = async (nodeId) => {
  return await redis.del(lockKey(nodeId));
};
