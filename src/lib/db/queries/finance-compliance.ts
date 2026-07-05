import { and, asc, desc, eq, gte, ilike, inArray, lte, sql } from "drizzle-orm";
import { db } from "..";
import {
    auditLogs,
    brandConfidentials,
    brandPayoutCycles,
    brandPayoutLineItems,
    brandPayoutConfig,
    brandPayoutOverrides,
    brandTdsTracking,
    brands,
    categories,
    commissionRules,
    dataDeletionRequests,
    financeCodReconciliation,
    financeCodReconciliationRuns,
    financeModules,
    gstReportRuns,
    hsnMaster,
    legalContacts,
    legals,
    moduleAccess,
    newsletterSubscribers,
    orderItems,
    orders,
    orderShipments,
    plManualEntries,
    plSnapshots,
    products,
    refunds,
    platformSettings,
    userConsents,
} from "../schema";

type RefundFilters = {
    status?: string;
    approvalStatus?: string;
    q?: string;
};

class FinanceComplianceQuery {
    async listRefunds(filters: RefundFilters = {}) {
        const where = and(
            filters.status ? eq(refunds.status, filters.status as any) : undefined,
            filters.approvalStatus
                ? eq(refunds.approvalStatus, filters.approvalStatus as any)
                : undefined,
            filters.q ? ilike(refunds.orderId, `%${filters.q}%`) : undefined
        );

        return db.query.refunds.findMany({
            where,
            with: {
                order: true,
                user: true,
            },
            orderBy: [desc(refunds.createdAt)],
            limit: 100,
        });
    }

    async getRefundById(id: string) {
        return db.query.refunds.findFirst({
            where: eq(refunds.id, id),
            with: {
                order: true,
                user: true,
            },
        });
    }

    async getRefundByOrderId(orderId: string) {
        return db.query.refunds.findFirst({
            where: eq(refunds.orderId, orderId),
        });
    }

    async createRefund(values: typeof refunds.$inferInsert) {
        return db
            .insert(refunds)
            .values(values)
            .returning()
            .then((rows) => rows[0]);
    }

    async updateRefund(id: string, values: Partial<typeof refunds.$inferInsert>) {
        return db
            .update(refunds)
            .set(values)
            .where(eq(refunds.id, id))
            .returning()
            .then((rows) => rows[0]);
    }

    async createRefundIfMissing(values: typeof refunds.$inferInsert) {
        const existing = await this.getRefundByOrderId(values.orderId);
        if (existing) {
            return existing;
        }

        return this.createRefund(values);
    }

    async createCodRun(values: typeof financeCodReconciliationRuns.$inferInsert) {
        return db
            .insert(financeCodReconciliationRuns)
            .values(values)
            .returning()
            .then((rows) => rows[0]);
    }

    async finishCodRun(id: string, values: Partial<typeof financeCodReconciliationRuns.$inferInsert>) {
        return db
            .update(financeCodReconciliationRuns)
            .set(values)
            .where(eq(financeCodReconciliationRuns.id, id))
            .returning()
            .then((rows) => rows[0]);
    }

    async upsertCodReconciliation(values: typeof financeCodReconciliation.$inferInsert) {
        return db
            .insert(financeCodReconciliation)
            .values(values)
            .onConflictDoUpdate({
                target: financeCodReconciliation.orderId,
                set: {
                    runId: values.runId,
                    carrier: values.carrier,
                    expectedAmountPaise: values.expectedAmountPaise,
                    remittedAmountPaise: values.remittedAmountPaise,
                    expectedFeePaise: values.expectedFeePaise,
                    actualFeePaise: values.actualFeePaise,
                    discrepancyAmountPaise: values.discrepancyAmountPaise,
                    ageingDays: values.ageingDays,
                    remittanceReference: values.remittanceReference,
                    remittanceDate: values.remittanceDate,
                    status: values.status,
                    notes: values.notes,
                    metadata: values.metadata,
                    resolvedBy: values.resolvedBy,
                    resolvedAt: values.resolvedAt,
                    updatedAt: new Date(),
                },
            })
            .returning()
            .then((rows) => rows[0]);
    }

    async listCodReconciliation(status?: string) {
        return db.query.financeCodReconciliation.findMany({
            where: status ? eq(financeCodReconciliation.status, status as any) : undefined,
            with: {
                order: true,
                run: true,
            },
            orderBy: [desc(financeCodReconciliation.updatedAt)],
            limit: 200,
        });
    }

