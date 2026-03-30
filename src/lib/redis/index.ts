import { env } from "@/../env";
import { Redis } from "ioredis";

// Cache Redis connection on globalThis to prevent connection leaks during Next.js hot-reloads
const globalForRedis = globalThis as unknown as {
    redis: Redis | undefined;
};

export const redis =
    globalForRedis.redis ??
    new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
    });

globalForRedis.redis = redis;