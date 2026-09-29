import { describe, expect, test } from "bun:test";
import { runDelayedWhatsAppAlerts } from "./delayed-whatsapp-alerts";

type Row = {
    id: string;
    orderId: string;
    alertType: "unshipped_48h" | "undelivered_7d";
    phoneNumber: string;
    digestLine: string;
    status: "pending" | "sending" | "sent" | "failed";
};

function storeFactory() {
    const rows: Row[] = [];
    return {
        rows,
        async upsertPendingAlerts(values: Array<Omit<Row, "id" | "status">>) {
            for (const value of values) {
                if (!rows.some((row) => row.orderId === value.orderId && row.alertType === value.alertType && row.phoneNumber === value.phoneNumber)) {
                    rows.push({ ...value, id: `${rows.length + 1}`, status: "pending" });
                }
            }
        },
        async getRetryableAlerts({ alertType, phoneNumber }: { alertType: Row["alertType"]; phoneNumber: string }) {
            return rows.filter((row) => row.alertType === alertType && row.phoneNumber === phoneNumber && (row.status === "pending" || row.status === "failed"));
        },
        async claimPendingAlerts({ ids }: { ids: string[]; batchId?: string; now?: Date }) {
            return rows.filter((row) => ids.includes(row.id) && (row.status === "pending" || row.status === "failed")).map((row) => {
                row.status = "sending";
                return row;
            });
        },
        async markBatchSent({ ids }: { ids: string[]; batchId?: string; sid?: string; now?: Date }) {
            rows.filter((row) => ids.includes(row.id)).forEach((row) => { row.status = "sent"; });
        },
        async markBatchFailed({ ids }: { ids: string[]; batchId?: string; error?: string; now?: Date }) {
            rows.filter((row) => ids.includes(row.id)).forEach((row) => { row.status = "failed"; });
        },
    };
}

const candidates = [
    { orderId: "ORD-1", alertType: "unshipped_48h" as const, digestLine: "ORD-1 | Necklace | Qty 2 | Status processing" },
    { orderId: "ORD-2", alertType: "unshipped_48h" as const, digestLine: "ORD-2 | Bracelet | Qty 1 | Status processing" },
];

describe("delayed WhatsApp alert run", () => {
    test("aggregates multiple orders and fans out to three recipients", async () => {
        const store = storeFactory();
        const sends: Array<{ recipient: string; templateName: string; parameters: string[] }> = [];

        const result = await runDelayedWhatsAppAlerts({
            now: new Date("2026-09-29T17:00:00.000Z"),
            candidates,
            recipients: ["7001047092", "8983676772", "7356499350"],
            store,
            send: async (input) => {
                sends.push(input);
                return { sid: `SM-${sends.length}` };
            },
        });

        expect(sends).toHaveLength(3);
        expect(sends[0]?.templateName).toBe("delayed_fulfillment_digest_48h");
        expect(sends[0]?.parameters[0]).toContain("ORD-1");
        expect(sends[0]?.parameters[0]).toContain("ORD-2");
        expect(result.sent).toBe(6);
    });

    test("does not resend successful rows but retries failed batches", async () => {
        const store = storeFactory();
        let calls = 0;
        const first = await runDelayedWhatsAppAlerts({
            now: new Date("2026-09-29T17:00:00.000Z"),
            candidates: [candidates[0]!],
            recipients: ["7001047092"],
            store,
            send: async () => {
                calls += 1;
                throw new Error("Twilio unavailable");
            },
        });

        expect(first.failed).toBe(1);
        const second = await runDelayedWhatsAppAlerts({
            now: new Date("2026-09-30T17:00:00.000Z"),
            candidates: [candidates[0]!],
            recipients: ["7001047092"],
            store,
            send: async () => {
                calls += 1;
                return { sid: "SM-retry" };
            },
        });

        expect(second.sent).toBe(1);
        expect(calls).toBe(2);
    });
});
