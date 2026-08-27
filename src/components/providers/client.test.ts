import { describe, expect, test } from "bun:test";

import { POSTHOG_INIT_DELAY_MS } from "./posthog-init-policy";

describe("PostHog initialization timing", () => {
    test("uses the approved short delay for early-visit capture", () => {
        expect(POSTHOG_INIT_DELAY_MS).toBeGreaterThanOrEqual(1000);
        expect(POSTHOG_INIT_DELAY_MS).toBeLessThanOrEqual(2000);
    });
});
