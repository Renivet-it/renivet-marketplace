import { env } from "@/../env";
import { Redis } from "ioredis";
import {
    createBestEffortRedis,
    createObservabilityRedis,
    getRedisOptions,
} from "./connection-policy";

const rawRedis = new Redis(env.REDIS_URL, getRedisOptions());

rawRedis.on("error", (error) => {
    console.error("Redis connection error", error);
});

export const criticalRedis = createObservabilityRedis(rawRedis);
export const redis = createBestEffortRedis(rawRedis);
