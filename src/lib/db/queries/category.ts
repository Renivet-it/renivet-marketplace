import { CreateCategory, UpdateCategory } from "@/lib/validations";
import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "..";
import { categories } from "../schema";

class CategoryQuery {
    async getCount() {
        const data = await db.$count(categories);
        return +data || 0;
    }

    async getCategories() {
        const data = await db.query.categories.findMany({
            with: {
                subCategories: true,
            },
            orderBy: [desc(categories.createdAt)],
        });

        return data;
    }

    async getCategory(id: string) {
        const data = await db.query.categories.findFirst({
            with: {
                subCategories: true,
            },
            where: eq(categories.id, id),
        });

        return data;
    }

    async getCategoryBySlug(slug: string) {
        const data = await db.query.categories.findFirst({
            where: eq(categories.slug, slug),
        });

        return data;
    }

    async getOtherCategory(slug: string, id: string) {
        const data = await db.query.categories.findFirst({
            where: and(eq(categories.slug, slug), ne(categories.id, id)),
        });

        return data;
    }

    async createCategory(
        values: CreateCategory & {
            slug: string;
        }
    ) {
        const data = await db
            .insert(categories)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateCategory(
        id: string,
        values: UpdateCategory & {
            slug: string;
        }
    ) {
        const data = await db
            .update(categories)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(categories.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteCategory(id: string) {
        const data = await db
            .delete(categories)
            .where(eq(categories.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }
}

export const categoryQueries = new CategoryQuery();
