import {
    couponWithCategorySchema,
    CreateCoupon,
    UpdateCoupon,
} from "@/lib/validations";
import { and, desc, eq, ilike } from "drizzle-orm";
import { db } from "..";
import { coupons } from "../schema";

class CouponQuery {
    async getCount({
        isActive,
        categoryId,
        subCategoryId,
        productTypeId,
    }: {
        isActive?: boolean;
        categoryId?: string;
        subCategoryId?: string;
        productTypeId?: string;
    }) {
        const data = await db.$count(
            coupons,
            and(
                isActive !== undefined
                    ? eq(coupons.isActive, isActive)
                    : undefined,
                !!categoryId?.length
                    ? eq(coupons.categoryId, categoryId)
                    : undefined,
                !!subCategoryId?.length
                    ? eq(coupons.subCategoryId, subCategoryId)
                    : undefined,
                !!productTypeId?.length
                    ? eq(coupons.productTypeId, productTypeId)
                    : undefined
            )
        );
        return +data || 0;
    }

    async getAllCoupons() {
        const data = await db.query.coupons.findMany({
            with: {
                category: true,
                subCategory: true,
                productType: true,
            },
        });

        return couponWithCategorySchema.array().parse(data);
    }

    async getCoupons({
        isActive,
        categoryId,
        subCategoryId,
        productTypeId,
        limit,
        page,
        search,
    }: {
        isActive?: boolean;
        categoryId?: string;
        subCategoryId?: string;
        productTypeId?: string;
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.coupons.findMany({
            with: {
                category: true,
                subCategory: true,
                productType: true,
            },
            where: and(
                isActive !== undefined
                    ? eq(coupons.isActive, isActive)
                    : undefined,
                !!categoryId?.length
                    ? eq(coupons.categoryId, categoryId)
                    : undefined,
                !!subCategoryId?.length
                    ? eq(coupons.subCategoryId, subCategoryId)
                    : undefined,
                !!productTypeId?.length
                    ? eq(coupons.productTypeId, productTypeId)
                    : undefined,
                !!search?.length
                    ? ilike(coupons.code, `%${search}%`)
                    : undefined
            ),
            limit,
            offset: (page - 1) * limit,
            orderBy: [desc(coupons.createdAt)],
            extras: {
                count: db
                    .$count(
                        coupons,
                        and(
                            isActive !== undefined
                                ? eq(coupons.isActive, isActive)
                                : undefined,
                            !!categoryId?.length
                                ? eq(coupons.categoryId, categoryId)
                                : undefined,
                            !!subCategoryId?.length
                                ? eq(coupons.subCategoryId, subCategoryId)
                                : undefined,
                            !!productTypeId?.length
                                ? eq(coupons.productTypeId, productTypeId)
                                : undefined,
                            !!search?.length
                                ? ilike(coupons.code, `%${search}%`)
                                : undefined
                        )
                    )
                    .as("coupon_count"),
            },
        });

        const parsed = couponWithCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getCoupon({
        code,
        isActive,
        categoryId,
        subCategoryId,
        productTypeId,
    }: {
        code: string;
        isActive?: boolean;
        categoryId?: string;
        subCategoryId?: string;
        productTypeId?: string;
    }) {
        const data = await db.query.coupons.findFirst({
            with: {
                category: true,
                subCategory: true,
                productType: true,
            },
            where: and(
                eq(coupons.code, code),
                isActive !== undefined
                    ? eq(coupons.isActive, isActive)
                    : undefined,
                !!categoryId?.length
                    ? eq(coupons.categoryId, categoryId)
                    : undefined,
                !!subCategoryId?.length
                    ? eq(coupons.subCategoryId, subCategoryId)
                    : undefined,
                !!productTypeId?.length
                    ? eq(coupons.productTypeId, productTypeId)
                    : undefined
            ),
        });
        if (!data) return null;

        return couponWithCategorySchema.parse(data);
    }

    async createCoupon(values: CreateCoupon) {
        const data = await db
            .insert(coupons)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateCoupon(code: string, values: UpdateCoupon) {
        const data = await db
            .update(coupons)
            .set(values)
            .where(eq(coupons.code, code))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateCouponUses(code: string, uses: number) {
        const data = await db
            .update(coupons)
            .set({ uses })
            .where(eq(coupons.code, code))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateCouponStatus(code: string, isActive: boolean) {
        const data = await db
            .update(coupons)
            .set({ isActive })
            .where(eq(coupons.code, code))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteCoupon(code: string) {
        const data = await db
            .delete(coupons)
            .where(eq(coupons.code, code))
            .returning()
            .then((res) => res[0]);

        return data;
    }
}

export const couponQueries = new CouponQuery();
