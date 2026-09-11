import { createHash } from "node:crypto";

export const RECOMMENDATION_CACHE_TTL_SECONDS = 180;
const RECOMMENDATION_CACHE_VERSION = 1;
const DEFAULT_OPERATION_TIMEOUT_MS = 100;

export type RecommendationCacheContext = {
    userId?: string;
    limit: number;
    excludeProductIds: string[];
};

type CacheableRecommendationResult = {
    products: unknown[];
    source: string;
};

export type RedisCacheClient = {
    get(key: string): Promise<string | null> | string | null;
    set(
        key: string,
        value: string,
        mode: "EX",
        ttlSeconds: number
    ): Promise<unknown> | unknown;
    del(key: string): Promise<unknown> | unknown;
};

type CacheEnvelope<T> = {
    version: number;
    ownerUserId: string;
    contextFingerprint: string;
    result: T;
};

const globalInFlight = new Map<string, Promise<unknown>>();

export function createRecommendationContextFingerprint(
    context: RecommendationCacheContext
) {
    const exclusions = [...new Set(context.excludeProductIds)].sort();
    return createHash("sha256")
        .update(
            JSON.stringify({
                userId: context.userId ?? null,
                limit: context.limit,
                exclusions,
            })
        )
        .digest("hex");
}

async function withinBudget<T>(
    operation: () => Promise<T> | T,
    timeoutMs: number,
    fallback: T
): Promise<T> {
    try {
        return await Promise.race([
            Promise.resolve().then(operation),
            new Promise<T>((resolve) =>
                setTimeout(() => resolve(fallback), timeoutMs)
            ),
        ]);
    } catch {
        return fallback;
    }
}

export function createRecommendationCache<T>({
    client,
    parseResult,
    operationTimeoutMs = DEFAULT_OPERATION_TIMEOUT_MS,
}: {
    client: RedisCacheClient;
    parseResult: (value: unknown) => T | null;
    operationTimeoutMs?: number;
}) {
    const key = (context: RecommendationCacheContext) =>
        `recommendation:v${RECOMMENDATION_CACHE_VERSION}:${createRecommendationContextFingerprint(context)}`;

    return {
        key,
        async get(context: RecommendationCacheContext): Promise<T | null> {
            if (!context.userId) return null;
            const cacheKey = key(context);
            const raw = await withinBudget(
                () => client.get(cacheKey),
                operationTimeoutMs,
                null
            );
            if (!raw) return null;

            try {
                const envelope = JSON.parse(raw) as Partial<
                    CacheEnvelope<unknown>
                >;
                const fingerprint =
                    createRecommendationContextFingerprint(context);
                if (
                    envelope.version !== RECOMMENDATION_CACHE_VERSION ||
                    envelope.ownerUserId !== context.userId ||
                    envelope.contextFingerprint !== fingerprint
                ) {
                    await withinBudget(
                        () => client.del(cacheKey),
                        operationTimeoutMs,
                        0
                    );
                    return null;
                }

                const result = parseResult(envelope.result);
                if (result) return result;
            } catch {
                // Invalid Redis data is a cache miss.
            }

            await withinBudget(
                () => client.del(cacheKey),
                operationTimeoutMs,
                0
            );
            return null;
        },
        async set(context: RecommendationCacheContext, result: T) {
            if (!context.userId) return;
            const contextFingerprint =
                createRecommendationContextFingerprint(context);
            const envelope: CacheEnvelope<T> = {
                version: RECOMMENDATION_CACHE_VERSION,
                ownerUserId: context.userId,
                contextFingerprint,
                result,
            };
            await withinBudget(
                () =>
                    client.set(
                        key(context),
                        JSON.stringify(envelope),
                        "EX",
                        RECOMMENDATION_CACHE_TTL_SECONDS
                    ),
                operationTimeoutMs,
                null
            );
        },
    };
}

export async function withPersonalizedRecommendationCache<
    T extends CacheableRecommendationResult,
>({
    cache,
    context,
    compute,
    inFlight = globalInFlight as Map<string, Promise<T>>,
}: {
    cache: ReturnType<typeof createRecommendationCache<T>>;
    context: RecommendationCacheContext;
    compute: () => Promise<T>;
    inFlight?: Map<string, Promise<T>>;
}): Promise<T> {
    if (!context.userId) return compute();

    const cached = await cache.get(context);
    if (cached) return cached;

    const cacheKey = cache.key(context);
    const running = inFlight.get(cacheKey);
    if (running) return running;

    const computation = (async () => {
        const result = await compute();
        if (
            result.source !== "platform_defaults" &&
            result.products.length >= 5
        ) {
            await cache.set(context, result);
        }
        return result;
    })();

    inFlight.set(cacheKey, computation);
    try {
        return await computation;
    } finally {
        inFlight.delete(cacheKey);
    }
}
