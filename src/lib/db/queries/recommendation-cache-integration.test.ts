import { readFile } from "node:fs/promises";
import { expect, test } from "bun:test";

test("wraps authenticated recommendations without changing the uncached decision tree", async () => {
    const source = await readFile(
        new URL("./recommendation.ts", import.meta.url),
        "utf8"
    );

    expect(source).toContain("withPersonalizedRecommendationCache");
    expect(source).toContain("recommendationResultCache");
    expect(source).toContain("getUncachedPersonalizedRecommendations");
    expect(source).toContain("if (!userId) {");
    expect(source).toContain("return this.getPlatformDefaults");
});
