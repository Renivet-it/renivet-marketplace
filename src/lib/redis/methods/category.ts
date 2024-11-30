import { categoryQueries } from "@/lib/db/queries";
import { generateCacheKey, parseToJSON } from "@/lib/utils";
import { CachedCategory, cachedCategorySchema } from "@/lib/validations";
import { redis } from "..";

class CategoryCache {
    private genKey: (...args: string[]) => string;

    constructor() {
        this.genKey = generateCacheKey(":", "category");
    }

    async getAll(): Promise<CachedCategory[]> {
        const [dbCategoriesCount, keys] = await Promise.all([
            categoryQueries.getCount(),
            redis.keys(this.genKey("*")),
        ]);

        if (keys.length !== dbCategoriesCount) {
            await this.drop();

            const dbCategories = await categoryQueries.getCategories();
            if (!dbCategories.length) return [];

            const cachedCategories = cachedCategorySchema.array().parse(
                dbCategories
                    .map((cat) => ({
                        ...cat,
                        subCategories: cat.subCategories.length,
                    }))
                    .sort(
                        (a, b) =>
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime()
                    )
            );

            await this.addBulk(cachedCategories);
            return cachedCategories;
        }
        if (!keys.length) return [];

        const cachedCategories = await redis.mget(...keys);
        return cachedCategorySchema.array().parse(
            cachedCategories
                .map((cat) => parseToJSON<CachedCategory>(cat))
                .filter((cat): cat is CachedCategory => cat !== null)
                .sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                )
        );
    }

    async get(id: string): Promise<CachedCategory | null> {
        const cachedCategoryRaw = await redis.get(this.genKey(id));
        let cachedCategory = cachedCategorySchema
            .nullable()
            .parse(parseToJSON<CachedCategory>(cachedCategoryRaw));

        if (!cachedCategory) {
            const dbCategory = await categoryQueries.getCategory(id);
            if (!dbCategory) return null;

            cachedCategory = cachedCategorySchema.parse({
                ...dbCategory,
                subCategories: dbCategory.subCategories.length,
            });
            await this.add(cachedCategory);
        }

        return cachedCategory;
    }

    async add(category: CachedCategory) {
        return await redis.set(
            this.genKey(category.id),
            JSON.stringify(category),
            "EX",
            60 * 60 * 24 * 7
        );
    }

    async addBulk(categories: CachedCategory[]) {
        const pipeline = redis.pipeline();

        await Promise.all(
            categories.map((cat) => {
                pipeline.set(
                    this.genKey(cat.id),
                    JSON.stringify(cat),
                    "EX",
                    60 * 60 * 24 * 7
                );
            })
        );

        await pipeline.exec();
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

export const categoryCache = new CategoryCache();
