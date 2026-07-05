import { financeComplianceQueries } from "@/lib/db/queries/finance-compliance";
import { categorizeCodDiscrepancy } from "@/lib/finance/calculations";
import { auditAndAlert } from "@/lib/monitoring-sla/audit";

type CodProviderRow = {
    orderId: string;
    expectedAmountPaise: number;
    remittedAmountPaise: number;
    expectedFeePaise?: number;
    actualFeePaise?: number;
    remittanceReference?: string | null;
    remittanceDate?: string | Date | null;
    carrier?: string | null;
    rawPayload?: Record<string, unknown>;
};

function normalizeDate(value?: string | Date | null) {
    if (!value) return undefined;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return undefined;
    return date;
}

async function fetchCodRowsFromFallbackWindow() {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 21);
    const orders = await financeComplianceQueries.listOrdersForFinanceWindow({
        start,
        end,
    });

    return orders
        .filter(
            (order) =>
                order.paymentMethod?.toLowerCase() === "cod" &&
                order.status === "delivered"
        )
        .map<CodProviderRow>((order) => ({
            orderId: order.id,
            expectedAmountPaise: order.totalAmount,
            remittedAmountPaise: 0,
            expectedFeePaise: 0,
            actualFeePaise: 0,
            carrier: order.shipments[0]?.awbNumber ? "delhivery" : "shiprocket",
            rawPayload: {
                source: "fallback_order_scan",
            },
        }));
}

async function fetchDelhiveryRemittanceRows() {
    const url = process.env.DELHIVERY_COD_REMITTANCE_URL;
    const token = process.env.DELHIVERY_TOKEN;

    if (!url || !token) {
        return fetchCodRowsFromFallbackWindow();
    }

    const response = await fetch(url, {
        headers: {
            Authorization: `Token ${token}`,
            Accept: "application/json",
        },
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(`Delhivery remittance sync failed with ${response.status}.`);
    }

    const payload = (await response.json()) as {
        records?: Array<Record<string, unknown>>;
    };

    return (payload.records ?? []).map<CodProviderRow>((record) => ({
        orderId: String(record.orderId ?? record.order_id ?? ""),
        expectedAmountPaise: Number(record.expectedAmountPaise ?? record.expected_amount_paise ?? 0),
        remittedAmountPaise: Number(record.remittedAmountPaise ?? record.remitted_amount_paise ?? 0),
        expectedFeePaise: Number(record.expectedFeePaise ?? record.expected_fee_paise ?? 0),
        actualFeePaise: Number(record.actualFeePaise ?? record.actual_fee_paise ?? 0),
        remittanceReference: String(record.remittanceReference ?? record.remittance_reference ?? ""),
        remittanceDate: (record.remittanceDate ?? record.remittance_date ?? null) as
            | string
            | null,
        carrier: "delhivery",
        rawPayload: record,
    }));
}

export async function syncCodReconciliationRun(actorId?: string | null) {
    const run = await financeComplianceQueries.createCodRun({
        runType: "remittance_sync",
        status: "running",
        requestedBy: actorId ?? null,
        metadata: {
            source: "finance_cod_service",
        },
    });

    try {
        const rows = await fetchDelhiveryRemittanceRows();
        let processed = 0;

        for (const row of rows) {
            if (!row.orderId) continue;
            const remittanceDate = normalizeDate(row.remittanceDate);
            const categorization = categorizeCodDiscrepancy({
                expectedAmountPaise: row.expectedAmountPaise,
                remittedAmountPaise: row.remittedAmountPaise,
                remittanceDate,
            });

            await financeComplianceQueries.upsertCodReconciliation({
                orderId: row.orderId,
                runId: run.id,
                carrier: row.carrier ?? "delhivery",
                expectedAmountPaise: row.expectedAmountPaise,
                remittedAmountPaise: row.remittedAmountPaise,
                expectedFeePaise: row.expectedFeePaise ?? 0,
                actualFeePaise: row.actualFeePaise ?? 0,
                discrepancyAmountPaise: categorization.discrepancyAmountPaise,
                ageingDays: categorization.ageingDays,
                remittanceReference: row.remittanceReference ?? null,
                remittanceDate: remittanceDate?.toISOString().slice(0, 10),
                status: categorization.status as
                    | "matched"
                    | "short"
                    | "missing"
                    | "delayed"
                    | "excess"
                    | "review",
                metadata: {
                    source: "cod_remittance_sync",
                    rawPayload: row.rawPayload ?? {},
                },
            });
            processed += 1;
        }

        await financeComplianceQueries.finishCodRun(run.id, {
            status: "completed",
            rowsProcessed: processed,
            finishedAt: new Date(),
        });

        const discrepancies = await financeComplianceQueries.listCodReconciliation();
        const overdue = discrepancies.filter(
            (item) =>
                ["missing", "delayed", "short"].includes(item.status) &&
                item.ageingDays >= 7
        );

        for (const item of overdue) {
            await auditAndAlert({
                actorId: actorId ?? "system",
                actionType: "cod_remittance_overdue",
                entityType: "cod_reconciliation",
                entityId: item.id,
                afterValue: item as Record<string, unknown>,
                reason: item.status,
                title: "COD reconciliation discrepancy requires action",
                message: `Order ${item.orderId} has ${item.status} COD reconciliation aged ${item.ageingDays} days.`,
                severity: item.ageingDays >= 14 ? "critical" : "warning",
                ownerRole: "finance_admin",
                type: "cod_reconciliation_overdue",
                dedupeKey: `cod:overdue:${item.orderId}:${item.status}`,
                channels: ["admin", "email"],
                metadata: {
                    module: "finance_compliance",
                    runId: run.id,
                },
            });
        }

        return { runId: run.id, rowsProcessed: processed };
    } catch (error) {
        await financeComplianceQueries.finishCodRun(run.id, {
            status: "failed",
            finishedAt: new Date(),
            error: error instanceof Error ? error.message : "Unknown COD sync error",
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
            ownerRole: "finance_admin",
            type: "cod_sync_failed",
            dedupeKey: `cod:sync-failed:${run.id}`,
            channels: ["admin", "email", "whatsapp"],
            metadata: {
                module: "finance_compliance",
            },
        });
        throw error;
    }
}

export async function writeOffCodDiscrepancy(input: {
    id: string;
    actorId: string;
    reason: string;
    proofFileUrl: string;
    notes?: string | null;
}) {
    const existing = await financeComplianceQueries.listCodReconciliation();
    const row = existing.find((item) => item.id === input.id);
    if (!row) {
        throw new Error("COD reconciliation row not found.");
    }

    const updated = await financeComplianceQueries.markCodReconciliationResolution({
        id: row.id,
        status: "review",
        notes: input.notes ?? input.reason,
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
        title: "COD discrepancy write-off recorded",
        message: `COD discrepancy for order ${row.orderId} has been moved to finance review.`,
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
