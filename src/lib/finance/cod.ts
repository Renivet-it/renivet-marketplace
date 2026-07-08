import { financeComplianceQueries } from "@/lib/db/queries/finance-compliance";
import { auditAndAlert } from "@/lib/monitoring-sla/audit";

type CarrierName = "delhivery" | "shiprocket";
type CodStatus =
    | "pending"
    | "matched"
    | "discrepancy"
    | "overdue"
    | "critical"
    | "ghost"
    | "written_off";

type CodProviderRemittanceRow = {
    awbNumber: string;
    orderId?: string | null;
    carrier: CarrierName;
    codAmountPaise?: number | null;
    remittedAmountPaise: number;
    remittedAt?: string | Date | null;
    remittanceReference?: string | null;
    rawPayload?: Record<string, unknown>;
};

type CarrierFeeRow = {
    carrier: CarrierName;
    feePercentBps: number;
    feeFlatPaise: number;
    effectiveFrom: string;
    rawPayload?: Record<string, unknown>;
};

const DEFAULT_COD_MATCH_TOLERANCE_PAISE = 1_000;
const DELIVERY_PENDING_DAYS = 14;
const DELIVERY_CRITICAL_DAYS = 30;

function normalizeDate(value?: string | Date | null) {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function toDateString(value: Date | null | undefined) {
    return value ? value.toISOString().slice(0, 10) : undefined;
}

async function getCodTolerancePaise() {
    const setting = await financeComplianceQueries.getPlatformSetting(
        "cod_match_tolerance_paise"
    );
    const raw =
        typeof setting?.value?.value === "number"
            ? setting.value.value
            : typeof setting?.value?.value === "string"
              ? Number(setting.value.value)
              : Number(setting?.value);

    return Number.isFinite(raw) && raw >= 0 ? raw : DEFAULT_COD_MATCH_TOLERANCE_PAISE;
}

function computeExpectedFeePaise(input: {
    codAmountPaise: number;
    feePercentBps?: number | null;
    feeFlatPaise?: number | null;
}) {
    const percentFee = Math.round(
        input.codAmountPaise * ((input.feePercentBps ?? 0) / 10_000)
    );
    return percentFee + (input.feeFlatPaise ?? 0);
}

function computeExpectedRemittancePaise(input: {
    codAmountPaise: number;
    feePercentBps?: number | null;
    feeFlatPaise?: number | null;
}) {
    return Math.max(
        input.codAmountPaise - computeExpectedFeePaise(input),
        0
    );
}

function computeAgeingDays(deliveryDate: Date | null, now = new Date()) {
    if (!deliveryDate) return 0;
    return Math.max(
        0,
        Math.floor((now.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24))
    );
}

export function categorizeCodReconciliation(input: {
    expectedRemittancePaise: number;
    remittedAmountPaise: number | null;
    deliveryDate: Date | null;
    tolerancePaise: number;
    now?: Date;
}): { status: CodStatus; discrepancyAmountPaise: number | null; ageingDays: number } {
    const now = input.now ?? new Date();
    const ageingDays = computeAgeingDays(input.deliveryDate, now);

    if (input.remittedAmountPaise === null) {
        if (ageingDays >= DELIVERY_CRITICAL_DAYS) {
            return { status: "critical", discrepancyAmountPaise: null, ageingDays };
        }
        if (ageingDays > DELIVERY_PENDING_DAYS) {
            return { status: "overdue", discrepancyAmountPaise: null, ageingDays };
        }
        return { status: "pending", discrepancyAmountPaise: null, ageingDays };
    }

    const discrepancyAmountPaise =
        input.remittedAmountPaise - input.expectedRemittancePaise;

    if (Math.abs(discrepancyAmountPaise) <= input.tolerancePaise) {
        return { status: "matched", discrepancyAmountPaise: discrepancyAmountPaise, ageingDays };
    }

    return { status: "discrepancy", discrepancyAmountPaise, ageingDays };
}

async function fetchCarrierFeeRows(carrier: CarrierName) {
    const url =
        carrier === "delhivery"
            ? process.env.DELHIVERY_COD_FEE_SCHEDULE_URL
            : process.env.SHIPROCKET_COD_FEE_SCHEDULE_URL;
    const token =
        carrier === "delhivery"
            ? process.env.DELHIVERY_TOKEN
            : process.env.SHIPROCKET_API_TOKEN;

    if (!url || !token) {
        const existing = await financeComplianceQueries.getLatestCarrierFeeSchedule(carrier);
        return existing
            ? [
                  {
                      carrier,
                      feePercentBps: existing.feePercentBps ?? 0,
                      feeFlatPaise: existing.feeFlatPaise ?? 0,
                      effectiveFrom:
                          existing.effectiveFrom ?? new Date().toISOString().slice(0, 10),
                      rawPayload: { source: "existing_fee_schedule" },
                  },
              ]
            : [];
    }

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
        },
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(`${carrier} COD fee sync failed with ${response.status}.`);
    }

    const payload = (await response.json()) as {
        records?: Array<Record<string, unknown>>;
        feeRate?: number | string;
        feeFlat?: number | string;
        validFrom?: string;
    };

    if (payload.records?.length) {
        return payload.records.map<CarrierFeeRow>((record) => ({
            carrier,
            feePercentBps: Math.round(
                Number(record.feePercentBps ?? record.fee_percent_bps ?? record.cod_fee_rate ?? 0)
            ),
            feeFlatPaise: Number(record.feeFlatPaise ?? record.fee_flat_paise ?? record.cod_fee_flat ?? 0),
            effectiveFrom: String(
                record.effectiveFrom ?? record.valid_from ?? new Date().toISOString().slice(0, 10)
            ),
            rawPayload: record,
        }));
    }

    return [
        {
            carrier,
            feePercentBps: Math.round(Number(payload.feeRate ?? 0)),
            feeFlatPaise: Number(payload.feeFlat ?? 0),
            effectiveFrom: payload.validFrom ?? new Date().toISOString().slice(0, 10),
            rawPayload: payload as Record<string, unknown>,
        },
    ];
}

