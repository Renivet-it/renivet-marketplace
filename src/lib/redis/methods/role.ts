import { db } from "@/lib/db";
import { roles } from "@/lib/db/schema";
import { generateCacheKey, parseToJSON } from "@/lib/utils";
import { CachedRole, cachedRoleSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";
import { redis } from "..";

class RoleCache {
    private genKey: (...args: string[]) => string;

    constructor() {
        this.genKey = generateCacheKey(":", "role");
    }

    async getAll() {
        const dbRolesCount = await db.$count(roles);

        const keys = await redis.keys(this.genKey("*"));
        if (keys.length !== +dbRolesCount) {
            await this.drop();

            const dbRoles = await db.query.roles.findMany({
                with: {
                    userRoles: true,
                },
            });
            if (!dbRoles.length) return [];

            const cachedRoles = dbRoles.map((role) => ({
                ...role,
                users: role.userRoles.length,
            }));

            await this.addBulk(cachedRoles);
            return cachedRoles;
        }

        const cachedRoles = await redis.mget(...keys);
        return cachedRoleSchema
            .array()
            .parse(
                cachedRoles
                    .map((role) => parseToJSON<CachedRole>(role))
                    .filter((role): role is CachedRole => role !== null)
            );
    }

    async get(id: string) {
        const cachedRoleRaw = await redis.get(this.genKey(id));
        let cachedRole = cachedRoleSchema
            .nullable()
            .parse(parseToJSON<CachedRole>(cachedRoleRaw));

        if (!cachedRole) {
            const dbRole = await db.query.roles.findFirst({
                where: eq(roles.id, id),
                with: {
                    userRoles: true,
                },
            });
            if (!dbRole) return null;

            cachedRole = {
                ...dbRole,
                users: dbRole.userRoles.length,
            };

            await this.add(cachedRole);
        }

        return cachedRole;
    }

    async add(role: CachedRole) {
        return await redis.set(
            this.genKey(role.id),
            JSON.stringify(role),
            "EX",
            60 * 60 * 24 * 7
        );
    }

    async addBulk(roles: CachedRole[]) {
        const pipeline = redis.pipeline();

        await Promise.all(
            roles.map((role) => {
                pipeline.set(
                    this.genKey(role.id),
                    JSON.stringify(role),
                    "EX",
                    60 * 60 * 24 * 7
                );
            })
        );

        return await pipeline.exec();
    }

    async update(role: CachedRole) {
        await this.remove(role.id);
        return await this.add(role);
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

export const roleCache = new RoleCache();
