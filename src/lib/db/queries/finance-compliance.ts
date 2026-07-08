import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import { db } from "..";
import {
    analyticsDailyCommerce,
    auditLogs,
    carrierClaims,
    brandConfidentials,
    brandPayoutCycles,
    brandPayoutLineItems,
    brandPayoutConfig,
    brandPayoutOverrides,
    brandTdsTracking,
    brands,
    carrierFeeSchedule,
    categories,
    commissionRules,
    corporatePayments,
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
    reasonMasters,
    userConsents,
    users,
} from "../schema";

type RefundFilters = {
    status?: string;
    approvalStatus?: string;
    q?: string;
    source?: string;
};

type CodFilters = {
    status?: string;
    q?: string;
    attentionOnly?: boolean;
};

class FinanceComplianceQuery {
    async listRefunds(filters: RefundFilters = {}) {
        const where = and(
            filters.status ? eq(refunds.status, filters.status as any) : undefined,
            filters.approvalStatus
                ? eq(refunds.approvalStatus, filters.approvalStatus as any)
                : undefined,
            filters.q ? ilike(refunds.orderId, `%${filters.q}%`) : undefined,
            filters.source === "manual"
                ? sql`${refunds.metadata} ->> 'source' = 'finance_refund_workflow'`
                : undefined,
            filters.source === "automatic"
                ? sql`${refunds.metadata} ->> 'source' <> 'finance_refund_workflow'`
                : undefined
        );

        return db.query.refunds.findMany({
            where,
            with: {
                order: true,
                user: true,
                reasonMaster: true,
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
                reasonMaster: true,
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

    async listRefundReasons() {
        return db.query.reasonMasters.findMany({
            where: and(
                eq(reasonMasters.isActive, true),
                eq(reasonMasters.reasonType, "return_reason")
            ),
            with: {
                parent: true,
            },
            orderBy: [asc(reasonMasters.level), asc(reasonMasters.shortOrder), asc(reasonMasters.name)],
        });
    }

    async getRefundReasonById(id: string) {
        return db.query.reasonMasters.findFirst({
            where: eq(reasonMasters.id, id),
            with: {
                parent: true,
            },
        });
    }

    async listRefundEligibleOrders(search?: string) {
        const term = search?.trim();

        return db
            .select({
                orderId: orders.id,
                userId: orders.userId,
                paymentId: orders.paymentId,
                amount: orders.totalAmount,
                status: orders.status,
                paymentStatus: orders.paymentStatus,
            })
            .from(orders)
            .where(
                and(
                    eq(orders.status, "delivered"),
                    eq(orders.paymentStatus, "paid"),
                    sql`${orders.paymentId} IS NOT NULL`,
                    sql`NOT EXISTS (
                        SELECT 1
                        FROM ${refunds}
                        WHERE ${refunds.orderId} = ${orders.id}
                    )`,
                    term ? ilike(orders.id, `%${term}%`) : undefined
                )
            )
            .orderBy(desc(orders.createdAt))
            .limit(20);
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
                    awbNumber: values.awbNumber,
                    carrier: values.carrier,
                    codAmountPaise: values.codAmountPaise,
                    codFeeRateBps: values.codFeeRateBps,
                    codFeeFlatPaise: values.codFeeFlatPaise,
                    expectedAmountPaise: values.expectedAmountPaise,
                    expectedRemittancePaise: values.expectedRemittancePaise,
                    remittedAmountPaise: values.remittedAmountPaise,
                    expectedFeePaise: values.expectedFeePaise,
                    actualFeePaise: values.actualFeePaise,
                    discrepancyAmountPaise: values.discrepancyAmountPaise,
                    ageingDays: values.ageingDays,
                    remittanceReference: values.remittanceReference,
                    deliveryDate: values.deliveryDate,
                    remittedAt: values.remittedAt,
                    remittanceDate: values.remittanceDate,
                    status: values.status,
                    notes: values.notes,
                    proofFileUrl: values.proofFileUrl,
                    metadata: values.metadata,
                    resolvedBy: values.resolvedBy,
                    resolvedAt: values.resolvedAt,
                    updatedAt: new Date(),
                },
            })
            .returning()
            .then((rows) => rows[0]);
    }

    async createCodReconciliation(values: typeof financeCodReconciliation.$inferInsert) {
        return db
            .insert(financeCodReconciliation)
            .values(values)
            .returning()
            .then((rows) => rows[0]);
    }

    async updateCodReconciliation(
        id: string,
        values: Partial<typeof financeCodReconciliation.$inferInsert>
    ) {
        return db
            .update(financeCodReconciliation)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(financeCodReconciliation.id, id))
            .returning()
            .then((rows) => rows[0]);
    }

