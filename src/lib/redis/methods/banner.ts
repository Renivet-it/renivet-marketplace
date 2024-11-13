import { db } from "@/lib/db";
import { banners } from "@/lib/db/schema";
import { generateCacheKey, parseToJSON } from "@/lib/utils";
import { CachedBanner, cachedBannerSchema } from "@/lib/validations";
import { and, eq } from "drizzle-orm";
import { redis } from "..";

class BannerCache {
    private genKey: (...args: string[]) => string;

    constructor() {
        this.genKey = generateCacheKey(":", "banner");
    }

    async getAll() {
        const keys = await redis.keys(this.genKey("*"));
        if (!keys.length) {
            const dbBanners = await db.query.banners.findMany({
                where: eq(banners.isActive, true),
            });
            if (!dbBanners.length) return [];

            await this.addBulk(dbBanners);
            return dbBanners;
        }

        const cachedBanners = await redis.mget(...keys);
        return cachedBannerSchema
            .array()
            .parse(
                cachedBanners
                    .map((banner) => parseToJSON<CachedBanner>(banner))
                    .filter((banner): banner is CachedBanner => banner !== null)
            );
    }

    async get(id: string) {
        const cachedBannerRaw = await redis.get(this.genKey(id));
        let cachedBanner = cachedBannerSchema
            .nullable()
            .parse(parseToJSON<CachedBanner>(cachedBannerRaw));

        if (!cachedBanner) {
            const dbBanner = await db.query.banners.findFirst({
                where: and(eq(banners.id, id), eq(banners.isActive, true)),
            });
            if (!dbBanner) return null;

            cachedBanner = dbBanner;
            await this.add(cachedBanner);
        }

        return cachedBanner;
    }

    async add(banner: CachedBanner) {
        return await redis.set(this.genKey(banner.id), JSON.stringify(banner));
    }

    async addBulk(banners: CachedBanner[]) {
        const pipeline = redis.pipeline();

        await Promise.all(
            banners.map((banner) => {
                pipeline.set(this.genKey(banner.id), JSON.stringify(banner));
            })
        );

        return await pipeline.exec();
    }

    async update(banner: CachedBanner) {
        await this.remove(banner.id);
        return await this.add(banner);
    }

    async remove(id: string) {
        return await redis.del(this.genKey(id));
    }

    async drop() {
        const keys = await redis.keys(this.genKey("*"));
        if (!keys.length) return 0;
        return await redis.del(...keys);
    }
}

export const bannerCache = new BannerCache();
