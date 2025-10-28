import { CreateProductType, UpdateProductType } from "@/lib/validations";
import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "..";
import { productTypes } from "../schema";
import { productTypeCache } from "@/lib/redis/methods";

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

    
    // async getProductTypes() {
    //     const data = await db.query.productTypes.findMany({
    //         orderBy: [desc(productTypes.createdAt)],
    //         with: {
    //             products: {
    //                 columns: {
    //                     id: true, // just need one field to count
    //                 },
    //             },
    //         },
    //     });

    //     // Add productCount manually
    //     return data.map((pt) => ({
    //         ...pt,
    //         productCount: pt.products.length,
    //     }));
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
          columns: {
            id: true,
            name: true,
            categoryId: true,
            subCategoryId: true,   //  added
            slug: true,            //  added
            description: true,     //  added
            createdAt: true,
            updatedAt: true,       //  added
            priorityId: true,      //  added by rachana
          },
        });
      
        return data.map((pt) => ({
          ...pt,
          productCount: pt.products.length,
          priorityId: pt.priorityId ?? 0, // ✅ fallback to 0
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
}

export const productTypeQueries = new ProductTypeQuery();
