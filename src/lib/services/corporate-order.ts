import crypto from "crypto";
import { env } from "@/../env";
import {
    fillCorporateDeliveryAddressDefaults,
    formatCorporateDeliveryAddress,
} from "@/lib/corporate-delivery-address";
import { db } from "@/lib/db";
import { corporateOrderQueries } from "@/lib/db/queries/corporate-order";
import {
    brandConfidentials,
    brands,
    corporateColorOptions,
    corporateDeliveryChallans,
    corporateExtraChargeRules,
    corporateFabricCompositions,
    corporateGsmOptions,
    corporateLogoLocations,
    corporatePayments,
    corporatePricingSlabs,
    corporatePrintMethods,
    corporateProductTypes,
    corporatePurchaseOrders,
    corporateQuotes,
    corporateReceiptVouchers,
    corporateTaxInvoices,
} from "@/lib/db/schema";
import { hsnMaster } from "@/lib/db/schema/finance-compliance";
import { razorpay } from "@/lib/razorpay";
import { resend } from "@/lib/resend";
import {
    CorporateOrderBalanceReminderEmail,
    CorporateOrderDeliveredEmail,
    CorporateOrderInternalNotificationEmail,
    CorporateOrderReceivedEmail,
} from "@/lib/resend/emails";
import {
    assertCorporateLegalIdentity,
    corporateDocumentService,
    getCorporateDocumentSettings,
    gstStateCode,
    nextBrandInvoiceNumber,
    nextCorporateDocumentNumber,
} from "@/lib/services/corporate-documents";
import { convertValueToLabel, getAbsoluteURL } from "@/lib/utils";
import {
    corporateBalancePaymentConfirmationInputSchema,
    corporateBalancePaymentOrderInputSchema,
    corporateConfigUpsertInputSchema,
    corporateOrderBrandAssignmentInputSchema,
    CorporateOrderFormInput,
    corporateOrderFormInputSchema,
    corporateOrderListInputSchema,
    CorporateOrderQuote,
    corporateOrderQuoteSchema,
    corporateOrderUserListInputSchema,
    CorporateOrderWorkflowStatus,
    corporatePaymentConfirmationInputSchema,
    CorporatePaymentPreference,
} from "@/lib/validations/corporate-order";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, inArray, isNull, lte, or } from "drizzle-orm";

const ARTWORK_EXTENSIONS = ["ai", "eps", "pdf", "png", "jpg", "jpeg"];
const SHEET_EXTENSIONS = ["xls", "xlsx", "csv"];

