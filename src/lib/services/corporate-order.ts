import { env } from "@/../env";
import { corporateOrderQueries } from "@/lib/db/queries/corporate-order";
import { db } from "@/lib/db";
import {
    corporateColorOptions,
    corporateExtraChargeRules,
    corporateFabricCompositions,
    corporateGsmOptions,
    corporateLogoLocations,
    corporatePricingSlabs,
    corporatePrintMethods,
    corporateProductTypes,
    corporateQuotes,
} from "@/lib/db/schema";
import { razorpay } from "@/lib/razorpay";
import { resend } from "@/lib/resend";
import {
    CorporatePaymentPreference,
    CorporateOrderFormInput,
    CorporateOrderQuote,
    CorporateOrderWorkflowStatus,
    corporateConfigUpsertInputSchema,
    corporateOrderFormInputSchema,
    corporateOrderListInputSchema,
    corporateOrderQuoteSchema,
    corporateOrderUserListInputSchema,
    corporatePaymentConfirmationInputSchema,
} from "@/lib/validations/corporate-order";
import { convertValueToLabel, getAbsoluteURL } from "@/lib/utils";
import {
    CorporateOrderBalanceReminderEmail,
    CorporateOrderInternalNotificationEmail,
    CorporateOrderReceivedEmail,
} from "@/lib/resend/emails";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";
import { and, desc, eq, inArray, lte, or, gte, isNull } from "drizzle-orm";

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

    private async buildOrderInsertValues(
        userId: string,
        parsed: CorporateOrderFormInput,
        quote: CorporateOrderQuote
    ) {
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
            paymentStatus: "paid" as const,
            companyName: parsed.companyName,
            contactPersonName: parsed.contactPersonName,
            emailAddress: parsed.emailAddress,
            mobileNumber: parsed.mobileNumber,
            gstNumber: parsed.gstNumber ?? null,
            deliveryAddress: parsed.deliveryAddress,
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
                deliveryAddress: parsed.deliveryAddress,
                numberOfEmployees: parsed.numberOfEmployees,
            },
            productConfigSnapshot: {
                productType,
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
            balancePaymentStatus: quote.balanceDuePaise === 0 ? "paid" : "pending",
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
        const printMethodChargePaise = printMethod.priceModifierPaise * quantity;
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
            (preTaxPaise * config.settings.gstRateBps) / 10000
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
            subtotalPaise,
            printMethodChargePaise,
            extraChargesPaise,
            customizationPaise,
            gstRateBps: config.settings.gstRateBps,
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

    async createAdvancePaymentOrder(userId: string, input: CorporateOrderFormInput) {
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
                confirmationHref: `/corporate-orders/confirmation/${existingOrder.id}`,
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
            ...(await this.buildOrderInsertValues(userId, draft.form, draft.quote)),
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

        const settings = await corporateOrderQueries.getOrderSettings();
        const customerHref = getAbsoluteURL(
            `/corporate-orders/confirmation/${updated.id}`
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
            confirmationHref: `/corporate-orders/confirmation/${updated.id}`,
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
        const order = await corporateOrderQueries.getOrderById(corporateOrderId);
        if (!order) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Corporate order not found",
            });
        }

        return order;
    }

    async updateStatus(input: {
        corporateOrderId: string;
        toStatus: CorporateOrderWorkflowStatus;
        changedByUserId: string;
        note?: string;
    }) {
        const order = await corporateOrderQueries.getOrderById(input.corporateOrderId);
        if (!order) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Corporate order not found",
            });
        }

        if (order.balanceDuePaise <= 0) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "This order is already fully paid",
            });
        }

        const updated = await corporateOrderQueries.updateCorporateOrder(order.id, {
            status: input.toStatus,
        });

        if (!updated) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to update corporate order status",
            });
        }

        await corporateOrderQueries.createStatusHistory({
            corporateOrderId: order.id,
            fromStatus: order.status,
            toStatus: input.toStatus,
            changedByUserId: input.changedByUserId,
            note: input.note ?? `Status changed to ${convertValueToLabel(input.toStatus)}`,
        });

        return updated;
    }

    async saveBalancePaymentLink(input: {
        corporateOrderId: string;
        balancePaymentLink: string;
        balancePaymentNotes?: string;
    }) {
        const order = await corporateOrderQueries.getOrderById(input.corporateOrderId);
        if (!order) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Corporate order not found",
            });
        }

        const updated = await corporateOrderQueries.updateCorporateOrder(order.id, {
            balancePaymentLink: input.balancePaymentLink,
            balancePaymentNotes: input.balancePaymentNotes ?? null,
            balancePaymentStatus: "shared",
        });

        return updated;
    }

    async sendBalancePaymentReminder(input: {
        corporateOrderId: string;
        changedByUserId: string;
    }) {
        const { corporateOrderId, changedByUserId } = input;
        const order = await corporateOrderQueries.getOrderById(corporateOrderId);
        if (!order) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Corporate order not found",
            });
        }

        if (!order.balancePaymentLink) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Add a balance payment link before sending a reminder",
            });
        }

        if (order.balanceDuePaise <= 0) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "This order has no remaining balance",
            });
        }

        await resend.emails.send({
            from: env.RESEND_EMAIL_FROM,
            to: order.emailAddress,
            subject: `Balance payment reminder: ${order.publicOrderId}`,
            react: CorporateOrderBalanceReminderEmail({
                order,
                paymentHref: order.balancePaymentLink,
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
