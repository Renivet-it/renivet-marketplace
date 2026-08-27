import { env } from "@/../env";
import { Redis } from "ioredis";
import { createBestEffortRedis, getRedisOptions } from "./connection-policy";

const rawRedis = new Redis(env.REDIS_URL, getRedisOptions());

rawRedis.on("error", (error) => {
    console.error("Redis connection error", error);
});

export const criticalRedis = rawRedis;
export const redis = createBestEffortRedis(rawRedis);
