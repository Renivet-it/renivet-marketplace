import {
    CorporateOrder,
    corporateOrderSchema,
    corporateOrderSettingsSchema,
    corporateOrderStatusHistorySchema,
} from "@/lib/validations/corporate-order";
import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "..";
import {
    corporateColorOptions,
    corporateExtraChargeRules,
    corporateFabricCompositions,
    corporateGsmOptions,
    corporateLogoLocations,
    corporateOrderSettings,
    corporateOrders,
    corporateOrderStatusHistory,
    corporatePricingSlabs,
    corporatePrintMethods,
    corporateProductTypes,
} from "../schema";

const DEFAULT_TIMELINE_TEXT =
    "10-15 business days from approval and artwork confirmation.";

class CorporateOrderQueries {
    private parseOrder(value: any): CorporateOrder {
        return corporateOrderSchema.parse({
            ...value,
            gstNumber: value.gstNumber ?? null,
            artworkFile: value.artworkFile ?? null,
            employeeSheetFile: value.employeeSheetFile ?? null,
            razorpayOrderId: value.razorpayOrderId ?? null,
            razorpayPaymentId: value.razorpayPaymentId ?? null,
            razorpaySignature: value.razorpaySignature ?? null,
            paymentReference: value.paymentReference ?? null,
            balancePaymentLink: value.balancePaymentLink ?? null,
            balancePaymentNotes: value.balancePaymentNotes ?? null,
            customerNotes: value.customerNotes ?? null,
            internalNotes: value.internalNotes ?? null,
        });
    }

