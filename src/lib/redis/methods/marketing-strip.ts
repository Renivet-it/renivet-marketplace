import { db } from "@/lib/db";
import { marketingStrip } from "@/lib/db/schema";
import { generateCacheKey, parseToJSON } from "@/lib/utils";
import {
    CachedMarketingStrip,
    cachedMarketingStripSchema,
} from "@/lib/validations";
import { and, eq } from "drizzle-orm";
import { redis } from "..";

class MarketingStripCache {
    private genKey: (...args: string[]) => string;

    constructor() {
        this.genKey = generateCacheKey(":", "marketing-strip");
    }

    async getAll() {
        const keys = await redis.keys(this.genKey("*"));
        if (!keys.length) {
            const dbMarketingStrips = await db.query.marketingStrip.findMany({
                where: eq(marketingStrip.isActive, true),
            });
            if (!dbMarketingStrips.length) return [];

            await this.addBulk(dbMarketingStrips);
            return dbMarketingStrips;
        }

        const cachedMarketingStrips = await redis.mget(...keys);
        return cachedMarketingStripSchema
            .array()
            .parse(
                cachedMarketingStrips
                    .map((marketingStrip) =>
                        parseToJSON<CachedMarketingStrip>(marketingStrip)
                    )
                    .filter(
                        (
                            marketingStrip
                        ): marketingStrip is CachedMarketingStrip =>
                            marketingStrip !== null
                    )
            );
    }

    async get(id: string) {
        const cachedMarketingStripRaw = await redis.get(this.genKey(id));
        let cachedMarketingStrip = cachedMarketingStripSchema
            .nullable()
            .parse(parseToJSON<CachedMarketingStrip>(cachedMarketingStripRaw));

        if (!cachedMarketingStrip) {
            const dbMarketingStrip = await db.query.marketingStrip.findFirst({
                where: and(
                    eq(marketingStrip.id, id),
                    eq(marketingStrip.isActive, true)
                ),
            });
            if (!dbMarketingStrip) return null;

            cachedMarketingStrip = dbMarketingStrip;
            await this.add(cachedMarketingStrip);
        }

        return cachedMarketingStrip;
    }

    async add(marketingStrip: CachedMarketingStrip) {
        return await redis.set(
            this.genKey(marketingStrip.id),
            JSON.stringify(marketingStrip)
        );
    }

    async addBulk(marketingStrips: CachedMarketingStrip[]) {
        const pipeline = redis.pipeline();

        await Promise.all(
            marketingStrips.map((marketingStrip) => {
                pipeline.set(
                    this.genKey(marketingStrip.id),
                    JSON.stringify(marketingStrip)
                );
            })
        );

        return await pipeline.exec();
    }

    async update(marketingStrip: CachedMarketingStrip) {
        await this.remove(marketingStrip.id);
        return await this.add(marketingStrip);
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

export const marketingStripCache = new MarketingStripCache();
