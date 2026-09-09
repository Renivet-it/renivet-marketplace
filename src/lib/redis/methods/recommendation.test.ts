import { describe, expect, test } from "bun:test";
import {
    createRecommendationCache,
    createRecommendationContextFingerprint,
    RECOMMENDATION_CACHE_TTL_SECONDS,
    withPersonalizedRecommendationCache,
} from "./recommendation";

type Result = { products: Array<{ id: string }>; source: string };

const healthy = (): Result => ({
    products: Array.from({ length: 5 }, (_, index) => ({ id: `p-${index}` })),
    source: "mixed",
});

function fakeRedis() {
    const values = new Map<string, string>();
    const sets: Array<{ key: string; ttl: number }> = [];
    return {
        values,
        sets,
        client: {
            get: async (key: string) => values.get(key) ?? null,
            set: async (
                key: string,
                value: string,
                mode: string,
                ttl: number
            ) => {
                expect(mode).toBe("EX");
                values.set(key, value);
                sets.push({ key, ttl });
                return "OK";
            },
            del: async (key: string) => (values.delete(key) ? 1 : 0),
        },
    };
}

const parseResult = (value: unknown): Result | null => {
    if (!value || typeof value !== "object") return null;
    const result = value as Result;
    return Array.isArray(result.products) && typeof result.source === "string"
        ? result
        : null;
};

describe("personalized recommendation cache", () => {
    test("normalizes exclusions while isolating user and limit", () => {
        const first = createRecommendationContextFingerprint({
            userId: "user-a",
            limit: 20,
            excludeProductIds: ["b", "a", "a"],
        });
        const reordered = createRecommendationContextFingerprint({
            userId: "user-a",
            limit: 20,
            excludeProductIds: ["a", "b"],
        });

        expect(first).toBe(reordered);
        expect(first).not.toContain("a,b");
        expect(
            createRecommendationContextFingerprint({
                userId: "user-b",
                limit: 20,
                excludeProductIds: ["a", "b"],
            })
        ).not.toBe(first);
        expect(
            createRecommendationContextFingerprint({
                userId: "user-a",
                limit: 50,
                excludeProductIds: ["a", "b"],
            })
        ).not.toBe(first);
    });

    test("serves a validated hit and writes misses with the approved TTL", async () => {
        const redis = fakeRedis();
        const cache = createRecommendationCache<Result>({
            client: redis.client,
            parseResult,
        });
        const context = { userId: "user-a", limit: 20, excludeProductIds: [] };
        let computes = 0;

        const first = await withPersonalizedRecommendationCache({
            cache,
            context,
            compute: async () => {
                computes++;
                return healthy();
            },
        });
        const second = await withPersonalizedRecommendationCache({
            cache,
            context,
            compute: async () => {
                computes++;
                return healthy();
            },
        });

        expect(second).toEqual(first);
        expect(computes).toBe(1);
        expect(redis.sets[0]?.ttl).toBe(RECOMMENDATION_CACHE_TTL_SECONDS);
    });

    test("does not cache empty or platform-default fallback results", async () => {
        const redis = fakeRedis();
        const cache = createRecommendationCache<Result>({
            client: redis.client,
            parseResult,
        });
        const context = { userId: "user-a", limit: 20, excludeProductIds: [] };

        await withPersonalizedRecommendationCache({
            cache,
            context,
            compute: async () => ({ products: [], source: "mixed" }),
        });
        await withPersonalizedRecommendationCache({
            cache,
            context,
            compute: async () => ({
                ...healthy(),
                source: "platform_defaults",
            }),
        });

        expect(redis.sets).toHaveLength(0);
    });

    test("rejects an envelope owned by another user and recomputes", async () => {
        const redis = fakeRedis();
        const cache = createRecommendationCache<Result>({
            client: redis.client,
            parseResult,
        });
        const context = { userId: "user-a", limit: 20, excludeProductIds: [] };
        const key = cache.key(context);
        redis.values.set(
            key,
            JSON.stringify({
                version: 1,
                ownerUserId: "user-b",
                contextFingerprint:
                    createRecommendationContextFingerprint(context),
                result: healthy(),
            })
        );
        let computes = 0;

        await withPersonalizedRecommendationCache({
            cache,
            context,
            compute: async () => {
                computes++;
                return healthy();
            },
        });

        expect(computes).toBe(1);
    });

    test("coalesces concurrent misses and clears single-flight after failure", async () => {
        const redis = fakeRedis();
        const cache = createRecommendationCache<Result>({
            client: redis.client,
            parseResult,
        });
        const inFlight = new Map<string, Promise<Result>>();
        const context = { userId: "user-a", limit: 20, excludeProductIds: [] };
        let computes = 0;
        const compute = async () => {
            computes++;
            await Promise.resolve();
            return healthy();
        };

        await Promise.all([
            withPersonalizedRecommendationCache({
                cache,
                context,
                compute,
                inFlight,
            }),
            withPersonalizedRecommendationCache({
                cache,
                context,
                compute,
                inFlight,
            }),
        ]);
        expect(computes).toBe(1);

        const failingContext = { ...context, userId: "failure-user" };
        await expect(
            withPersonalizedRecommendationCache({
                cache,
                context: failingContext,
                inFlight,
                compute: async () => {
                    throw new Error("database failed");
                },
            })
        ).rejects.toThrow("database failed");
        expect(inFlight.size).toBe(0);
    });

    test("contains synchronous Redis failures and respects the operation budget", async () => {
        const cache = createRecommendationCache<Result>({
            client: {
                get: () => {
                    throw new Error("sync failure");
                },
                set: async () => new Promise(() => {}),
                del: async () => 0,
            },
            parseResult,
            operationTimeoutMs: 5,
        });
        const context = { userId: "user-a", limit: 20, excludeProductIds: [] };
        const started = Date.now();

        const result = await withPersonalizedRecommendationCache({
            cache,
            context,
            compute: async () => healthy(),
        });

        expect(result).toEqual(healthy());
        expect(Date.now() - started).toBeLessThan(100);
    });

    test("bypasses Redis for anonymous requests", async () => {
        const cache = createRecommendationCache<Result>({
            client: {
                get: async () => {
                    throw new Error("must not read Redis");
                },
                set: async () => {
                    throw new Error("must not write Redis");
                },
                del: async () => 0,
            },
            parseResult,
        });

        expect(
            await withPersonalizedRecommendationCache({
                cache,
                context: { limit: 20, excludeProductIds: [] },
                compute: async () => healthy(),
            })
        ).toEqual(healthy());
    });
});
