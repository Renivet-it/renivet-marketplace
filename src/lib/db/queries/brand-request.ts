import {
    BrandRequest,
    brandRequestWithOwnerSchema,
    CreateBrandRequest,
    UpdateBrandRequestStatus,
} from "@/lib/validations";
import { and, desc, eq, gt, ilike, ne } from "drizzle-orm";
import { db } from "..";
import { brandRequests } from "../schema";

class BrandRequestQuery {
    async getBrandRequests({
        limit,
        page,
        search,
        status,
    }: {
        limit: number;
        page: number;
        search?: string;
        status?: BrandRequest["status"];
    }) {
        const data = await db.query.brandRequests.findMany({
            with: {
                owner: true,
            },
            where: and(
                !!search?.length
                    ? ilike(brandRequests.name, `%${search}%`)
                    : undefined,
                !!status ? eq(brandRequests.status, status) : undefined
            ),
            limit,
            offset: (page - 1) * limit,
            orderBy: [desc(brandRequests.createdAt)],
            extras: {
                count: db
                    .$count(
                        brandRequests,
                        and(
                            !!search?.length
                                ? ilike(brandRequests.name, `%${search}%`)
                                : undefined,
                            !!status
                                ? eq(brandRequests.status, status)
                                : undefined
                        )
                    )
                    .as("request_count"),
            },
        });

        const parsed = brandRequestWithOwnerSchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getBrandRequest(
        id: string,
        status?: BrandRequest["status"],
        type?: "ne" | "eq"
    ) {
        const data = await db.query.brandRequests.findFirst({
            with: {
                owner: true,
            },
            where: and(
                eq(brandRequests.id, id),
                !!status
                    ? type === "ne"
                        ? ne(brandRequests.status, status)
                        : eq(brandRequests.status, status)
                    : undefined
            ),
        });

        return data;
    }

    async getBrandRequestByOwnerId(
        ownerId: string,
        status?: BrandRequest["status"],
        type?: "ne" | "eq"
    ) {
        const data = await db.query.brandRequests.findFirst({
            where: and(
                eq(brandRequests.ownerId, ownerId),
                !!status
                    ? type === "ne"
                        ? ne(brandRequests.status, status)
                        : eq(brandRequests.status, status)
                    : undefined
            ),
        });

        return data;
    }

    async getRecentRejectedRequest(ownerId: string) {
        const data = await db.query.brandRequests.findFirst({
            where: and(
                eq(brandRequests.ownerId, ownerId),
                eq(brandRequests.status, "rejected"),
                gt(
                    brandRequests.rejectedAt,
                    new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 3)
                )
            ),
        });

        return data;
    }

    async createBrandRequest(
        values: CreateBrandRequest & {
            ownerId: string;
        }
    ) {
        const data = await db
            .insert(brandRequests)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateBrandRequestStatus(
        id: string,
        values: UpdateBrandRequestStatus & {
            demoUrl?: string | null;
            rejectedAt: Date | null;
        }
    ) {
        const data = await db
            .update(brandRequests)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(brandRequests.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteBrandRequest(id: string) {
        const data = await db
            .delete(brandRequests)
            .where(eq(brandRequests.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }
}

export const brandRequestQueries = new BrandRequestQuery();
