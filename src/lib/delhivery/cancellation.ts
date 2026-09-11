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