    async ensureSeedData() {
        const productTypeCount = await db
            .select({ count: count() })
            .from(corporateProductTypes)
            .then((rows) => rows[0]?.count ?? 0);
        if (productTypeCount > 0) {
            const settings = await db.query.corporateOrderSettings.findFirst();
            if (!settings) {
                await db.insert(corporateOrderSettings).values({
                    gstRateBps: 1800,
                    advancePercentBps: 3000,
                    expectedTimelineText: DEFAULT_TIMELINE_TEXT,
                });
            }
            return;
        }

        await db.transaction(async (tx) => {
            const productTypes = await tx
                .insert(corporateProductTypes)
                .values([
                    {
                        name: "Round Neck T-Shirt",
                        description: "Crew-neck bulk T-shirt",
                        sortOrder: 1,
                    },
                    {
                        name: "Polo / Collar T-Shirt",
                        description: "Collared polo bulk T-shirt",
                        sortOrder: 2,
                    },
                ])
                .returning();

            const gsmOptions = await tx
                .insert(corporateGsmOptions)
                .values([
                    { label: "180 GSM", gsmValue: 180, sortOrder: 1 },
                    { label: "200 GSM", gsmValue: 200, sortOrder: 2 },
                    { label: "220 GSM", gsmValue: 220, sortOrder: 3 },
                    { label: "240 GSM", gsmValue: 240, sortOrder: 4 },
                ])
                .returning();

            await tx.insert(corporateFabricCompositions).values([
                { name: "100% Cotton", sortOrder: 1 },
                { name: "Cotton Blend", sortOrder: 2 },
                { name: "Organic Cotton", sortOrder: 3 },
                { name: "Premium Cotton", sortOrder: 4 },
            ]);

            await tx.insert(corporateColorOptions).values([
                { name: "Black", hexCode: "#111111", sortOrder: 1 },
                { name: "White", hexCode: "#FFFFFF", sortOrder: 2 },
                { name: "Navy", hexCode: "#1B2A49", sortOrder: 3 },
                { name: "Grey", hexCode: "#7A7A7A", sortOrder: 4 },
                { name: "Red", hexCode: "#C62828", sortOrder: 5 },
                { name: "Green", hexCode: "#2E7D32", sortOrder: 6 },
                { name: "Yellow", hexCode: "#F9A825", sortOrder: 7 },
                {
                    name: "Custom Color Request",
                    hexCode: null,
                    isCustom: true,
                    sortOrder: 8,
                },
            ]);

            await tx.insert(corporatePrintMethods).values([
                {
                    name: "Screen Print",
                    priceModifierPaise: 3000,
                    sortOrder: 1,
                },
                { name: "DTF Print", priceModifierPaise: 4500, sortOrder: 2 },
                { name: "Embroidery", priceModifierPaise: 6000, sortOrder: 3 },
            ]);

            await tx.insert(corporateLogoLocations).values([
                { name: "Left Chest", placementGroup: "front", sortOrder: 1 },
                { name: "Center Chest", placementGroup: "front", sortOrder: 2 },
                { name: "Upper Back", placementGroup: "back", sortOrder: 3 },
                { name: "Full Back", placementGroup: "back", sortOrder: 4 },
                { name: "Left Sleeve", placementGroup: "sleeve", sortOrder: 5 },
                {
                    name: "Right Sleeve",
                    placementGroup: "sleeve",
                    sortOrder: 6,
                },
            ]);

            await tx.insert(corporateExtraChargeRules).values([
                {
                    code: "additional_logo_location",
                    name: "Additional Logo Locations",
                    chargeType: "per_location",
                    amountPaise: 2000,
                    sortOrder: 1,
                },
                {
                    code: "custom_packaging",
                    name: "Custom Packaging",
                    chargeType: "flat",
                    amountPaise: 5000,
                    sortOrder: 2,
                },
                {
                    code: "rush_delivery",
                    name: "Rush Delivery",
                    chargeType: "flat",
                    amountPaise: 12000,
                    sortOrder: 3,
                },
            ]);

            const roundNeck = productTypes.find((item) =>
                item.name.includes("Round")
            )!;
            const polo = productTypes.find((item) => item.name.includes("Polo"))!;
            const gsm180 = gsmOptions.find((item) => item.gsmValue === 180)!;
            const gsm220 = gsmOptions.find((item) => item.gsmValue === 220)!;

            await tx.insert(corporatePricingSlabs).values([
                {
                    productTypeId: roundNeck.id,
                    gsmOptionId: gsm180.id,
                    minQuantity: 1,
                    maxQuantity: 50,
                    unitPricePaise: 35000,
                    sortOrder: 1,
                },
                {
                    productTypeId: roundNeck.id,
                    gsmOptionId: gsm180.id,
                    minQuantity: 51,
                    maxQuantity: 100,
                    unitPricePaise: 32500,
                    sortOrder: 2,
                },
                {
                    productTypeId: roundNeck.id,
                    gsmOptionId: gsm180.id,
                    minQuantity: 101,
                    maxQuantity: 250,
                    unitPricePaise: 30000,
                    sortOrder: 3,
                },
                {
                    productTypeId: roundNeck.id,
                    gsmOptionId: gsm180.id,
                    minQuantity: 251,
                    maxQuantity: null,
                    unitPricePaise: 27500,
                    sortOrder: 4,
                },
                {
                    productTypeId: polo.id,
                    gsmOptionId: gsm220.id,
                    minQuantity: 1,
                    maxQuantity: 50,
                    unitPricePaise: 55000,
                    sortOrder: 5,
                },
                {
                    productTypeId: polo.id,
                    gsmOptionId: gsm220.id,
                    minQuantity: 51,
                    maxQuantity: 100,
                    unitPricePaise: 52500,
                    sortOrder: 6,
                },
                {
                    productTypeId: polo.id,
                    gsmOptionId: gsm220.id,
                    minQuantity: 101,
                    maxQuantity: 250,
                    unitPricePaise: 50000,
                    sortOrder: 7,
                },
                {
                    productTypeId: polo.id,
                    gsmOptionId: gsm220.id,
                    minQuantity: 251,
                    maxQuantity: null,
                    unitPricePaise: 47500,
                    sortOrder: 8,
                },
            ]);

            await tx.insert(corporateOrderSettings).values({
                gstRateBps: 1800,
                advancePercentBps: 3000,
                expectedTimelineText: DEFAULT_TIMELINE_TEXT,
            });
        });
    }

