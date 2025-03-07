import { utApi } from "@/app/api/uploadthing/core";
import { BitFieldSitePermission } from "@/config/permissions";
import { bannerCache, marketingStripCache } from "@/lib/redis/methods";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
    publicProcedure,
} from "@/lib/trpc/trpc";
import { getUploadThingFileKey, hasPermission } from "@/lib/utils";
import {
    createAdvertisementSchema,
    createBannerSchema,
    createHomeBrandProductSchema,
    createHomeShopByCategorySchema,
    createMarketingStripSchema,
    updateAdvertisementSchema,
    updateBannerSchema,
    updateHomeBrandProductSchema,
    updateHomeShopByCategorySchema,
    updateMarketingStripSchema,
} from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const advertisementRouter = createTRPCRouter({
    getAdvertisements: protectedProcedure
        .input(
            z.object({
                limit: z.number().int().positive().default(10),
                page: z.number().int().positive().default(1),
                isPublished: z.boolean().optional(),
                search: z.string().optional(),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_CONTENT))
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { limit, page, isPublished, search } = input;

            const advertisements =
                await queries.advertisements.getAdvertisements({
                    limit,
                    page,
                    isPublished,
                    search,
                });

            return advertisements;
        }),
    getAdvertisement: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_CONTENT))
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingAdvertisement =
                await queries.advertisements.getAdvertisement(id);
            if (!existingAdvertisement)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Advertisement not found",
                });

            return existingAdvertisement;
        }),
    createAdvertisement: protectedProcedure
        .input(createAdvertisementSchema)
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_CONTENT))
        .mutation(async ({ ctx, input }) => {
            const { queries } = ctx;

            if (!input.imageUrl)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Image URL is required",
                });

            const newAdvertisement =
                await queries.advertisements.createAdvertisement({
                    ...input,
                    imageUrl: input.imageUrl,
                });

            return newAdvertisement;
        }),
    updateAdvertisement: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                values: updateAdvertisementSchema,
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_CONTENT))
        .mutation(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id, values } = input;

            if (!values.imageUrl)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Image URL is required",
                });

            const existingAdvertisement =
                await queries.advertisements.getAdvertisement(id);
            if (!existingAdvertisement)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Advertisement not found",
                });

            const updatedAdvertisement =
                await queries.advertisements.updateAdvertisement(id, {
                    ...values,
                    imageUrl: values.imageUrl,
                });

            return updatedAdvertisement;
        }),
    changeAdvertisementStatus: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                isPublished: z.boolean(),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_CONTENT))
        .mutation(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id, isPublished } = input;

            const existingAdvertisement =
                await queries.advertisements.getAdvertisement(id);
            if (!existingAdvertisement)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Advertisement not found",
                });

            const updatedAdvertisement =
                await queries.advertisements.updateAdvertisementStatus(
                    id,
                    isPublished
                );

            return updatedAdvertisement;
        }),
    deleteAdvertisement: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_CONTENT))
        .mutation(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingAdvertisement =
                await queries.advertisements.getAdvertisement(id);
            if (!existingAdvertisement)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Advertisement not found",
                });

            const existingImageUrl = existingAdvertisement.imageUrl;
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.advertisements.deleteAdvertisement(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
    updatePositions: protectedProcedure
        .input(
            z.array(
                z.object({
                    id: z.string(),
                    position: z.number(),
                })
            )
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_CONTENT))
        .mutation(async ({ ctx, input }) => {
            const { queries } = ctx;
            return queries.advertisements.updateAdvertisementPositions(input);
        }),
});

