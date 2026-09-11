const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

export function getEmbeddingServiceOrigin(): URL | null {
    const configured = process.env.EMBEDDING_SERVICE_URL?.trim();
    if (!configured) return null;

    try {
        const origin = new URL(configured);
        const appEnv = process.env.APP_ENV;
        const isLocalDevelopment =
            process.env.NODE_ENV !== "production" &&
            (!appEnv || appEnv === "development");
        const isLoopbackHttp =
            origin.protocol === "http:" &&
            LOOPBACK_HOSTS.has(origin.hostname) &&
            isLocalDevelopment;

        if (origin.protocol !== "https:" && !isLoopbackHttp) return null;
        if (
            origin.username ||
            origin.password ||
            origin.pathname !== "/" ||
            origin.search ||
            origin.hash
        ) return null;

        return origin;
    } catch {
        return null;
    }
}

export function buildEmbeddingServiceUrl(path: string): URL | null {
    const origin = getEmbeddingServiceOrigin();
    if (!origin) return null;
    return new URL(path.replace(/^\/+/, ""), origin);
}

export function requireEmbeddingServiceUrl(path: string): string {
    const url = buildEmbeddingServiceUrl(path);
    if (!url) throw new Error("Embedding service is not configured");
    return url.toString();
}
