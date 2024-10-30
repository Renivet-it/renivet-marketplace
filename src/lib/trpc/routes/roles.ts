import { BitFieldSitePermission } from "@/config/permissions";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/trpc";
import { hasPermission, slugify } from "@/lib/utils";
import { createRoleSchema, updateRoleSchema } from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { eq, or } from "drizzle-orm";
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
            const { db, schemas } = ctx;

            const roles = await db.query.roles.findMany({
                extras: {
                    userCount: db
                        .$count(
                            schemas.userRoles,
                            eq(schemas.userRoles.roleId, schemas.roles.id)
                        )
                        .as("user_count"),
                },
            });
            return roles;
        }),
    getRole: protectedProcedure
        .input(
            z
                .object({
                    id: z.string().optional(),
                    slug: z.string().optional(),
                })
                .refine((input) => input.id || input.slug, {
                    message: "ID or slug is required",
                    path: ["id", "slug"],
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
            const { id, slug } = input;

            const role = await db.query.roles.findFirst({
                where: or(
                    id ? eq(schemas.blogs.id, id) : undefined,
                    slug ? eq(schemas.blogs.slug, slug) : undefined
                ),
            });
            if (!role)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Role not found",
                });

            return role;
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

            return newRole;
        }),
    updateRole: protectedProcedure
        .input(
            z
                .object({
                    id: z.string().optional(),
                    slug: z.string().optional(),
                    data: updateRoleSchema,
                })
                .refine((input) => input.id || input.slug, {
                    message: "ID or slug is required",
                    path: ["id", "slug"],
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
            const { id, slug, data } = input;

            const existingRole = await db.query.roles.findFirst({
                where: or(
                    id ? eq(schemas.roles.id, id) : undefined,
                    slug ? eq(schemas.roles.slug, slug) : undefined
                ),
            });
            if (!existingRole)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Role not found",
                });

            const updatedRole = await db
                .update(schemas.roles)
                .set(data)
                .where(eq(schemas.roles.id, existingRole.id))
                .returning()
                .then((res) => res[0]);

            return updatedRole;
        }),
    deleteRole: protectedProcedure
        .input(
            z
                .object({
                    id: z.string().optional(),
                    slug: z.string().optional(),
                })
                .refine((input) => input.id || input.slug, {
                    message: "ID or slug is required",
                    path: ["id", "slug"],
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
            const { id, slug } = input;

            const existingRole = await db.query.roles.findFirst({
                where: or(
                    id ? eq(schemas.roles.id, id) : undefined,
                    slug ? eq(schemas.roles.slug, slug) : undefined
                ),
            });
            if (!existingRole)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Role not found",
                });

            await db
                .delete(schemas.roles)
                .where(
                    or(
                        id ? eq(schemas.roles.id, id) : undefined,
                        slug ? eq(schemas.roles.slug, slug) : undefined
                    )
                );

            return true;
        }),
});
