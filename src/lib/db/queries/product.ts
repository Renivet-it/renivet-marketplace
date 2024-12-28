import {
    CreateCategorizeProduct,
    CreateProduct,
    ProductWithBrand,
    productWithBrandSchema,
    UpdateProduct,
} from "@/lib/validations";
import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db } from "..";
import { productCategories, products, productVariants } from "../schema";

class ProductQuery {
    async getProductCount(brandId: string, status?: "active" | "deleted") {
        const data = await db.$count(
            products,
            and(
                eq(products.brandId, brandId),
                status !== undefined
                    ? eq(products.isDeleted, status === "deleted")
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
        categoryId,
        subCategoryId,
        productTypeId,
        isAvailable,
        isPublished,
        sortBy = "createdAt",
        sortOrder = "desc",
        colors,
        status,
    }: {
        limit: number;
        page: number;
        search?: string;
        brandIds?: string[];
        minPrice?: number;
        maxPrice?: number;
        categoryId?: string;
        subCategoryId?: string;
        productTypeId?: string;
        isAvailable?: boolean;
        isPublished?: boolean;
        sortBy?: "price" | "createdAt";
        sortOrder?: "asc" | "desc";
        colors?: string[];
        status?: "idle" | "pending" | "approved" | "rejected";
    }) {
        const searchQuery = !!search?.length
            ? sql`(
            setweight(to_tsvector('english', ${products.name}), 'A') ||
            setweight(to_tsvector('english', ${products.description}), 'B'))
            @@ plainto_tsquery('english', ${search})`
            : undefined;

        const filters = [
            searchQuery,
            !!brandIds?.length
                ? inArray(products.brandId, brandIds)
                : undefined,
            !!minPrice ? gte(products.price, minPrice) : undefined,
            !!maxPrice ? lte(products.price, maxPrice) : undefined,
            isAvailable !== undefined
                ? eq(products.isAvailable, isAvailable)
                : undefined,
            isPublished !== undefined
                ? eq(products.isPublished, isPublished)
                : undefined,
            eq(products.isDeleted, false),
            !!colors?.length
                ? sql`EXISTS (
                    SELECT 1 FROM ${productVariants} AS v
                    WHERE v.product_id = ${products.id}
                    AND v.is_deleted = false
                    AND v.color->>'hex' = ANY(${sql`ARRAY[${sql.join(
                        colors.map((hex) => sql`${hex}::text`),
                        ","
                    )}]`})
                )`
                : undefined,
            status !== undefined ? eq(products.status, status) : undefined,
        ];

        if (
            categoryId &&
            subCategoryId &&
            productTypeId &&
            categoryId.length > 0 &&
            subCategoryId.length > 0 &&
            productTypeId.length > 0
        ) {
            const cFilters = [
                ...filters,
                sql`${products.id} IN ${db
                    .select({
                        productId: productCategories.productId,
                    })
                    .from(productCategories)
                    .where(
                        and(
                            eq(productCategories.categoryId, categoryId),
                            eq(productCategories.subcategoryId, subCategoryId),
                            eq(productCategories.productTypeId, productTypeId)
                        )
                    )}`,
            ];

            const query = db.query.products.findMany({
                where: and(...cFilters),
                with: {
                    brand: true,
                    categories: {
                        with: {
                            category: true,
                            subcategory: true,
                            productType: true,
                        },
                    },
                    variants: true,
                },
                limit,
                offset: (page - 1) * limit,
                orderBy: searchQuery
                    ? [
                          sortOrder === "asc"
                              ? asc(products[sortBy])
                              : desc(products[sortBy]),
                          desc(sql`ts_rank(
                        setweight(to_tsvector('english', ${products.name}), 'A') ||
                        setweight(to_tsvector('english', ${products.description}), 'B'),
                        plainto_tsquery('english', ${searchQuery})
                      )`),
                      ]
                    : [
                          sortOrder === "asc"
                              ? asc(products[sortBy])
                              : desc(products[sortBy]),
                      ],
            });

            const data = await query;

            const countQuery = db
                .select({
                    count: sql<number>`count(DISTINCT ${products.id})`,
                })
                .from(products)
                .where(and(...cFilters));

            const [{ count }] = await countQuery;

            const parsed: ProductWithBrand[] = productWithBrandSchema
                .array()
                .parse(data);

            return {
                data: parsed,
                count: +count || 0,
            };
        }

        const data = await db.query.products.findMany({
            with: {
                brand: true,
                categories: {
                    with: {
                        category: true,
                        subcategory: true,
                        productType: true,
                    },
                },
                variants: true,
            },
            where: and(...filters),
            limit,
            offset: (page - 1) * limit,
            orderBy: searchQuery
                ? [
                      sortOrder === "asc"
                          ? asc(products[sortBy])
                          : desc(products[sortBy]),
                      desc(sql`ts_rank(
                        setweight(to_tsvector('english', ${products.name}), 'A') ||
                        setweight(to_tsvector('english', ${products.description}), 'B'),
                        plainto_tsquery('english', ${search})
                      )`),
                  ]
                : [
                      sortOrder === "asc"
                          ? asc(products[sortBy])
                          : desc(products[sortBy]),
                  ],
            extras: {
                count: db.$count(products, and(...filters)).as("product_count"),
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

    async getProduct(
        productId: string,
        visibility?: "published" | "draft",
        status?: "idle" | "pending" | "approved" | "rejected"
    ) {
        const data = await db.query.products.findFirst({
            with: {
                brand: true,
                categories: {
                    with: {
                        category: true,
                        subcategory: true,
                        productType: true,
                    },
                },
                variants: true,
            },
            where: and(
                eq(products.id, productId),
                visibility !== undefined
                    ? eq(products.isPublished, visibility === "published")
                    : undefined,
                status !== undefined ? eq(products.status, status) : undefined
            ),
        });

        return productWithBrandSchema.parse(data);
    }

    async getProductBySlug(
        slug: string,
        visibility?: "published" | "draft",
        status?: "idle" | "pending" | "approved" | "rejected"
    ) {
        const data = await db.query.products.findFirst({
            with: {
                brand: true,
                categories: {
                    with: {
                        category: true,
                        subcategory: true,
                        productType: true,
                    },
                },
                variants: true,
            },
            where: and(
                eq(products.slug, slug),
                visibility !== undefined
                    ? eq(products.isPublished, visibility === "published")
                    : undefined,
                status !== undefined ? eq(products.status, status) : undefined
            ),
        });

        return productWithBrandSchema.optional().parse(data);
    }

    async createProduct(
        values: CreateProduct & {
            slug: string;
            sustainabilityCertificateUrl: string;
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
            sustainabilityCertificateUrl: string;
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

    async sendProductForReview(productId: string) {
        const data = await db
            .update(products)
            .set({
                isSentForReview: true,
                status: "pending",
                updatedAt: new Date(),
            })
            .where(eq(products.id, productId))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async approveProduct(productId: string) {
        const data = await db
            .update(products)
            .set({
                status: "approved",
                isSentForReview: false,
                lastReviewedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(products.id, productId))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async rejectProduct(productId: string, rejectionReason: string | null) {
        const data = await db
            .update(products)
            .set({
                status: "rejected",
                rejectionReason,
                isSentForReview: false,
                lastReviewedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(products.id, productId))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateProductStock(
        values: {
            sku: string;
            quantity: number;
        }[]
    ) {
        const data = await db.transaction(async (tx) => {
            const promises = values.map(({ quantity, sku }) =>
                tx
                    .update(productVariants)
                    .set({
                        quantity,
                        updatedAt: new Date(),
                    })
                    .where(eq(productVariants.sku, sku))
                    .returning()
                    .then((res) => res[0])
            );

            return Promise.all(promises);
        });

        return data;
    }

    async updateVariantAvailability(sku: string, isAvailable: boolean) {
        const data = await db
            .update(productVariants)
            .set({
                isAvailable,
                updatedAt: new Date(),
            })
            .where(eq(productVariants.sku, sku))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async categorizeProduct(
        productId: string,
        toAdd: CreateCategorizeProduct["categories"],
        toRemove: string[]
    ) {
        const [added, removed] = await Promise.all([
            toAdd.length > 0
                ? db
                      .insert(productCategories)
                      .values(
                          toAdd.map((cat) => ({
                              productId,
                              categoryId: cat.categoryId,
                              subcategoryId: cat.subcategoryId,
                              productTypeId: cat.productTypeId,
                          }))
                      )
                      .returning()
                : [],
            toRemove.length > 0
                ? db
                      .delete(productCategories)
                      .where(
                          and(
                              eq(productCategories.productId, productId),
                              inArray(productCategories.id, toRemove)
                          )
                      )
                      .returning()
                : [],
        ]);

        return [added, removed];
    }

    async softDeleteProduct(productId: string) {
        const data = await db
            .update(products)
            .set({
                isDeleted: true,
                isAvailable: false,
                updatedAt: new Date(),
            })
            .where(eq(products.id, productId))
            .returning()
            .then((res) => res[0]);

        return data;
    }
}

export const productQueries = new ProductQuery();
