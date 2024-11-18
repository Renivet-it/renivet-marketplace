import { blogQueries } from "@/lib/db/queries";
import { generateCacheKey, parseToJSON } from "@/lib/utils";
import { CachedBlog, cachedBlogSchema } from "@/lib/validations";
import { redis } from "..";

class BlogCache {
    private genKey: (...args: string[]) => string;

    constructor() {
        this.genKey = generateCacheKey(":", "blog");
    }

    async get() {
        const cachedBlogRaw = await redis.get(this.genKey("primary"));
        let cachedBlog = cachedBlogSchema
            .nullable()
            .parse(parseToJSON<CachedBlog>(cachedBlogRaw));

        if (!cachedBlog) {
            const dbBlog = await blogQueries.getBlogs({
                limit: 1,
                page: 1,
                isPublished: true,
            });
            if (!dbBlog) return null;

            cachedBlog = cachedBlogSchema.parse(dbBlog.data[0]);
            await this.add(cachedBlog);
        }

        return cachedBlog;
    }

    async add(blog: CachedBlog) {
        await redis.set(
            this.genKey("primary"),
            JSON.stringify(blog),
            "EX",
            60 * 60 * 24 * 7
        );
    }

    async update(blog: CachedBlog) {
        await this.remove();
        return await this.add(blog);
    }

    async remove() {
        return await redis.del(this.genKey("primary"));
    }
}

export const blogCache = new BlogCache();
