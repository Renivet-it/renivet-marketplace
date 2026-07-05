import { financeComplianceQueries } from "@/lib/db/queries/finance-compliance";
import { splitGstByState } from "@/lib/finance/calculations";
import { toCsv } from "@/lib/finance/reporting";
import { auditAndAlert } from "@/lib/monitoring-sla/audit";

type GstExportPreview = {
    monthKey: string;
    validationErrors: string[];
    totals: Record<string, number>;
    rows: Array<Record<string, unknown>>;
};

function getMonthRange(monthKey: string) {
    const [year, month] = monthKey.split("-").map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    return { start, end };
}

function formatInvoiceNumber(prefix: string, orderId: string, monthKey: string) {
    return `${prefix}/${monthKey.replace("-", "")}/${orderId}`;
}

export async function previewGstExport(monthKey: string): Promise<GstExportPreview> {
    const { start, end } = getMonthRange(monthKey);
    const [orders, refunds] = await Promise.all([
        financeComplianceQueries.listOrdersForFinanceWindow({ start, end }),
        financeComplianceQueries.listRecentRefundsForOrderIds(
            (await financeComplianceQueries.listOrdersForFinanceWindow({ start, end })).map(
                (order) => order.id
            )
        ),
    ]);

    const validationErrors: string[] = [];
    const rows: Array<Record<string, unknown>> = [];
    let taxableTotal = 0;
    let taxTotal = 0;
    let tcsTotal = 0;

    for (const order of orders) {
        const customerState = order.address?.state ?? "";
        for (const item of order.items) {
            const product = item.product;
            const brand = product?.brand as
                | ({ name?: string; confidential?: { gstin?: string | null; state?: string | null } | null })
                | undefined;
            const brandGstin = brand?.confidential?.gstin ?? "";
            const hsnCode = product?.hsCode ?? "";
            if (!hsnCode) {
                validationErrors.push(`Missing HSN for product ${product?.title ?? item.productId}`);
            }
            if (!brandGstin) {
                validationErrors.push(`Missing brand GSTIN for brand ${brand?.name ?? "unknown"}`);
            }

            const taxableValuePaise =
                Number(item.variant?.price ?? product?.price ?? 0) * item.quantity;
            const gstRateBps = 1800;
            const gstSplit = splitGstByState({
                taxableValuePaise,
                gstRateBps,
                supplierState: brand?.confidential?.state ?? "",
                customerState,
            });
            const tcsPaise = Math.round(taxableValuePaise * 0.01);
            taxableTotal += taxableValuePaise;
            taxTotal += gstSplit.totalTaxPaise;
            tcsTotal += tcsPaise;

            rows.push({
                section: order.customerGstin ? "B2B" : "B2C",
                invoiceNumber: formatInvoiceNumber("REN", order.id, monthKey),
                orderId: order.id,
                orderDate: new Date(order.createdAt ?? new Date()).toISOString().slice(0, 10),
                brandName: brand?.name ?? "",
                brandGstin,
                customerGstin: order.customerGstin ?? "",
                hsnCode,
                taxableValue: (taxableValuePaise / 100).toFixed(2),
                gstRatePercent: (gstRateBps / 100).toFixed(2),
                cgst: (gstSplit.cgstPaise / 100).toFixed(2),
                sgst: (gstSplit.sgstPaise / 100).toFixed(2),
                igst: (gstSplit.igstPaise / 100).toFixed(2),
                tcs: (tcsPaise / 100).toFixed(2),
                state: customerState,
            });
        }
    }

    for (const refund of refunds) {
        rows.push({
            section: "CREDIT_NOTE",
            creditNoteNumber: formatInvoiceNumber("CRN", refund.id, monthKey),
            refundId: refund.id,
            orderId: refund.orderId,
            amount: (refund.amount / 100).toFixed(2),
            reasonCode: refund.reasonCode ?? "",
        });
    }

    return {
        monthKey,
        validationErrors,
        totals: {
            taxableValuePaise: taxableTotal,
            gstPaise: taxTotal,
            tcsPaise: tcsTotal,
            rowCount: rows.length,
        },
        rows,
    };
}

export async function generateGstExport(monthKey: string, actorId: string) {
    const preview = await previewGstExport(monthKey);
    const csv = toCsv(preview.rows);
    const run = await financeComplianceQueries.createGstReportRun({
        monthKey,
        status: preview.validationErrors.length ? "failed" : "generated",
        generatedBy: actorId,
        recordCount: preview.rows.length,
        totals: preview.totals,
        validationSummary: {
            errors: preview.validationErrors,
        },
    });

    await auditAndAlert({
        actorId,
        actionType: "gst_tcs_export_generated",
        entityType: "gst_report_run",
        entityId: run.id,
        afterValue: run as Record<string, unknown>,
        reason: preview.validationErrors.length ? "validation_failed" : "export_generated",
        title: "GST export generated",
        message: `GST/TCS export generated for ${monthKey}.`,
        severity: preview.validationErrors.length ? "warning" : "info",
        ownerRole: "finance_admin",
        type: "gst_export_generated",
        dedupeKey: `gst:export:${monthKey}`,
        channels: ["admin"],
        metadata: {
            module: "finance_compliance",
            validationErrors: preview.validationErrors,
        },
    });

    return { run, csv, preview };
}
