import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "bun:test";

const requiredConsumers = [
    "src/components/home/beauty-personal/banner.tsx",
    "src/components/home/home-and-living/banner.tsx",
    "src/components/home/kids/banner.tsx",
    "src/components/home/men/banner.tsx",
    "src/components/home/women/banner.tsx",
    "src/components/home/new-home-page/mobile-categories.tsx",
    "src/components/home/landing.tsx",
];

describe("REN-221 category link inventory", () => {
    test("contains no legacy category query links in required home consumers", () => {
        const legacyLinks = requiredConsumers.flatMap((file) => {
            const source = readFileSync(resolve(process.cwd(), file), "utf8");
            return /\/shop\?(?:[^"']*&)?categoryId=/i.test(source)
                ? [file]
                : [];
        });

        expect(legacyLinks).toEqual([]);
    });
});
