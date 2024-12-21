import { razorpay } from "@/lib/razorpay";
import {
    BrandRequest,
    brandRequestWithOwnerSchema,
    CreateBrandRequest,
    LinkBrandRequestToRazorpay,
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
                    new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 7)
                )
            ),
        });

        return data;
    }

    async linkBrandRequestToRazorpay(values: LinkBrandRequestToRazorpay) {
        try {
            const account = await razorpay.accounts.create({
                email: values.email,
                phone: values.phone,
                type: "route",
                legal_business_name: values.name,
                business_type: "partnership",
                contact_name: values.authorizedSignatoryName,
                notes: {
                    brandId: `req_${values.id}`,
                    ownerId: values.ownerId,
                },
                profile: {
                    category: "ecommerce",
                    subcategory: "men_and_boys_clothing_stores",
                    addresses: {
                        registered: {
                            street1: values.addressLine1,
                            street2: values.addressLine2,
                            city: values.city,
                            state: values.state,
                            postal_code: values.postalCode,
                            country: values.country,
                        },
                    },
                },
                legal_info: {
                    pan: values.pan,
                    gst: values.gstin,
                },
            });

            const data = await db
                .update(brandRequests)
                .set({
                    rzpAccountId: account.id,
                    updatedAt: new Date(),
                })
                .where(eq(brandRequests.id, values.id))
                .returning()
                .then((res) => res[0]);

            return data;
        } catch (error) {
            if (
                Object.prototype.hasOwnProperty.call(error, "error") &&
                Object.prototype.hasOwnProperty.call(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (error as any).error,
                    "description"
                )
            )
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                throw new Error((error as any).error.description);
        }
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
