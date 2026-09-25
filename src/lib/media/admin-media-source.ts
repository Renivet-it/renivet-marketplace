interface AdminMediaProxyOptions {
    width?: number;
    quality?: number;
}

export function getAdminMediaProxyUrl(
    mediaId: string,
    { width = 480, quality = 70 }: AdminMediaProxyOptions = {}
) {
    const params = new URLSearchParams({
        w: String(width),
        q: String(quality),
    });
    return `/api/admin/media/${encodeURIComponent(mediaId)}?${params}`;
}

export function getUploadThingFileKey(rawUrl: string) {
    try {
        const url = new URL(rawUrl);
        const isUploadThingHost =
            url.hostname === "utfs.io" || url.hostname.endsWith(".ufs.sh");
        if (!isUploadThingHost) return null;

        const parts = url.pathname.split("/").filter(Boolean);
        if (parts[0] === "f" && parts[1]) {
            return decodeURIComponent(parts.slice(1).join("/"));
        }
        if (parts[0] === "a" && parts[1] && parts[2]) {
            return decodeURIComponent(parts.slice(2).join("/"));
        }
        return null;
    } catch {
        return null;
    }
}
