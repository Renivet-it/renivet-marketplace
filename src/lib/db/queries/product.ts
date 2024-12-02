import {
    CreateProduct,
    ProductWithBrand,
    productWithBrandSchema,
    UpdateProduct,
} from "@/lib/validations";
import { and, eq, gte, ilike, inArray, lte, sql } from "drizzle-orm";
import { db } from "..";
import { products } from "../schema";

class ProductQuery {
    async getProductCount(brandId: string) {
        const data = await db.$count(products, eq(products.brandId, brandId));
        return +data || 0;
    }

    async getProducts({
        limit,
        page,
        search,
        brandIds,
        minPrice,
        maxPrice,
        isAvailable,
        isPublished,
    }: {
        limit: number;
        page: number;
        search?: string;
        brandIds?: string[];
        minPrice?: number;
        maxPrice?: number;
        isAvailable?: boolean;
        isPublished?: boolean;
    }) {
        const filters = and(
            !!search?.length ? ilike(products.name, `%${search}%`) : undefined,
            !!brandIds?.length
                ? inArray(products.brandId, brandIds)
                : undefined,
            !!minPrice
                ? gte(products.price, sql`cast(${minPrice} as numeric)`)
                : undefined,
            !!maxPrice
                ? lte(products.price, sql`cast(${maxPrice} as numeric)`)
                : undefined,
            isAvailable !== undefined
                ? eq(products.isAvailable, isAvailable)
                : undefined,
            isPublished !== undefined
                ? eq(products.isPublished, isPublished)
                : undefined
        );

        const data = await db.query.products.findMany({
            with: {
                brand: true,
            },
            where: filters,
            limit,
            offset: (page - 1) * limit,
            extras: {
                count: db.$count(products, filters).as("product_count"),
            },
        });

        const parsed: ProductWithBrand[] = productWithBrandSchema
            .array()
            .parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getProduct(productId: string, isPublished?: boolean) {
        const data = await db.query.products.findFirst({
            with: {
                brand: true,
            },
            where: and(
                eq(products.id, productId),
                isPublished !== undefined
                    ? eq(products.isPublished, isPublished)
                    : undefined
            ),
        });

        return productWithBrandSchema.parse(data);
    }

    async createProduct(values: CreateProduct) {
        const data = await db
            .insert(products)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateProduct(productId: string, values: UpdateProduct) {
        const data = await db
            .update(products)
            .set(values)
            .where(eq(products.id, productId))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteProduct(productId: string) {
        const data = await db
            .delete(products)
            .where(eq(products.id, productId))
            .returning()
            .then((res) => res[0]);

        return data;
    }
}

export const productQueries = new ProductQuery();
