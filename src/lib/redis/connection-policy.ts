import type { RedisOptions } from "ioredis";

const MAX_CONNECTION_RETRIES = 3;

export const getRedisOptions = (): RedisOptions => ({
    connectTimeout: 5000,
    maxRetriesPerRequest: 1,
    retryStrategy: (attempt) =>
        attempt > MAX_CONNECTION_RETRIES ? undefined : attempt * 100,
});

const fallbackFor = (command: string) => {
    switch (command) {
        case "get":
            return null;
        case "mget":
        case "keys":
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
            return 0;
        default:
            return null;
    }
};

export const createBestEffortRedis = <T extends Record<string, unknown>>(
    client: T
): T =>
    new Proxy(client, {
        get(target, property, receiver) {
            const value = Reflect.get(target, property, receiver);
            if (typeof value !== "function") return value;

            return (...args: unknown[]) => {
                const command = String(property);
                const result = value.apply(target, args);
                if (command === "pipeline" && result) {
                    return new Proxy(result, {
                        get(pipeline, pipelineProperty, pipelineReceiver) {
                            const pipelineValue = Reflect.get(
                                pipeline,
                                pipelineProperty,
                                pipelineReceiver
                            );
                            if (
                                pipelineProperty !== "exec" ||
                                typeof pipelineValue !== "function"
                            ) {
                                return pipelineValue;
                            }

                            return (...pipelineArgs: unknown[]) => {
                                const execResult = pipelineValue.apply(
                                    pipeline,
                                    pipelineArgs
                                );
                                return execResult.catch((error: unknown) => {
                                    console.error(
                                        "Redis cache pipeline failed",
                                        error
                                    );
                                    return [];
                                });
                            };
                        },
                    });
                }
                if (!result || typeof result.then !== "function") return result;

                return result.catch((error: unknown) => {
                    console.error(`Redis cache command failed: ${command}`, error);
                    return fallbackFor(command);
                });
            };
        },
    }) as T;
