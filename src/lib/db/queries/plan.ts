import { CreatePlan, UpdatePlanStatus } from "@/lib/validations";
import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "..";
import { plans } from "../schema";

class PlanQuery {
    async getCount(status?: "deleted", state?: "active" | "inactive") {
        const data = await db.$count(
            plans,
            and(
                status ? eq(plans.isDeleted, status === "deleted") : undefined,
                state ? eq(plans.isActive, state === "active") : undefined
            )
        );
        return data;
    }

    async getPlans(status?: "deleted", state?: "active" | "inactive") {
        const data = await db.query.plans.findMany({
            where: and(
                status ? eq(plans.isDeleted, status === "deleted") : undefined,
                state ? eq(plans.isActive, state === "active") : undefined
            ),
            orderBy: [desc(plans.createdAt)],
        });

        return data;
    }

    async getActivePlan() {
        const data = await db.query.plans.findFirst({
            where: eq(plans.isActive, true),
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

    async deactiveOtherPlans(id: string) {
        const data = await db
            .update(plans)
            .set({
                isActive: false,
            })
            .where(and(ne(plans.id, id), eq(plans.isActive, true)))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deletePlan(id: string) {
        const data = await db
            .update(plans)
            .set({
                isDeleted: true,
            })
            .where(eq(plans.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }
}

export const planQueries = new PlanQuery();
