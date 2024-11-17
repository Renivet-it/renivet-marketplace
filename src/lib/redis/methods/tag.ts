import { tagQueries } from "@/lib/db/queries";
import { generateCacheKey, parseToJSON } from "@/lib/utils";
import { CachedTag, cachedTagSchema, tagSchema } from "@/lib/validations";
import { z } from "zod";
import { redis } from "..";

class TagCache {
    private genKey: (...args: string[]) => string;

    constructor() {
        this.genKey = generateCacheKey(":", "tag");
    }

    async getAll(): Promise<CachedTag[]> {
        const [dbTagsCount, keys] = await Promise.all([
            tagQueries.getCount(),
            redis.keys(this.genKey("*")),
        ]);

        if (keys.length !== dbTagsCount) {
            await this.drop();

            const dbTags = await tagQueries.getTags();
            if (!dbTags.length) return [];

            const cachedTags = tagSchema
                .extend({
                    blogs: z.number(),
                })
                .array()
                .parse(
                    dbTags.map((tag) => ({
                        ...tag,
                        blogs: tag.blogTags.length,
                    }))
                );

            await this.addBulk(cachedTags);
            return cachedTags;
        }

        const cachedTags = await redis.mget(...keys);
        return cachedTagSchema
            .array()
            .parse(
                cachedTags
                    .map((tag) => parseToJSON<CachedTag>(tag))
                    .filter((tag): tag is CachedTag => tag !== null)
            );
    }

    async get(id: string): Promise<CachedTag | null> {
        const cachedTagRaw = await redis.get(this.genKey(id));
        let cachedTag = cachedTagSchema
            .nullable()
            .parse(parseToJSON<CachedTag>(cachedTagRaw));

        if (!cachedTag) {
            const dbTag = await tagQueries.getTag(id);
            if (!dbTag) return null;

            cachedTag = tagSchema
                .extend({
                    blogs: z.number(),
                })
                .parse({
                    ...dbTag,
                    blogs: dbTag.blogTags.length,
                });

            await this.add(cachedTag);
        }

        return cachedTag;
    }

    async add(tag: CachedTag) {
        return await redis.set(
            this.genKey(tag.id),
            JSON.stringify(tag),
            "EX",
            60 * 60 * 24 * 7
        );
    }

    async addBulk(tags: CachedTag[]) {
        const pipeline = redis.pipeline();

        await Promise.all(
            tags.map((tag) => {
                pipeline.set(
                    this.genKey(tag.id),
                    JSON.stringify(tag),
                    "EX",
                    60 * 60 * 24 * 7
                );
            })
        );

        await pipeline.exec();
    }

    async updateBulk(tags: CachedTag[]) {
        const pipeline = redis.pipeline();

        await Promise.all(
            tags.map((tag) => {
                pipeline.del(this.genKey(tag.id));
                pipeline.set(
                    this.genKey(tag.id),
                    JSON.stringify(tag),
                    "EX",
                    60 * 60 * 24 * 7
                );
            })
        );

        await pipeline.exec();
    }

    async update(tag: CachedTag) {
        await this.remove(tag.id);
        return await this.add(tag);
    }

    async remove(id: string) {
        return await redis.del(this.genKey(id));
    }

    async removeBulk(ids: string[]) {
        return await redis.del(...ids.map((id) => this.genKey(id)));
    }

    async drop() {
        const keys = await redis.keys(this.genKey("*"));
        if (!keys.length) return 0;
        return await redis.del(...keys);
    }
}

export const tagCache = new TagCache();
