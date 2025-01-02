import {
    BrandConfidential,
    brandConfidentialSchema,
    brandSchema,
    CreateBrandConfidential,
} from "@/lib/validations";
import { and, desc, eq, ilike } from "drizzle-orm";
import { db } from "..";
import { brandConfidentials, brands } from "../schema";

class BrandConfidentialQuery {
    async getCount(status?: "pending" | "approved" | "rejected") {
        const data = await db.$count(
            brandConfidentials,
            status
                ? eq(brandConfidentials.verificationStatus, status)
                : undefined
        );

        return +data || 0;
    }

    async getBrandConfidentials({
        limit,
        page,
        search,
        status,
    }: {
        limit: number;
        page: number;
        search?: string;
        status?: BrandConfidential["verificationStatus"];
    }) {
        const data = await db.query.brandConfidentials.findMany({
            with: {
                brand: true,
            },
            where: and(
                !!search?.length
                    ? ilike(brandConfidentials.id, `%${search}%`)
                    : undefined,
                !!status
                    ? eq(brandConfidentials.verificationStatus, status)
                    : undefined
            ),
            limit,
            offset: (page - 1) * limit,
            orderBy: [desc(brandConfidentials.createdAt)],
            extras: {
                count: db
                    .$count(
                        brandConfidentials,
                        and(
                            !!search?.length
                                ? ilike(brandConfidentials.id, `%${search}%`)
                                : undefined,
                            !!status
                                ? eq(
                                      brandConfidentials.verificationStatus,
                                      status
                                  )
                                : undefined
                        )
                    )
                    .as("conf_count"),
            },
        });

        const parsed = brandConfidentialSchema
            .extend({
                brand: brandSchema,
            })
            .array()
            .parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getBrandConfidential(bId: string) {
        const data = await db.query.brandConfidentials.findFirst({
            with: {
                brand: true,
            },
            where: eq(brandConfidentials.id, bId),
        });
        if (!data) return null;

        const parsed = brandConfidentialSchema
            .extend({
                brand: brandSchema,
            })
            .parse(data);

        return parsed;
    }

    async createBrandConfidential(values: CreateBrandConfidential) {
        const data = await db
            .insert(brandConfidentials)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateBrandConfidentialStatus(
        id: string,
        values: {
            status: BrandConfidential["verificationStatus"];
            rejectedReason?: string;
        }
    ) {
        const data = await db.transaction(async (tx) => {
            const [x] = await Promise.all([
                tx
                    .update(brandConfidentials)
                    .set({
                        verificationStatus: values.status,
                        updatedAt: new Date(),
                    })
                    .where(eq(brandConfidentials.id, id))
                    .returning()
                    .then((res) => res[0]),
                tx
                    .update(brands)
                    .set({
                        isConfidentialSentForVerification:
                            values.status === "pending",
                        confidentialVerificationStatus: values.status,
                        confidentialVerificationRejectedReason:
                            values.rejectedReason,
                        confidentialVerificationRejectedAt:
                            values.status === "rejected" ? new Date() : null,
                        updatedAt: new Date(),
                    })
                    .where(eq(brands.id, id))
                    .returning()
                    .then((res) => res[0]),
            ]);

            return x;
        });

        return data;
    }
}

export const brandConfidentialQueries = new BrandConfidentialQuery();
