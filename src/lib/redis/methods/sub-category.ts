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
        // await subCategoryCache.drop();
        // console.log("✅ SubCategory cache dropped manually");
        console.log("***********  getAll() started");
        const [dbSubCategoriesCount, keys] = await Promise.all([
            subCategoryQueries.getCount(),
            redis.keys(this.genKey("*")),
        ]);
    
        console.log("DB count:", dbSubCategoriesCount);
        console.log("Redis keys:", keys);
    
        if (keys.length !== dbSubCategoriesCount) {
            console.log("============ Cache mismatch or empty, dropping cache...");
            await this.drop();
    
            const dbSubCategories = await subCategoryQueries.getSubCategories();
            console.log("=============== Fetched from DB:", dbSubCategories);
    
            if (!dbSubCategories.length) return [];
    
            const cachedSubCategories = cachedSubCategorySchema.array().parse(
                dbSubCategories
                    .map((sub) => {
                        console.log("============= Processing subcategory:", sub);
                        return {
                            ...sub,
                            productTypes: Array.isArray(sub.productTypes) ? sub.productTypes.length : 0, // ✅ fallback added by rachana
                            priorityId: sub.priorityId ?? 0, // ✅ added by rachana
                        };
                    })
                    .sort(
                        (a, b) =>
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime()
                    )
            );
    
            console.log("=============== Parsed and validated subcategories:", cachedSubCategories);
    
            await this.addBulk(cachedSubCategories);
            return cachedSubCategories;
        }
    
        if (!keys.length) {
            console.log("============ No keys in cache after initial check, returning empty array.");
            return [];
        }
    
        const cachedCategories = await redis.mget(...keys);
        console.log("============== Fetched from Redis:", cachedCategories);
    
        const parsedCachedCategories = cachedSubCategorySchema.array().parse(
            cachedCategories
                .map((sub) => {
                    const parsed = parseToJSON<CachedSubCategory>(sub);
                    console.log("============== Parsed cached object:", parsed);
                    return parsed;
                })
                .filter((sub): sub is CachedSubCategory => sub !== null)
                .sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                )
        );
    
        console.log("============= Final parsed cached subcategories:", parsedCachedCategories);
    
        return parsedCachedCategories;
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
