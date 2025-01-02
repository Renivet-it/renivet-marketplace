import { razorpay } from "@/lib/razorpay";
import {
    CachedBrand,
    cachedBrandSchema,
    CreateBrand,
    LinkBrandToRazorpay,
    UpdateBrandConfidentialStatus,
} from "@/lib/validations";
import { desc, eq, ilike } from "drizzle-orm";
import { db } from "..";
import { brands } from "../schema";

class BrandQuery {
    async getCount() {
        const data = await db.$count(brands);
        return +data || 0;
    }

    async getAllBrands() {
        const data = await db.query.brands.findMany({
            with: {
                owner: true,
                members: {
                    with: {
                        member: true,
                    },
                },
                roles: {
                    with: {
                        role: true,
                    },
                },
                invites: true,
                bannedMembers: {
                    with: {
                        member: true,
                    },
                },
            },
        });

        const parsed: CachedBrand[] = cachedBrandSchema.array().parse(
            data.map(({ members, roles, bannedMembers, ...rest }) => ({
                ...rest,
                members: members.map(({ member }) => member),
                roles: roles.map(({ role }) => role),
                bannedMembers: bannedMembers.map(({ member }) => member),
            }))
        );

        return parsed;
    }

    async getBrands({
        limit,
        page,
        search,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.brands.findMany({
            with: {
                owner: true,
                members: {
                    with: {
                        member: true,
                    },
                },
                roles: {
                    with: {
                        role: true,
                    },
                },
                invites: true,
                bannedMembers: {
                    with: {
                        member: true,
                    },
                },
                subscriptions: true,
            },
            where: !!search?.length
                ? ilike(brands.name, `%${search}%`)
                : undefined,
            limit,
            offset: (page - 1) * limit,
            orderBy: [desc(brands.createdAt)],
            extras: {
                count: db
                    .$count(
                        brands,
                        !!search?.length
                            ? ilike(brands.name, `%${search}%`)
                            : undefined
                    )
                    .as("brand_count"),
            },
        });

        const parsed: CachedBrand[] = cachedBrandSchema.array().parse(
            data.map(({ members, roles, bannedMembers, ...rest }) => ({
                ...rest,
                members: members.map(({ member }) => member),
                roles: roles.map(({ role }) => role),
                bannedMembers: bannedMembers.map(({ member }) => member),
            }))
        );

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getBrand(id: string) {
        const data = await db.query.brands.findFirst({
            where: eq(brands.id, id),
            with: {
                owner: true,
                members: {
                    with: {
                        member: true,
                    },
                },
                roles: {
                    with: {
                        role: true,
                    },
                },
                invites: true,
                bannedMembers: {
                    with: {
                        member: true,
                    },
                },
                subscriptions: true,
            },
        });
        if (!data) return null;

        return cachedBrandSchema.parse({
            ...data,
            members: data.members.map(({ member }) => member),
            roles: data.roles.map(({ role }) => role),
            bannedMembers: data.bannedMembers.map(({ member }) => member),
        });
    }

    async getBrandBySlug(slug: string) {
        const data = await db.query.brands.findFirst({
            where: eq(brands.slug, slug),
        });
        if (!data) return null;

        return data;
    }

    async linkBrandToRazorpay(values: LinkBrandToRazorpay) {
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
                .update(brands)
                .set({
                    rzpAccountId: account.id,
                    updatedAt: new Date(),
                })
                .where(eq(brands.id, values.id))
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

    async createBrand(
        values: CreateBrand & {
            slug: string;
        }
    ) {
        const data = await db
            .insert(brands)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateBrandConfidentialStatus(values: UpdateBrandConfidentialStatus) {
        const data = await db
            .update(brands)
            .set({
                ...values,
                confidentialVerificationRejectedAt:
                    values.confidentialVerificationRejectedAt
                        ? new Date(values.confidentialVerificationRejectedAt)
                        : null,
                updatedAt: new Date(),
            })
            .where(eq(brands.id, values.id))
            .returning()
            .then((res) => res[0]);

        return data;
    }
}

export const brandQueries = new BrandQuery();
