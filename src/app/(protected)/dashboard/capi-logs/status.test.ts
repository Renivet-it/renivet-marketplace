import { readFile } from "node:fs/promises";
import { expect, test } from "bun:test";
import { getCapiLogDisplay } from "./status";

test("maps typed CAPI outcomes to operator labels", () => {
    expect(
        getCapiLogDisplay("success", { version: 1, outcome: "accepted" })
    ).toEqual({ label: "Accepted", variant: "default" });
    expect(
        getCapiLogDisplay("failed", {
            version: 1,
            outcome: "provider_rejected",
        })
    ).toEqual({ label: "Provider rejected", variant: "destructive" });
    expect(
        getCapiLogDisplay("failed", { version: 1, outcome: "timed_out" })
    ).toEqual({ label: "Timed out/unknown", variant: "secondary" });
    expect(
        getCapiLogDisplay("failed", { version: 1, outcome: "transport_error" })
    ).toEqual({ label: "Transport error", variant: "destructive" });
    expect(
        getCapiLogDisplay("failed", { version: 1, outcome: "invalid_response" })
    ).toEqual({ label: "Invalid response", variant: "destructive" });
});

test("keeps pending and legacy CAPI logs distinguishable", () => {
    expect(
        getCapiLogDisplay("pending", { version: 1, outcome: "pending" })
    ).toEqual({ label: "Pending/unknown", variant: "secondary" });
    expect(getCapiLogDisplay("success", { events_received: 1 })).toEqual({
        label: "Legacy success",
        variant: "default",
    });
    expect(getCapiLogDisplay("failed", { message: "old error" })).toEqual({
        label: "Legacy failed",
        variant: "destructive",
    });
});

test("dashboard CSV uses projected status and preserves raw response JSON", async () => {
    const pageSource = await readFile(
        new URL("./page.tsx", import.meta.url),
        "utf8"
    );
    expect(pageSource).toContain(
        "getCapiLogDisplay(log.status, log.response).label"
    );
    expect(pageSource).toContain("JSON.stringify(log.response ?? null)");
});
