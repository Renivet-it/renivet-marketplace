import { getDate } from "@/lib/utils";
import { parse } from "date-fns";
import { redis } from "..";

class Analytics {
    async track({
        namespace,
        brandId,
        event = {},
    }: {
        namespace: string;
        brandId: string;
        event: object;
    }) {
        const keysArray = ["analytics", namespace, brandId, getDate()];
        const key = keysArray.join("::");
        await redis.hincrby(key, JSON.stringify(event), 1);
    }

    async retrieveByRange({
        namespace,
        brandId,
        nDays,
    }: {
        namespace: string;
        brandId?: string;
        nDays: number;
    }) {
        const pipeline = redis.pipeline();
        const dates: string[] = [];

        for (let i = 0; i < nDays; i++) {
            const formattedDate = getDate(i);
            dates.push(formattedDate);

            const keysArray = [
                "analytics",
                namespace,
                brandId,
                formattedDate,
            ].filter(Boolean);
            const key = keysArray.join("::");

            pipeline.hgetall(key);
        }

        const results = await pipeline.exec();

        return dates
            .map((date, index) => ({
                date,
                events: Object.entries(results?.[index]?.[1] ?? {}).map(
                    ([key, value]) => ({
                        [key]: Number(value),
                    })
                ),
            }))
            .sort((a, b) =>
                parse(a.date, "dd/MM/yyyy", new Date()) >
                parse(b.date, "dd/MM/yyyy", new Date())
                    ? 1
                    : -1
            );
    }

    async retrieve({
        namespace,
        brandId,
        date,
    }: {
        namespace: string;
        brandId?: string;
        date: string;
    }) {
        const keysArray = ["analytics", namespace, brandId, date].filter(
            Boolean
        );
        const key = keysArray.join("::");

        const res = await redis.hgetall(key);
        return {
            date,
            events: Object.entries(res ?? []).map(([key, value]) => ({
                [key]: Number(value),
            })),
        };
    }
}

export const analytics = new Analytics();
