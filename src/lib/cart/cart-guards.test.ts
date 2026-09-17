import { expect, test } from "bun:test";
import { createSingleFlightGuard, hasCartStock } from "./cart-guards";

test("allows adding the final available unit", () => {
    expect(
        hasCartStock({
            stock: 1,
            existingQuantity: 0,
            requestedQuantity: 1,
        })
    ).toBe(true);
});

test("rejects a cart quantity that would exceed available stock", () => {
    expect(
        hasCartStock({
            stock: 1,
            existingQuantity: 1,
            requestedQuantity: 1,
        })
    ).toBe(false);
});

test("single-flight guard ignores a second quick-add while the first is pending", async () => {
    const guard = createSingleFlightGuard();
    let release!: () => void;
    let calls = 0;
    const pending = new Promise<void>((resolve) => {
        release = resolve;
    });

    const first = guard.run(async () => {
        calls += 1;
        await pending;
        return "added";
    });
    const second = guard.run(async () => {
        calls += 1;
        return "duplicate";
    });

    expect(await second).toBeUndefined();
    expect(calls).toBe(1);

    release();
    expect(await first).toBe("added");
});
