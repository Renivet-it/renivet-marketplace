import { planQueries } from "@/lib/db/queries";
import { generateCacheKey, parseToJSON } from "@/lib/utils";
import { CachedPlan, cachedPlanSchema } from "@/lib/validations";
import { redis } from "..";

class PlanCache {
    private genKey: (...args: string[]) => string;

    constructor() {
        this.genKey = generateCacheKey(":", "plan");
    }

    async getAll() {
        const [dbPlansCount, keys] = await Promise.all([
            planQueries.getCount(),
            redis.keys(this.genKey("*")),
        ]);

        if (keys.length !== dbPlansCount) {
            await this.drop();

            const dbPlans = await planQueries.getPlans();
            if (!dbPlans.length) return [];

            const cachedPlans = cachedPlanSchema.array().parse(dbPlans);

            await this.addBulk(cachedPlans);
            return cachedPlans;
        }
        if (!keys.length) return [];

        const cachedPlans = await redis.mget(...keys);
        return cachedPlanSchema
            .array()
            .parse(
                cachedPlans
                    .map((sub) => parseToJSON<CachedPlan>(sub))
                    .filter((sub): sub is CachedPlan => sub !== null)
            );
    }

    async get(id: string) {
        const cachedPlanRaw = await redis.get(this.genKey(id));
        let cachedPlan = cachedPlanSchema
            .nullable()
            .parse(parseToJSON<CachedPlan>(cachedPlanRaw));

        if (!cachedPlan) {
            const dbPlan = await planQueries.getPlan(id);
            if (!dbPlan) return null;

            cachedPlan = cachedPlanSchema.parse(dbPlan);
            await this.add(cachedPlan);
        }

        return cachedPlan;
    }

    async add(plan: CachedPlan) {
        return await redis.set(
            this.genKey(plan.id),
            JSON.stringify(plan),
            "EX",
            60 * 60 * 24 * 7
        );
    }

    async addBulk(plans: CachedPlan[]) {
        const pipeline = redis.pipeline();

        plans.forEach((plan) => {
            pipeline.set(
                this.genKey(plan.id),
                JSON.stringify(plan),
                "EX",
                60 * 60 * 24 * 7
            );
        });

        await pipeline.exec();
    }

    async remove(id: string) {
        return await redis.del(this.genKey(id));
    }

    async drop() {
        const keys = await redis.keys(this.genKey("*"));
        if (!keys.length) return;
        return await redis.del(...keys);
    }
}

export const planCache = new PlanCache();
