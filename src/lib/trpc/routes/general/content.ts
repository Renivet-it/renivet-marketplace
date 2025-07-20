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
                // @ts-ignore
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
                // @ts-ignore
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

export const womenhomeBannerRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getAllHomeShopByCategories({
                    limit,
                    page,
                });

            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
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
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createHomeShopByCategory({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getHomeShopByCategory(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            if (existingImageUrl !== values.imageUrl) {
            //@ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateHomeShopByCategory(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getHomeShopByCategory(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            //@ts-ignore
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deleteHomeShopByCategory(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});

export const womenElavateLooksSectionRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getAllelavateLooks({
                    limit,
                    page,
                });
console.log("homeShopByCategories", homeShopByCategories);
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getAllelavateLook(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createAllelavateLooks({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: input.title ?? null,
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getAllelavateLook(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            // @ts-ignore
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deleteAllelavateLooks(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});

export const womenStyleDirectoryRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getAllstyleDirectory({
                    limit,
                    page,
                });
console.log("homeShopByCategories", homeShopByCategories);
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getstyledirectory(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createAllstyleDirectory({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: input.title ?? null,
                    // @ts-ignore
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getstyledirectory(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            if (existingImageUrl !== values.imageUrl) {
                //@ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateAllstyleDirectory(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getstyledirectory(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            // @ts-ignore
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deletestyleDirectory(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});

export const womenNewCollectionRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getNewCollections({
                    limit,
                    page,
                });
console.log("homeShopByCategories", homeShopByCategories);
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getNewCollection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createNewCollectionDirectory({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getNewCollection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            if (existingImageUrl !== values.imageUrl) {
                //@ts-ignore

                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateNewCollectionDirectory(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getNewCollection(id);
                console.log(existingHomeShopByCategory, "existingHomeShopByCategory");
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            // @ts-ignore
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deletNewCollectionDirectory(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});

export const menMoodBoardSectionRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getMenMoodBoardSection({
                    limit,
                    page,
                });
console.log("homeShopByCategories", homeShopByCategories);
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getAllMenMoodBoardSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createMenMoodBoardSection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getAllMenMoodBoardSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateMenMoodBoardSection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getAllMenMoodBoardSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deleteMenMoodBoardSection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});



export const menFresInkSectionRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getMenFreshInkCollection({
                    limit,
                    page,
                });
console.log("homeShopByCategories", homeShopByCategories);
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getAllMenFreshInkCollection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createMenFreshInkCollection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getAllMenFreshInkCollection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateMenFreshInkCollection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getAllMenFreshInkCollection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deleteMenFreshInkCollection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});

export const womenDiscountOfferRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getNewOfferSections({
                    limit,
                    page,
                });
console.log("homeShopByCategories", homeShopByCategories);
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getNewOfferSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createNewOfferSection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getNewCollection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateNewOfferSection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getNewOfferSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deletNewOfferSection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});

export const womenMoodBoardRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getWomenMoodBoards({
                    limit,
                    page,
                });
console.log("homeShopByCategories", homeShopByCategories);
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getWomenMoodBoard(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createWomenMoodBoard({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getWomenMoodBoard(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateWomenMoodBoard(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getWomenMoodBoard(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore

            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deletWomenMoodBoard(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});

export const womenTopCollectionRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getWomenStyleSubstanceSections({
                    limit,
                    page,
                });
console.log("homeShopByCategories", homeShopByCategories);
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getWomenStyleSubstanceSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createWomenStyleSubstanceSection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getWomenStyleSubstanceSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore

            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateWomenStyleSubstanceSection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getWomenStyleSubstanceSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore

            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deletWomenStyleSubstanceSection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});



export const womenBrandSeasonalSaleRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getWomenSummerSaleSections({
                    limit,
                    page,
                });
console.log("homeShopByCategories", homeShopByCategories);
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getWomenSummerSaleSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createWomenSummerSaleSection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getWomenSummerSaleSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore

            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateWomenSummerSaleSection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getWomenSummerSaleSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore

            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deletWomenSummerSaleSection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});

export const womenFindYourStyleRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getWomenFindYourStyleSections({
                    limit,
                    page,
                });
console.log("homeShopByCategories", homeShopByCategories);
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getWomenFindYourStyleSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createWomenFindYourStyleSection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getWomenFindYourStyleSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore

            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateWomenFindYourStyleSection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getWomenFindYourStyleSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore

            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deletWomenFindYourStyleSection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});

export const womenSuggestedLooksSectionRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getSuggestedLookSections({
                    limit,
                    page,
                });
console.log("homeShopByCategories", homeShopByCategories);
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getSuggestedLookSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createSuggestedLookSection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getSuggestedLookSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore

            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateSuggestedLookSection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getSuggestedLookSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore

            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deletSuggestedLookSection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});


export const womenBrandStoryTellingRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getwomenBranStoryTellingSections({
                    limit,
                    page,
                });
console.log("homeShopByCategories", homeShopByCategories);
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getwomenBranStoryTellingSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createwomenBranStoryTellingSection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getwomenBranStoryTellingSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore

            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updatewomenBranStoryTellingSection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getwomenBranStoryTellingSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore

            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deletwomenBranStoryTellingSection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});


export const womenSkinCareSectionRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getwomenBrandSkinCareSections({
                    limit,
                    page,
                });
console.log("homeShopByCategories", homeShopByCategories);
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getwomenBrandSkinCareSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createwomenBrandSkinCareSection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getwomenBrandSkinCareSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore

            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updatewomenBrandSkinCareSection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getwomenBrandSkinCareSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore

            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deletwomenBranStoryTellingSection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});

