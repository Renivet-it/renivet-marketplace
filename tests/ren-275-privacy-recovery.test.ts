import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

test("REN-275 brand projections do not derive employee codes from names", async () => {
    const source = await readFile("src/lib/services/corporate-platform.ts", "utf8");
    const method = source.slice(
        source.indexOf("private maskEmployeeName"),
        source.indexOf("private async requireBrandMembership")
    );
    expect(method).not.toContain("createHash");
    expect(method).toContain("randomUUID");
});

test("REN-275 failure handling records explicit recovery vocabulary", async () => {
    const source = await readFile(
        "src/lib/services/corporate-recovery-state.ts",
        "utf8"
    );
    expect(source).toContain("recovery_required");
    expect(source).toContain("failed_closed");
});

test("REN-275 recovery state fails closed unless retry is explicitly allowed", async () => {
    const { resolveCorporateRecoveryState } = await import(
        "../src/lib/services/corporate-recovery-state"
    );
    expect(resolveCorporateRecoveryState({ succeeded: true })).toBe("completed");
    expect(
        resolveCorporateRecoveryState({ succeeded: false, retryable: true })
    ).toBe("recovery_required");
    expect(resolveCorporateRecoveryState({ succeeded: false })).toBe("failed_closed");
});
