import { CreateProductType, UpdateProductType } from "@/lib/validations";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { db } from "..";
import { products, productTypes } from "../schema";

class ProductTypeQuery {
    async getCount() {
        const data = await db.$count(productTypes);
        return +data || 0;
    }

    // async getProductTypes() {
    //     const data = await db.query.productTypes.findMany({
    //         orderBy: [desc(productTypes.createdAt)],
    //         with: {
    //             products: true,
    //         },
    //     });

    //     return data;
    // }
    async getProductTypes() {
        const data = await db.query.productTypes.findMany({
            orderBy: [desc(productTypes.createdAt)],
            with: {
                products: {
                    columns: {
                        id: true, // just need one field to count
                    },
                },
            },
        });

        // Add productCount manually
        return data.map((pt) => ({
            ...pt,
            productCount: pt.products.length,
        }));
    }

    async getProductTypeBySubCategory(subCategoryId: string) {
        const data = await db.query.productTypes.findMany({
            where: eq(productTypes.subCategoryId, subCategoryId),
            orderBy: [desc(productTypes.createdAt)],
        });

        return data;
    }

    async getProductType(id: string) {
        const data = await db.query.productTypes.findFirst({
            where: eq(productTypes.id, id),
        });

        return data;
    }

    async getProductTypeBySlug(slug: string) {
        const data = await db.query.productTypes.findFirst({
            where: eq(productTypes.slug, slug),
        });

        return data;
    }

    async getOtherProductType(slug: string, id: string) {
        const data = await db.query.productTypes.findFirst({
            where: and(eq(productTypes.slug, slug), ne(productTypes.id, id)),
        });

        return data;
    }

    async createProductType(
        values: CreateProductType & {
            slug: string;
        }
    ) {
        const data = await db
            .insert(productTypes)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateProductType(
        id: string,
        values: UpdateProductType & { slug: string }
    ) {
        const data = await db
            .update(productTypes)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(productTypes.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteProductType(id: string) {
        const data = await db
            .delete(productTypes)
            .where(eq(productTypes.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }
    async getProductTypesByBrand(brandId: string) {
    const rows = await db
        .selectDistinct({
        productTypeId: products.productTypeId,
        })
        .from(products)
        .where(eq(products.brandId, brandId));

    const ids = rows.map((r) => r.productTypeId);

    if (ids.length === 0) return [];

    return db
        .select()
        .from(productTypes)
        .where(inArray(productTypes.id, ids));
    }
}

export const productTypeQueries = new ProductTypeQuery();
