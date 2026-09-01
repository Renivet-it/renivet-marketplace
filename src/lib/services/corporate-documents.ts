import { corporateFinancialYear } from "@/lib/corporate-documents";
import { db } from "@/lib/db";
import {
    brandConfidentials,
    corporateBrandPayouts,
    corporateBrandTaxInvoices,
    corporateCustomizations,
    corporateDeliveryChallans,
    corporateDocumentSequences,
    corporateDocumentSettings,
    corporatePayments,
    corporateProformaInvoices,
    corporatePurchaseOrders,
    corporateReceiptVouchers,
    corporateSettlementStatements,
    corporateTaxInvoices,
    corporateVendorPurchaseOrders,
    hsnMaster,
    products,
} from "@/lib/db/schema";
import { requireCorporateTaxClassification } from "@/lib/finance/corporate-tax-classification";
import {
    corporateBrandTaxInvoiceInputSchema,
    corporateBrandTaxInvoiceReviewInputSchema,
    corporateDeliveryChallanInputSchema,
    corporateDocumentSettingsInputSchema,
    corporateVendorPurchaseOrderInputSchema,
} from "@/lib/validations/corporate-platform";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, sql } from "drizzle-orm";

export async function getCorporateDocumentSettings() {
    const current = await db.query.corporateDocumentSettings.findFirst({
        where: eq(corporateDocumentSettings.isActive, true),
        orderBy: [desc(corporateDocumentSettings.createdAt)],
    });
    if (current) return current;

    return db
        .insert(corporateDocumentSettings)
        .values({})
        .returning()
        .then((rows) => rows[0]);
}

export function defaultBrandInvoiceCode(brandName: string, brandId: string) {
    const letters = brandName.replace(/[^a-z0-9]/gi, "").toUpperCase();
    return `${letters.slice(0, 3).padEnd(3, "X")}${brandId.replace(/-/g, "").slice(-1).toUpperCase()}`;
}

export function brandFinancialYearCode(date: Date = new Date()) {
    const startYear =
        date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
    return `${String(startYear).slice(-2)}${String(startYear + 1).slice(-2)}`;
}

export async function nextBrandInvoiceNumber(params: {
    brandId: string;
    brandName: string;
    invoiceCode?: string | null;
    date?: Date;
}) {
    const invoiceDate = params.date ?? new Date();
    const financialYear = brandFinancialYearCode(invoiceDate);
    const invoiceCode =
        params.invoiceCode ||
        defaultBrandInvoiceCode(params.brandName, params.brandId);

    const sequence = await db.execute<{ last_sequence: number }>(sql`
        INSERT INTO brand_invoice_sequences (brand_id, financial_year, last_sequence)
        VALUES (${params.brandId}::uuid, ${financialYear}, 1)
        ON CONFLICT (brand_id, financial_year)
        DO UPDATE SET last_sequence = brand_invoice_sequences.last_sequence + 1,
                      updated_at = now()
        RETURNING last_sequence
    `);

    return `${invoiceCode}/${financialYear}/${String(sequence[0]?.last_sequence ?? 1).padStart(5, "0")}`;
}

export async function nextCorporateDocumentNumber(
    prefix: "PI" | "RV" | "FO" | "RPO" | "CINV" | "DC" | "CN" | "DN" | "QT" | "SET",
    date: string | Date = new Date()
) {
    const financialYear = corporateFinancialYear(date);
    const result = await db
        .insert(corporateDocumentSequences)
        .values({
            documentPrefix: prefix,
            financialYear,
            lastSequence: 1,
        })
        .onConflictDoUpdate({
            target: [
                corporateDocumentSequences.documentPrefix,
                corporateDocumentSequences.financialYear,
            ],
            set: {
                lastSequence: sql`${corporateDocumentSequences.lastSequence} + 1`,
                updatedAt: new Date(),
            },
        })
        .returning({ sequence: corporateDocumentSequences.lastSequence })
        .then((rows) => rows[0]);

    return `${prefix}/${financialYear}/${String(result.sequence).padStart(5, "0")}`;
}

export function corporatePartyAddress(party: {
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    country?: string | null;
}) {
    return [
        party.addressLine1,
        party.addressLine2,
        party.city,
        party.state,
        party.postalCode,
        party.country,
    ]
        .map((value) => value?.trim())
        .filter(Boolean)
        .join(", ");
}