    async listCodReconciliation(filters: CodFilters = {}) {
        return db.query.financeCodReconciliation.findMany({
            where: and(
                filters.status ? eq(financeCodReconciliation.status, filters.status as any) : undefined,
                filters.q
                    ? sql`(
                        COALESCE(${financeCodReconciliation.orderId}, '') ILIKE ${`%${filters.q}%`}
                        OR COALESCE(${financeCodReconciliation.awbNumber}, '') ILIKE ${`%${filters.q}%`}
                        OR COALESCE(${financeCodReconciliation.carrier}, '') ILIKE ${`%${filters.q}%`}
                    )`
                    : undefined,
                filters.attentionOnly
                    ? inArray(financeCodReconciliation.status, [
                          "discrepancy",
                          "overdue",
                          "critical",
                          "ghost",
                          "written_off",
                      ])
                    : undefined
            ),
            with: {
                order: true,
                run: true,
            },
            orderBy: [desc(financeCodReconciliation.updatedAt)],
            limit: 400,
        });
    }

    async getCodReconciliationByOrderId(orderId: string) {
        return db.query.financeCodReconciliation.findFirst({
            where: eq(financeCodReconciliation.orderId, orderId),
        });
    }

    async getCodReconciliationByAwb(awbNumber: string) {
        return db.query.financeCodReconciliation.findFirst({
            where: eq(financeCodReconciliation.awbNumber, awbNumber),
        });
    }

    async getCodReconciliationById(id: string) {
        return db.query.financeCodReconciliation.findFirst({
            where: eq(financeCodReconciliation.id, id),
            with: {
                order: true,
                run: true,
            },
        });
    }

