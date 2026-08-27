import { describe, expect, test } from "bun:test";
import { createBestEffortRedis, getRedisOptions } from "./connection-policy";

describe("Redis connection policy", () => {
    test("uses bounded serverless connection and command retry settings", () => {
        const options = getRedisOptions();

        expect(options.connectTimeout).toBe(5000);
        expect(options.maxRetriesPerRequest).toBe(1);
        expect(options.retryStrategy?.(1)).toBe(100);
        expect(options.retryStrategy?.(2)).toBe(200);
        expect(options.retryStrategy?.(3)).toBe(300);
        expect(options.retryStrategy?.(4)).toBeUndefined();
    });

    test("returns cache-safe fallbacks when a Redis command fails", async () => {
        const client = {
            get: async () => {
                throw new Error("Redis unavailable");
            },
            keys: async () => {
                throw new Error("Redis unavailable");
            },
            set: async () => {
                throw new Error("Redis unavailable");
            },
            pipeline: () => ({
                set: () => undefined,
                exec: async () => {
                    throw new Error("Redis unavailable");
                },
            }),
        } as never;

        const cacheRedis = createBestEffortRedis(client);

        expect(await cacheRedis.get("key")).toBeNull();
        expect(await cacheRedis.keys("*")).toEqual([]);
        expect(await cacheRedis.set("key", "value")).toBe("OK");
        expect(await cacheRedis.pipeline().exec()).toEqual([]);
    });
});
