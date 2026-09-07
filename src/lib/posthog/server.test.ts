import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "bun:test";

const posthogDirectory = resolve(import.meta.dir);

describe("PostHog server client naming", () => {
    test("keeps the posthog-node client in server.ts", () => {
        const serverClientPath = resolve(posthogDirectory, "server.ts");
        const legacyClientPath = resolve(posthogDirectory, "client.tsx");

        expect(existsSync(serverClientPath)).toBe(true);
        expect(existsSync(legacyClientPath)).toBe(false);
        expect(readFileSync(serverClientPath, "utf8")).toContain('from "posthog-node"');
    });
});
