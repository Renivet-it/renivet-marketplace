export type CapiLogDisplay = {
    label: string;
    variant: "default" | "secondary" | "destructive";
};

type CapiLogResponse = {
    version?: unknown;
    outcome?: unknown;
};

const typedLabels: Record<string, CapiLogDisplay> = {
    accepted: { label: "Accepted", variant: "default" },
    provider_rejected: { label: "Provider rejected", variant: "destructive" },
    timed_out: { label: "Timed out/unknown", variant: "secondary" },
    transport_error: { label: "Transport error", variant: "destructive" },
    invalid_response: { label: "Invalid response", variant: "destructive" },
    pending: { label: "Pending/unknown", variant: "secondary" },
};

export function getCapiLogDisplay(
    status: string,
    response: unknown
): CapiLogDisplay {
    if (status === "pending") return typedLabels.pending;

    const typedResponse =
        response && typeof response === "object"
            ? (response as CapiLogResponse)
            : undefined;
    if (
        typedResponse?.version === 1 &&
        typeof typedResponse.outcome === "string"
    ) {
        return (
            typedLabels[typedResponse.outcome] ?? {
                label:
                    status === "success" ? "Legacy success" : "Legacy failed",
                variant: status === "success" ? "default" : "destructive",
            }
        );
    }

    return status === "success"
        ? { label: "Legacy success", variant: "default" }
        : { label: "Legacy failed", variant: "destructive" };
}
