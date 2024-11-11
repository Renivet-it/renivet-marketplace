import { BitFieldSitePermission } from "@/config/permissions";
import { roleCache, userCache } from "@/lib/redis/methods";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/trpc";
import { hasPermission, slugify } from "@/lib/utils";
import {
    cachedRoleSchema,
    createRoleSchema,
    reorderRolesSchema,
    updateRoleSchema,
} from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { and, eq, gt, ne, sql } from "drizzle-orm";
import { z } from "zod";

export const rolesRouter = createTRPCRouter({
    getRoles: protectedProcedure
        .use(({ ctx, next }) => {
            const { user } = ctx;

            const isAuthorized = hasPermission(user.sitePermissions, [
                BitFieldSitePermission.VIEW_ROLES,
            ]);
            if (!isAuthorized)
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You're not authorized",
                });

            return next({ ctx });
        })
        .query(async ({ ctx }) => {
            const { db } = ctx;

            let cachedRoles = await roleCache.getAll();
            if (!cachedRoles.length) {
                const roles = await db.query.roles.findMany({
                    with: {
                        userRoles: true,
                    },
                });

                cachedRoles = cachedRoleSchema.array().parse(
                    roles.map((role) => ({
                        ...role,
                        users: role.userRoles.length,
                    }))
                );

                await roleCache.addBulk(cachedRoles.map((x) => x!));
            }

            return cachedRoles.sort((a, b) => a.position - b.position);
        }),
    getRole: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .use(({ ctx, next }) => {
            const { user } = ctx;

            const isAuthorized = hasPermission(user.sitePermissions, [
                BitFieldSitePermission.VIEW_ROLES,
            ]);
            if (!isAuthorized)
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You're not authorized",
                });

            return next({ ctx });
        })
        .query(async ({ ctx, input }) => {
            const { db, schemas } = ctx;
            const { id } = input;

            let cachedRole = await roleCache.get(id);
            if (!cachedRole) {
                const role = await db.query.roles.findFirst({
                    where: eq(schemas.blogs.id, id),
                    with: {
                        userRoles: true,
                    },
                });
                if (!role)
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Role not found",
                    });

                cachedRole = cachedRoleSchema.parse({
                    ...role,
                    users: role.userRoles.length,
                });

                await roleCache.add(cachedRole);
            }

            return cachedRole;
        }),
    createRole: protectedProcedure
        .input(createRoleSchema)
        .use(({ ctx, next }) => {
            const { user } = ctx;

            const isAuthorized = hasPermission(user.sitePermissions, [
                BitFieldSitePermission.MANAGE_ROLES,
            ]);
            if (!isAuthorized)
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You're not authorized",
                });

            return next({ ctx });
        })
        .mutation(async ({ ctx, input }) => {
            const { db, schemas } = ctx;

            const slug = slugify(input.name);

            const [cachedRoles, existingRole] = await Promise.all([
                roleCache.getAll(),
                db.query.roles.findFirst({
                    where: eq(schemas.roles.slug, slug),
                }),
            ]);
            if (existingRole)
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "Role already exists",
                });

            const newRole = await db
                .insert(schemas.roles)
                .values({
                    ...input,
                    slug,
                    position: cachedRoles.length + 1,
                })
                .returning()
                .then((res) => res[0]);

            await roleCache.add({
                ...newRole,
                users: 0,
            });

            return newRole;
        }),
    updateRole: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                data: updateRoleSchema,
            })
        )
        .use(({ ctx, next }) => {
            const { user } = ctx;

            const isAuthorized = hasPermission(user.sitePermissions, [
                BitFieldSitePermission.MANAGE_ROLES,
            ]);
            if (!isAuthorized)
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You're not authorized",
                });

            return next({ ctx });
        })
        .mutation(async ({ ctx, input }) => {
            const { db, schemas } = ctx;
            const { id, data } = input;

            const existingRole = await roleCache.get(id);
            if (!existingRole)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Role not found",
                });

            if (data.name) {
                const slug = slugify(data.name);

                const existingOtherRole = await db.query.roles.findFirst({
                    where: and(
                        eq(schemas.roles.slug, slug),
                        ne(schemas.roles.id, id)
                    ),
                });
                if (existingOtherRole)
                    throw new TRPCError({
                        code: "CONFLICT",
                        message: "Another role with the same name exists",
                    });
            }

            const [updatedRole] = await Promise.all([
                db
                    .update(schemas.roles)
                    .set({
                        ...data,
                        ...(data.name && { slug: slugify(data.name) }),
                    })
                    .where(eq(schemas.roles.id, existingRole.id))
                    .returning()
                    .then((res) => res[0]),
                roleCache.update({
                    ...existingRole,
                    ...{
                        ...data,
                        ...(data.name && { slug: slugify(data.name) }),
                    },
                }),
            ]);

            return updatedRole;
        }),
    reorderRoles: protectedProcedure
        .input(reorderRolesSchema)
        .use(({ ctx, next }) => {
            const { user } = ctx;

            const isAuthorized = hasPermission(user.sitePermissions, [
                BitFieldSitePermission.MANAGE_ROLES,
            ]);
            if (!isAuthorized)
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You're not authorized",
                });

            return next({ ctx });
        })
        .mutation(async ({ ctx, input }) => {
            const { db, schemas } = ctx;

            const existingRoles = await roleCache.getAll();
            if (existingRoles.length !== input.length)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Invalid data",
                });

            await db.transaction(async (tx) => {
                for (const role of input) {
                    await tx
                        .update(schemas.roles)
                        .set({ position: role.position })
                        .where(eq(schemas.roles.id, role.id));
                }

                await roleCache.drop();
                await roleCache.addBulk(input);
            });

            return true;
        }),
    deleteRole: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .use(({ ctx, next }) => {
            const { user } = ctx;

            const isAuthorized = hasPermission(user.sitePermissions, [
                BitFieldSitePermission.MANAGE_ROLES,
            ]);
            if (!isAuthorized)
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You're not authorized",
                });

            return next({ ctx });
        })
        .mutation(async ({ ctx, input }) => {
            const { db, schemas } = ctx;
            const { id } = input;

            const existingRoles = await roleCache.getAll();
            const existingRole = existingRoles.find((role) => role.id === id);
            if (!existingRole)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Role not found",
                });

            const existingUsers = await userCache.getAll();
            const usersWithRole = existingUsers.filter((user) =>
                user.roles.some((role) => role.id === id)
            );

            const updatedUsers = existingUsers.map((user) => ({
                ...user,
                roles: user.roles.filter((role) => role.id !== id),
            }));

            await db.transaction(async (tx) => {
                await Promise.all([
                    tx.delete(schemas.roles).where(eq(schemas.roles.id, id)),
                    tx
                        .update(schemas.roles)
                        .set({ position: sql`${schemas.roles.position} - 1` })
                        .where(
                            gt(schemas.roles.position, existingRole.position)
                        ),
                    roleCache.drop(),
                ]);

                const updateRoles = existingRoles
                    .map((role) => {
                        if (role.position > existingRole.position) {
                            return {
                                ...role,
                                position: role.position - 1,
                            };
                        }
                        return role;
                    })
                    .filter((role) => role.id !== id);

                if (usersWithRole.length > 0) {
                    await Promise.all([
                        roleCache.addBulk(updateRoles),
                        userCache.drop(),
                    ]);
                    await userCache.addBulk(updatedUsers);
                } else {
                    await roleCache.addBulk(updateRoles);
                }
            });

            return true;
        }),
});