export function gstStateCode(gstin?: string | null) {
    return /^\d{2}/.exec(gstin?.trim() ?? "")?.[0] ?? null;
}

export function assertCorporateLegalIdentity(settings: {
    gstin?: string | null;
    addressLine1?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
}) {
    const missing = [
        ["GSTIN", settings.gstin],
        ["address", settings.addressLine1],
        ["city", settings.city],
        ["state", settings.state],
        ["postal code", settings.postalCode],
    ]
        .filter(([, value]) => !value?.trim())
        .map(([label]) => label);
    if (missing.length) {
        throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: `Complete Renivet corporate document settings: ${missing.join(
                ", "
            )}`,
        });
    }
}

function orderDeliveryAddress(order: {
    deliveryAddress: string;
    deliveryCity: string;
    deliveryPincode: string;
    deliveryCountry: string;
}) {
    return [
        order.deliveryAddress,
        order.deliveryCity,
        order.deliveryPincode,
        order.deliveryCountry,
    ]
        .filter(Boolean)
        .join(", ");
}

async function getOrderOrThrow(orderId: string) {
    const order = await db.query.corporateOrders.findFirst({
        where: (table, { eq }) => eq(table.id, orderId),
        with: {
            brand: true,
            quote: { with: { profile: true } },
        },
    });
    if (!order) {
        throw new TRPCError({
            code: "NOT_FOUND",
            message: "Corporate order not found",
        });
    }
    return order;
}