export const womenOutfitVarientRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getAlloutfitVarients({
                    limit,
                    page,
                });
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getoutfitVarient(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createAlloutfitVarients({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getoutfitVarient(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore

            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateAlloutfitVarients(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getoutfitVarient(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore

            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deleteoutfitVarients(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});

export const womenExpoloreCategorySectionRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getAllexploreCategories({
                    limit,
                    page,
                });

            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getAllMenExploreCategorySection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createAllexploreCategories({
                    ...input,
                    imageUrl: input.imageUrl,
                    // title: input.title,
                    title: input.title ?? null,
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
// @ts-ignore
                await queries.womenhomebanner.updateAllexploreCategories(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore

            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateAllexploreCategories(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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

// @ts-ignore
                await queries.womenhomebanner.getAllexploreCategory(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore

            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deleteAllexploreCategories(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});


//kids section

export const kidBannerSectionRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getKidsBannerSections({
                    limit,
                    page,
                });
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getKidsBannerSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createKidsBannerSection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getKidsBannerSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateKidsBannerSection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getKidsBannerSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deleteKidsBannerSection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});


//kids section

export const kidExploreCategorySectionRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getKidsExploreCategorySections({
                    limit,
                    page,
                });
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getKidsExploreCategorySection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createKidsExploreCategorySection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: input.title ?? null,
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getKidsExploreCategorySection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateKidsExploreCategorySection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getKidsExploreCategorySection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deleteKidsExploreCategorySection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});

// special care section
export const kidSpecialCareSectionRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getKidsCareSections({
                    limit,
                    page,
                });
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getKidsCareSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createKidsCareSection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getKidsCareSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateKidsCareSection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getKidsCareSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deleteKidsCareSection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});


//kids banner
export const homeAndLivingBannerRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.gethomeAndLivingSections({
                    limit,
                    page,
                });
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.gethomeAndLivingSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createhomeAndLivingSection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.gethomeAndLivingSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updatehomeAndLivingSection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.gethomeAndLivingSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deletehomeAndLivingSection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});


//explore category section
export const homeAndLivingExploreCategoryRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.gethomeAndLivingCategoryExploreSections({
                    limit,
                    page,
                });
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.gethomeAndLivingCategoryExploreSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createhomeAndLivingCategoryExploreSection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: input.title ?? null,
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.gethomeAndLivingCategoryExploreSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updatehomeAndLivingCategoryExploreSection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.gethomeAndLivingCategoryExploreSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deletehomeAndLivingCategoryExploreSection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});

