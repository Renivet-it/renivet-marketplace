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

        return {
            data: parsed,
            count: parsed.length,
        };
    }

    async getByIds(ids: string[]) {
        if (ids.length === 0) return { data: [], count: 0 };

        const keys = ids.map((id) => `media:${id}:*`);
        const cachedMediaItems = await redis.mget(...keys);
        const mediaItems: CachedBrandMediaItem[] = [];
        const missingIds: string[] = [];
        // Parse Redis results
        for (let i = 0; i < cachedMediaItems.length; i++) {
            const cached = parseToJSON<CachedBrandMediaItem>(cachedMediaItems[i]);
            if (cached) {
                mediaItems.push(cached);
            } else {
                missingIds.push(ids[i]);
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

    async get(id: string) {
        const cachedMediaItemRaw = await redis.get(`media:${id}`);
        let cachedMediaItem = cachedBrandMediaItemSchema
            .nullable()
            .parse(parseToJSON<CachedBrandMediaItem>(cachedMediaItemRaw));

        if (!cachedMediaItem) {
            const dbMediaItem =
                await brandMediaItemQueries.getBrandMediaItem(id);
            if (!dbMediaItem) return null;

            cachedMediaItem = cachedBrandMediaItemSchema.parse(dbMediaItem);
            await this.add(cachedMediaItem);
        }

        return cachedMediaItem;
    }

    async add(mediaItem: CachedBrandMediaItem) {
        await redis.set(
            `media:${mediaItem.id}:${mediaItem.brandId}`,
            JSON.stringify(mediaItem)
        );
    }

    async addBulk(mediaItems: CachedBrandMediaItem[]) {
        const pipe = redis.pipeline();
        mediaItems.forEach((mediaItem) => {
            pipe.set(
                `media:${mediaItem.id}:${mediaItem.brandId}`,
                JSON.stringify(mediaItem)
            );
        });

        await pipe.exec();
    }

    async remove(id: string) {
        return await redis.del(`media:${id}`);
    }

    async drop(brandId?: string) {
        const keyPattern = brandId ? `media:*:${brandId}` : "media:*";
        const keys = await this.getAllKeys(keyPattern);
        if (!keys.length) return 0;

        return await redis.del(...keys);
    }
}

export const mediaCache = new MediaCache();