function getExtension(fileName: string) {
    return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function validateUploadFile(
    file: {
        name: string;
        size: number;
        type: string;
    },
    allowedExtensions: string[],
    maxBytes: number,
    label: string
) {
    const extension = getExtension(file.name);
    if (!allowedExtensions.includes(extension)) {
        throw new TRPCError({
            code: "BAD_REQUEST",
            message: `${label} must be one of: ${allowedExtensions.join(", ")}`,
        });
    }

    if (file.size > maxBytes) {
        throw new TRPCError({
            code: "BAD_REQUEST",
            message: `${label} exceeds the allowed size limit`,
        });
    }
}

function summarizeSizes(rows: Array<{ employeeName: string; size: string }>) {
    return rows.reduce<Record<string, number>>((acc, row) => {
        const key = row.size.toUpperCase();
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
    }, {});
}

function parseCorporateOpsEmails() {
    const envEmails = (env.CORPORATE_OPS_EMAILS ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

    if (envEmails.length > 0) return envEmails;

    return [env.RENIVET_EMAIL_1, env.RENIVET_EMAIL_2].filter(Boolean);
}

function getInitialPaymentLabel(
    paymentPreference: CorporatePaymentPreference,
    percentBps: number
) {
    if (paymentPreference === "full_upfront" || percentBps >= 10000) {
        return "100% upfront payment";
    }

    return `${Math.round(percentBps / 100)}% advance payment`;
}

type CorporateOrderDraftTokenPayload = {
    userId: string;
    publicOrderId: string;
    razorpayOrderId: string;
    form: CorporateOrderFormInput;
    quote: CorporateOrderQuote;
    issuedAt: string;
};

class CorporateOrderService {
    async getFormConfig() {
        return corporateOrderQueries.getFormConfig();
    }

    private signDraftToken(payload: CorporateOrderDraftTokenPayload) {
        const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
            "base64url"
        );
        const signature = crypto
            .createHmac("sha256", env.RAZOR_PAY_SECRET_KEY)
            .update(encodedPayload)
            .digest("base64url");

        return `${encodedPayload}.${signature}`;
    }

    private parseDraftToken(token: string) {
        const [encodedPayload, providedSignature] = token.split(".");
        if (!encodedPayload || !providedSignature) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Invalid corporate payment session",
            });
        }

        const expectedSignature = crypto
            .createHmac("sha256", env.RAZOR_PAY_SECRET_KEY)
            .update(encodedPayload)
            .digest("base64url");

        if (providedSignature !== expectedSignature) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Corporate payment session verification failed",
            });
        }

        const parsed = JSON.parse(
            Buffer.from(encodedPayload, "base64url").toString("utf8")
        );

        return {
            ...parsed,
            form: corporateOrderFormInputSchema.parse(parsed.form),
            quote: corporateOrderQuoteSchema.parse(parsed.quote),
        } as CorporateOrderDraftTokenPayload;
    }

    private async ensureTaxInvoiceForDispatchedOrder(corporateOrderId: string) {
        const order = await db.query.corporateOrders.findFirst({
            where: (table, { eq }) => eq(table.id, corporateOrderId),
            with: {
                brand: true,
                quote: { with: { profile: true } },
            },
        });

        if (
            !order?.brand ||
            ![
                "ready_for_dispatch",
                "dispatched",
                "delivered",
                "completed",
            ].includes(order.status)
        ) {
            return null;
        }

        const existingInvoice = await db.query.corporateTaxInvoices.findFirst({
            where: and(
                eq(corporateTaxInvoices.orderId, order.id),
                eq(corporateTaxInvoices.status, "issued")
            ),
            orderBy: [desc(corporateTaxInvoices.createdAt)],
        });
        if (existingInvoice) return existingInvoice;

        if (!order.brandId || !order.brand) {
            throw new TRPCError({
                code: "PRECONDITION_FAILED",
                message:
                    "A seller brand must be assigned before issuing the customer tax invoice",
            });
        }

        const [
            documentSettings,
            brandDetails,
            receiptVoucher,
            deliveryChallan,
            purchaseOrder,
        ] = await Promise.all([
            getCorporateDocumentSettings(),
            db.query.brandConfidentials.findFirst({
                where: eq(brandConfidentials.id, order.brandId),
            }),
            db.query.corporateReceiptVouchers.findFirst({
                where: eq(corporateReceiptVouchers.orderId, order.id),
                orderBy: [desc(corporateReceiptVouchers.createdAt)],
            }),
            db.query.corporateDeliveryChallans.findFirst({
                where: eq(corporateDeliveryChallans.orderId, order.id),
                orderBy: [desc(corporateDeliveryChallans.createdAt)],
            }),
            db.query.corporatePurchaseOrders.findFirst({
                where: eq(corporatePurchaseOrders.corporateOrderId, order.id),
                orderBy: [desc(corporatePurchaseOrders.createdAt)],
            }),
        ]);

        const sellerGstin = brandDetails?.gstin?.trim() ?? "";
        const buyerGstin =
            order.quote?.profile?.gstNumber?.trim() ??
            order.gstNumber?.trim() ??
            "";
        const sellerStateCode = gstStateCode(sellerGstin);
        const buyerStateCode = gstStateCode(buyerGstin);
        const billingAddress = order.quote?.profile?.billingAddress as
            | Record<string, unknown>
            | undefined;
        const sellerState = brandDetails?.state?.trim().toLowerCase();
        const buyerState =
            typeof billingAddress?.state === "string"
                ? billingAddress.state.trim().toLowerCase()
                : "";
        const isIntraState =
            sellerStateCode && buyerStateCode
                ? sellerStateCode === buyerStateCode
                : sellerState && buyerState
                  ? sellerState === buyerState
                  : true;
        const gstHalf = Math.round(order.gstPaise / 2);

        const invoiceDate = new Date();
        const invoiceNumber = await nextBrandInvoiceNumber({
            brandId: order.brandId,
            brandName: order.brand.name,
            invoiceCode: order.brand.invoiceCode,
            date: invoiceDate,
        });
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + documentSettings.balanceDueDays);

        return db
            .insert(corporateTaxInvoices)
            .values({
                invoiceNumber,
                orderId: order.id,
                brandId: order.brandId,
                buyerGstin: buyerGstin || null,
                poReference: purchaseOrder?.poNumber ?? null,
                receiptVoucherId: receiptVoucher?.id ?? null,
                invoiceDate: invoiceDate.toISOString().slice(0, 10),
                dueDate: dueDate.toISOString().slice(0, 10),
                taxableValuePaise:
                    order.subtotalPaise + order.customizationPaise,
                cgstPaise: isIntraState ? gstHalf : 0,
                sgstPaise: isIntraState ? order.gstPaise - gstHalf : 0,
                igstPaise: isIntraState ? 0 : order.gstPaise,
                totalAmountPaise: order.totalPaise,
                advanceAdjustmentPaise: order.advancePaidPaise,
                paymentTerms: "Net 15",
                bankDetailsSnapshot: documentSettings
                    ? {
                          bankName: documentSettings.bankName,
                          bankAccountName: documentSettings.bankAccountName,
                          bankAccountNumber: documentSettings.bankAccountNumber,
                          bankIfscCode: documentSettings.bankIfscCode,
                          bankBranch: documentSettings.bankBranch,
                      }
                    : null,
                eWayBillNumber: deliveryChallan?.eWayBillNumber ?? null,
                status: "issued",
            })
            .returning()
            .then((rows) => rows[0]);
    }

    private async buildOrderInsertValues(
        userId: string,
        parsed: CorporateOrderFormInput,
        quote: CorporateOrderQuote
    ) {
        const deliveryDetails = fillCorporateDeliveryAddressDefaults(parsed);
        const approvedQuote = parsed.approvedQuoteId
            ? await db.query.corporateQuotes.findFirst({
                  where: eq(corporateQuotes.id, parsed.approvedQuoteId),
              })
            : null;

        if (parsed.approvedQuoteId && !approvedQuote) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Approved quote link could not be resolved",
            });
        }

        const config = await corporateOrderQueries.getFormConfig();
        const productType = config.productTypes.find(
            (item) => item.id === parsed.productTypeId
        );
        const gsmOption = config.gsmOptions.find(
            (item) => item.id === parsed.gsmOptionId
        );
        const fabricComposition = config.fabricCompositions.find(
            (item) => item.id === parsed.fabricCompositionId
        );
        const printMethod = config.printMethods.find(
            (item) => item.id === parsed.printMethodId
        );
        const colors = config.colorOptions.filter((item) =>
            parsed.colorOptionIds.includes(item.id)
        );
        const logoLocations = config.logoLocations.filter((item) =>
            parsed.logoLocationIds.includes(item.id)
        );

        return {
            publicOrderId: `TEMP-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 8)
                .toUpperCase()}`,
            userId,
            quoteId: approvedQuote?.id ?? null,
            brandId: approvedQuote?.brandId ?? null,
            status: "inquiry_received" as const,
            paymentStatus:
                quote.balanceDuePaise > 0
                    ? ("pending" as const)
                    : ("paid" as const),
            companyName: parsed.companyName,
            contactPersonName: parsed.contactPersonName,
            emailAddress: parsed.emailAddress,
            mobileNumber: parsed.mobileNumber,
            gstNumber: parsed.gstNumber ?? null,
            deliveryCountry: deliveryDetails.deliveryCountry,
            deliveryCity: deliveryDetails.deliveryCity,
            deliveryPincode: deliveryDetails.deliveryPincode,
            deliveryAddress: deliveryDetails.deliveryAddress,
            numberOfEmployees: parsed.numberOfEmployees,
            employeeCount: quote.employeeCount,
            quantity: quote.quantity,
            sizeBreakdown: quote.sizeBreakdown,
            employeeRows: parsed.employeeRows,
            companySnapshot: {
                companyName: parsed.companyName,
                contactPersonName: parsed.contactPersonName,
                emailAddress: parsed.emailAddress,
                mobileNumber: parsed.mobileNumber,
                gstNumber: parsed.gstNumber ?? null,
                deliveryCountry: deliveryDetails.deliveryCountry,
                deliveryCity: deliveryDetails.deliveryCity,
                deliveryPincode: deliveryDetails.deliveryPincode,
                deliveryAddress: deliveryDetails.deliveryAddress,
                deliveryAddressFormatted:
                    formatCorporateDeliveryAddress(deliveryDetails),
                numberOfEmployees: parsed.numberOfEmployees,
            },
            productConfigSnapshot: {
                productType,
                hsnMasterId: productType?.hsnMasterId ?? null,
                hsnCode: quote.hsnCode,
                gstRateBps: quote.gstRateBps,
                gsmOption,
                fabricComposition,
                colors,
                customColorRequest: parsed.customColorRequest ?? null,
                quantity: quote.quantity,
                pricingSlabId: quote.appliedPricingSlabId,
                unitPricePaise: quote.unitPricePaise,
            },
            brandingConfigSnapshot: {
                logoLocations,
                printMethod,
                appliedExtraCharges: quote.appliedExtraCharges,
                paymentPreference: parsed.paymentPreference,
            },
            pricingSnapshot: quote,
            artworkFile: parsed.artworkFile,
            employeeSheetFile: parsed.employeeSheetFile,
            subtotalPaise: quote.subtotalPaise,
            customizationPaise: quote.customizationPaise,
            gstRateBps: quote.gstRateBps,
            gstPaise: quote.gstPaise,
            totalPaise: quote.totalPaise,
            advancePercentBps: quote.advancePercentBps,
            advancePaidPaise: quote.advancePaidPaise,
            balanceDuePaise: quote.balanceDuePaise,
            customerNotes: parsed.customerNotes ?? null,
            internalNotes: parsed.approvedQuoteId
                ? `Created from approved quote checkout | quote:${parsed.approvedQuoteId}`
                : null,
            balancePaymentStatus:
                quote.balanceDuePaise === 0
                    ? ("paid" as const)
                    : ("pending" as const),
        };
    }

    private async buildQuote(input: CorporateOrderFormInput) {
        const parsed = corporateOrderFormInputSchema.parse(input);

        validateUploadFile(
            parsed.artworkFile,
            ARTWORK_EXTENSIONS,
            25 * 1024 * 1024,
            "Artwork file"
        );
        validateUploadFile(
            parsed.employeeSheetFile,
            SHEET_EXTENSIONS,
            10 * 1024 * 1024,
            "Employee size sheet"
        );

        const [config, productType, gsmOption, fabricComposition, printMethod] =
            await Promise.all([
                corporateOrderQueries.getFormConfig(),
                db.query.corporateProductTypes.findFirst({
                    where: eq(corporateProductTypes.id, parsed.productTypeId),
                }),
                db.query.corporateGsmOptions.findFirst({
                    where: eq(corporateGsmOptions.id, parsed.gsmOptionId),
                }),
                db.query.corporateFabricCompositions.findFirst({
                    where: eq(
                        corporateFabricCompositions.id,
                        parsed.fabricCompositionId
                    ),
                }),
                db.query.corporatePrintMethods.findFirst({
                    where: eq(corporatePrintMethods.id, parsed.printMethodId),
                }),
            ]);

        if (!productType || !gsmOption || !fabricComposition || !printMethod) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Selected corporate order options are invalid",
            });
        }

        const productHsn = productType.hsnMasterId
            ? await db.query.hsnMaster.findFirst({
                  where: and(
                      eq(hsnMaster.id, productType.hsnMasterId),
                      eq(hsnMaster.isActive, true)
                  ),
              })
            : null;

        if (!productHsn) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                    "The selected product type needs an active HSN code before it can be quoted",
            });
        }

        const colorOptions = await db.query.corporateColorOptions.findMany({
            where: inArray(corporateColorOptions.id, parsed.colorOptionIds),
        });
        const logoLocations = await db.query.corporateLogoLocations.findMany({
            where: inArray(corporateLogoLocations.id, parsed.logoLocationIds),
        });
        const extraChargeRules =
            parsed.extraChargeRuleIds.length > 0
                ? await db.query.corporateExtraChargeRules.findMany({
                      where: inArray(
                          corporateExtraChargeRules.id,
                          parsed.extraChargeRuleIds
                      ),
                  })
                : [];

        if (colorOptions.length !== parsed.colorOptionIds.length) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "One or more selected colors are invalid",
            });
        }
        if (logoLocations.length !== parsed.logoLocationIds.length) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "One or more selected logo locations are invalid",
            });
        }

        const employeeCount = parsed.employeeRows.length;
        const quantity = Math.max(parsed.quantity ?? employeeCount, 1);
        const advancePercentBps =
            parsed.paymentPreference === "full_upfront"
                ? 10000
                : config.settings.advancePercentBps;

        const pricingSlab = await db.query.corporatePricingSlabs.findFirst({
            where: and(
                eq(corporatePricingSlabs.productTypeId, parsed.productTypeId),
                eq(corporatePricingSlabs.gsmOptionId, parsed.gsmOptionId),
                eq(corporatePricingSlabs.isActive, true),
                lte(corporatePricingSlabs.minQuantity, quantity),
                or(
                    gte(corporatePricingSlabs.maxQuantity, quantity),
                    isNull(corporatePricingSlabs.maxQuantity)
                )
            ),
            orderBy: [desc(corporatePricingSlabs.minQuantity)],
        });

        if (!pricingSlab) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "No pricing slab is configured for this quantity",
            });
        }

        const subtotalPaise = pricingSlab.unitPricePaise * quantity;
        const printMethodChargePaise =
            printMethod.priceModifierPaise * quantity;
        const additionalLogoRule = config.extraChargeRules.find(
            (item) => item.code === "additional_logo_location"
        );

        const appliedExtraCharges: Array<{
            id: string;
            code: string;
            name: string;
            amountPaise: number;
        }> = [];

        if (additionalLogoRule && logoLocations.length > 1) {
            const extraLocations = logoLocations.length - 1;
            const amountPaise =
                additionalLogoRule.chargeType === "per_location"
                    ? additionalLogoRule.amountPaise * extraLocations
                    : additionalLogoRule.amountPaise;

            appliedExtraCharges.push({
                id: additionalLogoRule.id,
                code: additionalLogoRule.code,
                name: additionalLogoRule.name,
                amountPaise,
            });
        }

        for (const rule of extraChargeRules) {
            if (rule.code === "additional_logo_location") continue;
            const amountPaise =
                rule.chargeType === "per_unit"
                    ? rule.amountPaise * quantity
                    : rule.amountPaise;

            appliedExtraCharges.push({
                id: rule.id,
                code: rule.code,
                name: rule.name,
                amountPaise,
            });
        }

        const extraChargesPaise = appliedExtraCharges.reduce(
            (sum, item) => sum + item.amountPaise,
            0
        );
        const customizationPaise = printMethodChargePaise + extraChargesPaise;
        const preTaxPaise = subtotalPaise + customizationPaise;
        const gstPaise = Math.round(
            (preTaxPaise * productHsn.gstRateBps) / 10000
        );
        const totalPaise = preTaxPaise + gstPaise;
        const advancePaidPaise = Math.round(
            (totalPaise * advancePercentBps) / 10000
        );
        const balanceDuePaise = totalPaise - advancePaidPaise;

        return corporateOrderQuoteSchema.parse({
            quantity,
            employeeCount,
            sizeBreakdown: summarizeSizes(parsed.employeeRows),
            hsnCode: productHsn.hsnCode,
            subtotalPaise,
            printMethodChargePaise,
            extraChargesPaise,
            customizationPaise,
            gstRateBps: productHsn.gstRateBps,
            gstPaise,
            totalPaise,
            advancePercentBps,
            advancePaidPaise,
            balanceDuePaise,
            unitPricePaise: pricingSlab.unitPricePaise,
            appliedPricingSlabId: pricingSlab.id,
            printMethod,
            appliedExtraCharges,
        });
    }

    async getQuote(input: CorporateOrderFormInput) {
        return this.buildQuote(input);
    }

    async createAdvancePaymentOrder(
        userId: string,
        input: CorporateOrderFormInput
    ) {
        const parsed = corporateOrderFormInputSchema.parse(input);
        const quote = await this.buildQuote(parsed);
        const publicOrderId = `REN-CORP-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 6)
            .toUpperCase()}`;
        const rzpOrder = await razorpay.orders.create({
            amount: quote.advancePaidPaise,
            currency: "INR",
            receipt: publicOrderId,
            notes: {
                publicOrderId,
                userId,
            },
        });

        return {
            quote,
            draftToken: this.signDraftToken({
                userId,
                publicOrderId,
                razorpayOrderId: rzpOrder.id,
                form: parsed,
                quote,
                issuedAt: new Date().toISOString(),
            }),
            razorpay: {
                orderId: rzpOrder.id,
                amount: quote.advancePaidPaise,
                currency: "INR",
                name: "Renivet Corporate Orders",
                paymentLabel: getInitialPaymentLabel(
                    parsed.paymentPreference,
                    quote.advancePercentBps
                ),
                description: `${getInitialPaymentLabel(
                    parsed.paymentPreference,
                    quote.advancePercentBps
                )} for ${publicOrderId}`,
            },
        };
    }

    async confirmAdvancePayment(userId: string, input: unknown) {
        const parsed = corporatePaymentConfirmationInputSchema.parse(input);
        const draft = this.parseDraftToken(parsed.draftToken);

        if (draft.userId !== userId) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "Corporate payment session does not belong to you",
            });
        }

        if (draft.razorpayOrderId !== parsed.razorpayOrderId) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Corporate payment order mismatch",
            });
        }

        const existingOrder =
            await corporateOrderQueries.getOrderByRazorpayPaymentId(
                parsed.razorpayPaymentId
            );
        if (existingOrder) {
            return {
                success: true,
                order: existingOrder,
                confirmationHref: `/profile/corporate-orders?confirmed=${existingOrder.id}`,
            };
        }

        const generatedSignature = crypto
            .createHmac("sha256", env.RAZOR_PAY_SECRET_KEY)
            .update(`${parsed.razorpayOrderId}|${parsed.razorpayPaymentId}`)
            .digest("hex");

        if (generatedSignature !== parsed.razorpaySignature) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Invalid payment signature",
            });
        }

        const createdOrder = await corporateOrderQueries.createCorporateOrder({
            ...(await this.buildOrderInsertValues(
                userId,
                draft.form,
                draft.quote
            )),
            razorpayOrderId: parsed.razorpayOrderId,
            razorpayPaymentId: parsed.razorpayPaymentId,
            razorpaySignature: parsed.razorpaySignature,
            paymentReference: parsed.razorpayPaymentId,
        });
        const finalPublicOrderId = `REN-CORP-${String(
            createdOrder.sequenceNo
        ).padStart(4, "0")}`;
        const updated = await corporateOrderQueries.updateCorporateOrder(
            createdOrder.id,
            {
                publicOrderId: finalPublicOrderId,
            }
        );
        if (!updated) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to finalize corporate order",
            });
        }

        await corporateOrderQueries.createStatusHistory({
            corporateOrderId: updated.id,
            fromStatus: null,
            toStatus: "inquiry_received",
            changedByUserId: userId,
            note: "Advance payment received",
            metadata: {
                razorpayOrderId: parsed.razorpayOrderId,
                razorpayPaymentId: parsed.razorpayPaymentId,
            },
        });

        const existingAdvancePayment =
            await db.query.corporatePayments.findFirst({
                where: and(
                    eq(corporatePayments.orderId, updated.id),
                    eq(
                        corporatePayments.paymentReference,
                        parsed.razorpayPaymentId
                    )
                ),
            });
        const advancePayment =
            existingAdvancePayment ??
            (await db
                .insert(corporatePayments)
                .values({
                    orderId: updated.id,
                    paymentType:
                        updated.balanceDuePaise > 0 ? "advance" : "manual",
                    paymentMode: "razorpay",
                    amountPaise: updated.advancePaidPaise,
                    paymentReference: parsed.razorpayPaymentId,
                    paymentStatus:
                        updated.balanceDuePaise > 0
                            ? "payment_partial"
                            : "payment_success",
                    paymentDate: new Date().toISOString().slice(0, 10),
                    metadata: {
                        percentageBps: updated.advancePercentBps,
                    },
                })
                .returning()
                .then((rows) => rows[0]));

        if (!advancePayment) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to record the corporate advance payment",
            });
        }

        await corporateDocumentService.ensureReceiptVoucher(
            updated.id,
            advancePayment.id
        );
        await corporateDocumentService.ensureProformaInvoiceForOrder(
            updated.id
        );

        const settings = await corporateOrderQueries.getOrderSettings();
        const customerHref = getAbsoluteURL(
            `/profile/corporate-orders?confirmed=${updated.id}`
        );
        const pdfHref = getAbsoluteURL(
            `/api/corporate-orders/${updated.id}/summary.pdf`
        );

        const opsEmails = parseCorporateOpsEmails();

        await Promise.allSettled([
            resend.emails.send({
                from: env.RESEND_EMAIL_FROM,
                to: updated.emailAddress,
                subject: `Corporate Order Received: ${updated.publicOrderId}`,
                react: CorporateOrderReceivedEmail({
                    order: updated,
                    confirmationHref: customerHref,
                    pdfHref,
                    expectedTimelineText: settings.expectedTimelineText,
                }),
            }),
            ...(opsEmails.length > 0
                ? [
                      resend.emails.send({
                          from: env.RESEND_EMAIL_FROM,
                          to: opsEmails,
                          subject: `New Corporate Order: ${updated.publicOrderId}`,
                          react: CorporateOrderInternalNotificationEmail({
                              order: updated,
                              adminHref: getAbsoluteURL(
                                  `/dashboard/general/corporate-orders/${updated.id}`
                              ),
                          }),
                      }),
                  ]
                : []),
        ]);

        return {
            success: true,
            order: updated,
            confirmationHref: `/profile/corporate-orders?confirmed=${updated.id}`,
        };
    }

    async createBalancePaymentOrder(userId: string, input: unknown) {
        const parsed = corporateBalancePaymentOrderInputSchema.parse(input);
        const order = await corporateOrderQueries.getOrderById(
            parsed.corporateOrderId
        );

        if (!order || order.userId !== userId) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Corporate order not found",
            });
        }

        if (order.balanceDuePaise <= 0) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "This order has no remaining balance",
            });
        }

        const rzpOrder = await razorpay.orders.create({
            amount: order.balanceDuePaise,
            currency: "INR",
            receipt: `${order.publicOrderId}-BAL`,
            notes: {
                corporateOrderId: order.id,
                publicOrderId: order.publicOrderId,
                userId,
                paymentKind: "balance",
            },
        });

        return {
            order,
            razorpay: {
                orderId: rzpOrder.id,
                amount: order.balanceDuePaise,
                currency: "INR",
                name: "Renivet Corporate Orders",
                description: `Remaining balance payment for ${order.publicOrderId}`,
            },
        };
    }

    async confirmBalancePayment(userId: string, input: unknown) {
        const parsed =
            corporateBalancePaymentConfirmationInputSchema.parse(input);
        const order = await corporateOrderQueries.getOrderById(
            parsed.corporateOrderId
        );

        if (!order || order.userId !== userId) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Corporate order not found",
            });
        }

        if (order.balanceDuePaise <= 0) {
            return {
                success: true,
                order,
                confirmationHref: `/profile/corporate-orders?confirmed=${order.id}`,
            };
        }

        const generatedSignature = crypto
            .createHmac("sha256", env.RAZOR_PAY_SECRET_KEY)
            .update(`${parsed.razorpayOrderId}|${parsed.razorpayPaymentId}`)
            .digest("hex");

        if (generatedSignature !== parsed.razorpaySignature) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Invalid payment signature",
            });
        }

        const updated = await corporateOrderQueries.updateCorporateOrder(
            order.id,
            {
                paymentStatus: "paid",
                balanceDuePaise: 0,
                balancePaymentStatus: "paid",
                balancePaymentLink: getAbsoluteURL(
                    `/profile/corporate-orders?confirmed=${order.id}`
                ),
                paymentReference: parsed.razorpayPaymentId,
            }
        );

        if (!updated) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to confirm remaining balance payment",
            });
        }

        await corporateOrderQueries.createStatusHistory({
            corporateOrderId: updated.id,
            fromStatus: updated.status,
            toStatus: updated.status,
            changedByUserId: userId,
            note: "Remaining balance payment received",
            metadata: {
                razorpayOrderId: parsed.razorpayOrderId,
                razorpayPaymentId: parsed.razorpayPaymentId,
                paymentKind: "balance",
            },
        });

        const existingBalancePayment =
            await db.query.corporatePayments.findFirst({
                where: and(
                    eq(corporatePayments.orderId, updated.id),
                    eq(
                        corporatePayments.paymentReference,
                        parsed.razorpayPaymentId
                    )
                ),
            });
        if (!existingBalancePayment) {
            await db.insert(corporatePayments).values({
                orderId: updated.id,
                paymentType: "balance",
                paymentMode: "razorpay",
                amountPaise: order.balanceDuePaise,
                paymentReference: parsed.razorpayPaymentId,
                paymentStatus: "payment_success",
                paymentDate: new Date().toISOString().slice(0, 10),
                metadata: {
                    publicOrderId: updated.publicOrderId,
                },
            });
        }

        return {
            success: true,
            order: updated,
            confirmationHref: `/profile/corporate-orders?confirmed=${updated.id}`,
        };
    }

    async getOrderConfirmation(userId: string, corporateOrderId: string) {
        const [order, settings] = await Promise.all([
            corporateOrderQueries.getOrderById(corporateOrderId),
            corporateOrderQueries.getOrderSettings(),
        ]);

        if (!order || order.userId !== userId) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Corporate order not found",
            });
        }

        return { order, settings };
    }

    async listOrders(input: unknown) {
        const parsed = corporateOrderListInputSchema.parse(input);
        return corporateOrderQueries.listOrders(parsed);
    }

    async listOrdersForUser(userId: string) {
        corporateOrderUserListInputSchema.parse({ userId });
        return corporateOrderQueries.listOrdersByUser(userId);
    }

    async getOrderById(corporateOrderId: string) {
        const order =
            await corporateOrderQueries.getOrderById(corporateOrderId);
        if (!order) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Corporate order not found",
            });
        }

        return order;
    }

    async assignBrand(input: unknown, changedByUserId: string) {
        const parsed = corporateOrderBrandAssignmentInputSchema.parse(input);
        const order = await corporateOrderQueries.getOrderById(
            parsed.corporateOrderId
        );
        if (!order) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Corporate order not found",
            });
        }
        if (order.quoteId) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                    "This quote-based order keeps the supplier brand selected in its approved quote",
            });
        }
        if (
            order.documentChain?.vendorPurchaseOrder &&
            order.brandId !== parsed.brandId
        ) {
            throw new TRPCError({
                code: "PRECONDITION_FAILED",
                message:
                    "The supplier brand cannot be changed after the Renivet purchase order is issued",
            });
        }

        const brand = await db.query.brands.findFirst({
            where: eq(brands.id, parsed.brandId),
            columns: { id: true, name: true, isActive: true },
        });
        if (!brand || !brand.isActive) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Select an active supplier brand",
            });
        }

        const nextStatus =
            order.status === "inquiry_received" ? "under_review" : order.status;
        const assigned = await corporateOrderQueries.updateCorporateOrder(
            order.id,
            { brandId: brand.id }
        );
        if (!assigned) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to assign the supplier brand",
            });
        }

        const updated =
            nextStatus === order.status
                ? assigned
                : await this.updateStatus({
                      corporateOrderId: order.id,
                      toStatus: nextStatus,
                      changedByUserId,
                      note:
                          parsed.note ||
                          `Supplier brand assigned: ${brand.name}`,
                      metadata: {
                          action: "brand_assigned",
                          brandId: brand.id,
                          brandName: brand.name,
                          previousBrandId: order.brandId ?? null,
                      },
                  });

        return { order: updated, brand };
    }

    async updateStatus(input: {
        corporateOrderId: string;
        toStatus: CorporateOrderWorkflowStatus;
        changedByUserId: string;
        note?: string;
        metadata?: Record<string, unknown>;
    }) {
        const order = await corporateOrderQueries.getOrderById(
            input.corporateOrderId
        );
        if (!order) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Corporate order not found",
            });
        }

        if (order.status === input.toStatus) {
            return order;
        }

        if (
            ["ready_for_dispatch", "dispatched", "delivered"].includes(
                input.toStatus
            )
        ) {
            const chain = order.documentChain;
            if (!chain?.vendorPurchaseOrder) {
                throw new TRPCError({
                    code: "PRECONDITION_FAILED",
                    message:
                        "Issue the Fulfillment Order to the supplier brand first",
                });
            }
            if (
                chain.vendorPurchaseOrder.deliveryMode ===
                    "direct_to_customer" &&
                !chain.deliveryChallan
            ) {
                throw new TRPCError({
                    code: "PRECONDITION_FAILED",
                    message:
                        "Issue the delivery challan before direct dispatch",
                });
            }
            if (
                chain.vendorPurchaseOrder.deliveryMode === "renivet_warehouse"
            ) {
                throw new TRPCError({
                    code: "PRECONDITION_FAILED",
                    message:
                        "Warehouse dispatch is blocked until the inbound goods-received document is recorded",
                });
            }
        }

        if (
            ["dispatched", "delivered"].includes(input.toStatus) &&
            order.totalPaise >= 5_000_000
        ) {
            const chain = order.documentChain;
            const deliveryChallan = chain?.deliveryChallan;
            const eWayBill =
                deliveryChallan?.eWayBillNumber?.trim() ||
                (order.shipment?.rawPayload as Record<string, unknown> | null)
                    ?.eWayBillNumber ||
                (order.shipment?.rawPayload as Record<string, unknown> | null)
                    ?.ewayBillNumber;
            if (!eWayBill) {
                throw new TRPCError({
                    code: "PRECONDITION_FAILED",
                    message:
                        "E-way bill number is mandatory for corporate consignments exceeding Rs. 50,000 before dispatch.",
                });
            }
        }

        const updated =
            await corporateOrderQueries.updateCorporateOrderStatusIfCurrent(
                order.id,
                order.status,
                input.toStatus
            );

        if (!updated) {
            throw new TRPCError({
                code: "CONFLICT",
                message:
                    "Corporate order status changed; refresh and retry the transition",
            });
        }

        await corporateOrderQueries.createStatusHistory({
            corporateOrderId: order.id,
            fromStatus: order.status,
            toStatus: input.toStatus,
            changedByUserId: input.changedByUserId,
            note:
                input.note ??
                `Status changed to ${convertValueToLabel(input.toStatus)}`,
            metadata: input.metadata,
        });

        if (["ready_for_dispatch", "dispatched"].includes(input.toStatus)) {
            await this.ensureTaxInvoiceForDispatchedOrder(updated.id);
        }

        if (
            input.toStatus === "delivered" &&
            order.status !== "delivered" &&
            order.emailAddress?.trim()
        ) {
            try {
                await resend.emails.send({
                    from: env.RESEND_EMAIL_FROM,
                    to: order.emailAddress.trim(),
                    subject: `Your order has been delivered: ${order.publicOrderId}`,
                    react: CorporateOrderDeliveredEmail({
                        order: {
                            publicOrderId: order.publicOrderId,
                            companyName: order.companyName,
                            totalPaise: order.totalPaise,
                            advancePaidPaise: order.advancePaidPaise,
                            balanceDuePaise: order.balanceDuePaise,
                            quantity: order.quantity,
                        },
                        confirmationHref: getAbsoluteURL(
                            `/profile/corporate-orders?confirmed=${order.id}`
                        ),
                        pdfHref: getAbsoluteURL(
                            `/api/corporate-orders/${order.id}/summary.pdf`
                        ),
                    }),
                });
            } catch (error) {
                console.error(
                    "Failed to send customer delivered notification from admin updateStatus",
                    error
                );
            }
        }

        return updated;
    }

    async saveBalancePaymentLink(input: {
        corporateOrderId: string;
        balancePaymentLink: string;
        balancePaymentNotes?: string;
    }) {
        const order = await corporateOrderQueries.getOrderById(
            input.corporateOrderId
        );
        if (!order) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Corporate order not found",
            });
        }

        const updated = await corporateOrderQueries.updateCorporateOrder(
            order.id,
            {
                balancePaymentLink: input.balancePaymentLink,
                balancePaymentNotes: input.balancePaymentNotes ?? null,
                balancePaymentStatus: "shared",
            }
        );

        return updated;
    }

    async sendBalancePaymentReminder(input: {
        corporateOrderId: string;
        changedByUserId: string;
    }) {
        const { corporateOrderId, changedByUserId } = input;
        const order =
            await corporateOrderQueries.getOrderById(corporateOrderId);
        if (!order) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Corporate order not found",
            });
        }

        if (order.balanceDuePaise <= 0) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "This order has no remaining balance",
            });
        }

        const paymentHref =
            order.balancePaymentLink ||
            getAbsoluteURL(`/profile/corporate-orders?confirmed=${order.id}`);

        await resend.emails.send({
            from: env.RESEND_EMAIL_FROM,
            to: order.emailAddress,
            subject: `Balance payment reminder: ${order.publicOrderId}`,
            react: CorporateOrderBalanceReminderEmail({
                order,
                paymentHref,
            }),
        });

        await corporateOrderQueries.createStatusHistory({
            corporateOrderId: order.id,
            fromStatus: order.status,
            toStatus: order.status,
            changedByUserId,
            note: "Balance payment reminder sent to customer",
        });

        return { success: true };
    }

    async listConfig() {
        return corporateOrderQueries.getFormConfig();
    }

    async upsertConfig(input: unknown) {
        const parsed = corporateConfigUpsertInputSchema.parse(input);
        return corporateOrderQueries.upsertConfig(parsed);
    }
}

export const corporateOrderService = new CorporateOrderService();
