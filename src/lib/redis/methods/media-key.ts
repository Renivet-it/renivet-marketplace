export const MEDIA_CACHE_TTL_SECONDS = 60 * 60 * 24;

export const mediaCacheKey = (id: string, brandId: string) =>
    `media:${id}:${brandId}`;