async function fetchCarrierRemittanceRows(carrier: CarrierName) {
    const url =
        carrier === "delhivery"
            ? process.env.DELHIVERY_COD_REMITTANCE_URL
            : process.env.SHIPROCKET_COD_REMITTANCE_URL;
    const token =
        carrier === "delhivery"
            ? process.env.DELHIVERY_TOKEN
            : process.env.SHIPROCKET_API_TOKEN;

    if (!url || !token) return [];

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
        },
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(`${carrier} COD remittance sync failed with ${response.status}.`);
    }

    const payload = (await response.json()) as {
        records?: Array<Record<string, unknown>>;
    };

    return (payload.records ?? [])
        .map<CodProviderRemittanceRow | null>((record) => {
            const awbNumber = String(
                record.awbNumber ?? record.awb_number ?? record.waybill ?? ""
            ).trim();
            if (!awbNumber) return null;

            return {
                awbNumber,
                orderId: record.orderId ? String(record.orderId) : null,
                carrier,
                codAmountPaise: Number(record.codAmountPaise ?? record.cod_amount ?? 0) || null,
                remittedAmountPaise: Number(
                    record.remittedAmountPaise ?? record.remitted_amount ?? record.amount ?? 0
                ),
                remittedAt: (record.remittedAt ?? record.remitted_at ?? record.remittance_date ?? null) as
                    | string
                    | null,
                remittanceReference: String(
                    record.remittanceReference ?? record.remittance_reference ?? record.utr ?? ""
                ),
                rawPayload: record,
            };
        })
        .filter((row): row is CodProviderRemittanceRow => Boolean(row));
}

