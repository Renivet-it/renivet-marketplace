import { userQueries } from "@/lib/db/queries";
import { generateCacheKey, parseToJSON } from "@/lib/utils";
import { CachedUser, cachedUserSchema } from "@/lib/validations";
import { redis } from "..";

class UserCache {
    private genKey: (...args: string[]) => string;

    constructor() {
        this.genKey = generateCacheKey(":", "user");
    }

    async get(id: string) {
        const cachedUserRaw = await redis.get(this.genKey(id));
        let cachedUser = cachedUserSchema
            .nullable()
            .parse(parseToJSON<CachedUser>(cachedUserRaw));

        if (!cachedUser) {
            const dbUser = await userQueries.getUser(id);
            if (!dbUser) return null;

            cachedUser = dbUser;
            await this.add(cachedUser);
        }

        return cachedUser;
    }

    async add(user: CachedUser) {
        return await redis.set(
            this.genKey(user.id),
            JSON.stringify(user),
            "EX",
            60 * 60 * 24
        );
    }

    async addBulk(users: CachedUser[]) {
        const pipeline = redis.pipeline();

        await Promise.all(
            users.map((user) => {
                pipeline.set(
                    this.genKey(user.id),
                    JSON.stringify(user),
                    "EX",
                    60 * 60 * 24
                );
            })
        );

        return await pipeline.exec();
    }

    async update(user: CachedUser) {
        await this.remove(user.id);
        return await this.add(user);
    }

    async remove(id: string) {
        return await redis.del(this.genKey(id));
    }

    async drop() {
        const keys = await redis.keys(this.genKey("*"));
        if (!keys.length) return;
        await redis.del(...keys);
    }
}

export const userCache = new UserCache();
