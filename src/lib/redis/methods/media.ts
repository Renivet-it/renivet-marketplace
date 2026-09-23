import { db } from "@/lib/db";
import { brandMediaItemQueries } from "@/lib/db/queries";
import { brandMediaItems } from "@/lib/db/schema";
import { parseToJSON } from "@/lib/utils";
import {
    CachedBrandMediaItem,
    cachedBrandMediaItemSchema,
} from "@/lib/validations";
import { inArray } from "drizzle-orm";
import { redis } from "..";
import {
    MEDIA_CACHE_TTL_SECONDS,
    mediaCacheKey,
} from "./media-key";

class MediaCache {
    private async getAllKeys(pattern: string): Promise<string[]> {
        const keys: string[] = [];
        let cursor = "0";
        do {
            const [nextCursor, scanKeys] = await redis.scan(
                cursor,
                "MATCH",
                pattern,
                "COUNT",
                "1000"
            );
            cursor = nextCursor;
            keys.push(...scanKeys);
        } while (cursor !== "0");
        return keys;
    }

    async getAll(brandId?: string) {
        const keyPattern = brandId ? `media:*:${brandId}` : "media:*";

        const [dbMediaCount, keys] = await Promise.all([
            brandMediaItemQueries.getCount(brandId),
            this.getAllKeys(keyPattern),
        ]);
        if (keys.length !== dbMediaCount) {
            await this.drop();

            const dbMediaItems =
                await brandMediaItemQueries.getBrandMediaItemsByBrand(brandId);
            if (dbMediaItems.count === 0) return { data: [], count: 0 };

            await this.addBulk(dbMediaItems.data);
            return dbMediaItems;
        }
        if (!keys.length) return { data: [], count: 0 };

        const cachedMediaItems = await redis.mget(...keys);
        const parsed = cachedBrandMediaItemSchema
            .array()
            .parse(
                cachedMediaItems
                    .map((media) => parseToJSON<CachedBrandMediaItem>(media))
                    .filter(
                        (media): media is CachedBrandMediaItem => media !== null
                    )
            )
            .sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
            );

        if (parsed.length !== dbMediaCount) {
            const dbMediaItems =
                await brandMediaItemQueries.getBrandMediaItemsByBrand(brandId);
            if (dbMediaItems.count > 0) await this.addBulk(dbMediaItems.data);
            return dbMediaItems;
        }

        return {
            data: parsed,
            count: parsed.length,
        };
    }

    async getByExactKeys(keys: string[]) {
        if (keys.length === 0) return { data: [], count: 0 };

        const cachedMediaItems = await redis.mget(...keys);
        const mediaItems: CachedBrandMediaItem[] = [];
        const missingIds: string[] = [];
        // Parse Redis results
        for (let i = 0; i < cachedMediaItems.length; i++) {
            const cached = parseToJSON<CachedBrandMediaItem>(cachedMediaItems[i]);
            if (cached) {
                mediaItems.push(cached);
            } else {
                const parts = keys[i].split(":");
                if (parts.length >= 2) {
                    missingIds.push(parts[1]);
                }
            }
        }
        // Fetch missing media from DB only
        if (missingIds.length > 0) {
            const dbMediaItems = await brandMediaItemQueries.getBrandMediaItemsByIds(missingIds);
            if (dbMediaItems.count > 0) {
                mediaItems.push(...dbMediaItems.data);
                // Add missing items back to Redis cache
                await this.addBulk(dbMediaItems.data);
            }
        }
        // Sort by createdAt (same as before)
        mediaItems.sort(
            (a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        return {
            data: mediaItems,
            count: mediaItems.length,
        };
    }

    async getByIds(ids: string[]) {
        if (ids.length === 0) return { data: [], count: 0 };

        const dbMediaItems = await brandMediaItemQueries.getBrandMediaItemsByIds(ids);
        const dbMediaById = new Map(
            dbMediaItems.data.map((mediaItem) => [mediaItem.id, mediaItem])
        );
        const cacheableItems = ids
            .map((id) => dbMediaById.get(id))
            .filter((item): item is CachedBrandMediaItem => Boolean(item));
        const keys = cacheableItems.map((item) => mediaCacheKey(item.id, item.brandId));
        if (keys.length === 0) return dbMediaItems;

        const cachedMediaItems = await redis.mget(...keys);
        const mediaItems: CachedBrandMediaItem[] = [];
        const missingItems: CachedBrandMediaItem[] = [];
        // Parse Redis results
        for (let i = 0; i < cachedMediaItems.length; i++) {
            const cached = parseToJSON<CachedBrandMediaItem>(cachedMediaItems[i]);
            if (cached) {
                mediaItems.push(cached);
            } else {
                const missingItem = cacheableItems[i];
                if (missingItem) missingItems.push(missingItem);
            }
        }
        if (missingItems.length > 0) {
            mediaItems.push(...missingItems);
            await this.addBulk(missingItems);
        }
        // Sort by createdAt (same as before)
        mediaItems.sort(
            (a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        return {
            data: mediaItems,
            count: mediaItems.length,
        };
    }

    async get(id: string, brandId?: string) {
        const dbMediaItem = brandId
            ? null
            : await brandMediaItemQueries.getBrandMediaItem(id);
        const resolvedBrandId = brandId ?? dbMediaItem?.brandId;
        if (!resolvedBrandId) return null;

        const cachedMediaItemRaw = await redis.get(
            mediaCacheKey(id, resolvedBrandId)
        );
        let cachedMediaItem = cachedBrandMediaItemSchema
            .nullable()
            .parse(parseToJSON<CachedBrandMediaItem>(cachedMediaItemRaw));

        if (!cachedMediaItem) {
            const fallbackMediaItem =
                dbMediaItem ?? (await brandMediaItemQueries.getBrandMediaItem(id));
            if (!fallbackMediaItem) return null;

            cachedMediaItem = cachedBrandMediaItemSchema.parse(fallbackMediaItem);
            await this.add(cachedMediaItem);
        }

        return cachedMediaItem;
    }

    async add(mediaItem: CachedBrandMediaItem) {
        await redis.set(
            mediaCacheKey(mediaItem.id, mediaItem.brandId),
            JSON.stringify(mediaItem),
            "EX",
            MEDIA_CACHE_TTL_SECONDS
        );
    }

    async addBulk(mediaItems: CachedBrandMediaItem[]) {
        const pipe = redis.pipeline();
        mediaItems.forEach((mediaItem) => {
            pipe.set(
                mediaCacheKey(mediaItem.id, mediaItem.brandId),
                JSON.stringify(mediaItem),
                "EX",
                MEDIA_CACHE_TTL_SECONDS
            );
        });

        await pipe.exec();
    }

    async remove(id: string, brandId?: string) {
        const mediaItem = brandId
            ? { brandId }
            : await brandMediaItemQueries.getBrandMediaItem(id);
        if (!mediaItem) return 0;
        return await redis.del(mediaCacheKey(id, mediaItem.brandId));
    }

    async drop(brandId?: string) {
        const keyPattern = brandId ? `media:*:${brandId}` : "media:*";
        const keys = await this.getAllKeys(keyPattern);
        if (!keys.length) return 0;

        return await redis.del(...keys);
    }
}

export const mediaCache = new MediaCache();