    async getCodReconciliationByOrderId(orderId: string) {
        return db.query.financeCodReconciliation.findFirst({
            where: eq(financeCodReconciliation.orderId, orderId),
        });
    }

    async markCodReconciliationResolution(input: {
        id: string;
        status: "matched" | "short" | "missing" | "delayed" | "excess" | "review";
        notes?: string | null;
        metadata?: Record<string, unknown>;
        resolvedBy?: string | null;
        resolvedAt?: Date | null;
    }) {
        return db
            .update(financeCodReconciliation)
            .set({
                status: input.status,
                notes: input.notes ?? null,
                metadata: input.metadata ?? {},
                resolvedBy: input.resolvedBy ?? null,
                resolvedAt: input.resolvedAt ?? null,
                updatedAt: new Date(),
            })
            .where(eq(financeCodReconciliation.id, input.id))
            .returning()
            .then((rows) => rows[0]);
    }

    async listCodRuns() {
        return db.query.financeCodReconciliationRuns.findMany({
            orderBy: [desc(financeCodReconciliationRuns.startedAt)],
            limit: 50,
        });
    }

    async upsertPayoutConfig(values: typeof brandPayoutConfig.$inferInsert) {
        return db
            .insert(brandPayoutConfig)
            .values(values)
            .onConflictDoUpdate({
                target: brandPayoutConfig.id,
                set: {
                    payoutMethod: values.payoutMethod,
                    payoutCycleAnchor: values.payoutCycleAnchor,
                    holdbackPercentBps: values.holdbackPercentBps,
                    minimumPayoutPaise: values.minimumPayoutPaise,
                    payoutEmail: values.payoutEmail,
                    bankSnapshot: values.bankSnapshot,
                    isActive: values.isActive,
                    updatedAt: new Date(),
                },
            })
            .returning()
            .then((rows) => rows[0]);
    }

    async createPayoutCycle(values: typeof brandPayoutCycles.$inferInsert) {
        return db
            .insert(brandPayoutCycles)
            .values(values)
            .returning()
            .then((rows) => rows[0]);
    }

    async updatePayoutCycle(id: string, values: Partial<typeof brandPayoutCycles.$inferInsert>) {
        return db
            .update(brandPayoutCycles)
            .set(values)
            .where(eq(brandPayoutCycles.id, id))
            .returning()
            .then((rows) => rows[0]);
    }

    async listPayoutCycles() {
        return db.query.brandPayoutCycles.findMany({
            orderBy: [desc(brandPayoutCycles.payoutDate)],
            limit: 50,
        });
    }

    async getPayoutCycle(id: string) {
        return db.query.brandPayoutCycles.findFirst({
            where: eq(brandPayoutCycles.id, id),
        });
    }

    async addPayoutLineItems(values: Array<typeof brandPayoutLineItems.$inferInsert>) {
        if (!values.length) return [];
        return db.insert(brandPayoutLineItems).values(values).returning();
    }

    async replacePayoutLineItems(
        cycleId: string,
        values: Array<typeof brandPayoutLineItems.$inferInsert>
    ) {
        await db.delete(brandPayoutLineItems).where(eq(brandPayoutLineItems.cycleId, cycleId));
        return this.addPayoutLineItems(values);
    }

    async addPayoutOverride(values: typeof brandPayoutOverrides.$inferInsert) {
        return db
            .insert(brandPayoutOverrides)
            .values(values)
            .returning()
            .then((rows) => rows[0]);
    }

    async listPayoutLineItems(cycleId: string) {
        return db.query.brandPayoutLineItems.findMany({
            where: eq(brandPayoutLineItems.cycleId, cycleId),
            orderBy: [asc(brandPayoutLineItems.brandId), asc(brandPayoutLineItems.createdAt)],
        });
    }

    async listPayoutOverrides(cycleId: string) {
        return db.query.brandPayoutOverrides.findMany({
            where: eq(brandPayoutOverrides.cycleId, cycleId),
            orderBy: [desc(brandPayoutOverrides.createdAt)],
        });
    }

    async listPayoutConfigs(brandIds?: string[]) {
        return db.query.brandPayoutConfig.findMany({
            where: brandIds?.length ? inArray(brandPayoutConfig.id, brandIds) : undefined,
            orderBy: [asc(brandPayoutConfig.id)],
        });
    }

