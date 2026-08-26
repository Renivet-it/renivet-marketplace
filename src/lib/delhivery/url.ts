const PRODUCTION_DELHIVERY_BASE_URL = "https://track.delhivery.com";

export function resolveDelhiveryUrl(
    configuredBaseUrl: string | undefined,
    endpointPath: string
): string {
    const rawBaseUrl = configuredBaseUrl?.trim();
    const baseUrl = rawBaseUrl || PRODUCTION_DELHIVERY_BASE_URL;

    let parsed: URL;
    try {
        parsed = new URL(baseUrl);
    } catch {
        throw new Error("Invalid DELHIVERY_BASE_URL");
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new Error("Invalid DELHIVERY_BASE_URL");
    }

    const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
    return `${normalizedBaseUrl}/${endpointPath.replace(/^\/+/, "")}`;
}