//new collection

//new category section
export const homeAndLivingNewCollectionRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.gethomeAndLivingNewCollectionSections({
                    limit,
                    page,
                });
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.gethomeAndLivingNewCollectionSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createhomeAndLivingNewCollectionSection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.gethomeAndLivingNewCollectionSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updatehomeAndLivingNewCollectionSection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.gethomeAndLivingNewCollectionSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deletehomeAndLivingNewCollectionSection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});


//new category section
export const homeAndLivingTopPickcollectionRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.gethomeAndLivingTopPickSections({
                    limit,
                    page,
                });
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.gethomeAndLivingTopPickSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createhomeAndLivingTopPickSection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.gethomeAndLivingTopPickSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updatehomeAndLivingTopPickSection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.gethomeAndLivingTopPickSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deletehomeAndLivingTopPickSection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});


export const homeAndLivingBannerMiddlecollectionRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.gethomeAndLivingBannerMiddleSections({
                    limit,
                    page,
                });
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.gethomeAndLivingBannerMiddleSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createhomeAndLivingBannerMiddleSection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.gethomeAndLivingBannerMiddleSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updatehomeAndLivingBannerMiddleSection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.gethomeAndLivingBannerMiddleSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deletehomeAndLivingBannerMiddleSection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});

export const homeAndLivingEcoBannercollectionRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.gethomeAndLivingEcoBanners({
                    limit,
                    page,
                });
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.gethomeAndLivingEcoBanner(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createhomeAndLivingEcoBanner({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.gethomeAndLivingEcoBanner(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updatehomeAndLivingEcoBanner(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.gethomeAndLivingEcoBanner(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deletehomeAndLivingEcoBanner(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});

export const homeAndLivingCurateConciousRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.gethomeAndLivingCurateConciousSections({
                    limit,
                    page,
                });
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.gethomeAndLivingCurateConciousSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createhomeAndLivingCurateConciousSection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.gethomeAndLivingCurateConciousSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updatehomeAndLivingCurateConciousSection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.gethomeAndLivingCurateConciousSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deletehomeAndLivingCurateConciousSection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});


export const homeAndLivingBrandRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.gethomeAndLivingBrandSections({
                    limit,
                    page,
                });
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.gethomeAndLivingBrandSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createhomeAndLivingBrandSection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.gethomeAndLivingBrandSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updatehomeAndLivingBrandSection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.gethomeAndLivingBrandSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deletehomeAndLivingBrandSection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});



export const beautyBannerRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getBeautyPersonalSections({
                    limit,
                    page,
                });
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getBeautyPersonalSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createBeautyPersonalSection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getBeautyPersonalSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateBeautyPersonalSection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getBeautyPersonalSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deleteBeautyPersonalSection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});
export const beautyExploreCategoryRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getBeautyExploreCategorySections({
                    limit,
                    page,
                });
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getBeautyExploreCategorySection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createBeautyExploreCategorySection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: input.title || null,
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getBeautyExploreCategorySection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateBeautyExploreCategorySection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getBeautyExploreCategorySection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deleteBeautyExploreCategorySection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});

export const beautySkinCareBannerRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getBeautySkinBannerSections({
                    limit,
                    page,
                });
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getBeautySkinBannerSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createBeautySkinBannerSection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getBeautySkinBannerSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateBeautySkinBannerSection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getBeautySkinBannerSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deleteBeautySkinBannerSection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});


