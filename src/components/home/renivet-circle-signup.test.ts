import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

test("Renivet Circle signup includes the approved desktop layout", () => {
    const source = readFileSync(
        "src/components/home/renivet-circle-signup.tsx",
        "utf8"
    );

    expect(source).toContain("md:max-w-[1180px]");
    expect(source).toContain("md:grid-cols-[0.85fr_1.15fr]");
    expect(source).toContain("md:border-l");
    expect(source).toContain("Join the Renivet circle");
});