    async listBrandsForPayout() {
        return db
            .select({
                brandId: brands.id,
                brandName: brands.name,
                payoutMethod: brandPayoutConfig.payoutMethod,
                holdbackPercentBps: brandPayoutConfig.holdbackPercentBps,
                minimumPayoutPaise: brandPayoutConfig.minimumPayoutPaise,
                payoutEmail: brandPayoutConfig.payoutEmail,
                bankName: brandConfidentials.bankName,
                bankAccountHolderName: brandConfidentials.bankAccountHolderName,
                bankAccountNumber: brandConfidentials.bankAccountNumber,
                bankIfscCode: brandConfidentials.bankIfscCode,
                bankAccountType: brandConfidentials.bankAccountType,
                beneficiaryCode: brandConfidentials.beneficiaryCode,
                payoutReference: brandConfidentials.payoutReference,
                gstin: brandConfidentials.gstin,
                rzpAccountId: brands.rzpAccountId,
            })
            .from(brands)
            .leftJoin(brandPayoutConfig, eq(brandPayoutConfig.id, brands.id))
            .leftJoin(brandConfidentials, eq(brandConfidentials.id, brands.id))
            .where(eq(brands.isActive, true));
    }

    async listCommissionRules(filters?: {
        brandId?: string;
        categoryId?: string;
        isActive?: boolean;
    }) {
        return db.query.commissionRules.findMany({
            where: and(
                filters?.brandId ? eq(commissionRules.brandId, filters.brandId) : undefined,
                filters?.categoryId ? eq(commissionRules.categoryId, filters.categoryId) : undefined,
                filters?.isActive !== undefined ? eq(commissionRules.isActive, filters.isActive) : undefined
            ),
            orderBy: [asc(commissionRules.priority), desc(commissionRules.createdAt)],
        });
    }

    async upsertCommissionRule(values: typeof commissionRules.$inferInsert) {
        if (values.id) {
            return db
                .update(commissionRules)
                .set({
                    ...values,
                    updatedAt: new Date(),
                })
                .where(eq(commissionRules.id, values.id))
                .returning()
                .then((rows) => rows[0]);
        }

        return db
            .insert(commissionRules)
            .values(values)
            .returning()
            .then((rows) => rows[0]);
    }

    async upsertBrandTdsTracking(values: typeof brandTdsTracking.$inferInsert) {
        return db
            .insert(brandTdsTracking)
            .values(values)
            .onConflictDoUpdate({
                target: [brandTdsTracking.brandId, brandTdsTracking.financialYear],
                set: {
                    cumulativeCommissionPaise: values.cumulativeCommissionPaise,
                    cumulativeTdsPaise: values.cumulativeTdsPaise,
                    thresholdPaise: values.thresholdPaise,
                    tdsRateBps: values.tdsRateBps,
                    lastAppliedCycleId: values.lastAppliedCycleId,
                    updatedAt: new Date(),
                },
            })
            .returning()
            .then((rows) => rows[0]);
    }

    async listHsnMaster() {
        return db.query.hsnMaster.findMany({
            orderBy: [asc(hsnMaster.hsnCode)],
        });
    }

    async upsertHsn(values: typeof hsnMaster.$inferInsert) {
        return db
            .insert(hsnMaster)
            .values(values)
            .onConflictDoUpdate({
                target: hsnMaster.hsnCode,
                set: {
                    description: values.description,
                    gstRateBps: values.gstRateBps,
                    categoryLabel: values.categoryLabel,
                    isActive: values.isActive,
                    metadata: values.metadata,
                    updatedAt: new Date(),
                },
            })
            .returning()
            .then((rows) => rows[0]);
    }

    async createGstReportRun(values: typeof gstReportRuns.$inferInsert) {
        return db
            .insert(gstReportRuns)
            .values(values)
            .returning()
            .then((rows) => rows[0]);
    }

    async listGstReportRuns() {
        return db.query.gstReportRuns.findMany({
            orderBy: [desc(gstReportRuns.createdAt)],
            limit: 24,
        });
    }

    async upsertModuleAccess(values: typeof moduleAccess.$inferInsert) {
        return db
            .insert(moduleAccess)
            .values(values)
            .onConflictDoUpdate({
                target: [moduleAccess.moduleKey, moduleAccess.userId],
                set: {
                    grantedBy: values.grantedBy,
                    canView: values.canView,
                    canManage: values.canManage,
                    notes: values.notes,
                    updatedAt: new Date(),
                },
            })
            .returning()
            .then((rows) => rows[0]);
    }

