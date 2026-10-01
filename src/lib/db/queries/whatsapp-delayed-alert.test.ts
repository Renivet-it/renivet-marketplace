import { describe, expect, test } from "bun:test";
import {
    buildDelayedAlertIdentity,
    isRetryableDelayedAlert,
} from "./whatsapp-delayed-alert";

describe("delayed WhatsApp alert persistence rules", () => {
    test("uses order, alert type, and normalized recipient as the unique identity", () => {
        expect(
            buildDelayedAlertIdentity({
                orderId: "ORD-1001",
                alertType: "unshipped_48h",
                phoneNumber: "+91 90000 00000",
            })
        ).toBe("ORD-1001:unshipped_48h:+919000000000");
    });

    test("only failed or never-attempted rows are retryable", () => {
        expect(isRetryableDelayedAlert({ status: "pending", attempts: 0 })).toBe(true);
        expect(isRetryableDelayedAlert({ status: "failed", attempts: 2 })).toBe(true);
        expect(isRetryableDelayedAlert({ status: "sent", attempts: 1 })).toBe(false);
        expect(isRetryableDelayedAlert({ status: "sending", attempts: 1 })).toBe(false);
    });
});
