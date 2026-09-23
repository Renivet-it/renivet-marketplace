import { describe, expect, test } from "bun:test";
import {
    MEDIA_CACHE_TTL_SECONDS,
    mediaCacheKey,
} from "./media-key";

describe("media cache key contract", () => {
    test("uses the canonical id and brand scoped key", () => {
        expect(mediaCacheKey("media-1", "brand-1")).toBe(
            "media:media-1:brand-1"
        );
        expect(mediaCacheKey("media-1", "brand-1")).not.toContain("*");
    });

    test("uses a one-day safety TTL for editable media", () => {
        expect(MEDIA_CACHE_TTL_SECONDS).toBe(60 * 60 * 24);
    });
});
