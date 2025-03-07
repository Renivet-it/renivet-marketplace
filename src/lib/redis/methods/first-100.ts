import { redis } from "..";

class First100Cache {
    private readonly key = "first-100";

    async get(): Promise<number> {
        const value = await redis.get(this.key);
        return parseInt(value ?? "0");
    }

    async set(): Promise<number> {
        const current = await this.get();
        if (current >= 100) return current;

        return await redis.incr(this.key);
    }

    async clear(): Promise<void> {
        await redis.del(this.key);
    }
}

export const first100Cache = new First100Cache();
