const DEFAULT_REDIRECT = "/";

export function getSafeRedirectUrl(value: string | null | undefined): string {
    if (!value || !value.startsWith("/") || value.startsWith("//")) {
        return DEFAULT_REDIRECT;
    }

    if (/^[\s\S]*[\\\u0000-\u001f\u007f]/.test(value)) {
        return DEFAULT_REDIRECT;
    }

    try {
        const decoded = decodeURIComponent(value);
        if (
            decoded.startsWith("//") ||
            decoded.includes("\\") ||
            /[\u0000-\u001f\u007f]/.test(decoded)
        ) {
            return DEFAULT_REDIRECT;
        }
        const parsed = new URL(value, "https://renivet.invalid");
        if (parsed.origin !== "https://renivet.invalid") return DEFAULT_REDIRECT;
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
        return DEFAULT_REDIRECT;
    }
}

export function buildAuthRedirectUrl(destination: string): string {
    return `/auth/signin?redirect_url=${encodeURIComponent(getSafeRedirectUrl(destination))}`;
}
