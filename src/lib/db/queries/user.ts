import { userWithAddressesAndRolesSchema } from "@/lib/validations";
import { desc, eq, ilike } from "drizzle-orm";
import { db } from "..";
import { users } from "../schema";

class UserQuery {
    async getUsers({
        limit,
        page,
        search,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.users.findMany({
            where: !!search?.length
                ? ilike(users.email, `%${search}%`)
                : undefined,
            with: {
                addresses: true,
                roles: {
                    with: {
                        role: true,
                    },
                },
            },
            limit,
            offset: (page - 1) * limit,
            orderBy: [desc(users.createdAt)],
            extras: {
                count: db
                    .$count(
                        users,
                        !!search?.length
                            ? ilike(users.email, `%${search}%`)
                            : undefined
                    )
                    .as("user_count"),
            },
        });

        const parsed = userWithAddressesAndRolesSchema.array().parse(
            data.map((user) => ({
                ...user,
                roles: user.roles.map((role) => role.role),
            }))
        );

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getUser(id: string) {
        const user = await db.query.users.findFirst({
            where: eq(users.id, id),
            with: {
                addresses: true,
                roles: {
                    with: {
                        role: true,
                    },
                },
            },
        });
        if (!user) return null;

        return userWithAddressesAndRolesSchema.parse({
            ...user,
            roles: user.roles.map((role) => role.role),
        });
    }
}

export const userQueries = new UserQuery();
