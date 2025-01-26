import { CreatePlan, UpdatePlanStatus } from "@/lib/validations";
import { desc, eq } from "drizzle-orm";
import { db } from "..";
import { plans } from "../schema";

class PlanQuery {
    async getCount(state?: "active" | "inactive") {
        const data = await db.$count(
            plans,
            state ? eq(plans.isActive, state === "active") : undefined
        );
        return data;
    }

    async getPlans(state?: "active" | "inactive") {
        const data = await db.query.plans.findMany({
            where: state ? eq(plans.isActive, state === "active") : undefined,
            orderBy: [desc(plans.createdAt)],
        });

        return data;
    }

    async getPlan(id: string) {
        const data = await db.query.plans.findFirst({
            where: eq(plans.id, id),
        });

        return data;
    }

    async createPlan(values: CreatePlan) {
        const data = await db
            .insert(plans)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updatePlanStatus(values: UpdatePlanStatus) {
        const data = await db
            .update(plans)
            .set({
                isActive: values.isActive,
            })
            .where(eq(plans.id, values.id))
            .returning()
            .then((res) => res[0]);

        return data;
    }
}

export const planQueries = new PlanQuery();
