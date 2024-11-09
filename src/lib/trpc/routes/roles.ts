import { BitFieldSitePermission } from "@/config/permissions";
import { roleCache } from "@/lib/redis/methods";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/trpc";
import { hasPermission, slugify } from "@/lib/utils";
import { createRoleSchema, updateRoleSchema } from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { and, eq, ne } from "drizzle-orm";
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

                cachedRoles = roles.map((role) => ({
                    ...role,
                    users: role.userRoles.length,
                }));

                await roleCache.addBulk(cachedRoles.map((x) => x!));
            }

            return cachedRoles.map((role) => ({
                ...role,
                roleCount: cachedRoles.length,
            }));
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

                cachedRole = {
                    ...role,
                    users: role.userRoles.length,
                };

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

            const existingRole = await db.query.roles.findFirst({
                where: eq(schemas.roles.slug, slug),
            });
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

            const existingRole = await roleCache.get(id);
            if (!existingRole)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Role not found",
                });

            await Promise.all([
                db.delete(schemas.roles).where(eq(schemas.roles.id, id)),
                roleCache.remove(id),
            ]);

            return true;
        }),
});
