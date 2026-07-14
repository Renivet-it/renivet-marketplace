import { db } from "@/lib/db";
import { financeComplianceQueries } from "@/lib/db/queries/finance-compliance";
import { corporateOrders } from "@/lib/db/schema";
import { deriveGstRateBps, splitGstByState } from "@/lib/finance/calculations";
import { toCsv } from "@/lib/finance/reporting";
import { auditAndAlert } from "@/lib/monitoring-sla/audit";
import { and, desc, eq, gte, lte } from "drizzle-orm";

type ValidationIssue = {
    severity: "error" | "warning";
    code:
        | "missing_hsn"
        | "missing_brand_gstin"
        | "missing_customer_gstin"
        | "missing_customer_state"
        | "inactive_hsn"
        | "missing_hsn_master"
        | "missing_corporate_brand"
        | "missing_corporate_state";
    message: string;
    entityType: "order" | "product" | "brand" | "corporate_order";
    entityId: string;
};

type GstCsvRow = {
    section: "GST" | "CREDIT_NOTE" | "TCS";
    subsection: "B2B" | "B2C" | "TCS" | "CREDIT_NOTE";
    invoiceNumber: string;
    invoiceDate: string;
    originalInvoiceNumber: string;
    customerGstin: string;
    customerState: string;
    customerStateCode: string;
    supplierGstin: string;
    supplierName: string;
    hsnCode: string;
    taxableValue: string;
    gstRatePercent: string;
    cgst: string;
    sgst: string;
    igst: string;
    creditNoteAmount: string;
    tcsRatePercent: string;
    tcsAmount: string;
    stateOfSupply: string;
    orderReference: string;
    notes: string;
};

type GstExportPreview = {
    monthKey: string;
    validationIssues: ValidationIssue[];
    totals: {
        totalInvoices: number;
        totalTaxableValuePaise: number;
        totalCgstPaise: number;
        totalSgstPaise: number;
        totalIgstPaise: number;
        totalCreditNotePaise: number;
        totalTcsPaise: number;
        rowCount: number;
    };
    rows: GstCsvRow[];
    isReady: boolean;
};

const CSV_HEADERS: Array<keyof GstCsvRow> = [
    "section",
    "subsection",
    "invoiceNumber",
    "invoiceDate",
    "originalInvoiceNumber",
    "customerGstin",
    "customerState",
    "customerStateCode",
    "supplierGstin",
    "supplierName",
    "hsnCode",
    "taxableValue",
    "gstRatePercent",
    "cgst",
    "sgst",
    "igst",
    "creditNoteAmount",
    "tcsRatePercent",
    "tcsAmount",
    "stateOfSupply",
    "orderReference",
    "notes",
];

const STATE_CODE_MAP: Record<string, string> = {
    andhra_pradesh: "37",
    arunachal_pradesh: "12",
    assam: "18",
    bihar: "10",
    chandigarh: "04",
    chhattisgarh: "22",
    delhi: "07",
    goa: "30",
    gujarat: "24",
    haryana: "06",
    himachal_pradesh: "02",
    jharkhand: "20",
    karnataka: "29",
    kerala: "32",
    madhya_pradesh: "23",
    maharashtra: "27",
    odisha: "21",
    punjab: "03",
    rajasthan: "08",
    tamil_nadu: "33",
    telangana: "36",
    uttar_pradesh: "09",
    uttarakhand: "05",
    west_bengal: "19",
};

function getMonthRange(monthKey: string) {
    const [year, month] = monthKey.split("-").map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    return { start, end };
}

function normalizeState(value?: string | null) {
    return value?.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_") ?? "";
}

function stateCodeFromName(value?: string | null) {
    return STATE_CODE_MAP[normalizeState(value)] ?? "";
}

function formatInvoiceNumber(prefix: "INV" | "CRN", reference: string, monthKey: string) {
    const compactMonth = monthKey.replace("-", "");
    const suffix = reference.replace(/[^A-Za-z0-9]/g, "").slice(-4).toUpperCase().padStart(4, "0");
    return `${prefix}-${compactMonth}-${suffix}`;
}