async function seedDeliveredCodOrders(runId: string, actorId?: string | null) {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 120);
    const tolerancePaise = await getCodTolerancePaise();
    const orders = await financeComplianceQueries.listDeliveredCodOrders({ start, end: now });
    let created = 0;

    for (const order of orders) {
        const shipment = order.shipments[0];
        const carrier = shipment?.awbNumber || shipment?.uploadWbn ? "delhivery" : "shiprocket";
        const awbNumber = shipment?.awbNumber ?? shipment?.uploadWbn ?? null;
        const existing =
            (await financeComplianceQueries.getCodReconciliationByOrderId(order.id)) ??
            (awbNumber
                ? await financeComplianceQueries.getCodReconciliationByAwb(awbNumber)
                : null);
        const deliveryDate =
            normalizeDate(
                shipment?.updatedAt ?? order.updatedAt ?? order.createdAt
            ) ?? now;
        const feeSchedule = await financeComplianceQueries.getLatestCarrierFeeSchedule(carrier);
        const codAmountPaise = order.totalAmount;
        const expectedFeePaise = computeExpectedFeePaise({
            codAmountPaise,
            feePercentBps: feeSchedule?.feePercentBps,
            feeFlatPaise: feeSchedule?.feeFlatPaise,
        });
        const expectedRemittancePaise = computeExpectedRemittancePaise({
            codAmountPaise,
            feePercentBps: feeSchedule?.feePercentBps,
            feeFlatPaise: feeSchedule?.feeFlatPaise,
        });
        const categorized = categorizeCodReconciliation({
            expectedRemittancePaise,
            remittedAmountPaise: existing?.remittedAmountPaise ?? null,
            deliveryDate,
            tolerancePaise,
        });

        if (existing) {
            await financeComplianceQueries.updateCodReconciliation(existing.id, {
                orderId: order.id,
                runId,
                awbNumber,
                carrier,
                codAmountPaise,
                codFeeRateBps: feeSchedule?.feePercentBps ?? null,
                codFeeFlatPaise: feeSchedule?.feeFlatPaise ?? null,
                expectedAmountPaise: codAmountPaise,
                expectedRemittancePaise,
                remittedAmountPaise: existing.remittedAmountPaise,
                expectedFeePaise,
                actualFeePaise: existing.actualFeePaise,
                discrepancyAmountPaise: categorized.discrepancyAmountPaise,
                ageingDays: categorized.ageingDays,
                deliveryDate,
                remittedAt: existing.remittedAt,
                remittanceReference: existing.remittanceReference,
                remittanceDate: existing.remittanceDate,
                status:
                    existing.status === "written_off"
                        ? "written_off"
                        : categorized.status,
                notes: existing.notes,
                proofFileUrl: existing.proofFileUrl,
                metadata: {
                    ...(existing.metadata ?? {}),
                    source: "delivered_cod_seed",
                },
            });
            continue;
        }

        await financeComplianceQueries.createCodReconciliation({
            runId,
            orderId: order.id,
            awbNumber,
            carrier,
            codAmountPaise,
            codFeeRateBps: feeSchedule?.feePercentBps ?? null,
            codFeeFlatPaise: feeSchedule?.feeFlatPaise ?? null,
            expectedAmountPaise: codAmountPaise,
            expectedRemittancePaise,
            expectedFeePaise,
            ageingDays: categorized.ageingDays,
            deliveryDate,
            status: categorized.status,
            metadata: {
                source: "delivered_cod_seed",
            },
        });
        created += 1;
    }

    if (created && actorId) {
        await auditAndAlert({
            actorId,
            actionType: "cod_seed_created",
            entityType: "cod_reconciliation_run",
            entityId: runId,
            reason: "delivered_cod_seed",
            title: "COD reconciliation base rows created",
            message: `${created} delivered COD orders were seeded into finance reconciliation.`,
            severity: "info",
            ownerRole: "finance_admin",
            type: "cod_seed_created",
            dedupeKey: `cod:seed:${runId}`,
            channels: ["admin"],
            metadata: {
                module: "finance_compliance",
                createdRows: created,
            },
        });
    }

    return created;
}

async function alertIfAttentionRequired(input: {
    actorId?: string | null;
    row: Record<string, unknown> & {
        id: string;
        orderId?: string | null;
        status: string;
        ageingDays: number;
    };
    runId: string;
}) {
    if (!["discrepancy", "overdue", "critical", "ghost"].includes(input.row.status)) {
        return;
    }

    await auditAndAlert({
        actorId: input.actorId ?? "system",
        actionType: `cod_${input.row.status}`,
        entityType: "cod_reconciliation",
        entityId: input.row.id,
        afterValue: input.row,
        reason: input.row.status,
        title: "COD reconciliation requires review",
        message: `COD row ${input.row.orderId ?? input.row.id} is marked ${input.row.status}.`,
        severity: input.row.status === "critical" ? "critical" : "warning",
        ownerRole: "admin",
        type: `cod_${input.row.status}`,
        dedupeKey: `cod:${input.row.status}:${input.row.id}:${input.row.ageingDays}`,
        channels:
            input.row.status === "critical"
                ? ["admin", "email", "whatsapp"]
                : ["admin", "email"],
        metadata: {
            module: "finance_compliance",
            runId: input.runId,
            escalationTarget:
                input.row.status === "critical" ? "AJ + founders" : "AJ",
        },
    });
}

