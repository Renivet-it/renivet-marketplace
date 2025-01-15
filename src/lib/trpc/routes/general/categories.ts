import { env } from "@/../env";
import { BitFieldSitePermission } from "@/config/permissions";
import { brandCache, categoryCache } from "@/lib/redis/methods";
import { resend } from "@/lib/resend";
import { CategoryRequestStatusUpdate } from "@/lib/resend/emails";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
    publicProcedure,
} from "@/lib/trpc/trpc";
import { slugify } from "@/lib/utils";
import {
    categoryRequestSchema,
    createCategorySchema,
    updateCategorySchema,
} from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const categoryRequestsRouter = createTRPCRouter({
    getRequests: protectedProcedure
        .input(
            z.object({
                limit: z.number().int().positive().default(10),
                page: z.number().int().positive().default(1),
                status: categoryRequestSchema.shape.status.optional(),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_CATEGORIES))
        .query(async ({ input, ctx }) => {
            const { queries } = ctx;
            const { limit, page, status } = input;

            const data = await queries.categoryRequests.getCategoryRequests({
                limit,
                page,
                status,
            });

            return data;
        }),
    getRequest: protectedProcedure
        .input(
            z.object({
                id: categoryRequestSchema.shape.id,
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_CATEGORIES))
        .query(async ({ input, ctx }) => {
            const { queries } = ctx;
            const { id } = input;

            const data = await queries.categoryRequests.getCategoryRequest(id);
            if (!data)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Category request not found",
                });

            return data;
        }),
    approveRequest: protectedProcedure
        .input(
            z.object({
                id: categoryRequestSchema.shape.id,
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_CATEGORIES))
        .mutation(async ({ input, ctx }) => {
            const { queries } = ctx;
            const { id } = input;

            const categoryRequest =
                await queries.categoryRequests.getCategoryRequest(id);
            if (!categoryRequest)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Category request not found",
                });

            const existingBrand = await brandCache.get(categoryRequest.brandId);
            if (!existingBrand)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand not found",
                });

            const data =
                await queries.categoryRequests.updateCategoryRequestStatus(id, {
                    status: "approved",
                    rejectionReason: null,
                });

            await resend.emails.send({
                from: env.RESEND_EMAIL_FROM,
                to: existingBrand.email,
                subject: `Category Request Approved - ${existingBrand.name}`,
                react: CategoryRequestStatusUpdate({
                    user: {
                        name: existingBrand.name,
                    },
                    category: {
                        content: categoryRequest.content,
                        status: "approved",
                    },
                    brand: {
                        id: categoryRequest.brandId,
                        name: existingBrand.name,
                    },
                }),
            });

            return data;
        }),
    rejectRequest: protectedProcedure
        .input(
            z.object({
                id: categoryRequestSchema.shape.id,
                rejectionReason: categoryRequestSchema.shape.rejectionReason,
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_CATEGORIES))
        .mutation(async ({ input, ctx }) => {
            const { queries } = ctx;
            const { id, rejectionReason } = input;

            const categoryRequest =
                await queries.categoryRequests.getCategoryRequest(id);
            if (!categoryRequest)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Category request not found",
                });

            const existingBrand = await brandCache.get(categoryRequest.brandId);
            if (!existingBrand)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand not found",
                });

            const data =
                await queries.categoryRequests.updateCategoryRequestStatus(id, {
                    status: "rejected",
                    rejectionReason,
                });

            await resend.emails.send({
                from: env.RESEND_EMAIL_FROM,
                to: existingBrand.email,
                subject: `Category Request Rejected - ${existingBrand.name}`,
                react: CategoryRequestStatusUpdate({
                    user: {
                        name: existingBrand.name,
                    },
                    category: {
                        content: categoryRequest.content,
                        status: "rejected",
                        rejectionReason: rejectionReason ?? "",
                    },
                    brand: {
                        id: categoryRequest.brandId,
                        name: existingBrand.name,
                    },
                }),
            });

            return data;
        }),
});

export const categoriesRouter = createTRPCRouter({
    requests: categoryRequestsRouter,
    getCategories: publicProcedure.query(async () => {
        const categories = await categoryCache.getAll();
        return {
            data: categories,
            count: categories.length,
        };
    }),
    getCategory: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ input }) => {
            const { id } = input;

            const category = await categoryCache.get(id);
            if (!category)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Category not found",
                });

            return category;
        }),
    createCategory: protectedProcedure
        .input(createCategorySchema)
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_SETTINGS))
        .mutation(async ({ input, ctx }) => {
            const { queries } = ctx;

            const slug = slugify(input.name);

            const existingCategory =
                await queries.categories.getCategoryBySlug(slug);
            if (existingCategory)
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "Category already exists",
                });

            const newCategory = await queries.categories.createCategory({
                ...input,
                slug,
            });

            await categoryCache.add({
                ...newCategory,
                subCategories: 0,
            });

            return newCategory;
        }),
    updateCategory: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                data: updateCategorySchema,
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_SETTINGS))
        .mutation(async ({ input, ctx }) => {
            const { queries } = ctx;
            const { id, data } = input;

            const existingCategory = categoryCache.get(id);
            if (!existingCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Category not found",
                });

            const slug = slugify(data.name);

            const existingOtherCategory =
                await queries.categories.getOtherCategory(slug, id);
            if (existingOtherCategory)
                throw new TRPCError({
                    code: "CONFLICT",
                    message:
                        "Another category with the same name already exists",
                });

            const [updatedCategory] = await Promise.all([
                queries.categories.updateCategory(id, {
                    ...data,
                    slug,
                }),
                categoryCache.remove(id),
            ]);

            return updatedCategory;
        }),
    deleteCategory: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_SETTINGS))
        .mutation(async ({ input, ctx }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingCategory = await categoryCache.get(id);
            if (!existingCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Category not found",
                });

            await Promise.all([
                queries.categories.deleteCategory(id),
                categoryCache.remove(id),
            ]);

            return true;
        }),
});