export const corporateDocumentService = {
    async getSettings() {
        return getCorporateDocumentSettings();
    },

    async updateSettings(input: unknown) {
        const parsed = corporateDocumentSettingsInputSchema.parse(input);
        const current = await getCorporateDocumentSettings();
        return db
            .update(corporateDocumentSettings)
            .set({ ...parsed, updatedAt: new Date() })
            .where(eq(corporateDocumentSettings.id, current.id))
            .returning()
            .then((rows) => rows[0]);
    },

    async ensureReceiptVoucher(orderId: string, paymentId?: string | null) {
        const order = await getOrderOrThrow(orderId);
        if (order.advancePaidPaise <= 0) return null;

        const existing = paymentId
            ? await db.query.corporateReceiptVouchers.findFirst({
                  where: eq(corporateReceiptVouchers.paymentId, paymentId),
              })
            : await db.query.corporateReceiptVouchers.findFirst({
                  where: and(
                      eq(corporateReceiptVouchers.orderId, order.id),
                      eq(corporateReceiptVouchers.status, "issued")
                  ),
                  orderBy: [desc(corporateReceiptVouchers.createdAt)],
              });
        if (existing) return existing;

        const [payment, incomingPo] = await Promise.all([
            paymentId
                ? db.query.corporatePayments.findFirst({
                      where: eq(corporatePayments.id, paymentId),
                  })
                : db.query.corporatePayments.findFirst({
                      where: eq(corporatePayments.orderId, order.id),
                      orderBy: [desc(corporatePayments.createdAt)],
                  }),
            db.query.corporatePurchaseOrders.findFirst({
                where: eq(corporatePurchaseOrders.corporateOrderId, order.id),
                orderBy: [desc(corporatePurchaseOrders.createdAt)],
            }),
        ]);
        const voucherDate = payment?.paymentDate ?? new Date();
        const voucherNumber = await nextCorporateDocumentNumber(
            "RV",
            voucherDate
        );

        return db
            .insert(corporateReceiptVouchers)
            .values({
                voucherNumber,
                orderId: order.id,
                paymentId: payment?.id ?? null,
                voucherDate:
                    typeof voucherDate === "string"
                        ? voucherDate
                        : voucherDate.toISOString().slice(0, 10),
                amountPaise: payment?.amountPaise ?? order.advancePaidPaise,
                paymentMode: payment?.paymentMode ?? "prepaid",
                paymentReference:
                    payment?.paymentReference ?? order.paymentReference,
                poReference: incomingPo?.poNumber ?? null,
                status: "issued",
            })
            .returning()
            .then((rows) => rows[0]);
    },

    async ensureProformaInvoiceForOrder(orderId: string) {
        const order = await getOrderOrThrow(orderId);
        const snapshot = (order.pricingSnapshot ?? {}) as Record<
            string,
            unknown
        >;
        const hsnCode =
            order.quote?.hsnCode ??
            (typeof snapshot.hsnCode === "string" ? snapshot.hsnCode : null);
        const classificationRow = hsnCode
            ? await db.query.hsnMaster.findFirst({
                  where: and(
                      eq(hsnMaster.hsnCode, hsnCode),
                      eq(hsnMaster.isActive, true)
                  ),
              })
            : null;
        try {
            requireCorporateTaxClassification({
                hsnCode: classificationRow?.hsnCode,
                gstRateBps: classificationRow?.gstRateBps,
                sourceId: classificationRow?.id,
            });
        } catch {
            throw new TRPCError({
                code: "PRECONDITION_FAILED",
                message:
                    "An active HSN Master classification is required before issuing the proforma invoice",
            });
        }
        if (order.quoteId) {
            return db.query.corporateProformaInvoices.findFirst({
                where: and(
                    eq(corporateProformaInvoices.quoteId, order.quoteId),
                    eq(corporateProformaInvoices.status, "issued")
                ),
                orderBy: [desc(corporateProformaInvoices.createdAt)],
            });
        }
        const existing = await db.query.corporateProformaInvoices.findFirst({
            where: and(
                eq(corporateProformaInvoices.orderId, order.id),
                eq(corporateProformaInvoices.status, "issued")
            ),
            orderBy: [desc(corporateProformaInvoices.createdAt)],
        });
        if (existing) return existing;
        const orderCustomizations =
            await db.query.corporateCustomizations.findMany({
                where: eq(corporateCustomizations.orderId, order.id),
                orderBy: [asc(corporateCustomizations.createdAt)],
            });

        const [settings, invoiceNumber] = await Promise.all([
            getCorporateDocumentSettings(),
            nextCorporateDocumentNumber("PI"),
        ]);
        const invoiceDate = new Date();
        const validUntil = new Date(invoiceDate);
        validUntil.setDate(
            validUntil.getDate() + settings.proformaValidityDays
        );

        return db
            .insert(corporateProformaInvoices)
            .values({
                invoiceNumber,
                orderId: order.id,
                invoiceDate: invoiceDate.toISOString().slice(0, 10),
                validUntil: validUntil.toISOString().slice(0, 10),
                subtotalPaise: order.subtotalPaise + order.customizationPaise,
                gstAmountPaise: order.gstPaise,
                totalAmountPaise: order.totalPaise,
                customizations: orderCustomizations.map((row) => ({
                    id: row.id,
                    type: row.customizationType,
                    amountPaise: row.costPaise,
                    status: row.status,
                    metadata: row.metadata,
                })),
                paymentTerms: settings.defaultPaymentTerms,
                deliveryTimeline:
                    "Delivery timeline will be confirmed after order review and artwork confirmation.",
                termsAndConditions:
                    "This proforma invoice is not a tax invoice. The advance payment has been received and will be adjusted against the final tax invoice issued on dispatch.",
                status: "issued",
            })
            .returning()
            .then((rows) => rows[0]);
    },

    async issueFulfillmentOrder(actorUserId: string, input: unknown) {
        const parsed = corporateVendorPurchaseOrderInputSchema.parse(input);
        const order = await getOrderOrThrow(parsed.orderId);
        if (!order.brandId || !order.brand) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Assign a brand before issuing the Fulfillment Order",
            });
        }

        const existing = await db.query.corporateVendorPurchaseOrders.findFirst(
            {
                where: and(
                    eq(corporateVendorPurchaseOrders.orderId, order.id),
                    eq(corporateVendorPurchaseOrders.status, "issued")
                ),
                orderBy: [desc(corporateVendorPurchaseOrders.createdAt)],
            }
        );
        if (existing) return existing;

        if (parsed.customizations.length > 0) {
            await db.insert(corporateCustomizations).values(
                parsed.customizations.map((customization, index) => ({
                    orderId: order.id,
                    customizationType: String(
                        customization.name ??
                            customization.type ??
                            "Customization"
                    ),
                    costPaise: Math.max(
                        0,
                        Number(customization.amountPaise ?? 0)
                    ),
                    metadata: {
                        ...customization,
                        displayOrder: Number(
                            customization.displayOrder ?? index + 1
                        ),
                    },
                }))
            );
        }
        const orderCustomizations =
            await db.query.corporateCustomizations.findMany({
                where: eq(corporateCustomizations.orderId, order.id),
                orderBy: [asc(corporateCustomizations.createdAt)],
            });

        const [settings, brandDetails, receiptVoucher] = await Promise.all([
            getCorporateDocumentSettings(),
            db.query.brandConfidentials.findFirst({
                where: eq(brandConfidentials.id, order.brandId),
            }),
            db.query.corporateReceiptVouchers.findFirst({
                where: eq(corporateReceiptVouchers.orderId, order.id),
                orderBy: [desc(corporateReceiptVouchers.createdAt)],
            }),
        ]);
        if (!receiptVoucher || receiptVoucher.status !== "issued") {
            throw new TRPCError({
                code: "PRECONDITION_FAILED",
                message:
                    "Record the advance and issue its receipt voucher before issuing the Fulfillment Order",
            });
        }
        assertCorporateLegalIdentity(settings);
        const unitSellPricePaise = parsed.unitBuyPricePaise ?? 0;
        const totalAmountPaise = unitSellPricePaise * order.quantity;
        const issueDate = new Date();
        const foNumber = await nextCorporateDocumentNumber("FO", issueDate);
        const deliveryAddress =
            parsed.deliveryMode === "direct_to_customer"
                ? orderDeliveryAddress(order)
                : corporatePartyAddress(settings) || "Renivet warehouse";

        return db
            .insert(corporateVendorPurchaseOrders)
            .values({
                foNumber,
                orderId: order.id,
                brandId: order.brandId,
                issueDate: issueDate.toISOString().slice(0, 10),
                expectedDeliveryDate: parsed.expectedDeliveryDate ?? null,
                quantity: order.quantity,
                unitSellPricePaise,
                totalAmountPaise,
                deliveryMode: parsed.deliveryMode,
                deliveryAddress,
                paymentTerms: parsed.paymentTerms,
                deliveryInstructions: parsed.deliveryInstructions ?? null,
                customizations: orderCustomizations.map((row) => ({
                    id: row.id,
                    type: row.customizationType,
                    amountPaise: row.costPaise,
                    status: row.status,
                    metadata: row.metadata,
                })),
                status: "issued",
                createdByUserId: actorUserId,
            })
            .returning()
            .then((rows) => rows[0]);
    },

    async issueVendorPurchaseOrder(actorUserId: string, input: unknown) {
        return this.issueFulfillmentOrder(actorUserId, input);
    },

    async recordBrandTaxInvoice(actorUserId: string, input: unknown) {
        const parsed = corporateBrandTaxInvoiceInputSchema.parse(input);
        const order = await getOrderOrThrow(parsed.orderId);
        if (!order.brandId) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "This order has no assigned brand",
            });
        }

        const [settings, brandDetails, vendorPo, product] = await Promise.all([
            getCorporateDocumentSettings(),
            db.query.brandConfidentials.findFirst({
                where: eq(brandConfidentials.id, order.brandId!),
            }),
            parsed.vendorPurchaseOrderId
                ? db.query.corporateVendorPurchaseOrders.findFirst({
                      where: eq(
                          corporateVendorPurchaseOrders.id,
                          parsed.vendorPurchaseOrderId
                      ),
                  })
                : db.query.corporateVendorPurchaseOrders.findFirst({
                      where: eq(
                          corporateVendorPurchaseOrders.orderId,
                          order.id
                      ),
                      orderBy: [desc(corporateVendorPurchaseOrders.createdAt)],
                  }),
            order.quote?.productId
                ? db.query.products.findFirst({
                      where: eq(products.id, order.quote.productId),
                  })
                : Promise.resolve(null),
        ]);
        const validationIssues: string[] = [];
        if (!vendorPo)
            validationIssues.push("Renivet purchase order is missing");
        if (
            vendorPo &&
            (vendorPo.orderId !== order.id ||
                vendorPo.brandId !== order.brandId)
        ) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                    "The selected purchase order does not match this order",
            });
        }
        if (
            brandDetails?.gstin &&
            parsed.supplierGstin !== brandDetails.gstin.trim().toUpperCase()
        ) {
            validationIssues.push(
                "Supplier GSTIN does not match the brand record"
            );
        }
        if (
            settings.gstin &&
            parsed.recipientGstin !== settings.gstin.trim().toUpperCase()
        ) {
            validationIssues.push("Recipient GSTIN does not match Renivet");
        }
        if (
            product?.hsCode &&
            parsed.hsnCode !== product.hsCode.replace(/\s/g, "")
        ) {
            validationIssues.push("HSN does not match the ordered product");
        }
        if (vendorPo && parsed.totalAmountPaise !== vendorPo.totalAmountPaise) {
            validationIssues.push(
                "Invoice total does not match the Renivet PO"
            );
        }
        const calculatedTotal =
            parsed.taxableValuePaise +
            parsed.cgstPaise +
            parsed.sgstPaise +
            parsed.igstPaise;
        if (calculatedTotal !== parsed.totalAmountPaise) {
            validationIssues.push(
                "Taxable value plus GST does not equal total"
            );
        }

        return db
            .insert(corporateBrandTaxInvoices)
            .values({
                orderId: order.id,
                brandId: order.brandId,
                vendorPurchaseOrderId: vendorPo?.id ?? null,
                invoiceNumber: parsed.invoiceNumber,
                invoiceDate: parsed.invoiceDate,
                supplierGstin: parsed.supplierGstin,
                recipientGstin: parsed.recipientGstin,
                hsnCode: parsed.hsnCode,
                taxableValuePaise: parsed.taxableValuePaise,
                cgstPaise: parsed.cgstPaise,
                sgstPaise: parsed.sgstPaise,
                igstPaise: parsed.igstPaise,
                totalAmountPaise: parsed.totalAmountPaise,
                fileName: parsed.file.name,
                fileUrl: parsed.file.url,
                validationStatus:
                    validationIssues.length === 0 ? "validated" : "pending",
                validationIssues,
                gstr2bStatus: "pending",
                uploadedByUserId: actorUserId,
            })
            .returning()
            .then((rows) => rows[0]);
    },

    async reviewBrandTaxInvoice(input: unknown) {
        const parsed = corporateBrandTaxInvoiceReviewInputSchema.parse(input);
        return db
            .update(corporateBrandTaxInvoices)
            .set({
                validationStatus: parsed.validationStatus,
                gstr2bStatus: parsed.gstr2bStatus,
                reviewNotes: parsed.reviewNotes ?? null,
                updatedAt: new Date(),
            })
            .where(eq(corporateBrandTaxInvoices.id, parsed.invoiceId))
            .returning()
            .then((rows) => rows[0]);
    },

    async issueDeliveryChallan(actorUserId: string, input: unknown) {
        const parsed = corporateDeliveryChallanInputSchema.parse(input);
        const order = await getOrderOrThrow(parsed.orderId);
        if (!order.brandId || !order.brand) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Assign a brand before issuing a delivery challan",
            });
        }

        const vendorPo = parsed.vendorPurchaseOrderId
            ? await db.query.corporateVendorPurchaseOrders.findFirst({
                  where: eq(
                      corporateVendorPurchaseOrders.id,
                      parsed.vendorPurchaseOrderId
                  ),
              })
            : await db.query.corporateVendorPurchaseOrders.findFirst({
                  where: eq(corporateVendorPurchaseOrders.orderId, order.id),
                  orderBy: [desc(corporateVendorPurchaseOrders.createdAt)],
              });
        if (!vendorPo || vendorPo.deliveryMode !== "direct_to_customer") {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                    "A direct-to-customer Renivet purchase order is required",
            });
        }

        const existing = await db.query.corporateDeliveryChallans.findFirst({
            where: and(
                eq(corporateDeliveryChallans.orderId, order.id),
                eq(corporateDeliveryChallans.status, "issued")
            ),
            orderBy: [desc(corporateDeliveryChallans.createdAt)],
        });
        if (existing) return existing;

        const brandDetails = await db.query.brandConfidentials.findFirst({
            where: eq(brandConfidentials.id, order.brandId),
        });
        const challanDate = new Date();
        const challanNumber = await nextCorporateDocumentNumber(
            "DC",
            challanDate
        );

        return db
            .insert(corporateDeliveryChallans)
            .values({
                challanNumber,
                orderId: order.id,
                vendorPurchaseOrderId: vendorPo.id,
                challanDate: challanDate.toISOString().slice(0, 10),
                consignorName: order.brand.name,
                consignorAddress:
                    corporatePartyAddress(brandDetails ?? {}) || "Not provided",
                consigneeName: order.companyName,
                consigneeAddress: orderDeliveryAddress(order),
                onBehalfOf: parsed.onBehalfOf ?? null,
                reasonForMovement: "Supply of goods",
                eWayBillNumber: parsed.eWayBillNumber ?? null,
                status: "issued",
                createdByUserId: actorUserId,
            })
            .returning()
            .then((rows) => rows[0]);
    },

    async issueSettlementStatement(
        actorUserId: string,
        input: {
            orderId: string;
            notes?: string;
            adjustmentReason?: string;
        }
    ) {
        const order = await getOrderOrThrow(input.orderId);
        if (!order.brandId || !order.brand) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Assign a brand before issuing a settlement statement",
            });
        }

        const existingStatement =
            await db.query.corporateSettlementStatements.findFirst({
                where: and(
                    eq(corporateSettlementStatements.orderId, order.id),
                    eq(corporateSettlementStatements.isCurrent, true)
                ),
                orderBy: [desc(corporateSettlementStatements.version)],
            });
        const adjustmentReason = input.adjustmentReason?.trim() || null;
        if (existingStatement && !adjustmentReason) return existingStatement;

        const invoice = await db.query.corporateTaxInvoices.findFirst({
            where: eq(corporateTaxInvoices.orderId, order.id),
            orderBy: [desc(corporateTaxInvoices.createdAt)],
        });

        const grossPaidPaise =
            invoice?.totalAmountPaise ?? order.totalPaise;
        const gstEmbeddedPaise = invoice
            ? invoice.cgstPaise + invoice.sgstPaise + invoice.igstPaise
            : order.gstPaise;
        if (
            !Number.isFinite(grossPaidPaise) ||
            !Number.isFinite(gstEmbeddedPaise) ||
            grossPaidPaise < 0 ||
            gstEmbeddedPaise < 0 ||
            gstEmbeddedPaise > grossPaidPaise
        ) {
            throw new TRPCError({
                code: "PRECONDITION_FAILED",
                message:
                    "A valid customer invoice or corporate order financial snapshot is required before settlement issuance",
            });
        }
        const taxableValuePaise = Math.max(
            0,
            grossPaidPaise - gstEmbeddedPaise
        );

        const commissionAmountPaise = order.commissionAmountPaise;
        if (!Number.isFinite(commissionAmountPaise) || commissionAmountPaise < 0) {
            throw new TRPCError({
                code: "PRECONDITION_FAILED",
                message: "An agreed commission amount is required before settlement issuance",
            });
        }
        const commissionPercentBps =
            taxableValuePaise > 0
                ? Math.round((commissionAmountPaise * 10000) / taxableValuePaise)
                : 0;

        const commissionGstRateBps = order.commissionGstRateBps;
        if (commissionGstRateBps == null || !order.commissionHsnCode) {
            throw new Error(
                "Cannot issue settlement statement: commission HSN/SAC classification is not set on the order"
            );
        }
        const commissionGstAmountPaise = Math.round(
            (commissionAmountPaise * commissionGstRateBps) / 10000
        );

        // Reseller/seller-of-record corporate orders do not use marketplace TCS/194-O.
        const tcsPercentBps = 0;
        const tcsAmountPaise = 0;
        const tdsPercentBps = 0;
        const tdsAmountPaise = 0;

        const netRemittancePaise = Math.max(
            0,
            taxableValuePaise -
                commissionAmountPaise -
                commissionGstAmountPaise -
                tcsAmountPaise -
                tdsAmountPaise
        );

        const statementDate = new Date();
        const orderCustomizations =
            await db.query.corporateCustomizations.findMany({
                where: eq(corporateCustomizations.orderId, order.id),
                orderBy: [asc(corporateCustomizations.createdAt)],
            });
        return db.transaction(async (tx) => {
            const currentPayout = await tx.query.corporateBrandPayouts.findFirst({
                where: eq(corporateBrandPayouts.orderId, order.id),
            });
            if (adjustmentReason && currentPayout?.payoutStatus === "paid") {
                throw new TRPCError({
                    code: "PRECONDITION_FAILED",
                    message:
                        "A paid brand payout cannot be adjusted; create a separate finance-approved correction",
                });
            }
            if (existingStatement) {
                await tx
                    .update(corporateSettlementStatements)
                    .set({ isCurrent: false, updatedAt: new Date() })
                    .where(eq(corporateSettlementStatements.id, existingStatement.id));
            }

            const statementNumber = await nextCorporateDocumentNumber(
                "SET",
                statementDate
            );
            const [statement] = await tx
                .insert(corporateSettlementStatements)
                .values({
                    statementNumber,
                    orderId: order.id,
                    brandId: order.brandId!,
                    version: (existingStatement?.version ?? 0) + 1,
                    supersedesStatementId: existingStatement?.id ?? null,
                    isCurrent: true,
                    issuedByUserId: actorUserId,
                    adjustmentReason,
                    statementDate: statementDate.toISOString().slice(0, 10),
                    grossPaidPaise,
                    gstEmbeddedPaise,
                    taxableValuePaise,
                    commissionPercentBps,
                    commissionAmountPaise,
                    commissionGstRateBps,
                    commissionGstAmountPaise,
                    tcsPercentBps,
                    tcsAmountPaise,
                    tdsPercentBps,
                    tdsAmountPaise,
                    netRemittancePaise,
                    customizations: orderCustomizations.map((row) => ({
                        id: row.id,
                        type: row.customizationType,
                        amountPaise: row.costPaise,
                        status: row.status,
                        metadata: row.metadata,
                    })),
                    status: "issued",
                    notes: input.notes ?? null,
                })
                .returning();

            if (currentPayout) {
                await tx
                    .update(corporateBrandPayouts)
                    .set({
                        grossOrderValuePaise: grossPaidPaise,
                        commissionAmountPaise,
                        netPayablePaise: netRemittancePaise,
                        payoutStatus: "approved",
                    })
                    .where(eq(corporateBrandPayouts.id, currentPayout.id));
            } else {
                await tx.insert(corporateBrandPayouts).values({
                    orderId: order.id,
                    brandId: order.brandId!,
                    grossOrderValuePaise: grossPaidPaise,
                    commissionAmountPaise,
                    netPayablePaise: netRemittancePaise,
                    payoutStatus: "approved",
                });
            }

            return statement;
        });
    },

    async getOrderDocumentChain(orderId: string) {
        const order = await getOrderOrThrow(orderId);
        const [
            proformaInvoice,
            incomingPurchaseOrder,
            receiptVoucher,
            vendorPurchaseOrder,
            brandTaxInvoice,
            customerTaxInvoice,
            deliveryChallan,
            settlementStatement,
        ] = await Promise.all([
            db.query.corporateProformaInvoices
                .findFirst({
                    where: eq(corporateProformaInvoices.orderId, order.id),
                    orderBy: [desc(corporateProformaInvoices.createdAt)],
                })
                .then(async (orderInvoice) => {
                    if (orderInvoice || !order.quoteId) return orderInvoice;
                    return db.query.corporateProformaInvoices.findFirst({
                        where: eq(
                            corporateProformaInvoices.quoteId,
                            order.quoteId
                        ),
                        orderBy: [desc(corporateProformaInvoices.createdAt)],
                    });
                }),
            db.query.corporatePurchaseOrders.findFirst({
                where: eq(corporatePurchaseOrders.corporateOrderId, order.id),
                orderBy: [desc(corporatePurchaseOrders.createdAt)],
            }),
            db.query.corporateReceiptVouchers.findFirst({
                where: eq(corporateReceiptVouchers.orderId, order.id),
                orderBy: [desc(corporateReceiptVouchers.createdAt)],
            }),
            db.query.corporateVendorPurchaseOrders.findFirst({
                where: eq(corporateVendorPurchaseOrders.orderId, order.id),
                orderBy: [desc(corporateVendorPurchaseOrders.createdAt)],
            }),
            db.query.corporateBrandTaxInvoices.findFirst({
                where: eq(corporateBrandTaxInvoices.orderId, order.id),
                orderBy: [desc(corporateBrandTaxInvoices.createdAt)],
            }),
            db.query.corporateTaxInvoices.findFirst({
                where: eq(corporateTaxInvoices.orderId, order.id),
                orderBy: [desc(corporateTaxInvoices.createdAt)],
            }),
            db.query.corporateDeliveryChallans.findFirst({
                where: eq(corporateDeliveryChallans.orderId, order.id),
                orderBy: [desc(corporateDeliveryChallans.createdAt)],
            }),
            db.query.corporateSettlementStatements.findFirst({
                where: and(
                    eq(corporateSettlementStatements.orderId, order.id),
                    eq(corporateSettlementStatements.isCurrent, true)
                ),
                orderBy: [desc(corporateSettlementStatements.version)],
            }),
        ]);

        return {
            proformaInvoice,
            incomingPurchaseOrder,
            receiptVoucher,
            vendorPurchaseOrder,
            brandTaxInvoice,
            customerTaxInvoice,
            deliveryChallan,
            settlementStatement,
        };
    },
};