    async getOrderSettings() {
        await this.ensureSeedData();

        const existing = await db.query.corporateOrderSettings.findFirst({
            orderBy: [desc(corporateOrderSettings.createdAt)],
        });

        if (existing) return corporateOrderSettingsSchema.parse(existing);

        const created = await db
            .insert(corporateOrderSettings)
            .values({
                gstRateBps: 1800,
                advancePercentBps: 3000,
                expectedTimelineText: DEFAULT_TIMELINE_TEXT,
            })
            .returning()
            .then((rows) => rows[0]);

        return corporateOrderSettingsSchema.parse(created);
    }

    async getFormConfig() {
        await this.ensureSeedData();

        const [
            productTypes,
            gsmOptions,
            fabricCompositions,
            colorOptions,
            printMethods,
            logoLocations,
            extraChargeRules,
            pricingSlabs,
            settings,
        ] = await Promise.all([
            db.query.corporateProductTypes.findMany({
                where: eq(corporateProductTypes.isActive, true),
                orderBy: [asc(corporateProductTypes.sortOrder)],
            }),
            db.query.corporateGsmOptions.findMany({
                where: eq(corporateGsmOptions.isActive, true),
                orderBy: [asc(corporateGsmOptions.sortOrder)],
            }),
            db.query.corporateFabricCompositions.findMany({
                where: eq(corporateFabricCompositions.isActive, true),
                orderBy: [asc(corporateFabricCompositions.sortOrder)],
            }),
            db.query.corporateColorOptions.findMany({
                where: eq(corporateColorOptions.isActive, true),
                orderBy: [asc(corporateColorOptions.sortOrder)],
            }),
            db.query.corporatePrintMethods.findMany({
                where: eq(corporatePrintMethods.isActive, true),
                orderBy: [asc(corporatePrintMethods.sortOrder)],
            }),
            db.query.corporateLogoLocations.findMany({
                where: eq(corporateLogoLocations.isActive, true),
                orderBy: [asc(corporateLogoLocations.sortOrder)],
            }),
            db.query.corporateExtraChargeRules.findMany({
                where: eq(corporateExtraChargeRules.isActive, true),
                orderBy: [asc(corporateExtraChargeRules.sortOrder)],
            }),
            db.query.corporatePricingSlabs.findMany({
                where: eq(corporatePricingSlabs.isActive, true),
                orderBy: [asc(corporatePricingSlabs.sortOrder)],
            }),
            this.getOrderSettings(),
        ]);

        return {
            productTypes,
            gsmOptions,
            fabricCompositions,
            colorOptions,
            printMethods,
            logoLocations,
            extraChargeRules,
            pricingSlabs,
            settings,
        };
    }

    async createCorporateOrder(values: typeof corporateOrders.$inferInsert) {
        const created = await db
            .insert(corporateOrders)
            .values(values)
            .returning()
            .then((rows) => rows[0]);

        return this.parseOrder(created);
    }

    async updateCorporateOrder(
        id: string,
        values: Partial<typeof corporateOrders.$inferInsert>
    ) {
        const updated = await db
            .update(corporateOrders)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(corporateOrders.id, id))
            .returning()
            .then((rows) => rows[0]);

