import {
    CreateRewearPickupRequest,
    rewearPickupRequestSchema,
} from "@/lib/validations";
import { desc, ilike, or } from "drizzle-orm";
import { db } from "..";
import { rewearPickupRequests } from "../schema";

class RewearPickupQuery {
    async create(values: CreateRewearPickupRequest) {
        return db
            .insert(rewearPickupRequests)
            .values(values)
            .returning()
            .then((rows) => rows[0]);
    }

    async list({
        limit,
        page,
        search,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const where = search?.length
            ? or(
                  ilike(rewearPickupRequests.fullName, `%${search}%`),
                  ilike(rewearPickupRequests.mobileNumber, `%${search}%`),
                  ilike(rewearPickupRequests.locality, `%${search}%`)
              )
            : undefined;

        const data = await db.query.rewearPickupRequests.findMany({
            where,
            limit,
            offset: (page - 1) * limit,
            orderBy: [desc(rewearPickupRequests.createdAt)],
            extras: {
                count: db
                    .$count(rewearPickupRequests, where)
                    .as("rewear_pickup_count"),
            },
        });

        return {
            data: rewearPickupRequestSchema.array().parse(data),
            count: Number(data[0]?.count ?? 0),
        };
    }
}

export const rewearPickupQueries = new RewearPickupQuery();