export const beautyCareRoutineRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getBeautyCareRoutinetions({
                    limit,
                    page,
                });
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getBeautyCareRoutinetion(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createBeautyCareRoutineSection({
                    ...input,
                    imageUrl: input.imageUrl,
                  title: input.title || null,
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getBeautyCareRoutinetion(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateBeautyCareRoutineSection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getBeautyCareRoutinetion(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deleteBeautyCareRoutineSection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});


export const beautyNurtureRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getBeautyNurtureSections({
                    limit,
                    page,
                });
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getBeautyNurtureSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createBeautyNurtureSection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getBeautyNurtureSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateBeautyNurtureSection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getBeautyNurtureSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deleteBeautyNurtureSection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});


export const beautyDiscountRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getBeautyDiscountSections({
                    limit,
                    page,
                });
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getBeautyDiscountSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createBeautyDiscountSection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getBeautyDiscountSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateBeautyDiscountSection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getBeautyDiscountSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deleteBeautyDiscountSection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});




export const beautyBestSellerRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getBeautyBestSellerSections({
                    limit,
                    page,
                });
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getBeautyBestSellerSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createBeautyBestSellerSection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getBeautyBestSellerSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateBeautyBestSellerSection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getBeautyBestSellerSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deleteBeautyBestSellerSection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});



export const beautyMindFulRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getBeautyMindFulSections({
                    limit,
                    page,
                });
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getBeautyMindFulSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createBeautyMindFulSection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getBeautyMindFulSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateBeautyMindFulSection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getBeautyMindFulSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deleteBeautyMindFulSection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});


export const beautySkinQuizRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getBeautySkinQuizections({
                    limit,
                    page,
                });
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getBeautySkinQuizection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createBeautySkinQuizection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getBeautySkinQuizection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateBeautySkinQuizection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getBeautySkinQuizection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deleteBeautySkinQuizection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});

export const newHomePageTrustedBannerRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getHomePageTrustedSections({
                    limit,
                    page,
                });
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getHomePageTrustedSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createHomePageTrustedSection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getHomePageTrustedSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateHomePageTrustedSection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getHomePageTrustedSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deleteHomePageTrustedSection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});


export const newHomePageBrandIntroRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getHomePageBrandIntroductionSections({
                    limit,
                    page,
                });
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getHomePageBrandIntroductionSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createHomePageBrandIntroductionSection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getHomePageBrandIntroductionSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateHomePageBrandIntroductionSection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getHomePageBrandIntroductionSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deleteHomePageBrandIntroductionSection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});




export const newHomePageMatchingBannerRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getHomePageMatchingSections({
                    limit,
                    page,
                });
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getHomePageMatchingSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createHomePageMatchingSection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getHomePageMatchingSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateHomePageMatchingSection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getHomePageMatchingSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deleteHomePageMatchingSection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});


export const newHomePageFirstConciousRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getHomePageFirstConciousClickSections({
                    limit,
                    page,
                });
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getHomePageFirstConciousClickSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createHomePageFirstConciousClickSection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getHomePageFirstConciousClickSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateHomePageFirstConciousClickSection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getHomePageFirstConciousClickSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deleteHomePageFirstConciousClickSection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});



export const newHomePageSwapBannerRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getHomePageSwapBannerSections({
                    limit,
                    page,
                });
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getHomePageSwapBannerSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createHomePageSwapBannerSection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getHomePageSwapBannerSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateHomePageSwapBannerSection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getHomePageSwapBannerSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deleteHomePageSwapBannerSection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});


export const newHomePageArtisanRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getHomePageNewArtisanSections({
                    limit,
                    page,
                });
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getHomePageNewArtisanSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createHomePageNewArtisanSection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getHomePageNewArtisanSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateHomePageNewArtisanSection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getHomePageNewArtisanSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deleteHomePageNewArtisanSection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});


export const newHomePagInstaRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getHomePageInsaBannerSections({
                    limit,
                    page,
                });
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getHomePageInsaBannerSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createHomePageInsaBannerSection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getHomePageInsaBannerSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateHomePageInsaBannerSection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getHomePageInsaBannerSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deleteHomePageInsaBannerSection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});


