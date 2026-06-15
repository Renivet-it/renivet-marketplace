import { BrandTier } from "@/config/brand-program";
import {
    BrandTierMetrics,
    computeBrandTier,
} from "@/lib/brand-tier";
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
import {
    and,
    desc,
    eq,
    gte,
    ilike,
    inArray,
    ne,
    or,
    sql,
} from "drizzle-orm";
import { db } from "..";
import {
    brands,
    monitoringAlerts,
    orderItems,
    orders,
    products,
    userSupportTickets,
} from "../schema";

type TierCounts = Record<BrandTier, number>;

const createEmptyTierCounts = (): TierCounts => ({
    tier_1: 0,
    tier_2: 0,
    tier_3: 0,
    tier_0: 0,
    offboarded: 0,
});

const getMonthStarts = () => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return Array.from({ length: 4 }, (_, index) => {
        const month = new Date(
            currentMonthStart.getFullYear(),
            currentMonthStart.getMonth() - (3 - index),
            1
        );

        return {
            key: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`,
            start: month,
        };
    });
};

const buildBrandTierMetricsMap = async (brandIds: string[]) => {
    const metricsMap = new Map<string, BrandTierMetrics>();
    if (brandIds.length === 0) return metricsMap;

    const monthStarts = getMonthStarts();
    const gmWindowStart = monthStarts[0].start;
    const issueWindowStart = new Date();
    issueWindowStart.setDate(issueWindowStart.getDate() - 90);

    const [
        monthlyGmvRows,
        slaRows,
        openSlaRows,
        complaintRows,
    ] = await Promise.all([
        db
            .select({
                brandId: products.brandId,
                month: sql<string>`to_char(date_trunc('month', ${orders.createdAt}), 'YYYY-MM')`,
                gmvPaise:
                    sql<number>`coalesce(sum(${products.price} * ${orderItems.quantity}), 0)`,
            })
            .from(orderItems)
            .innerJoin(orders, eq(orderItems.orderId, orders.id))
            .innerJoin(products, eq(orderItems.productId, products.id))
            .where(
                and(
                    inArray(products.brandId, brandIds),
                    gte(orders.createdAt, gmWindowStart),
                    ne(orders.status, "cancelled"),
                    inArray(orders.paymentStatus, ["paid", "refund_pending"])
                )
            )
            .groupBy(
                products.brandId,
                sql`date_trunc('month', ${orders.createdAt})`
            ),
        db
            .select({
                brandId: monitoringAlerts.entityId,
                count: sql<number>`count(*)`,
                latestAt: sql<Date>`max(${monitoringAlerts.createdAt})`,
            })
            .from(monitoringAlerts)
            .where(
                and(
                    eq(monitoringAlerts.entityType, "brand"),
                    inArray(monitoringAlerts.entityId, brandIds),
                    gte(monitoringAlerts.createdAt, issueWindowStart),
                    or(
                        ilike(monitoringAlerts.type, "%sla%"),
                        ilike(monitoringAlerts.title, "%sla%"),
                        ilike(monitoringAlerts.message, "%sla%")
                    )
                )
            )
            .groupBy(monitoringAlerts.entityId),
        db
            .select({
                brandId: monitoringAlerts.entityId,
                oldestAt: sql<Date>`min(${monitoringAlerts.createdAt})`,
            })
            .from(monitoringAlerts)
            .where(
                and(
                    eq(monitoringAlerts.entityType, "brand"),
                    inArray(monitoringAlerts.entityId, brandIds),
                    inArray(monitoringAlerts.status, [
                        "open",
                        "acknowledged",
                        "escalated",
                    ]),
                    or(
                        ilike(monitoringAlerts.type, "%sla%"),
                        ilike(monitoringAlerts.title, "%sla%"),
                        ilike(monitoringAlerts.message, "%sla%")
                    )
                )
            )
            .groupBy(monitoringAlerts.entityId),
        db
            .select({
                brandId: userSupportTickets.brandId,
                count: sql<number>`count(*)`,
                oldestAt: sql<Date>`min(${userSupportTickets.createdAt})`,
                latestAt: sql<Date>`max(${userSupportTickets.createdAt})`,
            })
            .from(userSupportTickets)
            .where(
                and(
                    inArray(userSupportTickets.brandId, brandIds),
                    gte(userSupportTickets.createdAt, issueWindowStart),
                    or(
                        ilike(userSupportTickets.category, "%quality%"),
                        ilike(userSupportTickets.issueType, "%quality%"),
                        ilike(userSupportTickets.issueLabel, "%quality%"),
                        ilike(userSupportTickets.title, "%quality%"),
                        ilike(userSupportTickets.description, "%quality%")
                    )
                )
            )
            .groupBy(userSupportTickets.brandId),
    ]);

    for (const brandId of brandIds) {
        metricsMap.set(brandId, {
            monthlyGmv: monthStarts.map((month) => ({
                month: month.key,
                gmvPaise: 0,
            })),
            slaBreaches90d: 0,
            qualityComplaints90d: 0,
            hasExpiredSustainabilityCertificate: false,
            oldestActiveIssueAt: null,
            lastIssueObservedAt: null,
        });
    }

    for (const row of monthlyGmvRows) {
        const metrics = metricsMap.get(row.brandId);
        if (!metrics) continue;

        const month = metrics.monthlyGmv.find((item) => item.month === row.month);
        if (month) {
            month.gmvPaise = Number(row.gmvPaise ?? 0);
        }
    }

    for (const row of slaRows) {
        const metrics = metricsMap.get(row.brandId);
        if (!metrics) continue;
        metrics.slaBreaches90d = Number(row.count ?? 0);
        metrics.lastIssueObservedAt = row.latestAt ?? metrics.lastIssueObservedAt;
    }

    for (const row of openSlaRows) {
        const metrics = metricsMap.get(row.brandId);
        if (!metrics) continue;
        metrics.oldestActiveIssueAt = row.oldestAt ?? metrics.oldestActiveIssueAt;
    }

    for (const row of complaintRows) {
        if (!row.brandId) continue;
        const metrics = metricsMap.get(row.brandId);
        if (!metrics) continue;
        metrics.qualityComplaints90d = Number(row.count ?? 0);
        if (!metrics.oldestActiveIssueAt || (row.oldestAt && row.oldestAt < metrics.oldestActiveIssueAt)) {
            metrics.oldestActiveIssueAt = row.oldestAt ?? metrics.oldestActiveIssueAt;
        }
        if (!metrics.lastIssueObservedAt || (row.latestAt && row.latestAt > metrics.lastIssueObservedAt)) {
            metrics.lastIssueObservedAt = row.latestAt ?? metrics.lastIssueObservedAt;
        }
    }

    return metricsMap;
};

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
            const mediaId = product?.media?.[0]?.id;
            if (mediaId) mediaIds.add(mediaId);
        }

        const mediaItems = await mediaCache.getByIds(Array.from(mediaIds));
        const mediaMap = new Map(
            mediaItems.data.map((item) => [item.id, item])
        );

        const enhancedProducts = products.map((product) => ({
            ...product,
            media: [
                {
                    ...(product?.media?.[0] ?? {}),
                    mediaItem: product?.media?.[0]?.id
                        ? mediaMap.get(product?.media?.[0]?.id ?? "")
                        : undefined,
                },
            ],
        }));

        const mapped = data.map(
            ({ members, roles, bannedMembers, ...rest }) => ({
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
            })
        );
        const parsed = cachedBrandSchema.array().safeParse(mapped);

        return parsed.success ? parsed.data : (mapped as CachedBrand[]);
    }

    async getBrands({
        limit,
        page,
        search,
        tier,
    }: {
        limit: number;
        page: number;
        search?: string;
        tier?: BrandTier;
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
            orderBy: [desc(brands.createdAt)],
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
            const mediaId = product?.media?.[0]?.id;
            if (mediaId) mediaIds.add(mediaId);
        }

        const mediaItems = await mediaCache.getByIds(Array.from(mediaIds));
        const mediaMap = new Map(
            mediaItems.data.map((item) => [item.id, item])
        );

        const enhancedProducts = products.map((product) => ({
            ...product,
            media: [
                {
                    ...(product?.media?.[0] ?? {}),
                    mediaItem: product?.media?.[0]?.id
                        ? mediaMap.get(product?.media?.[0]?.id ?? "")
                        : undefined,
                },
            ],
        }));

        const mapped = data.map(
            ({ members, roles, bannedMembers, ...rest }) => ({
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
            })
        );
        const parsed = cachedBrandSchema.array().safeParse(mapped);
        const parsedData = parsed.success
            ? parsed.data
            : (mapped as CachedBrand[]);
        const tierMetricsMap = await buildBrandTierMetricsMap(
            parsedData.map((brand) => brand.id)
        );
        const tierCounts = createEmptyTierCounts();
        const tierSnapshotUpdates: Array<{
            id: string;
            tierPreviousSnapshot: Exclude<BrandTier, "tier_0" | "offboarded"> | null;
        }> = [];

        const enriched = parsedData.map((brand) => {
            const tierMetrics = tierMetricsMap.get(brand.id) ?? {
                monthlyGmv: [],
                slaBreaches90d: 0,
                qualityComplaints90d: 0,
                hasExpiredSustainabilityCertificate: false,
                oldestActiveIssueAt: null,
                lastIssueObservedAt: null,
            };

            if (
                brand.confidential?.sustainabilityCertificateExpiresAt &&
                new Date(brand.confidential.sustainabilityCertificateExpiresAt) <
                    new Date()
            ) {
                tierMetrics.hasExpiredSustainabilityCertificate = true;
                tierMetrics.oldestActiveIssueAt =
                    tierMetrics.oldestActiveIssueAt ??
                    new Date(brand.confidential.sustainabilityCertificateExpiresAt);
                tierMetrics.lastIssueObservedAt = new Date(
                    brand.confidential.sustainabilityCertificateExpiresAt
                );
            }

            const computedTierSummary = computeBrandTier(
                tierMetrics,
                brand.tierPreviousSnapshot ?? null
            );
            const tierSummary = brand.isActive
                ? computedTierSummary
                : {
                      ...computedTierSummary,
                      tier: "offboarded" as const,
                      reason:
                          "Brand is inactive, so it is automatically treated as Offboarded",
                  };

            if (
                (brand.tierPreviousSnapshot ?? null) !==
                tierSummary.previousTierSnapshot
            ) {
                tierSnapshotUpdates.push({
                    id: brand.id,
                    tierPreviousSnapshot: tierSummary.previousTierSnapshot,
                });
            }
            tierCounts[tierSummary.tier] += 1;

            return {
                ...brand,
                tier: tierSummary.tier,
                tierBase: tierSummary.baseTier,
                tierReason: tierSummary.reason,
                tierMetrics,
            };
        });

        if (tierSnapshotUpdates.length > 0) {
            await Promise.all(
                tierSnapshotUpdates.map((update) =>
                    db
                        .update(brands)
                        .set({
                            tierPreviousSnapshot: update.tierPreviousSnapshot,
                            updatedAt: new Date(),
                        })
                        .where(eq(brands.id, update.id))
                )
            );
        }

        const filtered = tier
            ? enriched.filter((brand) => brand.tier === tier)
            : enriched;
        const sliced = filtered.slice((page - 1) * limit, page * limit);

        return {
            data: sliced,
            count: filtered.length,
            tierCounts,
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
            const mediaId = product?.media?.[0]?.id;
            if (mediaId) mediaIds.add(mediaId);
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
                    ...(product?.media?.[0] ?? {}),
                    mediaItem: product?.media?.[0]?.id
                        ? mediaMap.get(product?.media?.[0]?.id ?? "")
                        : undefined,
                },
            ],
        }));

        const mapped = {
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
        };
        const parsed = cachedBrandSchema.safeParse(mapped);

        return parsed.success ? parsed.data : (mapped as CachedBrand);
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
