import { AsyncLocalStorage } from "node:async_hooks";
import type { RedisOptions } from "ioredis";

const MAX_CONNECTION_RETRIES = 3;

export const getRedisOptions = (): RedisOptions => ({
    connectTimeout: 5000,
    maxRetriesPerRequest: 1,
    retryStrategy: (attempt) =>
        attempt > MAX_CONNECTION_RETRIES ? undefined : attempt * 100,
});

type CommandCounts = Record<string, number>;

interface RedisObservation {
    route: string;
    cacheDomain: string;
    hitMiss: "unknown" | "hit" | "miss";
    commandCounts: CommandCounts;
    unconfirmedCommandCounts: CommandCounts;
}

const observationStorage = new AsyncLocalStorage<RedisObservation>();

const increment = (counts: CommandCounts, command: string, amount = 1) => {
    const family = command.toLowerCase();
    counts[family] = (counts[family] ?? 0) + amount;
};

const sanitizedError = (error: unknown) => ({
    type: error instanceof Error ? error.name : typeof error,
});

export const withRedisObservation = async <T>(
    route: string,
    operation: () => Promise<T>,
    metadata: Pick<Partial<RedisObservation>, "cacheDomain" | "hitMiss"> = {}
) => {
    const observation: RedisObservation = {
        route,
        cacheDomain: metadata.cacheDomain ?? route.split(".")[0] ?? "unknown",
        hitMiss: metadata.hitMiss ?? "unknown",
        commandCounts: {},
        unconfirmedCommandCounts: {},
    };

    return observationStorage.run(observation, async () => {
        try {
            return await operation();
        } finally {
            console.info("Redis command aggregate", {
                route: observation.route,
                cacheDomain: observation.cacheDomain,
                hitMiss: observation.hitMiss,
                commandCounts: observation.commandCounts,
                unconfirmedCommandCounts: observation.unconfirmedCommandCounts,
                env: process.env.NODE_ENV ?? "unknown",
                deploymentId: process.env.VERCEL_DEPLOYMENT_ID ?? "unknown",
            });
        }
    });
};

const fallbackFor = (command: string, args: unknown[] = []) => {
    switch (command) {
        case "get":
            return null;
        case "mget":
            return args.map(() => null);
        case "keys":
        case "smembers":
            return [];
        case "scan":
            return ["0", []];
        case "hgetall":
            return {};
        case "set":
            return "OK";
        case "del":
        case "incr":
        case "rpush":
        case "sadd":
        case "srem":
        case "expire":
            return 0;
        default:
            return null;
    }
};

export const createBestEffortRedis = <T extends Record<string, unknown>>(
    client: T
): T => createRedisProxy(client, true);

export const createObservabilityRedis = <T extends Record<string, unknown>>(
    client: T
): T => createRedisProxy(client, false);

const createRedisProxy = <T extends Record<string, unknown>>(
    client: T,
    bestEffort: boolean
): T =>
    new Proxy(client, {
        get(target, property, receiver) {
            const value = Reflect.get(target, property, receiver);
            if (typeof value !== "function") return value;

            return (...args: unknown[]) => {
                const command = String(property);
                const observation = observationStorage.getStore();
                const result = value.apply(target, args);

                if (command === "pipeline" && result) {
                    const pending: CommandCounts = {};
                    const pipelineProxy = new Proxy(result, {
                        get(pipeline, pipelineProperty, pipelineReceiver) {
                            const pipelineValue = Reflect.get(
                                pipeline,
                                pipelineProperty,
                                pipelineReceiver
                            );
                            if (typeof pipelineValue !== "function") {
                                return pipelineValue;
                            }

                            return (...pipelineArgs: unknown[]) => {
                                if (pipelineProperty !== "exec" && observation) {
                                    increment(pending, String(pipelineProperty));
                                }

                                const pipelineResult = pipelineValue.apply(
                                    pipeline,
                                    pipelineArgs
                                );
                                if (pipelineProperty !== "exec") {
                                    return pipelineResult === pipeline
                                        ? pipelineProxy
                                        : pipelineResult;
                                }

                                if (!pipelineResult || typeof pipelineResult.then !== "function") {
                                    return pipelineResult;
                                }

                                return pipelineResult.then(
                                    (resolved: unknown) => {
                                        if (observation) {
                                            for (const [family, count] of Object.entries(pending)) {
                                                increment(observation.commandCounts, family, count);
                                            }
                                        }
                                        return resolved;
                                    },
                                    (error: unknown) => {
                                        if (observation) {
                                            for (const [family, count] of Object.entries(pending)) {
                                                increment(
                                                    observation.unconfirmedCommandCounts,
                                                    family,
                                                    count
                                                );
                                            }
                                        }
                                        if (!bestEffort) throw error;
                                        console.error(
                                            "Redis cache pipeline failed",
                                            sanitizedError(error)
                                        );
                                        return [];
                                    }
                                );
                            };
                        },
                    });
                    return pipelineProxy;
                }

                if (observation && command !== "pipeline" && command !== "exec") {
                    increment(observation.commandCounts, command);
                }
                if (!result || typeof result.then !== "function" || !bestEffort) {
                    return result;
                }

                return result.catch((error: unknown) => {
                    console.error(
                        `Redis cache command failed: ${command}`,
                        sanitizedError(error)
                    );
                    return fallbackFor(command, args);
                });
            };
        },
    }) as T;
