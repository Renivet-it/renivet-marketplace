import {
    CreateCategorizeProduct,
    CreateProduct,
    ProductWithBrand,
    productWithBrandSchema,
    UpdateProduct,
} from "@/lib/validations";
import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db } from "..";
import { productCategories, products } from "../schema";

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
        categoryId,
        subCategoryId,
        productTypeId,
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
        categoryId?: string;
        subCategoryId?: string;
        productTypeId?: string;
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

        const filters = [
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
            eq(products.status, true),
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

            // const data = await db.query.productCategories.findMany({
            //     where: and(
            //         eq(productCategories.categoryId, categoryId),
            //         eq(productCategories.subcategoryId, subcategoryId),
            //         eq(productCategories.productTypeId, productTypeId),
            //         ...filters
            //     ),
            //     with: {
            //         product: {
            //             with: {
            //                 brand: true,
            //                 categories: {
            //                     with: {
            //                         category: true,
            //                         subcategory: true,
            //                         productType: true,
            //                     },
            //                 },
            //             },
            //             extras: {
            //                 count: db
            //                     .$count(products, and(...filters))
            //                     .as("product_count"),
            //             },
            //         },
            //     },
            //     limit,
            //     offset: (page - 1) * limit,
            // });
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

    async getProduct(productId: string, visibility?: "published" | "draft") {
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
                categories: {
                    with: {
                        category: true,
                        subcategory: true,
                        productType: true,
                    },
                },
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