export const homeBrandProductRouter = createTRPCRouter({
    getHomeBrandProducts: publicProcedure
        .input(
            z.object({
                limit: z.number().int().positive().default(10),
                page: z.number().int().positive().default(1),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { limit, page } = input;

            const homeBrandProducts =
                await queries.homeBrandProducts.getHomeBrandProducts({
                    limit,
                    page,
                });

            return homeBrandProducts;
        }),
    getHomeBrandProduct: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeBrandProduct =
                await queries.homeBrandProducts.getHomeBrandProduct(id);
            if (!existingHomeBrandProduct)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home brand product not found",
                });

            return existingHomeBrandProduct;
        }),
    createHomeBrandProduct: protectedProcedure
        .input(createHomeBrandProductSchema)
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
            const { queries } = ctx;

            if (!input.imageUrl)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Image URL is required",
                });

            const newHomeBrandProduct =
                await queries.homeBrandProducts.createHomeBrandProduct({
                    ...input,
                    imageUrl: input.imageUrl,
                });

            return newHomeBrandProduct;
        }),
    updateHomeBrandProduct: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                values: updateHomeBrandProductSchema,
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
            const { queries } = ctx;
            const { id, values } = input;

            if (!values.imageUrl)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Image URL is required",
                });

            const existingHomeBrandProduct =
                await queries.homeBrandProducts.getHomeBrandProduct(id);
            if (!existingHomeBrandProduct)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home brand product not found",
                });

            const existingImageUrl = existingHomeBrandProduct.imageUrl;
            if (existingImageUrl !== values.imageUrl) {
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeBrandProduct =
                await queries.homeBrandProducts.updateHomeBrandProduct(id, {
                    ...values,
                    imageUrl: values.imageUrl,
                });

            return updatedHomeBrandProduct;
        }),
    deleteHomeBrandProduct: protectedProcedure
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
            const { queries } = ctx;
            const { id } = input;

            const existingHomeBrandProduct =
                await queries.homeBrandProducts.getHomeBrandProduct(id);
            if (!existingHomeBrandProduct)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home brand product not found",
                });

            const existingImageUrl = existingHomeBrandProduct.imageUrl;
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.homeBrandProducts.deleteHomeBrandProduct(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
    updatePositions: protectedProcedure
        .input(
            z.array(
                z.object({
                    id: z.string(),
                    position: z.number(),
                })
            )
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
            const { queries } = ctx;
            return queries.homeBrandProducts.updateHomeBrandProductPositions(
                input
            );
        }),
});

export const homeShopByCategoryRouter = createTRPCRouter({
    getHomeShopByCategories: publicProcedure
        .input(
            z.object({
                limit: z.number().int().positive().default(10),
                page: z.number().int().positive().default(1),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { limit, page } = input;

            const homeShopByCategories =
                await queries.homeShopByCategories.getHomeShopByCategories({
                    limit,
                    page,
                });

            return homeShopByCategories;
        }),
    getHomeShopByCategory: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.homeShopByCategories.getHomeShopByCategory(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createHomeShopByCategory: protectedProcedure
        .input(createHomeShopByCategorySchema)
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
            const { queries } = ctx;

            if (!input.imageUrl)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Image URL is required",
                });

            const newHomeShopByCategory =
                await queries.homeShopByCategories.createHomeShopByCategory({
                    ...input,
                    imageUrl: input.imageUrl,
                });

            return newHomeShopByCategory;
        }),
    updateHomeShopByCategory: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                values: updateHomeShopByCategorySchema,
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
            const { queries } = ctx;
            const { id, values } = input;

            if (!values.imageUrl)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Image URL is required",
                });

            const existingHomeShopByCategory =
                await queries.homeShopByCategories.getHomeShopByCategory(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            if (existingImageUrl !== values.imageUrl) {
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.homeShopByCategories.updateHomeShopByCategory(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteHomeShopByCategory: protectedProcedure
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
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.homeShopByCategories.getHomeShopByCategory(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.homeShopByCategories.deleteHomeShopByCategory(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});

export const homeShopByCategoryTitleRouter = createTRPCRouter({
    getHomeShopByCategoryTitle: publicProcedure.query(async ({ ctx }) => {
        const { queries } = ctx;

        const homeShopByCategoryTitle =
            await queries.homeShopByCategoryTitle.getHomeShopByCategoryTitle();

        return homeShopByCategoryTitle;
    }),
    updateHomeShopByCategoryTitle: protectedProcedure
        .input(
            z.object({
                title: z.string(),
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
            const { queries } = ctx;

            const existingHomeShopByCategoryTitle =
                await queries.homeShopByCategoryTitle.getHomeShopByCategoryTitle();

            if (!existingHomeShopByCategoryTitle) {
                const newHomeShopByCategoryTitle =
                    await queries.homeShopByCategoryTitle.createHomeShopByCategoryTitle(
                        input.title
                    );

                return newHomeShopByCategoryTitle;
            }

            const updatedHomeShopByCategoryTitle =
                await queries.homeShopByCategoryTitle.updateHomeShopByCategoryTitle(
                    input.title
                );

            return updatedHomeShopByCategoryTitle;
        }),
});

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
            const { queries } = ctx;
            const { limit, page, isActive, search } = input;

            const banners = await queries.banners.getBanners({
                limit,
                page,
                isActive,
                search,
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
            const { queries } = ctx;
            const { id } = input;

            const existingBanner = await queries.banners.getBanner(id);
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
            const { queries } = ctx;

            if (!input.imageUrl)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Image URL is required",
                });

            const newBanner = await queries.banners.createBanner({
                ...input,
                imageUrl: input.imageUrl,
            });
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
            const { queries } = ctx;
            const { id, data } = input;

            if (!data.imageUrl)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Image URL is required",
                });

            const existingBanner = await queries.banners.getBanner(id);
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

            const updatedBanner = await queries.banners.updateBanner(id, {
                ...data,
                imageUrl: data.imageUrl,
            });

            await bannerCache.remove(updatedBanner.id);

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
            const { queries } = ctx;
            const { id, isActive } = input;

            const existingBanner = await queries.banners.getBanner(id);
            if (!existingBanner)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Banner not found",
                });

            const updatedBanner = await queries.banners.updateBannerStatus(
                id,
                isActive
            );

            await bannerCache.remove(id);

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
            const { queries } = ctx;
            const { id } = input;

            const existingBanner = await queries.banners.getBanner(id);
            if (!existingBanner)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Banner not found",
                });

            const existingImageUrl = existingBanner.imageUrl;
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.banners.deleteBanner(id),
                utApi.deleteFiles([existingKey]),
                ...(existingBanner.isActive ? [bannerCache.remove(id)] : []),
            ]);

            return true;
        }),
});