export async function syncCarrierFeeSchedule(actorId?: string | null) {
    const run = await financeComplianceQueries.createCodRun({
        carrier: "all",
        runType: "fee_sync",
        status: "running",
        requestedBy: actorId ?? null,
        metadata: {
            source: "finance_cod_fee_sync",
        },
    });

    try {
        const carriers: CarrierName[] = ["delhivery", "shiprocket"];
        let recordsSynced = 0;

        for (const carrier of carriers) {
            const rows = await fetchCarrierFeeRows(carrier);
            if (!rows.length) continue;

            const previous = await financeComplianceQueries.getLatestCarrierFeeSchedule(carrier);

            for (const row of rows) {
                await financeComplianceQueries.upsertCarrierFeeSchedule({
                    carrier: row.carrier,
                    feeType: "cod",
                    paymentMode: "cod",
                    feePercentBps: row.feePercentBps,
                    feeFlatPaise: row.feeFlatPaise,
                    effectiveFrom: row.effectiveFrom,
                    sourcePayload: row.rawPayload ?? {},
                    isActive: true,
                });
                recordsSynced += 1;
            }

            const latest = rows[0];
            if (
                previous &&
                (previous.feePercentBps !== latest.feePercentBps ||
                    previous.feeFlatPaise !== latest.feeFlatPaise)
            ) {
                await auditAndAlert({
                    actorId: actorId ?? "system",
                    actionType: "cod_fee_schedule_changed",
                    entityType: "carrier_fee_schedule",
                    entityId: previous.id,
                    beforeValue: previous as Record<string, unknown>,
                    afterValue: latest as Record<string, unknown>,
                    reason: `${carrier} fee schedule changed`,
                    title: "COD fee schedule changed",
                    message: `${carrier} COD fee schedule changed and future reconciliation math will be affected.`,
                    severity: "warning",
                    ownerRole: "admin",
                    type: "cod_fee_schedule_changed",
                    dedupeKey: `cod:fee-change:${carrier}:${latest.effectiveFrom}`,
                    channels: ["admin", "email"],
                    metadata: {
                        module: "finance_compliance",
                        escalationTarget: "AJ",
                    },
                });
            }
        }

        await financeComplianceQueries.finishCodRun(run.id, {
            status: "success",
            recordsSynced,
            rowsProcessed: recordsSynced,
            finishedAt: new Date(),
        });

        return { runId: run.id, recordsSynced };
    } catch (error) {
        await financeComplianceQueries.finishCodRun(run.id, {
            status: "failed",
            finishedAt: new Date(),
            error: error instanceof Error ? error.message : "Unknown COD fee sync error",
            errors: {
                message: error instanceof Error ? error.message : "Unknown COD fee sync error",
            },
        });
        throw error;
    }
}

