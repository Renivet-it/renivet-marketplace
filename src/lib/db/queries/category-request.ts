import {
    CategoryRequest,
    categoryRequestWithBrandAndUserSchema,
    CreateCategoryRequest,
    UpdateCategoryRequestStatus,
} from "@/lib/validations";
import { and, desc, eq } from "drizzle-orm";
import { db } from "..";
import { categoryRequests } from "../schema";

class CategoryRequestQuery {
    async getCount() {
        const data = await db.$count(categoryRequests);
        return +data || 0;
    }

    async getCategoryRequests({
        limit,
        page,
        status,
    }: {
        limit: number;
        page: number;
        status?: CategoryRequest["status"];
    }) {
        const data = await db.query.categoryRequests.findMany({
            with: {
                user: true,
                brand: true,
            },
            where: and(
                !!status ? eq(categoryRequests.status, status) : undefined
            ),
            limit,
            offset: (page - 1) * limit,
            orderBy: [desc(categoryRequests.createdAt)],
            extras: {
                count: db
                    .$count(
                        categoryRequests,
                        !!status
                            ? eq(categoryRequests.status, status)
                            : undefined
                    )
                    .as("request_count"),
            },
        });

        const parsed = categoryRequestWithBrandAndUserSchema
            .array()
            .parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getCategoryRequest(id: string) {
        const data = await db.query.categoryRequests.findFirst({
            with: {
                user: true,
                brand: true,
            },
            where: eq(categoryRequests.id, id),
        });
        if (!data) return null;

        return categoryRequestWithBrandAndUserSchema.parse(data);
    }

    async createCategoryRequest(
        values: CreateCategoryRequest & {
            userId: string;
        }
    ) {
        const data = await db
            .insert(categoryRequests)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateCategoryRequestStatus(
        id: string,
        values: UpdateCategoryRequestStatus
    ) {
        const data = await db
            .update(categoryRequests)
            .set({
                ...values,
                rejectedAt: values.status === "rejected" ? new Date() : null,
                updatedAt: new Date(),
            })
            .where(eq(categoryRequests.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }
}

export const categoryRequestQueries = new CategoryRequestQuery();
