import { afterEach, describe, expect, test } from "bun:test";
import {
    createBestEffortRedis,
    withRedisObservation,
} from "./connection-policy";

const originalInfo = console.info;

afterEach(() => {
    console.info = originalInfo;
});

describe("Redis command observability", () => {
    test("aggregates direct command families inside an AsyncLocalStorage scope", async () => {
        const logs: unknown[] = [];
        console.info = ((...args: unknown[]) => logs.push(args[1])) as typeof console.info;
        const client = {
            get: async () => "value",
            del: async () => 1,
        } as never;
        const cacheRedis = createBestEffortRedis(client);

        await withRedisObservation("cart.get", async () => {
            await cacheRedis.get("secret-key");
            await cacheRedis.del("secret-key");
        });

        expect(logs).toEqual([
            expect.objectContaining({
                route: "cart.get",
                commandCounts: { get: 1, del: 1 },
            }),
        ]);
        expect(JSON.stringify(logs)).not.toContain("secret-key");
    });

    test("counts each registered pipeline command and excludes pipeline and exec", async () => {
        const logs: unknown[] = [];
        console.info = ((...args: unknown[]) => logs.push(args[1])) as typeof console.info;
        const pipeline = {
            set: () => pipeline,
            del: () => pipeline,
            exec: async () => [[null, "OK"], [null, 1]],
        };
        const cacheRedis = createBestEffortRedis({ pipeline: () => pipeline } as never);

        await withRedisObservation("media.addBulk", async () => {
            await cacheRedis.pipeline().set("k1", "v1").del("k2").exec();
        });

        expect(logs).toEqual([
            expect.objectContaining({
                commandCounts: { set: 1, del: 1 },
                unconfirmedCommandCounts: {},
            }),
        ]);
    });

    test("records registered commands as unconfirmed when exec rejects", async () => {
        const logs: unknown[] = [];
        console.info = ((...args: unknown[]) => logs.push(args[1])) as typeof console.info;
        const pipeline = {
            hgetall: () => pipeline,
            exec: async () => {
                throw new Error("contains secret payload");
            },
        };
        const cacheRedis = createBestEffortRedis({ pipeline: () => pipeline } as never);

        await withRedisObservation("analytics.retrieve", async () => {
            await cacheRedis.pipeline().hgetall("private-key").exec();
        });

        expect(logs).toEqual([
            expect.objectContaining({
                commandCounts: {},
                unconfirmedCommandCounts: { hgetall: 1 },
            }),
        ]);
        expect(JSON.stringify(logs)).not.toContain("private-key");
        expect(JSON.stringify(logs)).not.toContain("secret payload");
    });

    test("observability cannot change a Redis result when instrumentation fails", async () => {
        const client = {
            get: async () => "value",
        } as never;
        const cacheRedis = createBestEffortRedis(client);

        await expect(
            withRedisObservation("cart.get", async () => cacheRedis.get("key"))
        ).resolves.toBe("value");
    });
});
