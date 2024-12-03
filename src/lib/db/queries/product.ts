import {
    CreateProduct,
    ProductWithBrand,
    productWithBrandSchema,
    UpdateProduct,
} from "@/lib/validations";
import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db } from "..";
import { products } from "../schema";

class ProductQuery {
    async getProductCount(brandId: string, status?: "active" | "deleted") {
        const data = await db.$count(
            products,
            and(
                eq(products.brandId, brandId),
                status !== undefined
                    ? eq(products.status, status === "active")
                    : undefined
            )
        );
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
        sortBy = "createdAt",
        sortOrder = "desc",
    }: {
        limit: number;
        page: number;
        search?: string;
        brandIds?: string[];
        minPrice?: number;
        maxPrice?: number;
        isAvailable?: boolean;
        isPublished?: boolean;
        sortBy?: "price" | "createdAt";
        sortOrder?: "asc" | "desc";
    }) {
        const searchQuery = !!search?.length
            ? sql`(
            setweight(to_tsvector('english', ${products.name}), 'A') ||
            setweight(to_tsvector('english', ${products.description}), 'B'))
            @@ plainto_tsquery('english', ${search})`
            : undefined;

        const filters = and(
            searchQuery,
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
                : undefined,
            eq(products.status, true)
        );

        const data = await db.query.products.findMany({
            with: {
                brand: true,
            },
            where: filters,
            limit,
            offset: (page - 1) * limit,
            orderBy: searchQuery
                ? [
                      sortOrder === "asc"
                          ? asc(products[sortBy])
                          : desc(products[sortBy]),
                      //   desc(sql`ts_rank(${searchQuery})`),
                  ]
                : [
                      sortOrder === "asc"
                          ? asc(products[sortBy])
                          : desc(products[sortBy]),
                  ],
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

    async getProduct(productId: string, visibility?: "published" | "draft") {
        const data = await db.query.products.findFirst({
            with: {
                brand: true,
            },
            where: and(
                eq(products.id, productId),
                visibility !== undefined
                    ? eq(products.isPublished, visibility === "published")
                    : undefined
            ),
        });

        return productWithBrandSchema.parse(data);
    }

    async getProductBySlug(slug: string, visibility?: "published" | "draft") {
        const data = await db.query.products.findFirst({
            with: {
                brand: true,
            },
            where: and(
                eq(products.slug, slug),
                visibility !== undefined
                    ? eq(products.isPublished, visibility === "published")
                    : undefined
            ),
        });

        return productWithBrandSchema.parse(data);
    }

    async createProduct(
        values: CreateProduct & {
            slug: string;
        }
    ) {
        const data = await db
            .insert(products)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateProduct(
        productId: string,
        values: UpdateProduct & {
            slug: string;
        }
    ) {
        const data = await db
            .update(products)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(products.id, productId))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async softDeleteProduct(productId: string) {
        const data = await db
            .update(products)
            .set({
                status: false,
                updatedAt: new Date(),
            })
            .where(eq(products.id, productId))
            .returning()
            .then((res) => res[0]);

        return data;
    }
}

export const productQueries = new ProductQuery();
