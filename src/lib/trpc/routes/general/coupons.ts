import { BitFieldSitePermission } from "@/config/permissions";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
    publicProcedure,
} from "@/lib/trpc/trpc";
import { convertPaiseToRupees, formatPriceTag } from "@/lib/utils";
import { createCouponSchema, updateCouponSchema } from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const couponRouter = createTRPCRouter({
    getActiveCoupons: publicProcedure.query(async ({ ctx }) => {
        const { queries } = ctx;
        const data = await queries.coupons.getActiveCoupons();
        return data;
    }),
    getCoupons: protectedProcedure
        .input(
            z.object({
                limit: z.number().int().positive().default(10),
                page: z.number().int().positive().default(1),
                search: z.string().optional(),
                isActive: z.boolean().optional(),
                categoryId: z.string().uuid().optional(),
                subCategoryId: z.string().uuid().optional(),
                productTypeId: z.string().uuid().optional(),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_SETTINGS))
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;

            const data = await queries.coupons.getCoupons(input);
            return data;
        }),
    getCoupon: publicProcedure
        .input(
            z.object({
                code: z.string(),
                isActive: z.boolean().optional(),
                categoryId: z.string().uuid().optional(),
                subCategoryId: z.string().uuid().optional(),
                productTypeId: z.string().uuid().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;

            const data = await queries.coupons.getCoupon(input);
            if (!data)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Coupon not found",
                });

            return data;
        }),
    validateCoupon: publicProcedure
        .input(
            z.object({
                code: z.string(),
                totalAmount: z.number().nonnegative(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { queries } = ctx;

            const data = await queries.coupons.getCoupon({
                ...input,
                isActive: true,
            });
            if (!data)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Coupon is invalid",
                });
            if (data.expiresAt && new Date(data.expiresAt) <= new Date())
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Coupon has expired",
                });
            if (input.totalAmount < data.minOrderAmount)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: `Coupon requires a minimum order amount of ${formatPriceTag(
                        +convertPaiseToRupees(data.minOrderAmount)
                    )}`,
                });
            if (data.maxUses !== 0 && data.uses >= data.maxUses)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Coupon has reached maximum usage limit",
                });
            if (
                data.maxDiscountAmount &&
                data.maxDiscountAmount > input.totalAmount
            )
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message:
                        "Coupon cannot be applied as the discount exceeds the total amount",
                });

            return data;
        }),
    createCoupon: protectedProcedure
        .input(createCouponSchema)
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_SETTINGS))
        .mutation(async ({ ctx, input }) => {
            const { queries } = ctx;

            const existingCoupon = await queries.coupons.getCoupon({
                code: input.code,
            });
            if (existingCoupon)
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "Another coupon with the same code already exists",
                });

            const data = await queries.coupons.createCoupon(input);
            return data;
        }),
    updateCoupon: protectedProcedure
        .input(z.object({ code: z.string(), values: updateCouponSchema }))
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_SETTINGS))
        .mutation(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { code, values } = input;

            const existingCoupon = await queries.coupons.getCoupon({ code });
            if (!existingCoupon)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Coupon not found",
                });

            const data = await queries.coupons.updateCoupon(code, values);
            return data;
        }),
    updateCouponStatus: protectedProcedure
        .input(z.object({ code: z.string(), isActive: z.boolean() }))
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_SETTINGS))
        .mutation(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { code, isActive } = input;

            const existingCoupon = await queries.coupons.getCoupon({ code });
            if (!existingCoupon)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Coupon not found",
                });

            if (existingCoupon.isActive === isActive)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: `Coupon is already ${
                        isActive ? "active" : "inactive"
                    }`,
                });

            const data = await queries.coupons.updateCouponStatus(
                code,
                isActive
            );
            return data;
        }),
    deleteCoupon: protectedProcedure
        .input(z.object({ code: z.string() }))
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_SETTINGS))
        .mutation(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { code } = input;

            const existingCoupon = await queries.coupons.getCoupon({ code });
            if (!existingCoupon)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Coupon not found",
                });

            const data = await queries.coupons.deleteCoupon(code);
            return data;
        }),
});
