import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "bun:test";

const homePageSource = readFileSync(
    resolve(process.cwd(), "src/app/(home)/page.tsx"),
    "utf8"
);

describe("home page festive section", () => {
    test("does not render the standalone festive catalogue on the home page", () => {
        expect(homePageSource).not.toContain("<FestiveSeasonFetch");
        expect(homePageSource).not.toContain("async function FestiveSeasonFetch");
        expect(homePageSource).not.toContain("const FestiveSeason = dynamic(");
    });
});