//kids elevate section
export const kidDollBannerSectionRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getkidDollBuyingSections({
                    limit,
                    page,
                });
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getkidDollBuyingSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createkidDollBuyingSection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getkidDollBuyingSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updatekidElevateSection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getkidDollBuyingSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deletekidDollBuyingSection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});

//kids discount section


export const kidDiscountSectionRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getkidDiscountOfferSections({
                    limit,
                    page,
                });
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getkidDiscountOfferSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createkidDiscountOfferSection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getkidDiscountOfferSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updatekidDiscountOfferSection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getkidDiscountOfferSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deletekidDiscountOfferSection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});

//doll buying  section
export const kidsDollTwiningSectionRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getkidDolllTwiningSections({
                    limit,
                    page,
                });
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getkidDollTwiningSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createkidDollTwiningSection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getkidDollTwiningSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updatekidDollTwiningSection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getkidDollTwiningSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deletekidDollTwiningSection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});

// men section


export const menhomeBannerRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getMenHomeBannerSections({
                    limit,
                    page,
                });

            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getAllMenHomeBannerSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createMenHomeBannerSection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getAllMenHomeBannerSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore

            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateMenHomeBannerSection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getAllMenHomeBannerSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore

            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deleteMenHomeBannerSection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});

export const menDiscountOfferRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getDiscountOfferSections({
                    limit,
                    page,
                });
console.log("homeShopByCategories", homeShopByCategories);
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getAllDiscountOfferSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createDiscountOfferSection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getAllDiscountOfferSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore

            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateDiscountOfferSection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getAllDiscountOfferSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore

            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deleteDiscountOfferSection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});

export const menElavateLooksSectionRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getMenelevateLooksections({
                    limit,
                    page,
                });
console.log("homeShopByCategories", homeShopByCategories);
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getAllelavateLook(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createMenelevateLooksection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: input.title ?? null,
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getAllelavateLook(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore

            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateMenelevateLooksection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getAllMenelevateLooksection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore

            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                //@ts-ignore
                queries.womenhomebanner.deleteMenelevateLooksection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});

export const menStyleDirectoryRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getStyleDirectorySections({
                    limit,
                    page,
                });
console.log("homeShopByCategories", homeShopByCategories);
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getAllStyleDirectorySection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createStyleDirectorySection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: input.title ?? null,
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getAllStyleDirectorySection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore

            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateStyleDirectorySection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getAllStyleDirectorySection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore

            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deleteStyleDirectorySection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});

export const menOutfitVarientRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getMenOutFitVarientSections({
                    limit,
                    page,
                });
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getAllMenOutFitVarientSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createMenOutFitVarientSection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getAllMenOutFitVarientSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore

            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateMenOutFitVarientSection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getAllMenOutFitVarientSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore

            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deleteMenOutFitVarientSection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});

export const menExpoloreCategorySectionRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getMenExploreCategorySections({
                    limit,
                    page,
                });

            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getAllMenExploreCategorySection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createMenExploreCategorySection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: input.title ?? null,
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getAllMenExploreCategorySection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore

            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateMenExploreCategorySection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getAllMenExploreCategorySection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore

            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deleteMenExploreCategorySection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});

export const menSuggestedLooksSectionRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getSuggestedLooksForYous({
                    limit,
                    page,
                });
