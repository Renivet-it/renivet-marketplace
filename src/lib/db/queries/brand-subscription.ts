import {
    CreateBrandSubscription,
    UpdateBrandSubscription,
} from "@/lib/validations";
import { eq } from "drizzle-orm";
import { db } from "..";
import { brandSubscriptions } from "../schema";

class BrandSubscriptionQuery {
    async getCount() {
        const data = await db.$count(brandSubscriptions);
        return +data || 0;
    }

    async getBrandSubscriptions() {
        const data = await db.query.brandSubscriptions.findMany();
        return data;
    }

    async getBrandSubscriptionById(id: string) {
        const data = await db.query.brandSubscriptions.findFirst({
            where: eq(brandSubscriptions.id, id),
        });

        return data;
    }

    async getBrandSubscriptionByBrandId(brandId: string) {
        const data = await db.query.brandSubscriptions.findFirst({
            where: eq(brandSubscriptions.brandId, brandId),
        });

        return data;
    }

    async createBrandSubscription(values: CreateBrandSubscription) {
        const data = await db
            .insert(brandSubscriptions)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateBrandSubscription(id: string, values: UpdateBrandSubscription) {
        const data = await db
            .update(brandSubscriptions)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(brandSubscriptions.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }
}

export const brandSubscriptionQueries = new BrandSubscriptionQuery();