    async listModuleAccess(moduleKey?: (typeof financeModules)[number]) {
        return db.query.moduleAccess.findMany({
            where: moduleKey ? eq(moduleAccess.moduleKey, moduleKey) : undefined,
            orderBy: [asc(moduleAccess.moduleKey), asc(moduleAccess.userId)],
        });
    }

    async getModuleAccessForUser(userId: string) {
        return db.query.moduleAccess.findMany({
            where: eq(moduleAccess.userId, userId),
        });
    }

    async listPlEntries(monthKey?: string) {
        return db.query.plManualEntries.findMany({
            where: monthKey ? eq(plManualEntries.monthKey, monthKey) : undefined,
            orderBy: [desc(plManualEntries.monthKey), asc(plManualEntries.category)],
        });
    }

    async upsertPlEntry(values: typeof plManualEntries.$inferInsert) {
        if (values.id) {
            return db
                .update(plManualEntries)
                .set({
                    monthKey: values.monthKey,
                    category: values.category,
                    description: values.description,
                    amountPaise: values.amountPaise,
                    notes: values.notes,
                    updatedBy: values.updatedBy,
                    lockedAt: values.lockedAt,
                    updatedAt: new Date(),
                })
                .where(eq(plManualEntries.id, values.id))
                .returning()
                .then((rows) => rows[0]);
        }

        return db
            .insert(plManualEntries)
            .values(values)
            .returning()
            .then((rows) => rows[0]);
    }

    async getPlSummary(monthKey: string) {
        const [manual] = await db
            .select({
                totalPaise: sql<number>`COALESCE(SUM(${plManualEntries.amountPaise}), 0)`,
            })
            .from(plManualEntries)
            .where(eq(plManualEntries.monthKey, monthKey));

        return {
            monthKey,
            manualExpensePaise: Number(manual?.totalPaise ?? 0),
        };
    }

    async getPlSnapshot(monthKey: string) {
        return db.query.plSnapshots.findFirst({
            where: eq(plSnapshots.monthKey, monthKey),
        });
    }

    async upsertPlSnapshot(values: typeof plSnapshots.$inferInsert) {
        return db
            .insert(plSnapshots)
            .values(values)
            .onConflictDoUpdate({
                target: plSnapshots.monthKey,
                set: {
                    snapshotType: values.snapshotType,
                    summary: values.summary,
                    lockedBy: values.lockedBy,
                    lockedAt: values.lockedAt,
                    unlockedBy: values.unlockedBy,
                    unlockedAt: values.unlockedAt,
                    unlockReason: values.unlockReason,
                    fileUrl: values.fileUrl,
                    updatedAt: new Date(),
                },
            })
            .returning()
            .then((rows) => rows[0]);
    }

    async upsertConsent(values: typeof userConsents.$inferInsert) {
        return db
            .insert(userConsents)
            .values(values)
            .returning()
            .then((rows) => rows[0]);
    }

    async listConsents(userIds?: string[]) {
        return db.query.userConsents.findMany({
            where: userIds?.length ? inArray(userConsents.userId, userIds) : undefined,
            orderBy: [desc(userConsents.grantedAt)],
            limit: 200,
        });
    }

    async createDeletionRequest(values: typeof dataDeletionRequests.$inferInsert) {
        return db
            .insert(dataDeletionRequests)
            .values(values)
            .returning()
            .then((rows) => rows[0]);
    }

    async updateDeletionRequest(
        id: string,
        values: Partial<typeof dataDeletionRequests.$inferInsert>
    ) {
        return db
            .update(dataDeletionRequests)
            .set(values)
            .where(eq(dataDeletionRequests.id, id))
            .returning()
            .then((rows) => rows[0]);
    }

    async listDeletionRequests(status?: string) {
        return db.query.dataDeletionRequests.findMany({
            where: status
                ? eq(dataDeletionRequests.status, status as any)
                : undefined,
            orderBy: [desc(dataDeletionRequests.createdAt)],
            limit: 100,
        });
    }

    async getDeletionRequest(id: string) {
        return db.query.dataDeletionRequests.findFirst({
            where: eq(dataDeletionRequests.id, id),
        });
    }

    async upsertLegalContact(values: typeof legalContacts.$inferInsert) {
        if (values.id) {
            return db
                .update(legalContacts)
                .set({
                    contactType: values.contactType,
                    name: values.name,
                    email: values.email,
                    phone: values.phone,
                    address: values.address,
                    designation: values.designation,
                    notes: values.notes,
                    isActive: values.isActive,
                    updatedAt: new Date(),
                })
                .where(eq(legalContacts.id, values.id))
                .returning()
                .then((rows) => rows[0]);
        }

        return db
            .insert(legalContacts)
            .values(values)
            .returning()
            .then((rows) => rows[0]);
    }