function getMonthKeyFromDate(value: Date | string | null | undefined) {
    const date = value ? new Date(value) : new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMoney(paise: number) {
    return (paise / 100).toFixed(2);
}

function formatRate(bps: number) {
    return (bps / 100).toFixed(2);
}

function readCorporateState(snapshot: Record<string, unknown> | null, fallbackCity?: string | null) {
    const shippingAddress =
        snapshot?.shippingAddress &&
        typeof snapshot.shippingAddress === "object" &&
        !Array.isArray(snapshot.shippingAddress)
            ? (snapshot.shippingAddress as Record<string, unknown>)
            : null;

    for (const field of ["state", "province", "region"]) {
        const value = shippingAddress?.[field];
        if (typeof value === "string" && value.trim()) return value.trim();
    }

    return fallbackCity?.trim() ?? "";
}

function emptyCsvRow(): GstCsvRow {
    return {
        section: "GST",
        subsection: "B2C",
        invoiceNumber: "",
        invoiceDate: "",
        originalInvoiceNumber: "",
        customerGstin: "",
        customerState: "",
        customerStateCode: "",
        supplierGstin: "",
        supplierName: "",
        hsnCode: "",
        taxableValue: "",
        gstRatePercent: "",
        cgst: "",
        sgst: "",
        igst: "",
        creditNoteAmount: "",
        tcsRatePercent: "",
        tcsAmount: "",
        stateOfSupply: "",
        orderReference: "",
        notes: "",
    };
}

export async function previewGstExport(monthKey: string): Promise<GstExportPreview> {
    const { start, end } = getMonthRange(monthKey);
    const [orders, corporateRows, refundRows, hsnRows] = await Promise.all([
        financeComplianceQueries.listOrdersForFinanceWindow({ start, end }),
        db.query.corporateOrders.findMany({
            where: and(
                gte(corporateOrders.createdAt, start),
                lte(corporateOrders.createdAt, end),
                eq(corporateOrders.paymentStatus, "paid")
            ),
            with: {
                brand: {
                    with: {
                        confidential: true,
                    },
                },
            },
            orderBy: [desc(corporateOrders.createdAt)],
        }),
        financeComplianceQueries.listRefundsForPayoutWindow({ start, end }),
        financeComplianceQueries.listHsnMaster(),
    ]);

    const hsnByCode = new Map(hsnRows.map((row) => [row.hsnCode, row]));
    const validationIssues: ValidationIssue[] = [];
    const rows: GstCsvRow[] = [];
    const tcsBuckets = new Map<string, { supplierGstin: string; supplierName: string; state: string; taxablePaise: number }>();

    let totalInvoices = 0;
    let totalTaxableValuePaise = 0;
    let totalCgstPaise = 0;
    let totalSgstPaise = 0;
    let totalIgstPaise = 0;
    let totalCreditNotePaise = 0;

    for (const order of orders) {
        if (order.paymentStatus !== "paid" && order.paymentStatus !== "refunded") continue;

        const customerState = order.address?.state?.trim() ?? "";
        const customerStateCode = stateCodeFromName(customerState);
        if (!customerState) {
            validationIssues.push({
                severity: "error",
                code: "missing_customer_state",
                message: `Order ${order.id} is missing customer state for GST split.`,
                entityType: "order",
                entityId: order.id,
            });
        }

        const grossBeforeDiscount = order.items.reduce(
            (sum, item) => sum + Number(item.variant?.price ?? item.product?.price ?? 0) * item.quantity,
            0
        );
        let orderHasInvoiceRows = false;

        for (const item of order.items) {
            const product = item.product;
            const brand = product?.brand;
            const brandGstin = brand?.confidential?.gstin?.trim() ?? "";
            const hsnCode = product?.hsCode?.trim() ?? "";
            const hsn = hsnCode ? hsnByCode.get(hsnCode) : undefined;
            const unitPricePaise = Number(item.variant?.price ?? product?.price ?? 0);
            const lineGrossPaise = unitPricePaise * item.quantity;
            const discountSharePaise =
                grossBeforeDiscount > 0
                    ? Math.round((lineGrossPaise / grossBeforeDiscount) * (order.discountAmount ?? 0))
                    : 0;
            const taxableValuePaise = Math.max(0, lineGrossPaise - discountSharePaise);
            const gstRateBps = deriveGstRateBps({
                hsnCode,
                fallbackRateBps: hsn?.gstRateBps ?? 0,
                unitPricePaise,
            });
            const gstSplit = splitGstByState({
                taxableValuePaise,
                gstRateBps,
                supplierState: "Karnataka",
                customerState,
            });

            if (!hsnCode) {
                validationIssues.push({
                    severity: "error",
                    code: "missing_hsn",
                    message: `Product ${product?.title ?? item.productId} is missing an HSN code.`,
                    entityType: "product",
                    entityId: product?.id ?? item.productId,
                });
            } else if (!hsn) {
                validationIssues.push({
                    severity: "error",
                    code: "missing_hsn_master",
                    message: `HSN ${hsnCode} for product ${product?.title ?? item.productId} is not present in HSN master.`,
                    entityType: "product",
                    entityId: product?.id ?? item.productId,
                });
            } else if (!hsn.isActive) {
                validationIssues.push({
                    severity: "warning",
                    code: "inactive_hsn",
                    message: `HSN ${hsnCode} for product ${product?.title ?? item.productId} is inactive in HSN master.`,
                    entityType: "product",
                    entityId: product?.id ?? item.productId,
                });
            }

            if (!brandGstin) {
                validationIssues.push({
                    severity: "error",
                    code: "missing_brand_gstin",
                    message: `Brand ${brand?.name ?? "unknown"} is missing GSTIN.`,
                    entityType: "brand",
                    entityId: brand?.id ?? "unknown",
                });
            }

            const row = emptyCsvRow();
            row.section = "GST";
            row.subsection = order.customerGstin ? "B2B" : "B2C";
            row.invoiceNumber = formatInvoiceNumber("INV", order.id, monthKey);
            row.invoiceDate = new Date(order.createdAt ?? new Date()).toISOString().slice(0, 10);
            row.customerGstin = order.customerGstin ?? "";
            row.customerState = customerState;
            row.customerStateCode = customerStateCode;
            row.supplierGstin = brandGstin;
            row.supplierName = brand?.name ?? "";
            row.hsnCode = hsnCode;
            row.taxableValue = formatMoney(taxableValuePaise);
            row.gstRatePercent = formatRate(gstRateBps);
            row.cgst = formatMoney(gstSplit.cgstPaise);
            row.sgst = formatMoney(gstSplit.sgstPaise);
            row.igst = formatMoney(gstSplit.igstPaise);
            row.orderReference = order.id;
            row.stateOfSupply = customerState;
            row.notes = product?.title ?? "";
            rows.push(row);
            orderHasInvoiceRows = true;

            totalTaxableValuePaise += taxableValuePaise;
            totalCgstPaise += gstSplit.cgstPaise;
            totalSgstPaise += gstSplit.sgstPaise;
            totalIgstPaise += gstSplit.igstPaise;

            if (brandGstin) {
                const bucketKey = `${brand?.id ?? "unknown"}::${customerState}`;
                const bucket = tcsBuckets.get(bucketKey) ?? {
                    supplierGstin: brandGstin,
                    supplierName: brand?.name ?? "",
                    state: customerState,
                    taxablePaise: 0,
                };
                bucket.taxablePaise += taxableValuePaise;
                tcsBuckets.set(bucketKey, bucket);
            }
        }

        if (orderHasInvoiceRows) {
            totalInvoices += 1;
        }
    }

    for (const order of corporateRows) {
        const customerState = readCorporateState(
            (order.companySnapshot as Record<string, unknown> | null) ?? null,
            order.deliveryCity
        );
        const customerStateCode = stateCodeFromName(customerState);
        const brandGstin = order.brand?.confidential?.gstin?.trim() ?? "";
        const hsnCode =
            typeof (order.productConfigSnapshot as Record<string, unknown> | null)?.hsnCode === "string"
                ? String((order.productConfigSnapshot as Record<string, unknown>).hsnCode)
                : "";
        const hsn = hsnCode ? hsnByCode.get(hsnCode) : undefined;
        const taxableValuePaise = order.subtotalPaise + order.customizationPaise;
        const gstRateBps = deriveGstRateBps({
            hsnCode,
            fallbackRateBps: hsn?.gstRateBps ?? order.gstRateBps,
            unitPricePaise: order.quantity > 0 ? Math.round(taxableValuePaise / order.quantity) : taxableValuePaise,
        });
        const gstSplit = splitGstByState({
            taxableValuePaise,
            gstRateBps,
            supplierState: "Karnataka",
            customerState,
        });

        if (!order.brandId) {
            validationIssues.push({
                severity: "error",
                code: "missing_corporate_brand",
                message: `Corporate order ${order.publicOrderId} is missing its supplier brand mapping.`,
                entityType: "corporate_order",
                entityId: order.id,
            });
        }
        if (!order.gstNumber) {
            validationIssues.push({
                severity: "error",
                code: "missing_customer_gstin",
                message: `Corporate order ${order.publicOrderId} is missing customer GSTIN.`,
                entityType: "corporate_order",
                entityId: order.id,
            });
        }
        if (!customerState) {
            validationIssues.push({
                severity: "error",
                code: "missing_corporate_state",
                message: `Corporate order ${order.publicOrderId} is missing customer state.`,
                entityType: "corporate_order",
                entityId: order.id,
            });
        }
        if (!hsnCode || !hsn) {
            validationIssues.push({
                severity: "error",
                code: !hsnCode ? "missing_hsn" : "missing_hsn_master",
                message: `Corporate order ${order.publicOrderId} needs a valid HSN mapping.`,
                entityType: "corporate_order",
                entityId: order.id,
            });
        }
        if (!brandGstin) {
            validationIssues.push({
                severity: "error",
                code: "missing_brand_gstin",
                message: `Corporate order ${order.publicOrderId} supplier brand is missing GSTIN.`,
                entityType: "corporate_order",
                entityId: order.id,
            });
        }

        const row = emptyCsvRow();
        row.section = "GST";
        row.subsection = "B2B";
        row.invoiceNumber = formatInvoiceNumber("INV", order.publicOrderId, monthKey);
        row.invoiceDate = new Date(order.createdAt ?? new Date()).toISOString().slice(0, 10);
        row.customerGstin = order.gstNumber ?? "";
        row.customerState = customerState;
        row.customerStateCode = customerStateCode;
        row.supplierGstin = brandGstin;
        row.supplierName = order.brand?.name ?? "";
        row.hsnCode = hsnCode;
        row.taxableValue = formatMoney(taxableValuePaise);
        row.gstRatePercent = formatRate(gstRateBps);
        row.cgst = formatMoney(gstSplit.cgstPaise);
        row.sgst = formatMoney(gstSplit.sgstPaise);
        row.igst = formatMoney(gstSplit.igstPaise);
        row.orderReference = order.publicOrderId;
        row.stateOfSupply = customerState;
        row.notes = "Corporate order";
        rows.push(row);

        totalInvoices += 1;
        totalTaxableValuePaise += taxableValuePaise;
        totalCgstPaise += gstSplit.cgstPaise;
        totalSgstPaise += gstSplit.sgstPaise;
        totalIgstPaise += gstSplit.igstPaise;

        if (brandGstin) {
            const bucketKey = `${order.brandId ?? "unknown"}::${customerState}`;
            const bucket = tcsBuckets.get(bucketKey) ?? {
                supplierGstin: brandGstin,
                supplierName: order.brand?.name ?? "",
                state: customerState,
                taxablePaise: 0,
            };
            bucket.taxablePaise += taxableValuePaise;
            tcsBuckets.set(bucketKey, bucket);
        }
    }

    for (const refund of refundRows) {
        if (refund.status !== "processed") continue;
        const eventDate = refund.updatedAt ?? refund.createdAt;
        if (!eventDate) continue;
        const eventTime = new Date(eventDate).getTime();
        if (eventTime < start.getTime() || eventTime > end.getTime()) continue;

        const order = orders.find((candidate) => candidate.id === refund.orderId);
        if (!order || !order.items.length) continue;

        const customerState = order.address?.state?.trim() ?? "";
        const customerStateCode = stateCodeFromName(customerState);
        const grossBeforeDiscount = order.items.reduce(
            (sum, item) => sum + Number(item.variant?.price ?? item.product?.price ?? 0) * item.quantity,
            0
        );

        for (const item of order.items) {
            const product = item.product;
            const brand = product?.brand;
            const brandGstin = brand?.confidential?.gstin?.trim() ?? "";
            const hsnCode = product?.hsCode?.trim() ?? "";
            const hsn = hsnCode ? hsnByCode.get(hsnCode) : undefined;
            const unitPricePaise = Number(item.variant?.price ?? product?.price ?? 0);
            const lineGrossPaise = unitPricePaise * item.quantity;
            const discountSharePaise =
                grossBeforeDiscount > 0
                    ? Math.round((lineGrossPaise / grossBeforeDiscount) * (order.discountAmount ?? 0))
                    : 0;
            const originalTaxablePaise = Math.max(0, lineGrossPaise - discountSharePaise);
            const refundSharePaise =
                grossBeforeDiscount > 0
                    ? Math.round((lineGrossPaise / grossBeforeDiscount) * refund.amount)
                    : refund.amount;
            const gstRateBps = deriveGstRateBps({
                hsnCode,
                fallbackRateBps: hsn?.gstRateBps ?? 0,
                unitPricePaise,
            });
            const taxableCreditPaise = Math.min(originalTaxablePaise, refundSharePaise);
            const gstSplit = splitGstByState({
                taxableValuePaise: taxableCreditPaise,
                gstRateBps,
                supplierState: "Karnataka",
                customerState,
            });

            const row = emptyCsvRow();
            row.section = "CREDIT_NOTE";
            row.subsection = "CREDIT_NOTE";
            row.invoiceNumber = formatInvoiceNumber("CRN", refund.id, monthKey);
            row.invoiceDate = new Date(eventDate).toISOString().slice(0, 10);
            row.originalInvoiceNumber = formatInvoiceNumber(
                "INV",
                order.id,
                getMonthKeyFromDate(order.createdAt)
            );
            row.customerGstin = order.customerGstin ?? "";
            row.customerState = customerState;
            row.customerStateCode = customerStateCode;
            row.supplierGstin = brandGstin;
            row.supplierName = brand?.name ?? "";
            row.hsnCode = hsnCode;
            row.taxableValue = formatMoney(-taxableCreditPaise);
            row.gstRatePercent = formatRate(gstRateBps);
            row.cgst = formatMoney(-gstSplit.cgstPaise);
            row.sgst = formatMoney(-gstSplit.sgstPaise);
            row.igst = formatMoney(-gstSplit.igstPaise);
            row.creditNoteAmount = formatMoney(-refundSharePaise);
            row.orderReference = refund.orderId;
            row.stateOfSupply = customerState;
            row.notes = refund.id;
            rows.push(row);

            totalTaxableValuePaise -= taxableCreditPaise;
            totalCgstPaise -= gstSplit.cgstPaise;
            totalSgstPaise -= gstSplit.sgstPaise;
            totalIgstPaise -= gstSplit.igstPaise;
            totalCreditNotePaise += refundSharePaise;

            if (brandGstin) {
                const bucketKey = `${brand?.id ?? "unknown"}::${customerState}`;
                const bucket = tcsBuckets.get(bucketKey) ?? {
                    supplierGstin: brandGstin,
                    supplierName: brand?.name ?? "",
                    state: customerState,
                    taxablePaise: 0,
                };
                bucket.taxablePaise -= taxableCreditPaise;
                tcsBuckets.set(bucketKey, bucket);
            }
        }
    }

    let totalTcsPaise = 0;
    for (const bucket of tcsBuckets.values()) {
        const tcsPaise = Math.max(0, Math.round(bucket.taxablePaise * 0.01));
        totalTcsPaise += tcsPaise;
        const row = emptyCsvRow();
        row.section = "TCS";
        row.subsection = "TCS";
        row.supplierGstin = bucket.supplierGstin;
        row.supplierName = bucket.supplierName;
        row.taxableValue = formatMoney(bucket.taxablePaise);
        row.tcsRatePercent = "1.00";
        row.tcsAmount = formatMoney(tcsPaise);
        row.stateOfSupply = bucket.state;
        row.customerState = bucket.state;
        row.customerStateCode = stateCodeFromName(bucket.state);
        row.notes = "Marketplace TCS";
        rows.push(row);
    }

    return {
        monthKey,
        validationIssues,
        totals: {
            totalInvoices,
            totalTaxableValuePaise,
            totalCgstPaise,
            totalSgstPaise,
            totalIgstPaise,
            totalCreditNotePaise,
            totalTcsPaise,
            rowCount: rows.length,
        },
        rows,
        isReady: validationIssues.filter((issue) => issue.severity === "error").length === 0,
    };
}

export async function generateGstExport(monthKey: string, actorId: string) {
    const preview = await previewGstExport(monthKey);
    const csv = toCsv(preview.rows, CSV_HEADERS as string[]);
    const hasErrors = preview.validationIssues.some((issue) => issue.severity === "error");
    const run = await financeComplianceQueries.createGstReportRun({
        monthKey,
        status: "generated",
        generatedBy: actorId,
        recordCount: preview.rows.length,
        totals: preview.totals,
        validationSummary: {
            issues: preview.validationIssues,
            isReady: preview.isReady,
            hasErrors,
        },
    });

    await auditAndAlert({
        actorId,
        actionType: "gst_tcs_export_generated",
        entityType: "gst_report_run",
        entityId: run.id,
        afterValue: run as Record<string, unknown>,
        reason: hasErrors ? "export_generated_with_issues" : "export_generated",
        title: hasErrors ? "GST export generated with issues" : "GST export generated",
        message: hasErrors
            ? `GST/TCS export generated for ${monthKey} with validation issues.`
            : `GST/TCS export generated for ${monthKey}.`,
        severity: hasErrors ? "warning" : "info",
        ownerRole: "finance_admin",
        type: "gst_export_generated",
        dedupeKey: `gst:export:${monthKey}`,
        channels: ["admin"],
        metadata: {
            module: "finance_compliance",
            validationIssueCount: preview.validationIssues.length,
            hasErrors,
        },
    });

    return { run, csv, preview };
}
