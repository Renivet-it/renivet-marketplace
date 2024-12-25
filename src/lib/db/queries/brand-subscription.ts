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

    async getBrandSubscriptionByBrandId(brandId: string) {
        const data = await db.query.brandSubscriptions.findFirst({
            where: eq(brandSubscriptions.brandId, brandId),
        });

        return data;
    }
}

export const brandSubscriptionQueries = new BrandSubscriptionQuery();
