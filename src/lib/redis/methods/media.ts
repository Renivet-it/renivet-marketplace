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
    async getAll(brandId?: string) {
        const keyNames = brandId ? `media:*:${brandId}` : "media:*";

        const [dbMediaCount, keys] = await Promise.all([
            brandMediaItemQueries.getCount(brandId),
            redis.keys(keyNames),
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
        const keys = ids.map((id) => `media:${id}:*`);
        if (keys.length === 0) return { data: [], count: 0 };

        const [dbMediaCount, cachedMediaItems] = await Promise.all([
            db.$count(brandMediaItems, inArray(brandMediaItems.id, ids)),
            redis.mget(...keys),
        ]);

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
            await this.drop();

            const dbMediaItems =
                await brandMediaItemQueries.getBrandMediaItemsByIds(ids);
            if (dbMediaItems.count === 0) return { data: [], count: 0 };

            await this.addBulk(dbMediaItems.data);
            return dbMediaItems;
        }

        return {
            data: parsed,
            count: parsed.length,
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
        const keyNames = brandId ? `media:*:${brandId}` : "media:*";
        const keys = await redis.keys(keyNames);
        if (!keys.length) return 0;

        return await redis.del(...keys);
    }
}

export const mediaCache = new MediaCache();