export async function syncCodReconciliationRun(actorId?: string | null) {
    const run = await financeComplianceQueries.createCodRun({
        carrier: "all",
        runType: "remittance_sync",
        status: "running",
        requestedBy: actorId ?? null,
        metadata: {
            source: "finance_cod_service",
        },
    });

    try {
        await seedDeliveredCodOrders(run.id, actorId);
        const tolerancePaise = await getCodTolerancePaise();
        const providers: CarrierName[] = ["delhivery", "shiprocket"];
        let recordsSynced = 0;

        for (const carrier of providers) {
            const rows = await fetchCarrierRemittanceRows(carrier);
            for (const row of rows) {
                const existing =
                    (await financeComplianceQueries.getCodReconciliationByAwb(row.awbNumber)) ??
                    (row.orderId
                        ? await financeComplianceQueries.getCodReconciliationByOrderId(row.orderId)
                        : null);
                const remittedAt = normalizeDate(row.remittedAt);

                if (!existing) {
                    const ghost = await financeComplianceQueries.createCodReconciliation({
                        runId: run.id,
                        orderId: row.orderId ?? null,
                        awbNumber: row.awbNumber,
                        carrier,
                        codAmountPaise: row.codAmountPaise ?? 0,
                        expectedAmountPaise: row.codAmountPaise ?? 0,
                        expectedRemittancePaise: row.remittedAmountPaise,
                        remittedAmountPaise: row.remittedAmountPaise,
                        discrepancyAmountPaise: null,
                        remittedAt,
                        remittanceReference: row.remittanceReference ?? null,
                        remittanceDate: toDateString(remittedAt),
                        status: "ghost",
                        metadata: {
                            source: "provider_remittance_ghost",
                            rawPayload: row.rawPayload ?? {},
                        },
                    });
                    await alertIfAttentionRequired({
                        actorId,
                        row: ghost as any,
                        runId: run.id,
                    });
                    recordsSynced += 1;
                    continue;
                }

                const expectedRemittancePaise =
                    existing.expectedRemittancePaise ?? existing.expectedAmountPaise;
                const deliveryDate = normalizeDate(existing.deliveryDate);
                const categorized = categorizeCodReconciliation({
                    expectedRemittancePaise,
                    remittedAmountPaise: row.remittedAmountPaise,
                    deliveryDate,
                    tolerancePaise,
                });

                const actualFeePaise =
                    (existing.codAmountPaise || 0) - row.remittedAmountPaise;

                const updated = await financeComplianceQueries.updateCodReconciliation(existing.id, {
                    orderId: existing.orderId,
                    runId: run.id,
                    awbNumber: existing.awbNumber ?? row.awbNumber,
                    carrier,
                    codAmountPaise: existing.codAmountPaise ?? row.codAmountPaise ?? 0,
                    codFeeRateBps: existing.codFeeRateBps,
                    codFeeFlatPaise: existing.codFeeFlatPaise,
                    expectedAmountPaise: existing.expectedAmountPaise,
                    expectedRemittancePaise,
                    remittedAmountPaise: row.remittedAmountPaise,
                    expectedFeePaise: existing.expectedFeePaise,
                    actualFeePaise,
                    discrepancyAmountPaise: categorized.discrepancyAmountPaise,
                    ageingDays: categorized.ageingDays,
                    deliveryDate,
                    remittedAt,
                    remittanceReference: row.remittanceReference ?? null,
                    remittanceDate: toDateString(remittedAt),
                    status:
                        existing.status === "written_off"
                            ? "written_off"
                            : categorized.status,
                    notes: existing.notes,
                    proofFileUrl: existing.proofFileUrl,
                    metadata: {
                        ...(existing.metadata ?? {}),
                        rawPayload: row.rawPayload ?? {},
                        source: "provider_remittance_sync",
                    },
                });

                await alertIfAttentionRequired({
                    actorId,
                    row: updated as any,
                    runId: run.id,
                });
                recordsSynced += 1;
            }
        }

        const allRows = await financeComplianceQueries.listCodReconciliation();
        for (const row of allRows) {
            if (row.status === "written_off" || row.status === "ghost") continue;
            if (row.remittedAmountPaise !== null && row.remittedAmountPaise !== undefined) continue;

            const categorized = categorizeCodReconciliation({
                expectedRemittancePaise:
                    row.expectedRemittancePaise ?? row.expectedAmountPaise,
                remittedAmountPaise: null,
                deliveryDate: normalizeDate(row.deliveryDate),
                tolerancePaise,
            });

            if (row.status !== categorized.status) {
                const updated = await financeComplianceQueries.markCodReconciliationResolution({
                    id: row.id,
                    status: categorized.status,
                    notes: row.notes,
                    metadata: row.metadata ?? {},
                    resolvedBy: row.resolvedBy,
                    resolvedAt: row.resolvedAt,
                });
                await alertIfAttentionRequired({
                    actorId,
                    row: updated as any,
                    runId: run.id,
                });
            }
        }

        const refreshed = await financeComplianceQueries.listCodReconciliation();
        const matchedCount = refreshed.filter((item) => item.status === "matched").length;
        const pendingCount = refreshed.filter((item) => item.status === "pending").length;
        const discrepancyCount = refreshed.filter((item) =>
            ["discrepancy", "overdue", "critical", "ghost", "written_off"].includes(
                item.status
            )
        ).length;

        await financeComplianceQueries.finishCodRun(run.id, {
            status: discrepancyCount > 0 ? "partial" : "success",
            rowsProcessed: refreshed.length,
            recordsSynced,
            matchedCount,
            pendingCount,
            discrepancyCount,
            finishedAt: new Date(),
        });

        return { runId: run.id, rowsProcessed: refreshed.length, recordsSynced };
    } catch (error) {
        await financeComplianceQueries.finishCodRun(run.id, {
            status: "failed",
            finishedAt: new Date(),
            error: error instanceof Error ? error.message : "Unknown COD sync error",
            errors: {
                message: error instanceof Error ? error.message : "Unknown COD sync error",
            },
        });
        await auditAndAlert({
            actorId: actorId ?? "system",
            actionType: "cod_sync_failed",
            entityType: "cod_reconciliation_run",
            entityId: run.id,
            reason: "cod_sync_failed",
            title: "COD sync failed",
            message:
                error instanceof Error ? error.message : "Unknown COD sync error",
            severity: "critical",
            ownerRole: "admin",
            type: "cod_sync_failed",
            dedupeKey: `cod:sync-failed:${run.id}`,
            channels: ["admin", "email", "whatsapp"],
            metadata: {
                module: "finance_compliance",
                escalationTarget: "AJ + founders",
            },
        });
        throw error;
    }
}

