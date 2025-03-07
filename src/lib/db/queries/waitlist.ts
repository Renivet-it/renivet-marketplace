import {
    AddBrandWaitlistDemoUrl,
    brandWaitlistSchema,
    CreateBrandWaitlist,
} from "@/lib/validations";
import { desc, eq, ilike } from "drizzle-orm";
import { db } from "..";
import { brandsWaitlist } from "../schema";

class WaitlistQuery {
    async getWaitlistBrands({
        limit,
        page,
        search,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.brandsWaitlist.findMany({
            where: !!search?.length
                ? ilike(brandsWaitlist.brandEmail, `%${search}%`)
                : undefined,
            limit,
            offset: (page - 1) * limit,
            orderBy: [desc(brandsWaitlist.createdAt)],
            extras: {
                count: db
                    .$count(
                        brandsWaitlist,
                        !!search?.length
                            ? ilike(brandsWaitlist.brandEmail, `%${search}%`)
                            : undefined
                    )
                    .as("waitlist_count"),
            },
        });

        const parsed = brandWaitlistSchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getWaitlistBrand(id: string) {
        const data = await db.query.brandsWaitlist.findFirst({
            where: eq(brandsWaitlist.id, id),
        });

        return data;
    }

    async getWaitlistBrandByEmail(email: string) {
        const data = await db.query.brandsWaitlist.findFirst({
            where: eq(brandsWaitlist.brandEmail, email),
        });

        return data;
    }

    async createWaitlistBrand(values: CreateBrandWaitlist) {
        const data = await db
            .insert(brandsWaitlist)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async addBrandWaitlistDemo(id: string, values: AddBrandWaitlistDemoUrl) {
        const data = await db
            .update(brandsWaitlist)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(brandsWaitlist.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteWaitlistBrand(id: string) {
        const data = await db
            .delete(brandsWaitlist)
            .where(eq(brandsWaitlist.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }
}

export const waitlistQueries = new WaitlistQuery();
