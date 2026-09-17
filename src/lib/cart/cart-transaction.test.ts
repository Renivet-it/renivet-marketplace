import { expect, test } from "bun:test";
import { withCartTransactionLock } from "./cart-transaction";

test("acquires the cart transaction lock before mutating cart state", async () => {
    const events: string[] = [];
    const database = {
        transaction: async <T>(
            callback: (transaction: {
                execute: () => Promise<void>;
            }) => Promise<T>
        ) =>
            callback({
                execute: async () => {
                    events.push("lock");
                },
            }),
    };

    const result = await withCartTransactionLock(
        database,
        "user:product:variant",
        async () => {
            events.push("mutate");
            return "updated";
        }
    );

    expect(result).toBe("updated");
    expect(events).toEqual(["lock", "mutate"]);
});