export async function resolveCodDiscrepancy(input: {
    id: string;
    actorId: string;
    status: "matched" | "discrepancy" | "overdue" | "critical" | "ghost" | "pending";
    notes?: string | null;
}) {
    const row = await financeComplianceQueries.getCodReconciliationById(input.id);
    if (!row) {
        throw new Error("COD reconciliation row not found.");
    }

    const updated = await financeComplianceQueries.markCodReconciliationResolution({
        id: row.id,
        status: input.status,
        notes: input.notes ?? row.notes,
        metadata: {
            ...(row.metadata ?? {}),
            manualResolution: {
                status: input.status,
                notes: input.notes ?? null,
                at: new Date().toISOString(),
            },
        },
        resolvedBy: input.actorId,
        resolvedAt: new Date(),
    });

    await auditAndAlert({
        actorId: input.actorId,
        actionType: "cod_resolution_updated",
        entityType: "cod_reconciliation",
        entityId: row.id,
        beforeValue: row as Record<string, unknown>,
        afterValue: updated as Record<string, unknown>,
        reason: input.notes ?? input.status,
        title: "COD reconciliation updated",
        message: `COD reconciliation row ${row.id} was moved to ${input.status}.`,
        severity: "warning",
        ownerRole: "finance_admin",
        type: "cod_resolution_updated",
        dedupeKey: `cod:resolve:${row.id}:${input.status}`,
        channels: ["admin"],
        metadata: {
            module: "finance_compliance",
        },
    });

    return updated;
}

export async function writeOffCodDiscrepancy(input: {
    id: string;
    actorId: string;
    reason: string;
    proofFileUrl: string;
    notes?: string | null;
}) {
    const row = await financeComplianceQueries.getCodReconciliationById(input.id);
    if (!row) {
        throw new Error("COD reconciliation row not found.");
    }

    if (!input.proofFileUrl) {
        throw new Error("Proof upload is required for COD write-off.");
    }

    const updated = await financeComplianceQueries.markCodReconciliationResolution({
        id: row.id,
        status: "written_off",
        notes: input.notes ?? input.reason,
        proofFileUrl: input.proofFileUrl,
        resolvedBy: input.actorId,
        resolvedAt: new Date(),
        metadata: {
            ...(row.metadata ?? {}),
            writeOff: {
                reason: input.reason,
                proofFileUrl: input.proofFileUrl,
                at: new Date().toISOString(),
            },
        },
    });

    await auditAndAlert({
        actorId: input.actorId,
        actionType: "cod_write_off_recorded",
        entityType: "cod_reconciliation",
        entityId: row.id,
        beforeValue: row as Record<string, unknown>,
        afterValue: updated as Record<string, unknown>,
        reason: input.reason,
        title: "COD discrepancy written off",
        message: `COD discrepancy for ${row.orderId ?? row.awbNumber ?? row.id} has been written off.`,
        severity: "warning",
        ownerRole: "finance_admin",
        type: "cod_write_off_recorded",
        dedupeKey: `cod:writeoff:${row.id}`,
        channels: ["admin"],
        metadata: {
            module: "finance_compliance",
            proofFileUrl: input.proofFileUrl,
        },
    });

    return updated;
}