console.log("homeShopByCategories", homeShopByCategories);
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getAllSuggestedLooksForYou(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createSuggestedLooksForYou({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getAllSuggestedLooksForYou(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore

            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateSuggestedLooksForYou(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getAllSuggestedLooksForYou(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore

            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deleteSuggestedLooksForYou(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});

export const menBrandSeasonalSaleRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getWomenSummerSaleSections({
                    limit,
                    page,
                });
console.log("homeShopByCategories", homeShopByCategories);
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getWomenSummerSaleSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createWomenSummerSaleSection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getWomenSummerSaleSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore

            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateWomenSummerSaleSection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getWomenSummerSaleSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore

            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deletWomenSummerSaleSection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});

export const menTopCollectionRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getTopCollectionSections({
                    limit,
                    page,
                });
console.log("homeShopByCategories", homeShopByCategories);
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getAllTopCollectionSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createTopCollectionSection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getAllTopCollectionSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore

            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateTopCollectionSection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getAllTopCollectionSection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore

            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deleteTopCollectionSection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});
export const menNewCollectionRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getMenNewCollections({
                    limit,
                    page,
                });
console.log("homeShopByCategories", homeShopByCategories);
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getAllMenNewCollection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createMenNewCollection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getAllMenNewCollection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore

            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateMenNewCollection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getAllMenNewCollection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore

            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deleteMenNewCollection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});



export const menTopcollectionBannerRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getMenTopcollections({
                    limit,
                    page,
                });
console.log("homeShopByCategories", homeShopByCategories);
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getAllMenTopcollection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createMenTopcollection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getAllMenTopcollection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore

            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateMenTopcollection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getAllMenTopcollection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deleteMenTopcollection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});


export const WomenGetReadyRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getWomenGetReadySection({
                    limit,
                    page,
                });
console.log("homeShopByCategories", homeShopByCategories);
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getAllWomenGetReadySection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createWomenGetReadySection({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getAllWomenGetReadySection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore

            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updateWomenGetReadySection(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getAllWomenGetReadySection(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deleteWomenGetReadySection(id),
                utApi.deleteFiles([existingKey]),
            ]);

            return true;
        }),
});