    async markCodReconciliationResolution(input: {
        id: string;
        status:
            | "pending"
            | "matched"
            | "discrepancy"
            | "overdue"
            | "critical"
            | "ghost"
            | "written_off";
        notes?: string | null;
        proofFileUrl?: string | null;
        metadata?: Record<string, unknown>;
        resolvedBy?: string | null;
        resolvedAt?: Date | null;
    }) {
        return db
            .update(financeCodReconciliation)
            .set({
                status: input.status,
                notes: input.notes ?? null,
                proofFileUrl: input.proofFileUrl ?? null,
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

    async listCarrierFeeSchedules(carrier?: string) {
        return db.query.carrierFeeSchedule.findMany({
            where: carrier ? eq(carrierFeeSchedule.carrier, carrier) : undefined,
            orderBy: [desc(carrierFeeSchedule.effectiveFrom), desc(carrierFeeSchedule.createdAt)],
            limit: 100,
        });
    }

    async upsertCarrierFeeSchedule(values: typeof carrierFeeSchedule.$inferInsert) {
        return db
            .insert(carrierFeeSchedule)
            .values(values)
            .returning()
            .then((rows) => rows[0]);
    }

    async getLatestCarrierFeeSchedule(carrier: string) {
        return db.query.carrierFeeSchedule.findFirst({
            where: and(eq(carrierFeeSchedule.carrier, carrier), eq(carrierFeeSchedule.isActive, true)),
            orderBy: [desc(carrierFeeSchedule.effectiveFrom), desc(carrierFeeSchedule.createdAt)],
        });
    }

    async listDeliveredCodOrders(input: { start: Date; end: Date }) {
        return db.query.orders.findMany({
            where: and(
                gte(orders.createdAt, input.start),
                lte(orders.createdAt, input.end),
                eq(orders.status, "delivered"),
                sql`LOWER(COALESCE(${orders.paymentMethod}, '')) = 'cod'`
            ),
            with: {
                shipments: true,
                address: true,
            },
            orderBy: [desc(orders.updatedAt)],
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

    async getPayoutOverride(id: string) {
        return db.query.brandPayoutOverrides.findFirst({
            where: eq(brandPayoutOverrides.id, id),
        });
    }

    async updatePayoutOverride(
        id: string,
        values: Partial<typeof brandPayoutOverrides.$inferInsert>
    ) {
        return db
            .update(brandPayoutOverrides)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(brandPayoutOverrides.id, id))
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

    async getBrandTdsTracking(brandId: string, financialYear: string) {
        return db.query.brandTdsTracking.findFirst({
            where: and(
                eq(brandTdsTracking.brandId, brandId),
                eq(brandTdsTracking.financialYear, financialYear)
            ),
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
                pan: brandConfidentials.pan,
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
                    annualCommissionYtdPaise: values.annualCommissionYtdPaise,
                    tdsDeductedYtdPaise: values.tdsDeductedYtdPaise,
                    thresholdCrossedAt: values.thresholdCrossedAt,
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

    async listBrandTdsTracking(financialYear?: string) {
        return db.query.brandTdsTracking.findMany({
            where: financialYear ? eq(brandTdsTracking.financialYear, financialYear) : undefined,
            orderBy: [desc(brandTdsTracking.financialYear), asc(brandTdsTracking.brandId)],
        });
    }

    async listCarrierClaimsForFinanceWindow(input: {
        start: Date;
        end: Date;
    }) {
        return db.query.carrierClaims.findMany({
            where: and(gte(carrierClaims.updatedAt, input.start), lte(carrierClaims.updatedAt, input.end)),
            orderBy: [desc(carrierClaims.updatedAt)],
        });
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
                    grantedAt: values.grantedAt ?? new Date(),
                    revokedAt: values.revokedAt ?? null,
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

    async searchFinanceUsers(search?: string) {
        const term = search?.trim();
        return db
            .select({
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                email: users.email,
            })
            .from(users)
            .where(
                term
                    ? or(
                          ilike(users.firstName, `%${term}%`),
                          ilike(users.lastName, `%${term}%`),
                          ilike(users.email, `%${term}%`),
                          ilike(users.id, `%${term}%`)
                      )
                    : undefined
            )
            .orderBy(asc(users.firstName), asc(users.lastName))
            .limit(20);
    }

    async getModuleAccessForUser(userId: string) {
        return db.query.moduleAccess.findMany({
            where: and(eq(moduleAccess.userId, userId), sql`${moduleAccess.revokedAt} IS NULL`),
        });
    }

    async listPlEntries(monthKey?: string) {
        return db.query.plManualEntries.findMany({
            where: monthKey
                ? or(eq(plManualEntries.monthKey, monthKey), eq(plManualEntries.month, monthKey))
                : undefined,
            orderBy: [
                desc(plManualEntries.monthKey),
                asc(plManualEntries.category),
                asc(plManualEntries.subLabel),
            ],
        });
    }

    async getPlEntryById(id: string) {
        return db.query.plManualEntries.findFirst({
            where: eq(plManualEntries.id, id),
        });
    }

    async getLatestPreviousPlEntries(monthKey: string) {
        const previousMonth = await db.query.plManualEntries.findFirst({
            where: sql`COALESCE(${plManualEntries.month}, ${plManualEntries.monthKey}) < ${monthKey}`,
            orderBy: [desc(sql`COALESCE(${plManualEntries.month}, ${plManualEntries.monthKey})`)],
        });

        if (!previousMonth) return [];

        const previousKey = previousMonth.month ?? previousMonth.monthKey;
        return this.listPlEntries(previousKey);
    }

    async upsertPlEntry(values: typeof plManualEntries.$inferInsert) {
        if (values.id) {
            return db
                .update(plManualEntries)
                .set({
                    monthKey: values.monthKey,
                    month: values.month ?? values.monthKey,
                    category: values.category,
                    lineItem: values.lineItem,
                    subLabel: values.subLabel,
                    description: values.description,
                    amountPaise: values.amountPaise,
                    notes: values.notes,
                    enteredBy: values.enteredBy,
                    enteredAt: values.enteredAt,
                    updatedBy: values.updatedBy,
                    isLocked: values.isLocked,
                    lockedAt: values.lockedAt,
                    updatedAt: new Date(),
                })
                .where(eq(plManualEntries.id, values.id))
                .returning()
                .then((rows) => rows[0]);
        }

        return db
            .insert(plManualEntries)
            .values({
                ...values,
                month: values.month ?? values.monthKey,
                lineItem: values.lineItem ?? values.category,
                enteredAt: values.enteredAt ?? new Date(),
                enteredBy: values.enteredBy ?? values.createdBy,
            })
            .returning()
            .then((rows) => rows[0]);
    }

    async lockPlEntries(monthKey: string) {
        return db
            .update(plManualEntries)
            .set({
                isLocked: true,
                lockedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(or(eq(plManualEntries.monthKey, monthKey), eq(plManualEntries.month, monthKey)))
            .returning();
    }

    async unlockPlEntries(monthKey: string) {
        return db
            .update(plManualEntries)
            .set({
                isLocked: false,
                lockedAt: null,
                updatedAt: new Date(),
            })
            .where(or(eq(plManualEntries.monthKey, monthKey), eq(plManualEntries.month, monthKey)))
            .returning();
    }

    async getPlSummary(monthKey: string) {
        const [manual] = await db
            .select({
                totalPaise: sql<number>`COALESCE(SUM(${plManualEntries.amountPaise}), 0)`,
            })
            .from(plManualEntries)
            .where(or(eq(plManualEntries.monthKey, monthKey), eq(plManualEntries.month, monthKey)));

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
                    month: values.month ?? values.monthKey,
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
            orderBy: [desc(userConsents.consentGivenAt)],
            limit: 200,
        });
    }

    async getLatestConsent(userId: string, consentType: typeof userConsents.$inferSelect.consentType) {
        return db.query.userConsents.findFirst({
            where: and(eq(userConsents.userId, userId), eq(userConsents.consentType, consentType)),
            orderBy: [desc(userConsents.consentGivenAt), desc(userConsents.createdAt)],
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
            orderBy: [desc(dataDeletionRequests.requestedAt), desc(dataDeletionRequests.createdAt)],
            limit: 100,
        });
    }

    async getDeletionRequest(id: string) {
        return db.query.dataDeletionRequests.findFirst({
            where: eq(dataDeletionRequests.id, id),
        });
    }

    async getDeletionRequestByVerificationToken(token: string) {
        return db.query.dataDeletionRequests.findFirst({
            where: eq(dataDeletionRequests.verificationToken, token),
        });
    }

    async upsertLegalContact(values: typeof legalContacts.$inferInsert) {
        if (values.isActive) {
            await db
                .update(legalContacts)
                .set({
                    isActive: false,
                    updatedAt: new Date(),
                })
                .where(
                    and(
                        eq(legalContacts.role, values.role),
                        eq(legalContacts.isActive, true)
                    )
                );
        }

        return db
            .insert(legalContacts)
            .values(values)
            .returning()
            .then((rows) => rows[0]);
    }

    async listLegalContacts() {
        return db.query.legalContacts.findMany({
            orderBy: [asc(legalContacts.role), desc(legalContacts.effectiveFrom), desc(legalContacts.createdAt)],
        });
    }

    async getActiveLegalContacts() {
        return db.query.legalContacts.findMany({
            where: eq(legalContacts.isActive, true),
            orderBy: [asc(legalContacts.role), desc(legalContacts.effectiveFrom), desc(legalContacts.createdAt)],
        });
    }

    async getActiveLegalContactByRole(role: "gro" | "dpo" | "nodal_officer" | "compliance_officer") {
        return db.query.legalContacts.findFirst({
            where: and(eq(legalContacts.role, role), eq(legalContacts.isActive, true)),
            orderBy: [desc(legalContacts.effectiveFrom), desc(legalContacts.createdAt)],
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

    async listAnalyticsCommerceForMonth(input: { monthKey: string }) {
        return db.query.analyticsDailyCommerce.findMany({
            where: sql`${analyticsDailyCommerce.dateKey} LIKE ${`${input.monthKey}%`}`,
            orderBy: [asc(analyticsDailyCommerce.dateKey)],
        });
    }

    async listCorporatePaymentsForMonth(input: { start: Date; end: Date }) {
        return db.query.corporatePayments.findMany({
            where: and(
                gte(corporatePayments.createdAt, input.start),
                lte(corporatePayments.createdAt, input.end)
            ),
            orderBy: [desc(corporatePayments.createdAt)],
        });
    }

    async listRefundsForPayoutWindow(input: {
        start: Date;
        end: Date;
    }) {
        return db.query.refunds.findMany({
            where: or(
                and(gte(refunds.createdAt, input.start), lte(refunds.createdAt, input.end)),
                and(
                    gte(refunds.returnReceivedAt, input.start),
                    lte(refunds.returnReceivedAt, input.end)
                )
            ),
            with: {
                order: {
                    with: {
                        items: {
                            with: {
                                product: {
                                    with: {
                                        brand: {
                                            with: {
                                                confidential: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
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
        entityId?: string;
        actionType?: string;
        actorId?: string;
        actorType?: string;
        from?: Date;
        to?: Date;
        q?: string;
        module?: string;
        attachmentOnly?: boolean;
    } = {}) {
        return db.query.auditLogs.findMany({
            where: and(
                filters.entityType ? eq(auditLogs.entityType, filters.entityType) : undefined,
                filters.entityId ? eq(auditLogs.entityId, filters.entityId) : undefined,
                filters.actionType ? eq(auditLogs.actionType, filters.actionType) : undefined,
                filters.actorId ? eq(auditLogs.userId, filters.actorId) : undefined,
                filters.actorType ? eq(auditLogs.actorType, filters.actorType) : undefined,
                filters.from ? gte(auditLogs.timestampUtc, filters.from) : undefined,
                filters.to ? lte(auditLogs.timestampUtc, filters.to) : undefined,
                filters.q
                    ? sql`(
                        ${auditLogs.reason} ILIKE ${`%${filters.q}%`}
                        OR ${auditLogs.entityId} ILIKE ${`%${filters.q}%`}
                        OR ${auditLogs.actionType} ILIKE ${`%${filters.q}%`}
                        OR COALESCE(${auditLogs.metadata} ->> 'financeEventCode', '') ILIKE ${`%${filters.q}%`}
                    )`
                    : undefined,
                filters.module
                    ? sql`${auditLogs.metadata} ->> 'module' = ${filters.module}`
                    : sql`${auditLogs.metadata} ->> 'module' = 'finance_compliance'`,
                filters.attachmentOnly ? sql`${auditLogs.attachmentUrl} IS NOT NULL` : undefined
            ),
            orderBy: [desc(auditLogs.timestampUtc)],
            limit: 250,
        });
    }
}

export const financeComplianceQueries = new FinanceComplianceQuery();
