import { razorpay } from "@/lib/razorpay";
import { mediaCache } from "@/lib/redis/methods";
import {
    CachedBrand,
    cachedBrandSchema,
    CreateBrand,
    LinkBrandToRazorpay,
    UpdateBrand,
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
                pageSections: {
                    with: {
                        sectionProducts: {
                            with: {
                                product: {
                                    with: {
                                        variants: true,
                                    },
                                },
                            },
                        },
                    },
                },
                subscriptions: {
                    with: {
                        plan: true,
                    },
                },
            },
        });

        const products = data.flatMap((brand) =>
            // @ts-ignore
            brand.pageSections.flatMap((section) =>
            // @ts-ignore
                section.sectionProducts.map(({ product }) => product)
            )
        );

        const mediaIds = new Set<string>();
        for (const product of products) {
            mediaIds.add(product?.media[0].id);
        }

        const mediaItems = await mediaCache.getByIds(Array.from(mediaIds));
        const mediaMap = new Map(
            mediaItems.data.map((item) => [item.id, item])
        );

        const enhancedProducts = products.map((product) => ({
            ...product,
            media: [
                {
                    ...product?.media[0],
                    mediaItem: mediaMap.get(product?.media[0].id),
                },
            ],
        }));

        const parsed: CachedBrand[] = cachedBrandSchema.array().parse(
            // @ts-ignore
            data.map(({ members, roles, bannedMembers, ...rest }) => ({
                ...rest,
            // @ts-ignore
                members: members.map(({ member }) => member),
            // @ts-ignore
                roles: roles.map(({ role }) => role),
            // @ts-ignore
                bannedMembers: bannedMembers.map(({ member }) => member),
            // @ts-ignore
                pageSections: rest.pageSections.map((section) => ({
                    ...section,
            // @ts-ignore
                    sectionProducts: section.sectionProducts.map((sp) => ({
                        ...sp,
                        product: enhancedProducts.find(
                            (product) => product.id === sp.productId
                        ),
                    })),
                })),
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
                confidential: true,
                packingRules: {
          with: {
            packingType: true,
          },
        },
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
                pageSections: {
                    with: {
                        sectionProducts: {
                            with: {
                                product: {
                                    with: {
                                        variants: true,
                                    },
                                },
                            },
                        },
                    },
                },
                subscriptions: {
                    with: {
                        plan: true,
                    },
                },
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

        const products = data.flatMap((brand) =>
            // @ts-ignore
            brand.pageSections.flatMap((section) =>
            // @ts-ignore
                section.sectionProducts.map(({ product }) => product)
            )
        );

        const mediaIds = new Set<string>();
        for (const product of products) {
            mediaIds.add(product?.media[0].id);
        }

        const mediaItems = await mediaCache.getByIds(Array.from(mediaIds));
        const mediaMap = new Map(
            mediaItems.data.map((item) => [item.id, item])
        );

        const enhancedProducts = products.map((product) => ({
            ...product,
            media: [
                {
                    ...product?.media[0],
                    mediaItem: mediaMap.get(product?.media[0].id),
                },
            ],
        }));

        const parsed: CachedBrand[] = cachedBrandSchema.array().parse(
            // @ts-ignore
            data.map(({ members, roles, bannedMembers, ...rest }) => ({
                ...rest,
            // @ts-ignore
                members: members.map(({ member }) => member),
            // @ts-ignore
                roles: roles.map(({ role }) => role),
            // @ts-ignore
                bannedMembers: bannedMembers.map(({ member }) => member),
            // @ts-ignore
                pageSections: rest.pageSections.map((section) => ({
                    ...section,
            // @ts-ignore
                    sectionProducts: section.sectionProducts.map((sp) => ({
                        ...sp,
                        product: enhancedProducts.find(
                            (product) => product.id === sp.productId
                        ),
                    })),
                })),
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
                pageSections: {
                    with: {
                        sectionProducts: {
                            with: {
                                product: {
                                    with: {
                                        variants: true,
                                    },
                                },
                            },
                        },
                    },
                },
                subscriptions: {
                    with: {
                        plan: true,
                    },
                },
            },
        });
        if (!data) return null;
            // @ts-ignore
        const products = data.pageSections.flatMap((section) =>
            // @ts-ignore
            section.sectionProducts.map(({ product }) => product)
        );

        const mediaIds = new Set<string>();
        for (const product of products) {
            mediaIds.add(product?.media[0].id);
        }

        const mediaItems = await mediaCache.getByIds(Array.from(mediaIds));
        const mediaMap = new Map(
            mediaItems.data.map((item) => [item.id, item])
        );
            // @ts-ignore
        const enhancedProducts = products.map((product) => ({
            ...product,
            media: [
                {
                    ...product?.media[0],
                    mediaItem: mediaMap.get(product?.media[0].id),
                },
            ],
        }));

        return cachedBrandSchema.parse({
            ...data,
            // @ts-ignore
            members: data.members.map(({ member }) => member),
            // @ts-ignore
            roles: data.roles.map(({ role }) => role),
            // @ts-ignore
            bannedMembers: data.bannedMembers.map(({ member }) => member),
            // @ts-ignore
            pageSections: data.pageSections.map((section) => ({
                ...section,
            // @ts-ignore
                sectionProducts: section.sectionProducts.map((sp) => ({
                    ...sp,
                    product: enhancedProducts.find(
            // @ts-ignore
                        (product) => product.id === sp.productId
                    ),
                })),
            })),
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
                            street2: values.addressLine2 ?? "",
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
console.log(account, "account razorpay request");
            const data = await db
                .update(brands)
                .set({
                    rzpAccountId: account.id,
                    updatedAt: new Date(),
                })
                .where(eq(brands.id, values.id))
                .returning()
                .then((res) => res[0]);
console.log(data, "account razorpay response update");

            return data;
        } catch (error) {
console.log(error, "account razorpay error");

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

    async updateBrand(id: string, values: UpdateBrand) {
        const data = await db
            .update(brands)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(brands.id, id))
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
