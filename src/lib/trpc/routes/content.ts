import { utApi } from "@/app/api/uploadthing/core";
import { BitFieldSitePermission } from "@/config/permissions";
import { bannerCache } from "@/lib/redis/methods";
import { getUploadThingFileKey, hasPermission } from "@/lib/utils";
import { createBannerSchema, updateBannerSchema } from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, ilike } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const bannerRouter = createTRPCRouter({
    getBanners: publicProcedure
        .input(
            z.object({
                limit: z.number().int().positive().default(10),
                page: z.number().int().positive().default(1),
                isActive: z.boolean().optional(),
                search: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { db, schemas } = ctx;
            const { limit, page, isActive, search } = input;

            const banners = await db.query.banners.findMany({
                where: and(
                    isActive !== undefined
                        ? eq(schemas.banners.isActive, isActive)
                        : undefined,
                    !!search?.length
                        ? ilike(schemas.banners.title, `%${search}%`)
                        : undefined
                ),
                limit,
                offset: (page - 1) * limit,
                orderBy: [desc(schemas.banners.createdAt)],
                extras: {
                    bannerCount: db.$count(schemas.banners).as("banner_count"),
                },
            });

            return banners;
        }),
    getBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { db, schemas } = ctx;
            const { id } = input;

            const existingBanner = await db.query.banners.findFirst({
                where: eq(schemas.banners.id, id),
            });
            if (!existingBanner)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Banner not found",
                });

            return existingBanner;
        }),
    createBanner: protectedProcedure
        .input(createBannerSchema)
        .use(({ ctx, next }) => {
            const { user } = ctx;

            const isAuthorized = hasPermission(user.sitePermissions, [
                BitFieldSitePermission.MANAGE_CONTENT,
            ]);
            if (!isAuthorized) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You're not authorized",
                });
            }

            return next({ ctx });
        })
        .mutation(async ({ ctx, input }) => {
            const { db, schemas } = ctx;

            if (!input.imageUrl)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Image URL is required",
                });

            const newBanner = await db
                .insert(schemas.banners)
                .values({
                    ...input,
                    imageUrl: input.imageUrl,
                })
                .returning()
                .then((res) => res[0]);

            if (input.isActive) await bannerCache.add(newBanner);

            return newBanner;
        }),
    updateBanner: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                data: updateBannerSchema,
            })
        )
        .use(({ ctx, next }) => {
            const { user } = ctx;

            const isAuthorized = hasPermission(user.sitePermissions, [
                BitFieldSitePermission.MANAGE_CONTENT,
            ]);
            if (!isAuthorized) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You're not authorized",
                });
            }

            return next({ ctx });
        })
        .mutation(async ({ ctx, input }) => {
            const { db, schemas } = ctx;
            const { id, data } = input;

            if (!data.imageUrl)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Image URL is required",
                });

            const existingBanner = await db.query.banners.findFirst({
                where: eq(schemas.banners.id, id),
            });
            if (!existingBanner)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Banner not found",
                });

            const existingImageUrl = existingBanner.imageUrl;
            if (existingImageUrl !== data.imageUrl) {
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedBanner = await db
                .update(schemas.banners)
                .set({
                    ...data,
                    imageUrl: data.imageUrl,
                    updatedAt: new Date(),
                })
                .where(eq(schemas.banners.id, id))
                .returning()
                .then((res) => res[0]);

            if (data.isActive || existingBanner.isActive) {
                if (data.isActive) await bannerCache.update(updatedBanner);
                else await bannerCache.remove(updatedBanner.id);
            }

            return updatedBanner;
        }),
    changeStatus: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                isActive: z.boolean(),
            })
        )
        .use(({ ctx, next }) => {
            const { user } = ctx;

            const isAuthorized = hasPermission(user.sitePermissions, [
                BitFieldSitePermission.MANAGE_CONTENT,
            ]);
            if (!isAuthorized) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You're not authorized",
                });
            }

            return next({ ctx });
        })
        .mutation(async ({ ctx, input }) => {
            const { db, schemas } = ctx;
            const { id, isActive } = input;

            const existingBanner = await db.query.banners.findFirst({
                where: eq(schemas.banners.id, id),
            });
            if (!existingBanner)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Banner not found",
                });

            const updatedBanner = await db
                .update(schemas.banners)
                .set({
                    isActive,
                    updatedAt: new Date(),
                })
                .where(eq(schemas.banners.id, id))
                .returning()
                .then((res) => res[0]);

            if (isActive) await bannerCache.update(updatedBanner);
            else await bannerCache.remove(id);

            return updatedBanner;
        }),
    deleteBanner: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .use(({ ctx, next }) => {
            const { user } = ctx;

            const isAuthorized = hasPermission(user.sitePermissions, [
                BitFieldSitePermission.MANAGE_CONTENT,
            ]);
            if (!isAuthorized) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You're not authorized",
                });
            }

            return next({ ctx });
        })
        .mutation(async ({ ctx, input }) => {
            const { db, schemas } = ctx;
            const { id } = input;

            const existingBanner = await db.query.banners.findFirst({
                where: eq(schemas.banners.id, id),
            });
            if (!existingBanner)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Banner not found",
                });

            const existingImageUrl = existingBanner.imageUrl;
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                db.delete(schemas.banners).where(eq(schemas.banners.id, id)),
                utApi.deleteFiles([existingKey]),
                ...(existingBanner.isActive ? [bannerCache.remove(id)] : []),
            ]);

            return true;
        }),
});

export const contentRouter = createTRPCRouter({
    banners: bannerRouter,
});