        return updated ? this.parseOrder(updated) : null;
    }

    async getOrderById(id: string) {
        const order = await db.query.corporateOrders.findFirst({
            where: eq(corporateOrders.id, id),
            with: {
                statusHistory: {
                    orderBy: [desc(corporateOrderStatusHistory.createdAt)],
                },
                user: true,
            },
        });

        if (!order) return null;

        return {
            ...this.parseOrder(order),
            statusHistory: order.statusHistory.map((item) =>
                corporateOrderStatusHistorySchema.parse({
                    ...item,
                    fromStatus: item.fromStatus ?? null,
                    changedByUserId: item.changedByUserId ?? null,
                    note: item.note ?? null,
                    metadata: item.metadata ?? null,
                })
            ),
            user: order.user,
        };
    }

    async getOrderByPublicId(publicOrderId: string) {
        const order = await db.query.corporateOrders.findFirst({
            where: eq(corporateOrders.publicOrderId, publicOrderId),
        });

        return order ? this.parseOrder(order) : null;
    }

    async listOrders(input: {
        page: number;
        limit: number;
        search?: string;
        status?: string;
    }) {
        const filters = [
            input.status ? eq(corporateOrders.status, input.status as any) : undefined,
            input.search
                ? or(
                      ilike(corporateOrders.publicOrderId, `%${input.search}%`),
                      ilike(corporateOrders.companyName, `%${input.search}%`),
                      ilike(corporateOrders.contactPersonName, `%${input.search}%`),
                      ilike(corporateOrders.emailAddress, `%${input.search}%`)
                  )
                : undefined,
        ].filter(Boolean);

        const where = filters.length
            ? and(...(filters as Parameters<typeof and>))
            : undefined;

        const [rows, [{ count: totalCount }]] = await Promise.all([
            db.query.corporateOrders.findMany({
                where,
                orderBy: [desc(corporateOrders.createdAt)],
                offset: (input.page - 1) * input.limit,
                limit: input.limit,
            }),
            db
                .select({ count: count() })
                .from(corporateOrders)
                .where(where),
        ]);

        return {
            data: rows.map((row) => this.parseOrder(row)),
            count: totalCount,
        };
    }

    async createStatusHistory(
        values: typeof corporateOrderStatusHistory.$inferInsert
    ) {
        return db
            .insert(corporateOrderStatusHistory)
            .values(values)
            .returning()
            .then((rows) => rows[0]);
    }

    async upsertConfig(input: any) {
        await this.ensureSeedData();
        const now = new Date();

        await db.transaction(async (tx) => {
            const productTypeIds = new Set(
                input.productTypes
                    .map((item: { id?: string }) => item.id)
                    .filter(Boolean)
            );
            const gsmOptionIds = new Set(
                input.gsmOptions
                    .map((item: { id?: string }) => item.id)
                    .filter(Boolean)
            );
            const fabricCompositionIds = new Set(
                input.fabricCompositions
                    .map((item: { id?: string }) => item.id)
                    .filter(Boolean)
            );
            const colorOptionIds = new Set(
                input.colorOptions
                    .map((item: { id?: string }) => item.id)
                    .filter(Boolean)
            );
            const printMethodIds = new Set(
                input.printMethods
                    .map((item: { id?: string }) => item.id)
                    .filter(Boolean)
            );
            const logoLocationIds = new Set(
                input.logoLocations
                    .map((item: { id?: string }) => item.id)
                    .filter(Boolean)
            );
            const extraChargeRuleIds = new Set(
                input.extraChargeRules
                    .map((item: { id?: string }) => item.id)
                    .filter(Boolean)
            );
            const pricingSlabIds = new Set(
                input.pricingSlabs
                    .map((item: { id?: string }) => item.id)
                    .filter(Boolean)
            );

            const existingPricingSlabs = await tx
                .select({ id: corporatePricingSlabs.id })
                .from(corporatePricingSlabs);
            for (const item of existingPricingSlabs) {
                if (!pricingSlabIds.has(item.id)) {
                    await tx
                        .delete(corporatePricingSlabs)
                        .where(eq(corporatePricingSlabs.id, item.id));
                }
            }

            const existingExtraChargeRules = await tx
                .select({ id: corporateExtraChargeRules.id })
                .from(corporateExtraChargeRules);
            for (const item of existingExtraChargeRules) {
                if (!extraChargeRuleIds.has(item.id)) {
                    await tx
                        .delete(corporateExtraChargeRules)
                        .where(eq(corporateExtraChargeRules.id, item.id));
                }
            }

            const existingLogoLocations = await tx
                .select({ id: corporateLogoLocations.id })
                .from(corporateLogoLocations);
            for (const item of existingLogoLocations) {
                if (!logoLocationIds.has(item.id)) {
                    await tx
                        .delete(corporateLogoLocations)
                        .where(eq(corporateLogoLocations.id, item.id));
                }
            }

            const existingPrintMethods = await tx
                .select({ id: corporatePrintMethods.id })
                .from(corporatePrintMethods);
            for (const item of existingPrintMethods) {
                if (!printMethodIds.has(item.id)) {
                    await tx
                        .delete(corporatePrintMethods)
                        .where(eq(corporatePrintMethods.id, item.id));
                }
            }

            const existingColorOptions = await tx
                .select({ id: corporateColorOptions.id })
                .from(corporateColorOptions);
            for (const item of existingColorOptions) {
                if (!colorOptionIds.has(item.id)) {
                    await tx
                        .delete(corporateColorOptions)
                        .where(eq(corporateColorOptions.id, item.id));
                }
            }

            const existingFabricCompositions = await tx
                .select({ id: corporateFabricCompositions.id })
                .from(corporateFabricCompositions);
            for (const item of existingFabricCompositions) {
                if (!fabricCompositionIds.has(item.id)) {
                    await tx
                        .delete(corporateFabricCompositions)
                        .where(eq(corporateFabricCompositions.id, item.id));
                }
            }

            const existingGsmOptions = await tx
                .select({ id: corporateGsmOptions.id })
                .from(corporateGsmOptions);
            for (const item of existingGsmOptions) {
                if (!gsmOptionIds.has(item.id)) {
                    await tx
                        .delete(corporateGsmOptions)
                        .where(eq(corporateGsmOptions.id, item.id));
                }
            }

            const existingProductTypes = await tx
                .select({ id: corporateProductTypes.id })
                .from(corporateProductTypes);
            for (const item of existingProductTypes) {
                if (!productTypeIds.has(item.id)) {
                    await tx
                        .delete(corporateProductTypes)
                        .where(eq(corporateProductTypes.id, item.id));
                }
            }

            for (const item of input.productTypes) {
                await tx
                    .insert(corporateProductTypes)
                    .values(item)
                    .onConflictDoUpdate({
                        target: corporateProductTypes.id,
                        set: { ...item, updatedAt: now },
                    });
            }
            for (const item of input.gsmOptions) {
                await tx
                    .insert(corporateGsmOptions)
                    .values(item)
                    .onConflictDoUpdate({
                        target: corporateGsmOptions.id,
                        set: { ...item, updatedAt: now },
                    });
            }
            for (const item of input.fabricCompositions) {
                await tx
                    .insert(corporateFabricCompositions)
                    .values(item)
                    .onConflictDoUpdate({
                        target: corporateFabricCompositions.id,
                        set: { ...item, updatedAt: now },
                    });
            }
            for (const item of input.colorOptions) {
                await tx
                    .insert(corporateColorOptions)
                    .values(item)
                    .onConflictDoUpdate({
                        target: corporateColorOptions.id,
                        set: { ...item, updatedAt: now },
                    });
            }
            for (const item of input.printMethods) {
                await tx
                    .insert(corporatePrintMethods)
                    .values(item)
                    .onConflictDoUpdate({
                        target: corporatePrintMethods.id,
                        set: { ...item, updatedAt: now },
                    });
            }
            for (const item of input.logoLocations) {
                await tx
                    .insert(corporateLogoLocations)
                    .values(item)
                    .onConflictDoUpdate({
                        target: corporateLogoLocations.id,
                        set: { ...item, updatedAt: now },
                    });
            }
            for (const item of input.extraChargeRules) {
                await tx
                    .insert(corporateExtraChargeRules)
                    .values(item)
                    .onConflictDoUpdate({
                        target: corporateExtraChargeRules.id,
                        set: { ...item, updatedAt: now },
                    });
            }
            for (const item of input.pricingSlabs) {
                await tx
                    .insert(corporatePricingSlabs)
                    .values(item)
                    .onConflictDoUpdate({
                        target: corporatePricingSlabs.id,
                        set: { ...item, updatedAt: now },
                    });
            }

            const existingSettings = await tx.query.corporateOrderSettings.findFirst({
                orderBy: [desc(corporateOrderSettings.createdAt)],
            });

            if (!existingSettings) {
                await tx.insert(corporateOrderSettings).values(input.settings);
            } else {
                await tx
                    .update(corporateOrderSettings)
                    .set({
                        ...input.settings,
                        updatedAt: now,
                    })
                    .where(eq(corporateOrderSettings.id, existingSettings.id));
            }
        });

        return this.getFormConfig();
    }
}

export const corporateOrderQueries = new CorporateOrderQueries();