    async listLegalContacts() {
        return db.query.legalContacts.findMany({
            orderBy: [asc(legalContacts.contactType), asc(legalContacts.name)],
        });
    }

    async getActiveLegalContacts() {
        return db.query.legalContacts.findMany({
            where: eq(legalContacts.isActive, true),
            orderBy: [asc(legalContacts.contactType), asc(legalContacts.name)],
        });
    }

    async upsertPlatformSetting(values: typeof platformSettings.$inferInsert) {
        return db
            .insert(platformSettings)
            .values(values)
            .onConflictDoUpdate({
                target: platformSettings.key,
                set: {
                    value: values.value,
                    description: values.description,
                    updatedBy: values.updatedBy,
                    updatedAt: new Date(),
                },
            })
            .returning()
            .then((rows) => rows[0]);
    }

    async listPlatformSettings() {
        return db.query.platformSettings.findMany({
            orderBy: [asc(platformSettings.key)],
        });
    }

    async getPlatformSetting(key: string) {
        return db.query.platformSettings.findFirst({
            where: eq(platformSettings.key, key),
        });
    }

    async listOrdersForFinanceWindow(input: {
        start: Date;
        end: Date;
    }) {
        return db.query.orders.findMany({
            where: and(gte(orders.createdAt, input.start), lte(orders.createdAt, input.end)),
            with: {
                address: true,
                shipments: true,
                items: {
                    with: {
                        product: {
                            with: {
                                brand: {
                                    with: {
                                        confidential: true,
                                    },
                                },
                                category: true,
                                productType: true,
                            },
                        },
                        variant: true,
                    },
                },
            },
            orderBy: [asc(orders.createdAt)],
        });
    }

    async listOrderItemsForFinanceWindow(input: {
        start: Date;
        end: Date;
    }) {
        return db
            .select()
            .from(orderItems)
            .innerJoin(orders, eq(orderItems.orderId, orders.id))
            .innerJoin(products, eq(orderItems.productId, products.id))
            .innerJoin(categories, eq(products.categoryId, categories.id))
            .where(and(gte(orders.createdAt, input.start), lte(orders.createdAt, input.end)));
    }

    async listRecentRefundsForOrderIds(orderIds: string[]) {
        if (!orderIds.length) return [];
        return db.query.refunds.findMany({
            where: inArray(refunds.orderId, orderIds),
            orderBy: [desc(refunds.createdAt)],
        });
    }

    async listShipmentsForOrderIds(orderIds: string[]) {
        if (!orderIds.length) return [];
        return db.query.orderShipments.findMany({
            where: inArray(orderShipments.orderId, orderIds),
        });
    }

    async syncNewsletterConsent(email: string, name: string, isActive: boolean) {
        return db
            .insert(newsletterSubscribers)
            .values({
                email,
                name,
                isActive,
            })
            .onConflictDoUpdate({
                target: newsletterSubscribers.email,
                set: {
                    name,
                    isActive,
                },
            })
            .returning()
            .then((rows) => rows[0]);
    }

    async getLegalContent() {
        return db.query.legals.findFirst();
    }

    async updateLegalContent(values: Partial<typeof legals.$inferInsert>) {
        // eslint-disable-next-line drizzle/enforce-update-with-where
        return db.update(legals).set(values).returning().then((rows) => rows[0]);
    }

    async listFinanceAuditLogs(filters: {
        entityType?: string;
        actorId?: string;
        from?: Date;
        to?: Date;
        module?: string;
    } = {}) {
        return db.query.auditLogs.findMany({
            where: and(
                filters.entityType ? eq(auditLogs.entityType, filters.entityType) : undefined,
                filters.actorId ? eq(auditLogs.userId, filters.actorId) : undefined,
                filters.from ? gte(auditLogs.timestampUtc, filters.from) : undefined,
                filters.to ? lte(auditLogs.timestampUtc, filters.to) : undefined,
                filters.module
                    ? sql`${auditLogs.metadata} ->> 'module' = ${filters.module}`
                    : sql`${auditLogs.metadata} ->> 'module' = 'finance_compliance'`
            ),
            orderBy: [desc(auditLogs.timestampUtc)],
            limit: 250,
        });
    }
}

export const financeComplianceQueries = new FinanceComplianceQuery();
