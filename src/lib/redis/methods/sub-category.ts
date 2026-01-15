import { subCategoryQueries } from "@/lib/db/queries";
import { generateCacheKey, parseToJSON } from "@/lib/utils";
import { CachedSubCategory, cachedSubCategorySchema } from "@/lib/validations";
import { redis } from "..";

class SubCategoryCache {
    private genKey: (...args: string[]) => string;

    constructor() {
        this.genKey = generateCacheKey(":", "sub-category");
    }

    async getAll(): Promise<CachedSubCategory[]> {
        const [dbSubCategoriesCount, keys] = await Promise.all([
            subCategoryQueries.getCount(),
            redis.keys(this.genKey("*")),
        ]);

        if (keys.length !== dbSubCategoriesCount) {
            await this.drop();

            const dbSubCategories = await subCategoryQueries.getSubCategories();
            if (!dbSubCategories.length) return [];

            const cachedSubCategories = cachedSubCategorySchema.array().parse(
                dbSubCategories
                    .map((sub) => ({
                        ...sub,
                        productTypes: sub.productTypes.length,
                        productCount: Number(sub.productCount),
                    }))
                    .sort((a, b) => {
                        const rankA = a.rank || Infinity;
                        const rankB = b.rank || Infinity;
                        if (rankA !== rankB) {
                            return rankA - rankB;
                        }
                        return (
                            new Date(b.updatedAt).getTime() -
                            new Date(a.updatedAt).getTime()
                        );
                    })
            );

            await this.addBulk(cachedSubCategories);
            return cachedSubCategories;
        }
        if (!keys.length) return [];

        const cachedCategories = await redis.mget(...keys);
        return cachedSubCategorySchema.array().parse(
            cachedCategories
                .map((sub) => parseToJSON<CachedSubCategory>(sub))
                .filter((sub): sub is CachedSubCategory => sub !== null)
                .sort((a, b) => {
                    const rankA = a.rank || Infinity;
                    const rankB = b.rank || Infinity;
                    if (rankA !== rankB) {
                        return rankA - rankB;
                    }
                    return (
                        new Date(b.updatedAt).getTime() -
                        new Date(a.updatedAt).getTime()
                    );
                })
        );
    }

    async get(id: string): Promise<CachedSubCategory | null> {
        const cachedSubCategoryRaw = await redis.get(this.genKey(id));
        let cachedSubCategory = cachedSubCategorySchema
            .nullable()
            .parse(parseToJSON<CachedSubCategory>(cachedSubCategoryRaw));

        if (!cachedSubCategory) {
            const dbSubCategory = await subCategoryQueries.getSubCategory(id);
            if (!dbSubCategory) return null;

            cachedSubCategory = cachedSubCategorySchema.parse({
                ...dbSubCategory,
                productTypes: dbSubCategory.productTypes.length,
            });
            await this.add(cachedSubCategory);
        }

        return cachedSubCategory;
    }

    async add(subCategory: CachedSubCategory) {
        return await redis.set(
            this.genKey(subCategory.id),
            JSON.stringify(subCategory),
            "EX",
            60 * 60 * 24 * 7
        );
    }

    async addBulk(subCategories: CachedSubCategory[]) {
        const pipeline = redis.pipeline();

        await Promise.all(
            subCategories.map((sub) => {
                pipeline.set(
                    this.genKey(sub.id),
                    JSON.stringify(sub),
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

export const subCategoryCache = new SubCategoryCache();
