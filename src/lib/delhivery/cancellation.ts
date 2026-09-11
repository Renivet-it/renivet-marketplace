export function buildCancellationPayload(waybill: string) {
    return { waybill, cancellation: "true" as const };
}

function statusText(value: unknown): string {
    if (!value || typeof value !== "object") return "";
    const record = value as Record<string, unknown>;
    return String(record.status ?? record.Status ?? "").trim().toLowerCase();
}

export function isExplicitCancellationSuccess(response: unknown): boolean {
    return ["success", "succeeded", "cancelled", "canceled"].includes(
        statusText(response)
    );
}

export function isTerminalCancellationStatus(status: unknown): boolean {
    return ["cancelled", "canceled", "returned"].includes(
        String(status ?? "").trim().toLowerCase()
    );
}

export interface CancellationEvidenceEvent {
    attemptId: string;
    phase: "request" | "verification";
    recordedAt: string;
    response: unknown;
}

export function appendCancellationEvidence(
    existing: unknown,
    event: CancellationEvidenceEvent
) {
    const current =
        existing && typeof existing === "object"
            ? (existing as Record<string, unknown>)
            : {};
    const reconciliation =
        current.cancellationReconciliation &&
        typeof current.cancellationReconciliation === "object"
            ? (current.cancellationReconciliation as Record<string, unknown>)
            : {};
    const events = Array.isArray(reconciliation.events)
        ? reconciliation.events
        : [];

    return {
        ...current,
        cancellationReconciliation: {
            version: 1,
            events: [...events, event].slice(-20),
        },
    };
}

export function extractDelhiveryShipmentStatus(response: unknown): string {
    if (!response || typeof response !== "object") return "";
    const root = response as Record<string, unknown>;
    const shipmentData = Array.isArray(root.ShipmentData)
        ? root.ShipmentData[0]
        : undefined;
    if (!shipmentData || typeof shipmentData !== "object") return "";
    const shipment = (shipmentData as Record<string, unknown>).Shipment;
    if (!shipment || typeof shipment !== "object") return "";
    const record = shipment as Record<string, unknown>;
    const status = record.Status;
    if (typeof status === "string") return status;
    if (status && typeof status === "object") {
        const nested = status as Record<string, unknown>;
        return String(nested.Status ?? nested.StatusType ?? "");
    }
    return "";
}
