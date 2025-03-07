import { CreateSubCategory, UpdateSubCategory } from "@/lib/validations";
import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "..";
import { subCategories } from "../schema";

class SubCategoryQuery {
    async getCount() {
        const data = await db.$count(subCategories);
        return +data || 0;
    }

    async getSubCategories() {
        const data = await db.query.subCategories.findMany({
            with: {
                productTypes: true,
            },
            orderBy: [desc(subCategories.createdAt)],
        });

        return data;
    }

    async getSubCategoriesByCategory(categoryId: string) {
        const data = await db.query.subCategories.findMany({
            where: eq(subCategories.categoryId, categoryId),
            with: {
                productTypes: true,
            },
            orderBy: [desc(subCategories.createdAt)],
        });

        return data;
    }

    async getSubCategory(id: string) {
        const data = await db.query.subCategories.findFirst({
            with: {
                productTypes: true,
            },
            where: eq(subCategories.id, id),
        });

        return data;
    }

    async getSubCategoryBySlug(slug: string) {
        const data = await db.query.subCategories.findFirst({
            where: eq(subCategories.slug, slug),
        });

        return data;
    }

    async getOtherSubCategory(slug: string, id: string) {
        const data = await db.query.subCategories.findFirst({
            where: and(eq(subCategories.slug, slug), ne(subCategories.id, id)),
        });

        return data;
    }

    async createSubCategory(
        values: CreateSubCategory & {
            slug: string;
        }
    ) {
        const data = await db
            .insert(subCategories)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateSubCategory(
        id: string,
        values: UpdateSubCategory & { slug: string }
    ) {
        const data = await db
            .update(subCategories)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(subCategories.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteSubCategory(id: string) {
        const data = await db
            .delete(subCategories)
            .where(eq(subCategories.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }
}

export const subCategoryQueries = new SubCategoryQuery();
