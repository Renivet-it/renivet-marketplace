import { CreateLegal, UpdateLegal } from "@/lib/validations";
import { db } from "..";
import { legals } from "../schema";

class LegalQuery {
    async getLegal() {
        const data = await db.query.legals.findFirst();
        return data;
    }

    async createLegal(values: CreateLegal) {
        const data = await db
            .insert(legals)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateLegal(values: UpdateLegal) {
        // eslint-disable-next-line drizzle/enforce-update-with-where
        const data = await db
            .update(legals)
            .set({
                ...values,
                ppUpdatedAt:
                    values.updated === "privacyPolicy" ||
                    values.updated === "all"
                        ? new Date()
                        : undefined,
                tosUpdatedAt:
                    values.updated === "termsOfService" ||
                    values.updated === "all"
                        ? new Date()
                        : undefined,
                spUpdatedAt:
                    values.updated === "shippingPolicy" ||
                    values.updated === "all"
                        ? new Date()
                        : undefined,
                rpUpdatedAt:
                    values.updated === "refundPolicy" ||
                    values.updated === "all"
                        ? new Date()
                        : undefined,
            })
            .returning()
            .then((res) => res[0]);

        return data;
    }
}

export const legalQueries = new LegalQuery();
