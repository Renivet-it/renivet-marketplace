export function getAdminMediaProxyUrl(mediaId: string) {
    return `/api/admin/media/${encodeURIComponent(mediaId)}`;
}