export const marketingStripRouter = createTRPCRouter({
    getMarketingStrips: publicProcedure
        .input(
            z.object({
                limit: z.number().int().positive().default(10),
                page: z.number().int().positive().default(1),
                isActive: z.boolean().optional(),
                search: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { limit, page, isActive, search } = input;

            const marketingStrips =
                await queries.marketingStrips.getMarketingStrips({
                    limit,
                    page,
                    isActive,
                    search,
                });

            return marketingStrips;
        }),
    getMarketingStrip: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingMarketingStrip =
                await queries.marketingStrips.getMarketingStrip(id);
            if (!existingMarketingStrip)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Marketing strip not found",
                });

            return existingMarketingStrip;
        }),
    createMarketingStrip: protectedProcedure
        .input(createMarketingStripSchema)
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
            const { queries } = ctx;

            if (!input.imageUrl)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Image URL is required",
                });

            const newMarketingStrip =
                await queries.marketingStrips.createMarketingStrip({
                    ...input,
                    imageUrl: input.imageUrl,
                });
            if (input.isActive)
                await marketingStripCache.add(newMarketingStrip);

            return newMarketingStrip;
        }),
    updateMarketingStrip: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                data: updateMarketingStripSchema,
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
            const { queries } = ctx;
            const { id, data } = input;

            if (!data.imageUrl)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Image URL is required",
                });

            const existingMarketingStrip =
                await queries.marketingStrips.getMarketingStrip(id);
            if (!existingMarketingStrip)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Marketing strip not found",
                });

            const existingImageUrl = existingMarketingStrip.imageUrl;
            if (existingImageUrl !== data.imageUrl) {
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedMarketingStrip =
                await queries.marketingStrips.updateMarketingStrip(id, {
                    ...data,
                    imageUrl: data.imageUrl,
                });

            await marketingStripCache.remove(updatedMarketingStrip.id);

            return updatedMarketingStrip;
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
            const { queries } = ctx;
            const { id, isActive } = input;

            const existingMarketingStrip =
                await queries.marketingStrips.getMarketingStrip(id);
            if (!existingMarketingStrip)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Marketing strip not found",
                });

            const updatedMarketingStrip =
                await queries.marketingStrips.updateMarketingStripStatus(
                    id,
                    isActive
                );

            await marketingStripCache.remove(id);

            return updatedMarketingStrip;
        }),
    deleteMarketingStrip: protectedProcedure
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
            const { queries } = ctx;
            const { id } = input;

            const existingMarketingStrip =
                await queries.marketingStrips.getMarketingStrip(id);
            if (!existingMarketingStrip)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Marketing strip not found",
                });

            const existingImageUrl = existingMarketingStrip.imageUrl;
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.marketingStrips.deleteMarketingStrip(id),
                utApi.deleteFiles([existingKey]),
                ...(existingMarketingStrip.isActive
                    ? [marketingStripCache.remove(id)]
                    : []),
            ]);

            return true;
        }),
});

export const contentRouter = createTRPCRouter({
    advertisements: advertisementRouter,
    banners: bannerRouter,
    marketingStrips: marketingStripRouter,
    homeBrandProducts: homeBrandProductRouter,
    homeShopByCategories: homeShopByCategoryRouter,
    homeShopByCategoryTitle: homeShopByCategoryTitleRouter,
});
