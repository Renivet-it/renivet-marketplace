import { CreateTag, UpdateTag } from "@/lib/validations";
import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "..";
import { tags } from "../schema";

class TagQuery {
    async getCount() {
        const data = await db.$count(tags);
        return +data || 0;
    }

    async getTags() {
        const data = await db.query.tags.findMany({
            with: {
                blogTags: true,
            },
            orderBy: [desc(tags.createdAt)],
        });

        return data;
    }

    async getTag(id: string) {
        const data = await db.query.tags.findFirst({
            where: eq(tags.id, id),
            with: {
                blogTags: true,
            },
        });

        return data;
    }

    async getTagBySlug(slug: string) {
        const data = await db.query.tags.findFirst({
            where: eq(tags.slug, slug),
        });

        return data;
    }

    async getOtherTag(slug: string, id: string) {
        const data = await db.query.tags.findFirst({
            where: and(eq(tags.slug, slug), ne(tags.id, id)),
        });

        return data;
    }

    async createTag(
        values: CreateTag & {
            slug: string;
        }
    ) {
        const data = await db
            .insert(tags)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateTag(
        id: string,
        values: UpdateTag & {
            slug: string;
        }
    ) {
        const data = await db
            .update(tags)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(tags.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteTag(id: string) {
        const data = await db
            .delete(tags)
            .where(eq(tags.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }
}

export const tagQueries = new TagQuery();