export const WomenNewDiscountCollectionRouter = createTRPCRouter({
    getwomenHomeBanners: publicProcedure
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
                await queries.womenhomebanner.getnewCollectionDiscountSection({
                    limit,
                    page,
                });
console.log("homeShopByCategories", homeShopByCategories);
            return homeShopByCategories;
        }),
    getwomenHomeBanner: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingHomeShopByCategory =
                await queries.womenhomebanner.getnewCollectionDiscount(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            return existingHomeShopByCategory;
        }),
    createWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.createnewCollectionDiscount({
                    ...input,
                    imageUrl: input.imageUrl,
                    title: "",
                    isActive: false
                });

            return newHomeShopByCategory;
        }),
    updateWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getnewCollectionDiscount(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore

            if (existingImageUrl !== values.imageUrl) {
                // @ts-ignore
                const existingKey = getUploadThingFileKey(existingImageUrl);
                await utApi.deleteFiles([existingKey]);
            }

            const updatedHomeShopByCategory =
                await queries.womenhomebanner.updatenewCollectionDiscount(
                    id,
                    {
                        ...values,
                        imageUrl: values.imageUrl,
                    }
                );

            return updatedHomeShopByCategory;
        }),
    deleteWomenBanner: protectedProcedure
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
                await queries.womenhomebanner.getnewCollectionDiscount(id);
            if (!existingHomeShopByCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Home shop by category not found",
                });

            const existingImageUrl = existingHomeShopByCategory.imageUrl;
                //@ts-ignore
            const existingKey = getUploadThingFileKey(existingImageUrl);

            await Promise.all([
                queries.womenhomebanner.deletenewCollectionDiscount(id),
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
    womenhomeBannerRouter: womenhomeBannerRouter,
    womenExpoloreCategorySectionRouter: womenExpoloreCategorySectionRouter,
    womenElavateLooksSectionRouter: womenElavateLooksSectionRouter,
    womenOutfitVarientRouter: womenOutfitVarientRouter,
    homeShopByCategoryTitle: homeShopByCategoryTitleRouter,
    womenStyleDirectoryRouter: womenStyleDirectoryRouter,
    womenNewDiscountCollectionRouter: WomenNewDiscountCollectionRouter,
    womenDiscountOfferRouter: womenDiscountOfferRouter,
    womenMoodBoardRouter: womenMoodBoardRouter,
    womenTopCollectionRouter:womenTopCollectionRouter,
    womenBrandSeasonalSaleRouter: womenBrandSeasonalSaleRouter,
    womenFindYourStyleRouter: womenFindYourStyleRouter,
    womenSuggestedLooksSectionRouter: womenSuggestedLooksSectionRouter,
    womenBrandStoryTellingRouter: womenBrandStoryTellingRouter,
    womenSkinCareSectionRouter: womenSkinCareSectionRouter,
    menhomeBannerRouter: menhomeBannerRouter,
    menExpoloreCategorySectionRouter: menExpoloreCategorySectionRouter,
    menElavateLooksSectionRouter: menElavateLooksSectionRouter,
    menOutfitVarientRouter: menOutfitVarientRouter,
    menTopCollectionRouter:menTopCollectionRouter,
    menNewCollectionRouter:menNewCollectionRouter,
    menDiscountOfferRouter:menDiscountOfferRouter,
    menSuggestedLooksSectionRouter: menSuggestedLooksSectionRouter,
    menStyleDirectoryRouter:menStyleDirectoryRouter,
    menTopcollectionBannerRouter: menTopcollectionBannerRouter,
    WomenGetReadyRouter: WomenGetReadyRouter,
    WomenNewCollectionRouter: womenNewCollectionRouter,
    menMoodBoardSectionRouter: menMoodBoardSectionRouter,
    menFresInkSectionRouter: menFresInkSectionRouter,
    kidBannerSectionRouter: kidBannerSectionRouter,
    kidExploreCategorySectionRouter: kidExploreCategorySectionRouter,
    kidSpecialCareSectionRouter: kidSpecialCareSectionRouter,
    kidDiscountSectionRouter: kidDiscountSectionRouter,
    kidsDollTwiningSectionRouter: kidsDollTwiningSectionRouter,
    kidDollBannerSectionRouter: kidDollBannerSectionRouter,
    homeAndLivingBannerRouter:homeAndLivingBannerRouter,
    homeAndLivingExploreCategoryRouter: homeAndLivingExploreCategoryRouter,
    homeAndLivingNewCollectionRouter:homeAndLivingNewCollectionRouter,
    homeAndLivingTopPickcollectionRouter: homeAndLivingTopPickcollectionRouter,
    homeAndLivingBannerMiddlecollectionRouter: homeAndLivingBannerMiddlecollectionRouter,
    homeAndLivingEcoBannercollectionRouter: homeAndLivingEcoBannercollectionRouter,
    homeAndLivingBrandRouter: homeAndLivingBrandRouter,
    homeAndLivingCurateConciousRouter: homeAndLivingCurateConciousRouter,
    beautyBannerRouter: beautyBannerRouter,
    beautyExploreCategoryRouter: beautyExploreCategoryRouter,
    beautySkinCareBannerRouter: beautySkinCareBannerRouter,
    beautyCareRoutineRouter: beautyCareRoutineRouter,
    beautyNurtureRouter: beautyNurtureRouter,
    beautyDiscountRouter: beautyDiscountRouter,
    beautyBestSellerRouter: beautyBestSellerRouter,
    beautyMindFulRouter: beautyMindFulRouter,
    beautySkinQuizRouter: beautySkinQuizRouter,
    newHomePageTrustedBannerRouter: newHomePageTrustedBannerRouter,
    newHomePageBrandIntroRouter: newHomePageBrandIntroRouter,
    newHomePageMatchingBannerRouter: newHomePageMatchingBannerRouter,
    newHomePageFirstConciousRouter: newHomePageFirstConciousRouter,
    newHomePageSwapBannerRouter: newHomePageSwapBannerRouter,
    newHomePageArtisanRouter: newHomePageArtisanRouter,
    newHomePagInstaRouter: newHomePagInstaRouter

});
