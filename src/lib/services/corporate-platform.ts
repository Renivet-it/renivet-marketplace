import crypto from "crypto";
import { env } from "@/../env";
import {
    extractCorporateDeliveryAddress,
    fillCorporateDeliveryAddressDefaults,
    formatCorporateDeliveryAddress,
    isCorporateDeliveryAddressValid,
} from "@/lib/corporate-delivery-address";
import { db } from "@/lib/db";
import { corporateOrderQueries } from "@/lib/db/queries/corporate-order";
import {
    brandConfidentials,
    brandMembers,
    brands,
    corporateActivityTimeline,
    corporateAdminAuditLogs,
    corporateBrandAuditLogs,
    corporateBrandTaxInvoices,
    corporateDeliveryChallans,
    corporateDocuments,
    corporateEscalations,
    corporateFabricCompositions,
    corporateGsmOptions,
    corporateNotifications,
    corporateOrders,
    corporateOrderStatusHistory,
    corporatePayments,
    corporateProductConfigs,
    corporateProductTypes,
    corporateProfiles,
    corporateProformaInvoices,
    corporatePurchaseOrders,
    corporateQcImages,
    corporateQcSubmissions,
    corporateQuoteRevisions,
    corporateQuotes,
    corporateReceiptVouchers,
    corporateRefunds,
    corporateReplacementRequests,
    corporateReports,
    corporateRfqBrandMatches,
    corporateRfqDocuments,
    corporateRfqs,
    corporateRtoShipments,
    corporateSettlementStatements,
    corporateShipments,
    corporateTasks,
    corporateTaxInvoices,
    corporateVendorPurchaseOrders,
    hsnMaster,
    packingTypes,
    products,
    users,
} from "@/lib/db/schema";
import { createOrder } from "@/lib/delhivery/orders";
import { schedulePickup } from "@/lib/delhivery/pickup";
import { requireCorporateTaxClassification } from "@/lib/finance/corporate-tax-classification";
import { resend } from "@/lib/resend";
import {
    CorporateOrderCustomerReadyForDispatchEmail,
    CorporateOrderDeliveredEmail,
    CorporateOrderReadyForDispatchEmail,
    CorporateReplacementRequestAdminEmail,
} from "@/lib/resend/emails";
import {
    assertCorporateLegalIdentity,
    corporateDocumentService,
    getCorporateDocumentSettings,
    gstStateCode,
    nextBrandInvoiceNumber,
    nextCorporateDocumentNumber,
} from "@/lib/services/corporate-documents";
import { corporateOrderService } from "@/lib/services/corporate-order";
import { corporatePaymentRequestService } from "@/lib/services/corporate-payment-request";
import {
    convertValueToLabel,
    generatePickupLocationCode,
    getAbsoluteURL,
} from "@/lib/utils";
import { CorporateOrderWorkflowStatus } from "@/lib/validations/corporate-order";
import {
    corporateAdminBuyerProfileInputSchema,
    corporateAdminManualQuoteInputSchema,
    corporateAdminOfflinePaymentInputSchema,
    corporateAdminPaymentRequestInputSchema,
    corporateAdminPurchaseOrderInputSchema,
    corporateApprovedQuoteOrderInputSchema,
    corporateBrandInvoiceUploadInputSchema,
    corporateBrandTaxInvoiceInputSchema,
    corporateCatalogListInputSchema,
    corporateDashboardSummarySchema,
    corporateForwardOrderInputSchema,
    corporatePaymentInputSchema,
    corporatePickupScheduleInputSchema,
    corporateProfileInputSchema,
    corporateProformaInvoiceInputSchema,
    corporatePurchaseOrderInputSchema,
    corporatePurchaseOrderReviewInputSchema,
    corporateQcReviewInputSchema,
    corporateQcSubmissionInputSchema,
    corporateQuoteDecisionInputSchema,
    corporateQuoteInputSchema,
    corporateQuoteRevisionInputSchema,
    corporateReplacementRequestInputSchema,
    corporateReplacementReviewInputSchema,
    corporateReportInputSchema,
    corporateRfqInputSchema,
    corporateShipmentInputSchema,
    corporateTaskInputSchema,
    corporateTaxInvoiceInputSchema,
    corporateUpdateConsigneeAddressInputSchema,
} from "@/lib/validations/corporate-platform";
import { TRPCError } from "@trpc/server";
import {
    and,
    asc,
    count,
    desc,
    eq,
    inArray,
    like,
    notInArray,
    sql,
} from "drizzle-orm";

const corporateReplacementReasonLabels = {
    size_issue: "Size issue",
    damaged_item: "Damaged item",
    print_issue: "Print issue",
    stitching_issue: "Stitching issue",
    wrong_item_received: "Wrong item received",
    quantity_shortage: "Quantity shortage",
    other: "Other",
} as const;

function makeNumber(prefix: string, sequence: number) {
    return `${prefix}-${String(sequence).padStart(5, "0")}`;
}

function parseCorporateOpsEmails() {
    const envEmails = (env.CORPORATE_OPS_EMAILS ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

    if (envEmails.length > 0) return envEmails;

    return [env.RENIVET_EMAIL_1, env.RENIVET_EMAIL_2].filter(Boolean);
}

function snapshotLabel(value: unknown, keys: string[]) {
    if (!value || typeof value !== "object") return null;
    const record = value as Record<string, unknown>;
    for (const key of keys) {
        const candidate = record[key];
        if (typeof candidate === "string" && candidate.trim()) {
            return candidate.trim();
        }
        if (typeof candidate === "number") return String(candidate);
    }
    return null;
}

class CorporatePlatformService {
    private readonly brandManagedOrderStatuses: CorporateOrderWorkflowStatus[] =
        [
            "under_review",
            "approved",
            "in_production",
            "quality_check",
            "ready_for_dispatch",
            "dispatched",
            "delivered",
            "completed",
        ];

    private async createEvent(
        entityType: string,
        entityId: string,
        eventName: string,
        details: Record<string, unknown>,
        createdBy?: string
    ) {
        await Promise.all([
            db.insert(corporateActivityTimeline).values({
                entityType,
                entityId: entityId as any,
                eventName,
                eventDetails: details,
                createdBy,
            }),
            db.insert(corporateNotifications).values({
                recipientType: "internal",
                recipientId: createdBy ?? null,
                notificationType: eventName,
                channel: "system",
                status: "pending",
                payload: details,
                sentAt: null,
            }),
        ]);
    }

    private async createAdminAuditLog(
        adminId: string | undefined,
        actionType: string,
        entityType: string,
        entityId: string | null,
        oldValue?: Record<string, unknown> | null,
        newValue?: Record<string, unknown> | null
    ) {
        await db.insert(corporateAdminAuditLogs).values({
            adminId: adminId ?? null,
            actionType,
            entityType,
            entityId: entityId as any,
            oldValue: oldValue ?? null,
            newValue: newValue ?? null,
        });
    }

    private buildPurchaseOrderValidationSummary(
        purchaseOrder: {
            companyName: string | null;
            poValuePaise: number;
            deliveryDate: string | null;
            productScopeSummary: string | null;
            authorizedSignatoryName: string | null;
            authorizedSignatoryConfirmed: boolean;
            uploadedFileUrl: string | null;
        },
        quote:
            | {
                  totalAmountPaise: number | null;
                  profile?: { companyName: string | null } | null;
              }
            | null
            | undefined
    ) {
        const companyNameMatches = !!(
            quote?.profile?.companyName &&
            purchaseOrder.companyName &&
            quote.profile.companyName.trim().toLowerCase() ===
                purchaseOrder.companyName.trim().toLowerCase()
        );
        const orderValueMatches =
            !!quote && quote.totalAmountPaise === purchaseOrder.poValuePaise;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const deliveryDateFeasible = purchaseOrder.deliveryDate
            ? new Date(purchaseOrder.deliveryDate) >= today
            : false;
        // The approved quote is the source of truth for scope. Customer POs do
        // not require a separate scope declaration or authorized-signatory field.
        const productScopeMatches = true;
        const authorizedSignatoryPresent = true;

        const issues = [
            companyNameMatches
                ? null
                : "Company name does not match the approved quote",
            orderValueMatches
                ? null
                : "Purchase order value does not match the quote total",
            deliveryDateFeasible
                ? null
                : "Delivery date is missing or not feasible",
            purchaseOrder.uploadedFileUrl
                ? null
                : "Purchase order document is missing",
        ].filter(Boolean) as string[];

        return {
            companyNameMatches,
            orderValueMatches,
            deliveryDateFeasible,
            productScopeMatches,
            authorizedSignatoryPresent,
            issues,
        };
    }

    private async findExistingOrderForQuote(
        quoteId: string,
        quoteNumber?: string | null
    ) {
        const directOrder = await db.query.corporateOrders.findFirst({
            where: eq(corporateOrders.quoteId, quoteId),
            orderBy: [desc(corporateOrders.createdAt)],
        });

        if (directOrder) {
            return directOrder;
        }

        const purchaseOrder = await db.query.corporatePurchaseOrders.findFirst({
            where: eq(corporatePurchaseOrders.quoteId, quoteId),
            orderBy: [desc(corporatePurchaseOrders.createdAt)],
        });

        if (purchaseOrder?.corporateOrderId) {
            const existingOrder = await db.query.corporateOrders.findFirst({
                where: eq(corporateOrders.id, purchaseOrder.corporateOrderId),
            });
            if (existingOrder) {
                return existingOrder;
            }
        }

        const matchedById = await db.query.corporateOrders.findFirst({
            where: like(corporateOrders.internalNotes, `%quote:${quoteId}%`),
            orderBy: [desc(corporateOrders.createdAt)],
        });

        if (matchedById) {
            return matchedById;
        }

        if (!quoteNumber) {
            return null;
        }

        const matchedByQuoteNumberInNotes =
            await db.query.corporateOrders.findFirst({
                where: like(corporateOrders.customerNotes, `%${quoteNumber}%`),
                orderBy: [desc(corporateOrders.createdAt)],
            });

        if (matchedByQuoteNumberInNotes) {
            return matchedByQuoteNumberInNotes;
        }

        return db.query.corporateOrders.findFirst({
            where: like(corporateOrders.internalNotes, `%${quoteNumber}%`),
            orderBy: [desc(corporateOrders.createdAt)],
        });
    }

    private async notifyAdminOrderReadyForDispatch(params: {
        order: {
            id: string;
            publicOrderId: string;
            companyName: string;
            quantity: number;
            totalPaise: number;
            advancePaidPaise: number;
            balanceDuePaise: number;
            status: string;
        };
        quoteNumber?: string | null;
        brandName?: string | null;
    }) {
        const opsEmails = parseCorporateOpsEmails();
        if (!opsEmails.length) return;

        try {
            await resend.emails.send({
                from: env.RESEND_EMAIL_FROM,
                to: opsEmails,
                subject: `Dispatch ready: ${params.order.publicOrderId}`,
                react: CorporateOrderReadyForDispatchEmail({
                    order: {
                        ...params.order,
                        quoteNumber: params.quoteNumber ?? null,
                        brandName: params.brandName ?? null,
                        status: convertValueToLabel(params.order.status),
                    },
                    adminHref: getAbsoluteURL(
                        `/dashboard/general/corporate-orders/${params.order.id}`
                    ),
                }),
            });
        } catch (error) {
            console.error(
                "Failed to send corporate ready-for-dispatch notification",
                error
            );
        }
    }

    private async notifyCustomerOrderReadyForDispatch(params: {
        order: {
            id: string;
            publicOrderId: string;
            companyName: string;
            quantity: number;
            totalPaise: number;
            advancePaidPaise: number;
            balanceDuePaise: number;
            emailAddress: string | null;
        };
    }) {
        if (!params.order.emailAddress?.trim()) return;

        try {
            await resend.emails.send({
                from: env.RESEND_EMAIL_FROM,
                to: params.order.emailAddress.trim(),
                subject: `Your order is ready for dispatch: ${params.order.publicOrderId}`,
                react: CorporateOrderCustomerReadyForDispatchEmail({
                    order: params.order,
                    confirmationHref: getAbsoluteURL(
                        `/corporate-orders/confirmation/${params.order.id}`
                    ),
                    pdfHref: getAbsoluteURL(
                        `/api/corporate-orders/${params.order.id}/summary.pdf`
                    ),
                }),
            });
        } catch (error) {
            console.error(
                "Failed to send customer ready-for-dispatch notification",
                error
            );
        }
    }

    private async notifyCustomerOrderDelivered(params: {
        order: {
            id: string;
            publicOrderId: string;
            companyName: string;
            quantity: number;
            totalPaise: number;
            advancePaidPaise: number;
            balanceDuePaise: number;
            emailAddress: string | null;
        };
    }) {
        if (!params.order.emailAddress?.trim()) return;

        try {
            await resend.emails.send({
                from: env.RESEND_EMAIL_FROM,
                to: params.order.emailAddress.trim(),
                subject: `Your order has been delivered: ${params.order.publicOrderId}`,
                react: CorporateOrderDeliveredEmail({
                    order: params.order,
                    confirmationHref: getAbsoluteURL(
                        `/corporate-orders/confirmation/${params.order.id}`
                    ),
                    pdfHref: getAbsoluteURL(
                        `/api/corporate-orders/${params.order.id}/summary.pdf`
                    ),
                }),
            });
        } catch (error) {
            console.error(
                "Failed to send customer delivered notification",
                error
            );
        }
    }

    private async notifyAdminReplacementRequestRaised(params: {
        order: {
            id: string;
            publicOrderId: string;
            companyName: string;
            contactPersonName: string;
            emailAddress: string;
        };
        request: {
            id: string;
            requestedQuantity: number;
            reasonCode: keyof typeof corporateReplacementReasonLabels;
            reasonDetails?: string | null;
        };
    }) {
        const opsEmails = parseCorporateOpsEmails();
        if (!opsEmails.length) return;

        try {
            await resend.emails.send({
                from: env.RESEND_EMAIL_FROM,
                to: opsEmails,
                subject: `Replacement request raised: ${params.order.publicOrderId}`,
                react: CorporateReplacementRequestAdminEmail({
                    order: params.order,
                    request: {
                        ...params.request,
                        reasonLabel:
                            corporateReplacementReasonLabels[
                                params.request.reasonCode
                            ] ?? "Other",
                    },
                    queueHref: getAbsoluteURL(
                        "/dashboard/general/corporate-orders/replacements"
                    ),
                    orderHref: getAbsoluteURL(
                        `/dashboard/general/corporate-orders/${params.order.id}`
                    ),
                }),
            });
        } catch (error) {
            console.error(
                "Failed to send admin replacement request notification",
                error
            );
        }
    }

    private maskEmployeeName(employeeName: string, index: number) {
        const normalized = employeeName.trim().toLowerCase();
        if (!normalized) {
            return `EMP-${String(index + 1).padStart(3, "0")}`;
        }

        const digest = crypto
            .createHash("sha256")
            .update(normalized)
            .digest("hex")
            .slice(0, 8)
            .toUpperCase();

        return `EMP-${digest}`;
    }

    private async requireBrandMembership(userId: string, brandId: string) {
        const membership = await db.query.brandMembers.findFirst({
            where: and(
                eq(brandMembers.brandId, brandId),
                eq(brandMembers.memberId, userId)
            ),
        });

        if (!membership) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "You are not a member of this brand",
            });
        }

        return membership;
    }

    private async resolveBrandQuoteForOrder(brandId: string, orderId: string) {
        const order = await db.query.corporateOrders.findFirst({
            where: and(
                eq(corporateOrders.id, orderId),
                eq(corporateOrders.brandId, brandId)
            ),
            with: {
                quote: true,
            },
        });

        if (!order) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "This corporate order is not assigned to the brand",
            });
        }

        return { order, quote: order.quote };
    }

    private async createCorporateOrderFromQuote(
        quote: {
            id: string;
            quoteNumber: string;
            brandId: string;
            productId: string | null;
            corporateProductConfigId: string | null;
            productTypeId: string | null;
            gsmOptionId: string | null;
            fabricCompositionId: string | null;
            quantity: number;
            subtotalPaise: number;
            customizationCostPaise: number;
            gstAmountPaise: number;
            totalAmountPaise: number;
            advanceAmountPaise: number;
            balanceAmountPaise: number;
            profile?: {
                userId: string | null;
                companyName: string;
                contactPerson: string;
                email: string;
                phone: string;
                gstNumber: string | null;
                shippingAddress: Record<string, unknown>;
            } | null;
        },
        context: {
            sourceType: "purchase_order" | "approved_quote";
            poNumber?: string | null;
            productScopeSummary?: string | null;
            customerNotes?: string | null;
            internalNotes?: string | null;
            orderSetup?: {
                companyName: string;
                contactPersonName: string;
                emailAddress: string;
                mobileNumber: string;
                gstNumber?: string | null;
                deliveryCountry: string;
                deliveryCity: string;
                deliveryPincode: string;
                deliveryAddress: string;
                brandingNotes?: string | null;
                productTypeId?: string | null;
                gsmOptionId?: string | null;
                fabricCompositionId?: string | null;
                colorOptionIds?: string[];
                customColorRequest?: string | null;
                logoLocationIds?: string[];
                printMethodId?: string | null;
                extraChargeRuleIds?: string[];
                sizeBreakdown: Record<string, number>;
                artworkFile?: Record<string, unknown> | null;
                employeeSheetFile?: Record<string, unknown> | null;
            };
        }
    ) {
        if (!quote.profile) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                    "Cannot create enterprise order without a linked buyer profile",
            });
        }
        const deliveryDetails = fillCorporateDeliveryAddressDefaults(
            extractCorporateDeliveryAddress(quote.profile.shippingAddress)
        );
        const setup = context.orderSetup;
        const companyName = setup?.companyName ?? quote.profile.companyName;
        const contactPersonName =
            setup?.contactPersonName ?? quote.profile.contactPerson;
        const emailAddress = setup?.emailAddress ?? quote.profile.email;
        const mobileNumber = setup?.mobileNumber ?? quote.profile.phone;
        const gstNumber = setup?.gstNumber ?? quote.profile.gstNumber ?? null;
        const orderDelivery = setup
            ? {
                  deliveryCountry: setup.deliveryCountry,
                  deliveryCity: setup.deliveryCity,
                  deliveryPincode: setup.deliveryPincode,
                  deliveryAddress: setup.deliveryAddress,
              }
            : deliveryDetails;
        const selectedProductTypeId =
            setup?.productTypeId ?? quote.productTypeId;
        const selectedGsmOptionId = setup?.gsmOptionId ?? quote.gsmOptionId;
        const selectedFabricCompositionId =
            setup?.fabricCompositionId ?? quote.fabricCompositionId;
        const [selectedProductType, selectedGsmOption, selectedFabric] =
            await Promise.all([
                selectedProductTypeId
                    ? db.query.corporateProductTypes.findFirst({
                          where: eq(
                              corporateProductTypes.id,
                              selectedProductTypeId
                          ),
                      })
                    : null,
                selectedGsmOptionId
                    ? db.query.corporateGsmOptions.findFirst({
                          where: eq(
                              corporateGsmOptions.id,
                              selectedGsmOptionId
                          ),
                      })
                    : null,
                selectedFabricCompositionId
                    ? db.query.corporateFabricCompositions.findFirst({
                          where: eq(
                              corporateFabricCompositions.id,
                              selectedFabricCompositionId
                          ),
                      })
                    : null,
            ]);

        const classificationRow = selectedProductType?.hsnMasterId
            ? await db.query.hsnMaster.findFirst({
                  where: and(
                      eq(hsnMaster.id, selectedProductType.hsnMasterId),
                      eq(hsnMaster.isActive, true)
                  ),
              })
            : null;
        let classification: ReturnType<
            typeof requireCorporateTaxClassification
        >;
        try {
            classification = requireCorporateTaxClassification({
                hsnCode: classificationRow?.hsnCode,
                gstRateBps: classificationRow?.gstRateBps,
                sourceId: classificationRow?.id,
            });
        } catch {
            throw new TRPCError({
                code: "PRECONDITION_FAILED",
                message:
                    "An active HSN Master classification is required before creating this corporate order",
            });
        }
        const gstRateBps = classification.gstRateBps;
        const gstAmountPaise = Math.round(
            ((quote.subtotalPaise + quote.customizationCostPaise) *
                gstRateBps) /
                10000
        );
        const totalAmountPaise =
            quote.subtotalPaise + quote.customizationCostPaise + gstAmountPaise;

        const createdOrder = await db
            .insert(corporateOrders)
            .values({
                publicOrderId: `REN-CORP-PO-${Date.now()}`,
                userId: quote.profile.userId,
                quoteId: quote.id,
                brandId: quote.brandId,
                status: "payment_pending",
                paymentStatus: "pending",
                companyName,
                contactPersonName,
                emailAddress,
                mobileNumber,
                gstNumber,
                deliveryCountry: orderDelivery.deliveryCountry,
                deliveryCity: orderDelivery.deliveryCity,
                deliveryPincode: orderDelivery.deliveryPincode,
                deliveryAddress: orderDelivery.deliveryAddress,
                numberOfEmployees: quote.quantity,
                employeeCount: quote.quantity,
                quantity: quote.quantity,
                sizeBreakdown: setup?.sizeBreakdown ?? {},
                employeeRows: [],
                companySnapshot: {
                    companyName,
                    contactPersonName,
                    emailAddress,
                    mobileNumber,
                    gstNumber,
                    deliveryCountry: orderDelivery.deliveryCountry,
                    deliveryCity: orderDelivery.deliveryCity,
                    deliveryPincode: orderDelivery.deliveryPincode,
                    deliveryAddress: orderDelivery.deliveryAddress,
                    deliveryAddressFormatted:
                        formatCorporateDeliveryAddress(orderDelivery),
                    shippingAddress: quote.profile.shippingAddress ?? {},
                    numberOfEmployees: quote.quantity,
                },
                productConfigSnapshot: {
                    productId: quote.productId,
                    corporateProductConfigId: quote.corporateProductConfigId,
                    productTypeId: selectedProductTypeId,
                    gsmOptionId: selectedGsmOptionId,
                    fabricCompositionId: selectedFabricCompositionId,
                    productType: selectedProductType ?? null,
                    gsmOption: selectedGsmOption ?? null,
                    fabricComposition: selectedFabric ?? null,
                    quoteNumber: quote.quoteNumber,
                    quantity: quote.quantity,
                    sourcedFrom: context.sourceType,
                },
                brandingConfigSnapshot: {
                    poNumber: context.poNumber ?? null,
                    productScopeSummary:
                        context.productScopeSummary ?? "As per approved quote",
                    adminBrandingNotes: setup?.brandingNotes ?? null,
                    colorOptionIds: setup?.colorOptionIds ?? [],
                    customColorRequest: setup?.customColorRequest ?? null,
                    logoLocationIds: setup?.logoLocationIds ?? [],
                    printMethodId: setup?.printMethodId ?? null,
                    extraChargeRuleIds: setup?.extraChargeRuleIds ?? [],
                },
                pricingSnapshot: {
                    subtotalPaise: quote.subtotalPaise,
                    customizationCostPaise: quote.customizationCostPaise,
                    hsnCode: classification.hsnCode,
                    hsnMasterId: classification.sourceId ?? null,
                    gstRateBps,
                    gstAmountPaise,
                    totalAmountPaise,
                },
                artworkFile: setup?.artworkFile ?? null,
                employeeSheetFile: setup?.employeeSheetFile ?? null,
                subtotalPaise: quote.subtotalPaise,
                customizationPaise: quote.customizationCostPaise,
                gstRateBps,
                gstPaise: gstAmountPaise,
                totalPaise: totalAmountPaise,
                advancePercentBps: totalAmountPaise
                    ? Math.round(
                          (quote.advanceAmountPaise / totalAmountPaise) * 10000
                      )
                    : 0,
                advancePaidPaise: 0,
                // A quote's advance split is a requested payment term, not a
                // completed collection. New orders start fully outstanding.
                balanceDuePaise: totalAmountPaise,
                balancePaymentStatus: "pending",
                customerNotes:
                    context.customerNotes ??
                    (context.sourceType === "purchase_order"
                        ? "Created from enterprise purchase order approval"
                        : "Created from approved corporate quote"),
                internalNotes:
                    context.internalNotes ??
                    (context.sourceType === "purchase_order"
                        ? `Created from ${context.poNumber ?? "purchase order"} | quote:${quote.id}`
                        : `Created from approved quote | quote:${quote.id}`),
            })
            .returning()
            .then((rows) => rows[0]);

        return createdOrder;
    }

    private async createReplacementOrderFromCorporateOrder(params: {
        sourceOrder: typeof corporateOrders.$inferSelect;
        requestedQuantity: number;
        replacementRequestId: string;
    }) {
        const { sourceOrder, requestedQuantity, replacementRequestId } = params;
        const totalPaise = sourceOrder.quantity
            ? Math.round(
                  (sourceOrder.totalPaise / sourceOrder.quantity) *
                      requestedQuantity
              )
            : 0;
        const subtotalPaise = sourceOrder.quantity
            ? Math.round(
                  (sourceOrder.subtotalPaise / sourceOrder.quantity) *
                      requestedQuantity
              )
            : 0;
        const customizationPaise = sourceOrder.quantity
            ? Math.round(
                  (sourceOrder.customizationPaise / sourceOrder.quantity) *
                      requestedQuantity
              )
            : 0;
        const gstPaise = sourceOrder.quantity
            ? Math.round(
                  (sourceOrder.gstPaise / sourceOrder.quantity) *
                      requestedQuantity
              )
            : 0;
        const sourceSnapshot = (sourceOrder.companySnapshot ?? {}) as Record<
            string,
            unknown
        >;
        const normalizedCompanySnapshot = {
            ...sourceSnapshot,
            numberOfEmployees: requestedQuantity,
            replacementForOrderId: sourceOrder.id,
            replacementForPublicOrderId: sourceOrder.publicOrderId,
        };
        const normalizedProductSnapshot = {
            ...(sourceOrder.productConfigSnapshot ?? {}),
            quantity: requestedQuantity,
            replacementForOrderId: sourceOrder.id,
            replacementForPublicOrderId: sourceOrder.publicOrderId,
        };
        const normalizedBrandingSnapshot = {
            ...(sourceOrder.brandingConfigSnapshot ?? {}),
            replacementRequestId,
            replacementForOrderId: sourceOrder.id,
        };
        const normalizedPricingSnapshot = {
            ...(sourceOrder.pricingSnapshot ?? {}),
            subtotalPaise,
            customizationPaise,
            gstPaise,
            totalPaise,
            replacementQuantity: requestedQuantity,
        };

        const createdOrder = await db
            .insert(corporateOrders)
            .values({
                publicOrderId: `REN-CORP-RPL-${Date.now()}`,
                userId: sourceOrder.userId,
                quoteId: sourceOrder.quoteId,
                brandId: sourceOrder.brandId,
                status: "approved",
                paymentStatus: "paid",
                companyName: sourceOrder.companyName,
                contactPersonName: sourceOrder.contactPersonName,
                emailAddress: sourceOrder.emailAddress,
                mobileNumber: sourceOrder.mobileNumber,
                gstNumber: sourceOrder.gstNumber,
                deliveryCountry: sourceOrder.deliveryCountry,
                deliveryCity: sourceOrder.deliveryCity,
                deliveryPincode: sourceOrder.deliveryPincode,
                deliveryAddress: sourceOrder.deliveryAddress,
                numberOfEmployees: requestedQuantity,
                employeeCount: requestedQuantity,
                quantity: requestedQuantity,
                sizeBreakdown: sourceOrder.sizeBreakdown,
                employeeRows: sourceOrder.employeeRows,
                companySnapshot: normalizedCompanySnapshot,
                productConfigSnapshot: normalizedProductSnapshot,
                brandingConfigSnapshot: normalizedBrandingSnapshot,
                pricingSnapshot: normalizedPricingSnapshot,
                artworkFile: sourceOrder.artworkFile,
                employeeSheetFile: sourceOrder.employeeSheetFile,
                subtotalPaise,
                customizationPaise,
                gstRateBps: sourceOrder.gstRateBps,
                gstPaise,
                totalPaise,
                advancePercentBps: 10000,
                advancePaidPaise: totalPaise,
                balanceDuePaise: 0,
                razorpayOrderId: sourceOrder.razorpayOrderId,
                razorpayPaymentId: sourceOrder.razorpayPaymentId,
                razorpaySignature: sourceOrder.razorpaySignature,
                paymentReference:
                    sourceOrder.paymentReference ??
                    sourceOrder.razorpayPaymentId,
                balancePaymentStatus: "paid",
                customerNotes:
                    "Replacement order created after corporate replacement approval",
                internalNotes: `Replacement for ${sourceOrder.publicOrderId} | request:${replacementRequestId}`,
            })
            .returning()
            .then((rows) => rows[0]);

        await corporateOrderQueries.createStatusHistory({
            corporateOrderId: createdOrder.id,
            fromStatus: null,
            toStatus: "approved",
            changedByUserId: sourceOrder.userId,
            note: `Replacement order created for ${sourceOrder.publicOrderId}`,
            metadata: {
                sourceOrderId: sourceOrder.id,
                sourcePublicOrderId: sourceOrder.publicOrderId,
                replacementRequestId,
            },
        });

        return createdOrder;
    }

    private mapCorporateReplacementRequest(request: {
        id: string;
        orderId: string;
        requestedByUserId: string | null;
        reviewedByUserId: string | null;
        replacementOrderId: string | null;
        requestedQuantity: number;
        reasonCode: keyof typeof corporateReplacementReasonLabels;
        reasonDetails: string | null;
        photos: Array<{
            name: string;
            url: string;
            type: string;
            size: number;
            key?: string | undefined;
        }>;
        status: "requested" | "approved" | "rejected";
        adminNote: string | null;
        reviewedAt: string | null;
        createdAt: Date | string;
        updatedAt: Date | string;
        order?: typeof corporateOrders.$inferSelect | null;
        replacementOrder?: typeof corporateOrders.$inferSelect | null;
        rtoShipment?: typeof corporateRtoShipments.$inferSelect | null;
        requestedBy?: {
            id: string;
            firstName: string | null;
            lastName: string | null;
            email: string | null;
        } | null;
        reviewedBy?: {
            id: string;
            firstName: string | null;
            lastName: string | null;
            email: string | null;
        } | null;
    }) {
        return {
            ...request,
            reasonLabel:
                corporateReplacementReasonLabels[request.reasonCode] ?? "Other",
        };
    }

    private getDelhiveryTrackingUrl(awbNumber: string | null) {
        if (!awbNumber) return null;

        return `${process.env.DELHIVERY_BASE_URL?.trim() || "https://track.delhivery.com"}/tracking/package/${awbNumber}`;
    }

    private extractDelhiveryWaybill(
        rawData: Record<string, unknown> | null | undefined
    ) {
        if (!rawData) return null;

        const packageData = Array.isArray(rawData.packages)
            ? rawData.packages[0]
            : Array.isArray(rawData.package)
              ? rawData.package[0]
              : null;
        const packageRecord =
            packageData &&
            typeof packageData === "object" &&
            !Array.isArray(packageData)
                ? (packageData as Record<string, unknown>)
                : null;

        return typeof packageRecord?.waybill === "string"
            ? packageRecord.waybill
            : typeof packageRecord?.awb === "string"
              ? packageRecord.awb
              : typeof rawData.waybill === "string"
                ? rawData.waybill
                : typeof rawData.awb === "string"
                  ? rawData.awb
                  : null;
    }

    private readAddressField(
        source: Record<string, unknown> | null | undefined,
        keys: string[]
    ) {
        for (const key of keys) {
            const value = source?.[key];
            if (typeof value === "string" && value.trim()) {
                return value.trim();
            }
        }

        return null;
    }

    private async createCorporateRtoShipmentRecord(params: {
        actorUserId: string;
        order: typeof corporateOrders.$inferSelect & {
            shipment?: typeof corporateShipments.$inferSelect | null;
            brand?: typeof brands.$inferSelect | null;
        };
        request: typeof corporateReplacementRequests.$inferSelect;
        existingRtoShipment?: typeof corporateRtoShipments.$inferSelect | null;
    }) {
        if (!params.order.brand?.id || !params.order.brand?.name) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Assign a brand before creating the reverse shipment",
            });
        }

        const pickupLocationCode = generatePickupLocationCode({
            brandId: params.order.brand.id,
            brandName: params.order.brand.name,
        });

        const brandConfidential = await db.query.brandConfidentials.findFirst({
            where: eq(brandConfidentials.id, params.order.brand.id),
        });

        if (!brandConfidential) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                    "Brand pickup location details are missing for reverse shipment",
            });
        }

        const companySnapshot =
            params.order.companySnapshot &&
            typeof params.order.companySnapshot === "object" &&
            !Array.isArray(params.order.companySnapshot)
                ? (params.order.companySnapshot as Record<string, unknown>)
                : null;
        const shippingAddress =
            companySnapshot?.shippingAddress &&
            typeof companySnapshot.shippingAddress === "object" &&
            !Array.isArray(companySnapshot.shippingAddress)
                ? (companySnapshot.shippingAddress as Record<string, unknown>)
                : null;
        const customerState =
            this.readAddressField(shippingAddress, [
                "state",
                "province",
                "region",
            ]) ?? params.order.deliveryCity;
        const customerCountry =
            this.readAddressField(shippingAddress, ["country"]) ??
            params.order.deliveryCountry ??
            "India";
        const reverseOrderCode = `${params.order.publicOrderId}-RTO-${params.request.id
            .slice(0, 8)
            .toUpperCase()}`;
        const returnAddress =
            [
                brandConfidential.warehouseAddressLine1,
                brandConfidential.warehouseAddressLine2,
            ]
                .filter(Boolean)
                .join(", ")
                .trim() ||
            [brandConfidential.addressLine1, brandConfidential.addressLine2]
                .filter(Boolean)
                .join(", ")
                .trim();
        const returnCity =
            brandConfidential.warehouseCity ?? brandConfidential.city;
        const returnState =
            brandConfidential.warehouseState ?? brandConfidential.state;
        const returnCountry =
            brandConfidential.warehouseCountry ??
            brandConfidential.country ??
            "India";
        const returnPin =
            brandConfidential.warehousePostalCode ??
            brandConfidential.postalCode;

        const reversePayload = {
            format: "json" as const,
            pickup_location: {
                name: pickupLocationCode,
            },
            shipments: [
                {
                    name: params.order.contactPersonName,
                    add: params.order.deliveryAddress,
                    pin: params.order.deliveryPincode,
                    city: params.order.deliveryCity,
                    state: customerState,
                    country: customerCountry,
                    phone: params.order.mobileNumber,
                    order: reverseOrderCode,
                    payment_mode: "Pickup" as const,
                    shipping_mode: "Surface" as const,
                    address_type: "Office" as const,
                    quantity: String(params.request.requestedQuantity),
                    products_desc: `Corporate replacement return for ${params.order.publicOrderId}`,
                    return_name:
                        brandConfidential.authorizedSignatoryName ||
                        params.order.brand.name,
                    return_add: returnAddress,
                    return_city: returnCity,
                    return_state: returnState,
                    return_country: returnCountry,
                    return_pin: returnPin,
                    return_phone: brandConfidential.authorizedSignatoryPhone,
                },
            ],
        };

        const baseRawPayload = {
            ...(params.existingRtoShipment?.rawPayload ?? {}),
            sourceShipmentId: params.order.shipment?.id ?? null,
            sourceAwbNumber: params.order.shipment?.awbNumber ?? null,
            requestedQuantity: params.request.requestedQuantity,
            reasonDetails: params.request.reasonDetails ?? null,
            reverseOrderCode,
            requestPayload: reversePayload,
        };

        const existingRtoShipment = params.existingRtoShipment;
        const shipmentRecord = existingRtoShipment
            ? await db
                  .update(corporateRtoShipments)
                  .set({
                      provider: "delhivery",
                      pickupLocationCode,
                      originalAwbNumber:
                          params.order.shipment?.awbNumber ??
                          existingRtoShipment.originalAwbNumber,
                      reasonCode: params.request.reasonCode,
                      status: "draft",
                      rawPayload: baseRawPayload,
                      handledByUserId: params.actorUserId,
                      notes: "Retrying corporate reverse shipment creation",
                      updatedAt: new Date(),
                  })
                  .where(eq(corporateRtoShipments.id, existingRtoShipment.id))
                  .returning()
                  .then((rows) => rows[0])
            : await db
                  .insert(corporateRtoShipments)
                  .values({
                      orderId: params.order.id,
                      replacementRequestId: params.request.id,
                      provider: "delhivery",
                      pickupLocationCode,
                      originalAwbNumber:
                          params.order.shipment?.awbNumber ?? null,
                      reasonCode: params.request.reasonCode,
                      status: "draft",
                      rawPayload: baseRawPayload,
                      createdByUserId: params.actorUserId,
                      handledByUserId: params.actorUserId,
                      notes: "Corporate replacement reverse shipment initialized",
                  })
                  .returning()
                  .then((rows) => rows[0]);

        const result = await createOrder(reversePayload);
        const rawData =
            result.success && result.data && typeof result.data === "object"
                ? (result.data as Record<string, unknown>)
                : null;
        const reverseAwbNumber = this.extractDelhiveryWaybill(rawData);

        if (!result.success || !reverseAwbNumber) {
            const errorMessage =
                typeof result.error === "string"
                    ? result.error
                    : "Delhivery reverse shipment could not be created";

            await db
                .update(corporateRtoShipments)
                .set({
                    status: "failed",
                    rawPayload: {
                        ...baseRawPayload,
                        response: rawData,
                        error: result.error ?? errorMessage,
                    },
                    notes: errorMessage,
                    handledByUserId: params.actorUserId,
                    updatedAt: new Date(),
                })
                .where(eq(corporateRtoShipments.id, shipmentRecord.id));

            throw new TRPCError({
                code: "BAD_REQUEST",
                message: errorMessage,
            });
        }

        return db
            .update(corporateRtoShipments)
            .set({
                status: "requested",
                reverseAwbNumber,
                reverseTrackingNumber: reverseAwbNumber,
                reverseTrackingUrl:
                    this.getDelhiveryTrackingUrl(reverseAwbNumber),
                rawPayload: {
                    ...baseRawPayload,
                    response: rawData,
                },
                notes: "Delhivery reverse shipment created",
                handledByUserId: params.actorUserId,
                updatedAt: new Date(),
            })
            .where(eq(corporateRtoShipments.id, shipmentRecord.id))
            .returning()
            .then((rows) => rows[0]);
    }

    async getMyProfile(userId: string) {
        const linkedProfile = await db.query.corporateProfiles.findFirst({
            where: eq(corporateProfiles.userId, userId),
            orderBy: [desc(corporateProfiles.updatedAt)],
        });
        if (linkedProfile) return linkedProfile;

        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: { email: true, isEmailVerified: true },
        });
        if (!user?.email || !user.isEmailVerified) return null;

        const pendingProfile = await db.query.corporateProfiles.findFirst({
            where: sql`lower(${corporateProfiles.email}) = ${user.email.trim().toLowerCase()}`,
            orderBy: [desc(corporateProfiles.updatedAt)],
        });
        if (!pendingProfile) return null;

        if (!pendingProfile.userId) {
            await db
                .update(corporateProfiles)
                .set({ userId, updatedAt: new Date() })
                .where(eq(corporateProfiles.id, pendingProfile.id));
            pendingProfile.userId = userId;
        }

        return pendingProfile;
    }

    async upsertMyProfile(userId: string, input: unknown) {
        const parsed = corporateProfileInputSchema.parse(input);
        const existing = await this.getMyProfile(userId);

        if (existing) {
            const updated = await db
                .update(corporateProfiles)
                .set({
                    companyName: parsed.companyName,
                    gstNumber: parsed.gstNumber ?? null,
                    website: parsed.website ?? null,
                    companySize: parsed.companySize ?? null,
                    industry: parsed.industry ?? null,
                    contactPerson: parsed.contactPerson,
                    email: parsed.email,
                    phone: parsed.phone,
                    billingAddress: parsed.billingAddress,
                    shippingAddress: parsed.shippingAddress,
                    updatedAt: new Date(),
                })
                .where(eq(corporateProfiles.id, existing.id))
                .returning()
                .then((rows) => rows[0]);

            await this.createEvent(
                "corporate_profile",
                updated.id,
                "CORPORATE_PROFILE_UPDATED",
                { companyName: updated.companyName },
                userId
            );

            return updated;
        }

        const created = await db
            .insert(corporateProfiles)
            .values({
                userId,
                companyName: parsed.companyName,
                gstNumber: parsed.gstNumber ?? null,
                website: parsed.website ?? null,
                companySize: parsed.companySize ?? null,
                industry: parsed.industry ?? null,
                contactPerson: parsed.contactPerson,
                email: parsed.email,
                phone: parsed.phone,
                billingAddress: parsed.billingAddress,
                shippingAddress: parsed.shippingAddress,
                isDefault: true,
            })
            .returning()
            .then((rows) => rows[0]);

        await this.createEvent(
            "corporate_profile",
            created.id,
            "CORPORATE_PROFILE_CREATED",
            { companyName: created.companyName },
            userId
        );

        return created;
    }

    async listCatalog(input: unknown) {
        const parsed = corporateCatalogListInputSchema.parse(input);
        const rows = await db.query.corporateProductConfigs.findMany({
            where: eq(corporateProductConfigs.isActive, true),
            with: {
                product: true,
                brand: true,
            },
            orderBy: [asc(corporateProductConfigs.displayOrder)],
        });

        const filtered = rows.filter((row) => {
            if (parsed.brandId && row.brandId !== parsed.brandId) return false;
            if (
                parsed.categoryId &&
                row.product.categoryId !== parsed.categoryId
            )
                return false;
            if (parsed.customizationAvailable) {
                const hasCustomization = Object.values(
                    row.customizationOptions ?? {}
                ).some(Boolean);
                if (!hasCustomization) return false;
            }
            if (parsed.search) {
                const haystack = [
                    row.corporateTitle,
                    row.corporateDescription,
                    row.brand.name,
                    row.product.title,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();
                if (!haystack.includes(parsed.search.toLowerCase()))
                    return false;
            }
            return true;
        });

        const start = (parsed.page - 1) * parsed.limit;
        const data = filtered.slice(start, start + parsed.limit);

        return {
            data,
            total: filtered.length,
            page: parsed.page,
            limit: parsed.limit,
        };
    }

    async seedCatalogFromExistingProducts(limit = 24) {
        const existing = await db
            .select({ productId: corporateProductConfigs.productId })
            .from(corporateProductConfigs);
        const existingIds = existing.map((item) => item.productId);

        const sourceProducts = await db.query.products.findMany({
            where: existingIds.length
                ? and(
                      eq(products.isDeleted, false),
                      eq(products.isPublished, true),
                      notInArray(products.id, existingIds)
                  )
                : and(
                      eq(products.isDeleted, false),
                      eq(products.isPublished, true)
                  ),
            with: {
                brand: true,
            },
            limit,
            orderBy: [desc(products.createdAt)],
        });

        if (!sourceProducts.length) {
            return { inserted: 0 };
        }

        await db.insert(corporateProductConfigs).values(
            sourceProducts.map((product, index) => ({
                productId: product.id,
                brandId: product.brandId,
                corporateTitle: product.title,
                corporateDescription:
                    product.description ?? "Corporate-ready product",
                moq: 25,
                maxCapacityPerOrder: 500,
                monthlyCapacity: 1000,
                leadTimeDays: 14,
                availableSizes: ["XS", "S", "M", "L", "XL", "XXL"],
                availableColors: [],
                customizationOptions: {
                    logo_print: true,
                    embroidery: true,
                    custom_packaging: true,
                },
                customizationCharges: {
                    logo_print: 0,
                    embroidery: 0,
                    custom_packaging: 0,
                },
                priceRangeMinPaise: product.price ?? 0,
                priceRangeMaxPaise:
                    product.compareAtPrice ?? product.price ?? 0,
                sustainabilityNotes:
                    "Configured from marketplace catalog for corporate procurement.",
                displayOrder: index + 1,
            }))
        );

        return { inserted: sourceProducts.length };
    }

    async submitRfq(userId: string, input: unknown) {
        const parsed = corporateRfqInputSchema.parse(input);
        const corporateProfile =
            parsed.profileId ??
            (
                await this.upsertMyProfile(userId, {
                    companyName: parsed.companyName,
                    gstNumber: null,
                    website: null,
                    companySize: null,
                    industry: null,
                    contactPerson: parsed.contactPerson,
                    email: parsed.email,
                    phone: parsed.phone,
                    billingAddress: {},
                    shippingAddress: {},
                })
            ).id;
        const sequence = await db
            .select({ count: count() })
            .from(corporateRfqs)
            .then((rows) => (rows[0]?.count ?? 0) + 1);

        const created = await db
            .insert(corporateRfqs)
            .values({
                rfqNumber: makeNumber("RFQ", sequence),
                corporateProfileId: corporateProfile,
                userId,
                companyName: parsed.companyName,
                contactPerson: parsed.contactPerson,
                email: parsed.email,
                phone: parsed.phone,
                useCase: parsed.useCase,
                quantity: parsed.quantity,
                budgetPerUnitPaise: parsed.budgetPerUnitPaise ?? null,
                deliveryDate: parsed.deliveryDate ?? null,
                sustainabilityRequired: parsed.sustainabilityRequired,
                brandingRequired: parsed.brandingRequired,
                requirementDescription: parsed.requirementDescription,
                procurementMode: parsed.procurementMode,
            })
            .returning()
            .then((rows) => rows[0]);

        if (parsed.attachments.length > 0) {
            await db.insert(corporateRfqDocuments).values(
                parsed.attachments.map((file) => ({
                    rfqId: created.id,
                    fileName: file.name,
                    fileUrl: file.url,
                    fileType: file.type,
                    fileSizeBytes: file.size,
                    uploadedByUserId: userId,
                }))
            );
            await db.insert(corporateDocuments).values(
                parsed.attachments.map((file) => ({
                    entityType: "rfq",
                    entityId: created.id,
                    documentType: "rfq_attachment",
                    fileName: file.name,
                    fileUrl: file.url,
                    mimeType: file.type,
                    fileSizeBytes: file.size,
                    uploadedByUserId: userId,
                    version: 1,
                }))
            );
        }

        await db.insert(corporateTasks).values({
            taskType: "review_rfq",
            entityType: "rfq",
            entityId: created.id,
            status: "open",
            priority: "high",
            notes: `Review ${created.rfqNumber}`,
        });

        await this.createEvent(
            "rfq",
            created.id,
            "RFQ_SUBMITTED",
            {
                rfqNumber: created.rfqNumber,
                companyName: created.companyName,
                quantity: created.quantity,
            },
            userId
        );

        return created;
    }

    async listMyRfqs(userId: string) {
        return db.query.corporateRfqs.findMany({
            where: eq(corporateRfqs.userId, userId),
            with: {
                documents: true,
            },
            orderBy: [desc(corporateRfqs.createdAt)],
        });
    }

    async createQuote(actorUserId: string, input: unknown) {
        const parsed = corporateQuoteInputSchema.parse(input);
        const rfq = parsed.rfqId
            ? await db.query.corporateRfqs.findFirst({
                  where: eq(corporateRfqs.id, parsed.rfqId),
              })
            : null;
        const config = await corporateOrderQueries.getFormConfig();
        const selectedProductType = parsed.productTypeId
            ? config.productTypes.find(
                  (productType) => productType.id === parsed.productTypeId
              )
            : null;
        const classification = requireCorporateTaxClassification({
            hsnCode: selectedProductType?.hsnMaster?.hsnCode,
            gstRateBps: selectedProductType?.hsnMaster?.gstRateBps,
            sourceId: selectedProductType?.hsnMaster?.id,
        });
        if (parsed.customizationCostPaise > 0) {
            throw new TRPCError({
                code: "PRECONDITION_FAILED",
                message:
                    "Customization tax classification is required before creating this corporate quote",
            });
        }
        const pricingSlab =
            parsed.productTypeId && parsed.gsmOptionId
                ? (config.pricingSlabs
                      .filter(
                          (slab) =>
                              slab.productTypeId === parsed.productTypeId &&
                              slab.gsmOptionId === parsed.gsmOptionId &&
                              slab.minQuantity <= parsed.quantity &&
                              (slab.maxQuantity === null ||
                                  slab.maxQuantity >= parsed.quantity)
                      )
                      .sort((a, b) => b.minQuantity - a.minQuantity)[0] ?? null)
                : null;

        if (parsed.productTypeId && parsed.gsmOptionId && !pricingSlab) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                    "No corporate pricing slab is configured for this product, GSM, and quantity.",
            });
        }

        const subtotalPaise = pricingSlab
            ? pricingSlab.unitPricePaise * parsed.quantity
            : parsed.subtotalPaise;
        const gstAmountPaise = Math.round(
            (subtotalPaise * classification.gstRateBps) / 10000
        );
        const totalAmountPaise = subtotalPaise + gstAmountPaise;
        const advanceAmountPaise = Math.min(
            parsed.advanceAmountPaise,
            totalAmountPaise
        );
        const sequence = await db
            .select({ count: count() })
            .from(corporateQuotes)
            .then((rows) => (rows[0]?.count ?? 0) + 1);

        const created = await db
            .insert(corporateQuotes)
            .values({
                quoteNumber: makeNumber("QUO", sequence),
                rfqId: parsed.rfqId ?? null,
                corporateProfileId: parsed.corporateProfileId,
                brandId: parsed.brandId,
                productId: parsed.productId ?? null,
                corporateProductConfigId:
                    parsed.corporateProductConfigId ?? null,
                productTypeId: parsed.productTypeId ?? null,
                gsmOptionId: parsed.gsmOptionId ?? null,
                fabricCompositionId: parsed.fabricCompositionId ?? null,
                hsnCode: classification.hsnCode,
                quantity: parsed.quantity,
                subtotalPaise,
                customizationCostPaise: parsed.customizationCostPaise,
                gstAmountPaise,
                totalAmountPaise,
                advanceAmountPaise,
                balanceAmountPaise: totalAmountPaise - advanceAmountPaise,
                validUntil: parsed.validUntil ?? null,
                status: "sent",
            })
            .returning()
            .then((rows) => rows[0]);

        await db.insert(corporateQuoteRevisions).values({
            quoteId: created.id,
            revisionNumber: 1,
            subtotalPaise: created.subtotalPaise,
            customizationCostPaise: created.customizationCostPaise,
            gstAmountPaise: created.gstAmountPaise,
            totalAmountPaise: created.totalAmountPaise,
            comments: parsed.comments ?? null,
            createdByUserId: actorUserId,
        });

        if (rfq) {
            await db
                .update(corporateRfqs)
                .set({
                    status: "quote_sent",
                    updatedAt: new Date(),
                })
                .where(eq(corporateRfqs.id, rfq.id));

            await db.insert(corporateRfqBrandMatches).values({
                rfqId: rfq.id,
                brandId: parsed.brandId,
                confidenceScoreBps: 10000,
                recommendationNotes: "Selected during quotation preparation",
            });

            await this.createAdminAuditLog(
                actorUserId,
                "RFQ_QUOTED",
                "rfq",
                rfq.id,
                { previousStatus: rfq.status },
                { nextStatus: "quote_sent", quoteNumber: created.quoteNumber }
            );
        }

        await this.createEvent(
            "quote",
            created.id,
            "QUOTE_SENT",
            {
                quoteNumber: created.quoteNumber,
                totalAmountPaise: created.totalAmountPaise,
            },
            actorUserId
        );

        return created;
    }

    async createManualQuote(actorUserId: string, input: unknown) {
        const parsed = corporateAdminManualQuoteInputSchema.parse(input);
        let classificationRow = parsed.hsnCode
            ? await db.query.hsnMaster.findFirst({
                  where: and(
                      eq(hsnMaster.hsnCode, parsed.hsnCode),
                      eq(hsnMaster.isActive, true)
                  ),
              })
            : null;
        if (parsed.hsnCode && !classificationRow) {
            const normalizedHsnCode = parsed.hsnCode.trim();
            const gstRateBps = Math.round(parsed.gstPercent * 100);
            try {
                classificationRow = await db
                    .insert(hsnMaster)
                    .values({
                        hsnCode: normalizedHsnCode,
                        description: "Corporate manual quote classification",
                        gstRateBps,
                        isActive: true,
                        metadata: {
                            source: "corporate_manual_quote",
                            createdByUserId: actorUserId,
                        },
                    })
                    .onConflictDoNothing({ target: hsnMaster.hsnCode })
                    .returning()
                    .then((rows) => rows[0] ?? null);
                if (!classificationRow) {
                    classificationRow = await db.query.hsnMaster.findFirst({
                        where: and(
                            eq(hsnMaster.hsnCode, normalizedHsnCode),
                            eq(hsnMaster.isActive, true)
                        ),
                    });
                }
            } catch {
                classificationRow = null;
            }
        }
        let classification;
        try {
            classification = requireCorporateTaxClassification({
                hsnCode: classificationRow?.hsnCode,
                gstRateBps: classificationRow?.gstRateBps,
                sourceId: classificationRow?.id,
            });
        } catch {
            throw new TRPCError({
                code: "PRECONDITION_FAILED",
                message:
                    "An active HSN Master classification is required before creating this corporate quote",
            });
        }
        if (parsed.customizationCostPaise > 0) {
            throw new TRPCError({
                code: "PRECONDITION_FAILED",
                message:
                    "Customization tax classification is required before creating this corporate quote",
            });
        }
        const normalizedEmail = parsed.email.toLowerCase();
        const matchedUser = await db.query.users.findFirst({
            where: and(
                sql`lower(${users.email}) = ${normalizedEmail}`,
                eq(users.isEmailVerified, true)
            ),
            columns: { id: true },
        });
        const existingProfile = await db.query.corporateProfiles.findFirst({
            where: sql`lower(${corporateProfiles.email}) = ${normalizedEmail}`,
            orderBy: [desc(corporateProfiles.updatedAt)],
        });

        const subtotalPaise = parsed.unitPricePaise * parsed.quantity;
        const customizationCostPaise = parsed.customizationCostPaise ?? 0;
        const baseGstRateBps = classification.gstRateBps;
        const customizationGstRateBps = 0;
        const baseGstAmountPaise = Math.round(
            (subtotalPaise * baseGstRateBps) / 10000
        );
        const customizationGstAmountPaise = Math.round(
            (customizationCostPaise * customizationGstRateBps) / 10000
        );
        const gstAmountPaise = baseGstAmountPaise + customizationGstAmountPaise;
        const taxablePaise = subtotalPaise + customizationCostPaise;
        const totalAmountPaise = taxablePaise + gstAmountPaise;
        const advanceAmountPaise = Math.round(
            (totalAmountPaise * parsed.advancePercent) / 100
        );

        const commissionAmountPaise = parsed.commissionAmountPaise ?? 0;
        const commissionGstRateBps = Math.round(
            (parsed.commissionGstPercent ?? 18) * 100
        );
        const commissionGstAmountPaise = Math.round(
            (commissionAmountPaise * commissionGstRateBps) / 10000
        );
        const commissionTotalPaise =
            commissionAmountPaise + commissionGstAmountPaise;

        const hasDeliveryAddress = Boolean(
            parsed.deliveryAddress?.trim() ||
                parsed.deliveryPincode?.trim() ||
                parsed.deliveryCity?.trim() ||
                parsed.deliveryState?.trim()
        );
        const shippingAddress = hasDeliveryAddress
            ? {
                  addressLine1: parsed.deliveryAddress?.trim() || "",
                  street: parsed.deliveryAddress?.trim() || "",
                  city: parsed.deliveryCity?.trim() || "",
                  state: parsed.deliveryState?.trim() || "",
                  pincode: parsed.deliveryPincode?.trim() || "",
                  postalCode: parsed.deliveryPincode?.trim() || "",
                  country: parsed.deliveryCountry?.trim() || "India",
              }
            : ((existingProfile?.shippingAddress as
                  | Record<string, unknown>
                  | undefined) ?? {});

        const result = await db.transaction(async (tx) => {
            const profile = existingProfile
                ? await tx
                      .update(corporateProfiles)
                      .set({
                          userId:
                              matchedUser?.id ?? existingProfile.userId ?? null,
                          companyName: parsed.companyName,
                          contactPerson: parsed.contactPerson,
                          email: normalizedEmail,
                          phone: parsed.phone,
                          gstNumber: parsed.gstNumber ?? null,
                          ...(hasDeliveryAddress ? { shippingAddress } : {}),
                          updatedAt: new Date(),
                      })
                      .where(eq(corporateProfiles.id, existingProfile.id))
                      .returning()
                      .then((rows) => rows[0])
                : await tx
                      .insert(corporateProfiles)
                      .values({
                          userId: matchedUser?.id ?? null,
                          companyName: parsed.companyName,
                          contactPerson: parsed.contactPerson,
                          email: normalizedEmail,
                          phone: parsed.phone,
                          gstNumber: parsed.gstNumber ?? null,
                          billingAddress: {},
                          shippingAddress,
                          isDefault: true,
                      })
                      .returning()
                      .then((rows) => rows[0]);

            if (!profile) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "The customer profile could not be created.",
                });
            }

            const sequence = await tx
                .select({ count: count() })
                .from(corporateQuotes)
                .then((rows) => (rows[0]?.count ?? 0) + 1);
            const quote = await tx
                .insert(corporateQuotes)
                .values({
                    quoteNumber: makeNumber("QUO", sequence),
                    rfqId: null,
                    corporateProfileId: profile.id,
                    brandId: parsed.brandId,
                    productTypeId: parsed.productTypeId ?? null,
                    hsnCode: classification.hsnCode,
                    gsmOptionId: parsed.gsmOptionId ?? null,
                    fabricCompositionId: parsed.fabricCompositionId ?? null,
                    extraChargeRuleIds: parsed.extraChargeRuleIds ?? [],
                    manualExtraAmountPaise: parsed.manualExtraAmountPaise ?? 0,
                    manualExtraDescription:
                        parsed.manualExtraDescription ?? null,
                    quantity: parsed.quantity,
                    subtotalPaise,
                    customizationCostPaise: parsed.customizationCostPaise,
                    gstAmountPaise,
                    totalAmountPaise,
                    advanceAmountPaise,
                    balanceAmountPaise: totalAmountPaise - advanceAmountPaise,
                    commissionAmountPaise,
                    commissionGstRateBps,
                    commissionGstAmountPaise,
                    commissionTotalPaise,
                    validUntil: parsed.validUntil ?? null,
                    status: "sent",
                })
                .returning()
                .then((rows) => rows[0]);

            if (!quote) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "The manual quote could not be created.",
                });
            }

            await tx.insert(corporateQuoteRevisions).values({
                quoteId: quote.id,
                revisionNumber: 1,
                subtotalPaise,
                customizationCostPaise: parsed.customizationCostPaise,
                gstAmountPaise,
                totalAmountPaise,
                comments: parsed.comments ?? null,
                createdByUserId: actorUserId,
            });

            return { quote, profile };
        });

        await Promise.all([
            this.createEvent(
                "quote",
                result.quote.id,
                "MANUAL_QUOTE_SENT",
                {
                    quoteNumber: result.quote.quoteNumber,
                    recipientEmail: normalizedEmail,
                    recipientRegistered: Boolean(result.profile.userId),
                },
                actorUserId
            ),
            this.createAdminAuditLog(
                actorUserId,
                "MANUAL_QUOTE_CREATED",
                "quote",
                result.quote.id,
                null,
                {
                    quoteNumber: result.quote.quoteNumber,
                    recipientEmail: normalizedEmail,
                }
            ),
        ]);

        return {
            ...result.quote,
            recipientRegistered: Boolean(result.profile.userId),
        };
    }

    async listMyQuotes(userId: string) {
        await this.getMyProfile(userId);
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: { email: true, isEmailVerified: true },
        });
        const verifiedEmail =
            user?.isEmailVerified && user.email
                ? user.email.trim().toLowerCase()
                : null;
        const profiles = await db.query.corporateProfiles.findMany({
            where: verifiedEmail
                ? sql`lower(${corporateProfiles.email}) = ${verifiedEmail}`
                : eq(corporateProfiles.userId, userId),
        });
        if (!profiles.length) return [];

        await db
            .update(corporateProfiles)
            .set({ userId, updatedAt: new Date() })
            .where(
                inArray(
                    corporateProfiles.id,
                    profiles.map((profile) => profile.id)
                )
            );

        const quotes = await db.query.corporateQuotes.findMany({
            where: inArray(
                corporateQuotes.corporateProfileId,
                profiles.map((profile) => profile.id)
            ),
            with: {
                revisions: true,
                brand: true,
            },
            orderBy: [desc(corporateQuotes.createdAt)],
        });
        if (!quotes.length) return quotes;
        const proformas = await db.query.corporateProformaInvoices.findMany({
            where: inArray(
                corporateProformaInvoices.quoteId,
                quotes.map((quote) => quote.id)
            ),
            orderBy: [desc(corporateProformaInvoices.createdAt)],
        });
        const proformaByQuote = new Map(
            proformas.map((proforma) => [proforma.quoteId, proforma])
        );
        return quotes.map((quote) => ({
            ...quote,
            proformaInvoice: proformaByQuote.get(quote.id) ?? null,
        }));
    }

    async listMyPurchaseOrders(userId: string) {
        const profile = await this.getMyProfile(userId);
        if (!profile) return [];

        return db.query.corporatePurchaseOrders.findMany({
            where: eq(corporatePurchaseOrders.corporateProfileId, profile.id),
            with: {
                quote: true,
            },
            orderBy: [desc(corporatePurchaseOrders.createdAt)],
        });
    }

    async listMyIssuedTaxInvoices(userId: string) {
        return db
            .select({
                orderId: corporateTaxInvoices.orderId,
                invoiceNumber: corporateTaxInvoices.invoiceNumber,
            })
            .from(corporateTaxInvoices)
            .innerJoin(
                corporateOrders,
                eq(corporateTaxInvoices.orderId, corporateOrders.id)
            )
            .where(
                and(
                    eq(corporateOrders.userId, userId),
                    eq(corporateTaxInvoices.status, "issued")
                )
            );
    }

    async listMyReplacementRequests(userId: string, orderId?: string) {
        const requests = await db.query.corporateReplacementRequests.findMany({
            where: orderId
                ? eq(corporateReplacementRequests.orderId, orderId)
                : undefined,
            with: {
                order: true,
                replacementOrder: {
                    with: {
                        shipment: true,
                    },
                },
                rtoShipment: true,
                reviewedBy: {
                    columns: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
            orderBy: [desc(corporateReplacementRequests.createdAt)],
        });

        const visibleRequests = requests.filter(
            (request) => request.order?.userId === userId
        );

        return visibleRequests.map((request) =>
            this.mapCorporateReplacementRequest(request as any)
        );
    }

    async listReplacementRequestsForOrder(orderId: string) {
        const requests = await db.query.corporateReplacementRequests.findMany({
            where: eq(corporateReplacementRequests.orderId, orderId),
            with: {
                order: true,
                replacementOrder: {
                    with: {
                        shipment: true,
                    },
                },
                rtoShipment: true,
                requestedBy: {
                    columns: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                reviewedBy: {
                    columns: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
            orderBy: [desc(corporateReplacementRequests.createdAt)],
        });

        return requests.map((request) =>
            this.mapCorporateReplacementRequest(request as any)
        );
    }

    async listAdminReplacementRequests() {
        const requests = await db.query.corporateReplacementRequests.findMany({
            with: {
                order: true,
                replacementOrder: {
                    with: {
                        shipment: true,
                    },
                },
                rtoShipment: true,
                requestedBy: {
                    columns: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                reviewedBy: {
                    columns: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
            orderBy: [desc(corporateReplacementRequests.createdAt)],
        });

        return requests.map((request) =>
            this.mapCorporateReplacementRequest(request as any)
        );
    }

    async createReplacementRequest(actorUserId: string, input: unknown) {
        const parsed = corporateReplacementRequestInputSchema.parse(input);
        const order = await db.query.corporateOrders.findFirst({
            where: eq(corporateOrders.id, parsed.orderId),
        });

        if (!order || order.userId !== actorUserId) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Corporate order not found",
            });
        }

        if (parsed.requestedQuantity > order.quantity) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Replacement quantity cannot exceed ordered quantity",
            });
        }

        const existingOpenRequest =
            await db.query.corporateReplacementRequests.findFirst({
                where: and(
                    eq(corporateReplacementRequests.orderId, order.id),
                    eq(corporateReplacementRequests.status, "requested")
                ),
            });

        if (existingOpenRequest) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                    "A replacement request is already pending for this order",
            });
        }

        const created = await db
            .insert(corporateReplacementRequests)
            .values({
                orderId: order.id,
                requestedByUserId: actorUserId,
                requestedQuantity: parsed.requestedQuantity,
                reasonCode: parsed.reasonCode,
                reasonDetails: parsed.reasonDetails ?? null,
                photos: parsed.photos,
                status: "requested",
            })
            .returning()
            .then((rows) => rows[0]);

        await db.insert(corporateDocuments).values(
            parsed.photos.map((photo, index) => ({
                entityType: "corporate_replacement_request",
                entityId: created.id,
                documentType: "replacement_evidence",
                fileName: photo.name,
                fileUrl: photo.url,
                mimeType: photo.type,
                fileSizeBytes: photo.size,
                uploadedByUserId: actorUserId,
                version: index + 1,
            }))
        );

        await corporateOrderQueries.createStatusHistory({
            corporateOrderId: order.id,
            fromStatus: order.status,
            toStatus: order.status,
            changedByUserId: actorUserId,
            note: `Replacement request submitted for ${parsed.requestedQuantity} unit(s)`,
            metadata: {
                replacementRequestId: created.id,
                reasonCode: parsed.reasonCode,
            },
        });

        await this.createEvent(
            "corporate_replacement_request",
            created.id,
            "CORPORATE_REPLACEMENT_REQUEST_CREATED",
            {
                orderId: order.id,
                publicOrderId: order.publicOrderId,
                requestedQuantity: parsed.requestedQuantity,
                reasonCode: parsed.reasonCode,
            },
            actorUserId
        );

        await this.notifyAdminReplacementRequestRaised({
            order: {
                id: order.id,
                publicOrderId: order.publicOrderId,
                companyName: order.companyName,
                contactPersonName: order.contactPersonName,
                emailAddress: order.emailAddress,
            },
            request: {
                id: created.id,
                requestedQuantity: created.requestedQuantity,
                reasonCode:
                    created.reasonCode as keyof typeof corporateReplacementReasonLabels,
                reasonDetails: created.reasonDetails,
            },
        });

        return this.mapCorporateReplacementRequest(created as any);
    }

    async reviewReplacementRequest(actorUserId: string, input: unknown) {
        const parsed = corporateReplacementReviewInputSchema.parse(input);
        const request = await db.query.corporateReplacementRequests.findFirst({
            where: eq(corporateReplacementRequests.id, parsed.requestId),
            with: {
                order: {
                    with: {
                        shipment: true,
                        brand: true,
                    },
                },
                rtoShipment: true,
            },
        });

        if (!request || !request.order) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Replacement request not found",
            });
        }

        if (request.status !== "requested") {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "This replacement request has already been reviewed",
            });
        }

        const reviewedAt = new Date().toISOString().slice(0, 10);
        let replacementOrderId: string | null = null;
        let corporateRtoShipmentId: string | null =
            request.rtoShipment?.id ?? null;
        let reverseAwbNumber: string | null =
            request.rtoShipment?.reverseAwbNumber ?? null;
        let latestRtoShipment = request.rtoShipment;
        let forwardOrderResult: {
            awbNumber: string | null;
        } | null = null;

        if (parsed.decision === "approved") {
            const createdRtoShipment =
                await this.createCorporateRtoShipmentRecord({
                    actorUserId,
                    order: request.order,
                    request,
                    existingRtoShipment: request.rtoShipment,
                });
            latestRtoShipment = createdRtoShipment;
            corporateRtoShipmentId = createdRtoShipment.id;
            reverseAwbNumber = createdRtoShipment.reverseAwbNumber ?? null;

            const replacementOrder =
                await this.createReplacementOrderFromCorporateOrder({
                    sourceOrder: request.order,
                    requestedQuantity: request.requestedQuantity,
                    replacementRequestId: request.id,
                });
            replacementOrderId = replacementOrder.id;

            const rawPayload =
                request.order.shipment?.rawPayload &&
                typeof request.order.shipment.rawPayload === "object" &&
                !Array.isArray(request.order.shipment.rawPayload)
                    ? (request.order.shipment.rawPayload as Record<
                          string,
                          unknown
                      >)
                    : null;
            const packageSelection =
                rawPayload?.packageSelection &&
                typeof rawPayload.packageSelection === "object" &&
                !Array.isArray(rawPayload.packageSelection)
                    ? (rawPayload.packageSelection as Record<string, unknown>)
                    : null;

            const lengthCm = Number(packageSelection?.lengthCm ?? 0);
            const widthCm = Number(packageSelection?.widthCm ?? 0);
            const heightCm = Number(packageSelection?.heightCm ?? 0);
            const weightGrams = Number(packageSelection?.weightGrams ?? 0);
            const selectedPackingTypeId =
                typeof packageSelection?.packingTypeId === "string"
                    ? packageSelection.packingTypeId
                    : null;
            const packageSource =
                packageSelection?.source === "custom" ? "custom" : "preset";

            if (
                lengthCm > 0 &&
                widthCm > 0 &&
                heightCm > 0 &&
                weightGrams > 0
            ) {
                try {
                    const forwardCreated = await this.createForwardOrder(
                        actorUserId,
                        {
                            orderId: replacementOrder.id,
                            packageSource,
                            selectedPackingTypeId,
                            lengthCm,
                            widthCm,
                            heightCm,
                            weightGrams,
                        }
                    );

                    forwardOrderResult = {
                        awbNumber: forwardCreated.awbNumber ?? null,
                    };
                } catch (error) {
                    console.error(
                        "Failed to auto-create Delhivery forward order for replacement",
                        error
                    );
                }
            }
        }

        const updated = await db
            .update(corporateReplacementRequests)
            .set({
                status: parsed.decision,
                adminNote:
                    parsed.decision === "approved" &&
                    replacementOrderId &&
                    !forwardOrderResult
                        ? [
                              parsed.adminNote?.trim(),
                              "Replacement order created. Delhivery reverse shipment was created, but the forward replacement order could not be auto-created from the source shipment package details.",
                          ]
                              .filter(Boolean)
                              .join(" ")
                        : (parsed.adminNote ?? null),
                reviewedByUserId: actorUserId,
                reviewedAt,
                replacementOrderId,
                updatedAt: new Date(),
            })
            .where(eq(corporateReplacementRequests.id, request.id))
            .returning()
            .then((rows) => rows[0]);

        await corporateOrderQueries.createStatusHistory({
            corporateOrderId: request.order.id,
            fromStatus: request.order.status,
            toStatus: request.order.status,
            changedByUserId: actorUserId,
            note:
                parsed.decision === "approved"
                    ? forwardOrderResult?.awbNumber
                        ? "Corporate replacement approved, Delhivery reverse shipment created, replacement order created, and Delhivery forward order generated"
                        : "Corporate replacement approved, Delhivery reverse shipment created, and replacement order created"
                    : "Corporate replacement request rejected",
            metadata: {
                replacementRequestId: request.id,
                replacementOrderId,
                corporateRtoShipmentId,
                reverseAwbNumber,
                replacementAwbNumber: forwardOrderResult?.awbNumber ?? null,
            },
        });

        await this.createEvent(
            "corporate_replacement_request",
            request.id,
            parsed.decision === "approved"
                ? "CORPORATE_REPLACEMENT_REQUEST_APPROVED"
                : "CORPORATE_REPLACEMENT_REQUEST_REJECTED",
            {
                orderId: request.order.id,
                publicOrderId: request.order.publicOrderId,
                replacementOrderId,
                corporateRtoShipmentId,
                reverseAwbNumber,
                replacementAwbNumber: forwardOrderResult?.awbNumber ?? null,
            },
            actorUserId
        );

        return this.mapCorporateReplacementRequest({
            ...updated,
            order: request.order,
            rtoShipment: latestRtoShipment,
        } as any);
    }

    async decideQuote(userId: string, input: unknown) {
        const parsed = corporateQuoteDecisionInputSchema.parse(input);
        const quote = await db.query.corporateQuotes.findFirst({
            where: eq(corporateQuotes.id, parsed.quoteId),
            with: {
                profile: true,
            },
        });

        if (!quote) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Quote not found",
            });
        }

        const profile = await this.getMyProfile(userId);
        if (!profile || profile.id !== quote.corporateProfileId) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "You do not have access to this quote",
            });
        }

        const status =
            parsed.decision === "approved"
                ? "approved"
                : parsed.decision === "rejected"
                  ? "rejected"
                  : "revision_requested";

        const updated = await db
            .update(corporateQuotes)
            .set({
                status,
                customerDecisionNotes: parsed.notes ?? null,
                updatedAt: new Date(),
            })
            .where(eq(corporateQuotes.id, quote.id))
            .returning()
            .then((rows) => rows[0]);

        if (quote.rfqId) {
            await db
                .update(corporateRfqs)
                .set({
                    status:
                        parsed.decision === "approved"
                            ? "quote_accepted"
                            : parsed.decision === "rejected"
                              ? "quote_rejected"
                              : "quote_preparation",
                    updatedAt: new Date(),
                })
                .where(eq(corporateRfqs.id, quote.rfqId));
        }

        await this.createEvent(
            "quote",
            updated.id,
            parsed.decision === "approved"
                ? "QUOTE_APPROVED"
                : parsed.decision === "rejected"
                  ? "QUOTE_REJECTED"
                  : "QUOTE_REVISION_REQUESTED",
            {
                quoteNumber: updated.quoteNumber,
                notes: parsed.notes ?? null,
            },
            userId
        );

        return updated;
    }

    async acceptQuoteAsAdmin(
        actorUserId: string,
        input: { quoteId: string; notes?: string | null }
    ) {
        const quote = await db.query.corporateQuotes.findFirst({
            where: eq(corporateQuotes.id, input.quoteId),
        });
        if (!quote) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Quote not found",
            });
        }
        if (quote.status === "approved") return quote;
        if (["rejected", "expired"].includes(quote.status)) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "A rejected or expired quote cannot be accepted",
            });
        }

        const decisionNote =
            input.notes?.trim() ||
            "Accepted by admin on the customer's behalf following phone or email confirmation";
        const updated = await db.transaction(async (tx) => {
            const accepted = await tx
                .update(corporateQuotes)
                .set({
                    status: "approved",
                    customerDecisionNotes: decisionNote,
                    updatedAt: new Date(),
                })
                .where(eq(corporateQuotes.id, quote.id))
                .returning()
                .then((rows) => rows[0]);
            if (quote.rfqId) {
                await tx
                    .update(corporateRfqs)
                    .set({ status: "quote_accepted", updatedAt: new Date() })
                    .where(eq(corporateRfqs.id, quote.rfqId));
            }
            return accepted;
        });
        await this.createEvent(
            "quote",
            quote.id,
            "QUOTE_APPROVED_BY_ADMIN",
            { quoteNumber: quote.quoteNumber, notes: decisionNote },
            actorUserId
        );
        await this.createAdminAuditLog(
            actorUserId,
            "quote_approved_on_customer_behalf",
            "quote",
            quote.id,
            { status: quote.status },
            { status: "approved", notes: decisionNote }
        );
        return updated;
    }

    async addQuoteRevision(actorUserId: string, input: unknown) {
        const parsed = corporateQuoteRevisionInputSchema.parse(input);
        const quote = await db.query.corporateQuotes.findFirst({
            where: eq(corporateQuotes.id, parsed.quoteId),
        });
        if (!quote) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Quote not found",
            });
        }

        const revisionCount = await db
            .select({ count: count() })
            .from(corporateQuoteRevisions)
            .where(eq(corporateQuoteRevisions.quoteId, quote.id))
            .then((rows) => rows[0]?.count ?? 0);

        const revision = await db
            .insert(corporateQuoteRevisions)
            .values({
                quoteId: quote.id,
                revisionNumber: revisionCount + 1,
                subtotalPaise: parsed.subtotalPaise,
                customizationCostPaise: parsed.customizationCostPaise,
                gstAmountPaise: parsed.gstAmountPaise,
                totalAmountPaise: parsed.totalAmountPaise,
                comments: parsed.comments ?? null,
                createdByUserId: actorUserId,
            })
            .returning()
            .then((rows) => rows[0]);

        await db
            .update(corporateQuotes)
            .set({
                subtotalPaise: parsed.subtotalPaise,
                customizationCostPaise: parsed.customizationCostPaise,
                gstAmountPaise: parsed.gstAmountPaise,
                totalAmountPaise: parsed.totalAmountPaise,
                status: "sent",
                customerDecisionNotes: null,
                updatedAt: new Date(),
            })
            .where(eq(corporateQuotes.id, quote.id));

        if (quote.rfqId) {
            await db
                .update(corporateRfqs)
                .set({
                    status: "quote_sent",
                    updatedAt: new Date(),
                })
                .where(eq(corporateRfqs.id, quote.rfqId));
        }

        await this.createEvent(
            "quote",
            quote.id,
            "QUOTE_REVISED",
            {
                revisionNumber: revision.revisionNumber,
                totalAmountPaise: revision.totalAmountPaise,
            },
            actorUserId
        );

        return revision;
    }

    async createPurchaseOrder(actorUserId: string, input: unknown) {
        const parsed = corporatePurchaseOrderInputSchema.parse(input);
        const quote = await db.query.corporateQuotes.findFirst({
            where: eq(corporateQuotes.id, parsed.quoteId),
            with: {
                profile: true,
            },
        });
        if (!quote) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Quote not found",
            });
        }

        const profile = await this.getMyProfile(actorUserId);
        if (!profile || profile.id !== quote.corporateProfileId) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message:
                    "You do not have access to create a purchase order for this quote",
            });
        }

        if (quote.status !== "approved") {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                    "Purchase orders can only be uploaded after the quote is approved",
            });
        }

        if (parsed.corporateProfileId !== quote.corporateProfileId) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                    "Purchase order buyer company does not match the approved quote",
            });
        }

        const validationSummary = this.buildPurchaseOrderValidationSummary(
            {
                companyName: parsed.companyName,
                poValuePaise: parsed.poValuePaise,
                deliveryDate: parsed.deliveryDate ?? null,
                productScopeSummary: parsed.productScopeSummary,
                authorizedSignatoryName: parsed.authorizedSignatoryName,
                authorizedSignatoryConfirmed:
                    parsed.authorizedSignatoryConfirmed,
                uploadedFileUrl: parsed.uploadedFile.url,
            },
            quote
        );
        const created = await db
            .insert(corporatePurchaseOrders)
            .values({
                quoteId: parsed.quoteId,
                corporateOrderId: parsed.corporateOrderId ?? null,
                corporateProfileId: parsed.corporateProfileId,
                companyName: parsed.companyName,
                poNumber: parsed.poNumber,
                poValuePaise: parsed.poValuePaise,
                poDate: parsed.poDate ?? null,
                deliveryDate: parsed.deliveryDate ?? null,
                productScopeSummary: parsed.productScopeSummary,
                authorizedSignatoryName: parsed.authorizedSignatoryName,
                authorizedSignatoryConfirmed:
                    parsed.authorizedSignatoryConfirmed,
                uploadedFileUrl: parsed.uploadedFile.url,
                validationIssues: validationSummary.issues,
                status: "po_review",
                reviewNotes: parsed.reviewNotes ?? null,
            })
            .returning()
            .then((rows) => rows[0]);

        await db.insert(corporateDocuments).values({
            entityType: "purchase_order",
            entityId: created.id,
            documentType: "po",
            fileName: parsed.uploadedFile.name,
            fileUrl: parsed.uploadedFile.url,
            mimeType: parsed.uploadedFile.type,
            fileSizeBytes: parsed.uploadedFile.size,
            uploadedByUserId: actorUserId,
            version: 1,
        });

        await this.createEvent(
            "purchase_order",
            created.id,
            "PURCHASE_ORDER_UPLOADED",
            {
                poNumber: created.poNumber,
                poValuePaise: created.poValuePaise,
                validationIssues: validationSummary.issues,
            },
            actorUserId
        );

        return created;
    }

    async createAdminPurchaseOrder(actorUserId: string, input: unknown) {
        const parsed = corporateAdminPurchaseOrderInputSchema.parse(input);
        const quote = await db.query.corporateQuotes.findFirst({
            where: eq(corporateQuotes.id, parsed.quoteId),
            with: { profile: true },
        });
        if (!quote?.profile) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message:
                    "The selected quotation or buyer profile was not found",
            });
        }
        if (quote.status !== "approved") {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                    "Only an approved quotation can be linked to a purchase order",
            });
        }
        const duplicate = await db.query.corporatePurchaseOrders.findFirst({
            where: eq(corporatePurchaseOrders.poNumber, parsed.poNumber),
        });
        if (duplicate) {
            throw new TRPCError({
                code: "CONFLICT",
                message: "This purchase order number already exists",
            });
        }
        const validationSummary = this.buildPurchaseOrderValidationSummary(
            {
                companyName: quote.profile.companyName,
                poValuePaise: parsed.poValuePaise,
                deliveryDate: parsed.deliveryDate,
                productScopeSummary: "As per approved quotation",
                authorizedSignatoryName: null,
                authorizedSignatoryConfirmed: false,
                uploadedFileUrl: parsed.uploadedFile.url,
            },
            quote
        );
        const created = await db.transaction(async (tx) => {
            const po = await tx
                .insert(corporatePurchaseOrders)
                .values({
                    quoteId: quote.id,
                    corporateProfileId: quote.corporateProfileId,
                    companyName: quote.profile.companyName,
                    poNumber: parsed.poNumber,
                    poValuePaise: parsed.poValuePaise,
                    poDate: parsed.poDate ?? null,
                    deliveryDate: parsed.deliveryDate,
                    productScopeSummary: "As per approved quotation",
                    authorizedSignatoryName: null,
                    authorizedSignatoryConfirmed: false,
                    uploadedFileUrl: parsed.uploadedFile.url,
                    validationIssues: validationSummary.issues,
                    status: "po_review",
                    reviewNotes:
                        parsed.reviewNotes ??
                        "Received by email and uploaded by admin",
                })
                .returning()
                .then((rows) => rows[0]);
            await tx.insert(corporateDocuments).values({
                entityType: "purchase_order",
                entityId: po.id,
                documentType: "po",
                fileName: parsed.uploadedFile.name,
                fileUrl: parsed.uploadedFile.url,
                fileSizeBytes: parsed.uploadedFile.size,
                mimeType: parsed.uploadedFile.type,
                uploadedByUserId: actorUserId,
                version: 1,
            });
            return po;
        });
        await this.createEvent(
            "purchase_order",
            created.id,
            "PURCHASE_ORDER_UPLOADED_BY_ADMIN",
            {
                quoteId: quote.id,
                poNumber: created.poNumber,
                validationIssues: validationSummary.issues,
            },
            actorUserId
        );
        return { ...created, validationSummary };
    }

    async createAdminPaymentRequest(actorUserId: string, input: unknown) {
        corporateAdminPaymentRequestInputSchema.parse(input);
        return corporatePaymentRequestService.create(actorUserId, input);
    }

    async recordAdminOfflinePayment(actorUserId: string, input: unknown) {
        corporateAdminOfflinePaymentInputSchema.parse(input);
        return corporatePaymentRequestService.recordOffline(actorUserId, input);
    }

    async reviewPurchaseOrder(actorUserId: string, input: unknown) {
        const parsed = corporatePurchaseOrderReviewInputSchema.parse(input);
        const purchaseOrder = await db.query.corporatePurchaseOrders.findFirst({
            where: eq(corporatePurchaseOrders.id, parsed.purchaseOrderId),
        });
        if (!purchaseOrder) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Purchase order not found",
            });
        }
        const quote = purchaseOrder.quoteId
            ? await db.query.corporateQuotes.findFirst({
                  where: eq(corporateQuotes.id, purchaseOrder.quoteId),
                  with: {
                      profile: true,
                  },
              })
            : null;

        const computedValidationSummary =
            this.buildPurchaseOrderValidationSummary(
                {
                    companyName: purchaseOrder.companyName ?? null,
                    poValuePaise: purchaseOrder.poValuePaise,
                    deliveryDate: purchaseOrder.deliveryDate ?? null,
                    productScopeSummary:
                        purchaseOrder.productScopeSummary ?? null,
                    authorizedSignatoryName:
                        purchaseOrder.authorizedSignatoryName ?? null,
                    authorizedSignatoryConfirmed:
                        purchaseOrder.authorizedSignatoryConfirmed,
                    uploadedFileUrl: purchaseOrder.uploadedFileUrl ?? null,
                },
                quote
            );
        const validationSummary = {
            ...computedValidationSummary,
            ...(parsed.validationSummary ?? {}),
            issues: computedValidationSummary.issues,
        };

        if (parsed.status === "po_accepted") {
            const failedChecks = [
                validationSummary.companyNameMatches,
                validationSummary.orderValueMatches,
                validationSummary.deliveryDateFeasible,
            ].filter((item) => !item).length;

            if (failedChecks > 0) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message:
                        "Purchase order cannot be accepted until all validation checks pass",
                });
            }

            if (parsed.orderSetup) {
                const allocatedQuantity = Object.values(
                    parsed.orderSetup.sizeBreakdown
                ).reduce((sum, value) => sum + value, 0);
                if (!quote || allocatedQuantity !== quote.quantity) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: quote
                            ? `Employee size allocation must total exactly ${quote.quantity} units`
                            : "A linked quote is required to validate employee sizes",
                    });
                }
            }
        }

        let createdOrderId = purchaseOrder.corporateOrderId ?? null;
        if (
            parsed.status === "po_accepted" &&
            !purchaseOrder.corporateOrderId
        ) {
            if (!quote) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message:
                        "A linked quote is required before approving the purchase order",
                });
            }

            const createdOrder = await this.createCorporateOrderFromQuote(
                quote as any,
                {
                    sourceType: "purchase_order",
                    poNumber: purchaseOrder.poNumber,
                    productScopeSummary: purchaseOrder.productScopeSummary,
                    customerNotes:
                        "Created from enterprise purchase order approval",
                    internalNotes: `Created from ${purchaseOrder.poNumber} | quote:${quote.id}`,
                    orderSetup: parsed.orderSetup,
                }
            );
            createdOrderId = createdOrder.id;
        }

        const updated = await db
            .update(corporatePurchaseOrders)
            .set({
                corporateOrderId: createdOrderId,
                status: parsed.status,
                reviewNotes: parsed.reviewNotes ?? null,
                validationIssues:
                    parsed.status === "po_accepted"
                        ? []
                        : validationSummary.issues,
                approvedByUserId:
                    parsed.status === "po_accepted" ? actorUserId : null,
                approvedAt:
                    parsed.status === "po_accepted"
                        ? new Date().toISOString().slice(0, 10)
                        : null,
                updatedAt: new Date(),
            })
            .where(eq(corporatePurchaseOrders.id, purchaseOrder.id))
            .returning()
            .then((rows) => rows[0]);

        await this.createEvent(
            "purchase_order",
            updated.id,
            "PURCHASE_ORDER_REVIEWED",
            {
                status: updated.status,
                reviewNotes: updated.reviewNotes,
                validationSummary,
                corporateOrderId: updated.corporateOrderId,
            },
            actorUserId
        );

        await this.createAdminAuditLog(
            actorUserId,
            "PURCHASE_ORDER_REVIEWED",
            "purchase_order",
            updated.id,
            {
                previousStatus: purchaseOrder.status,
                previousReviewNotes: purchaseOrder.reviewNotes,
            },
            {
                nextStatus: updated.status,
                reviewNotes: updated.reviewNotes,
                validationIssues: updated.validationIssues,
            }
        );

        return updated;
    }

    async createOrderFromApprovedQuote(actorUserId: string, input: unknown) {
        const parsed = corporateApprovedQuoteOrderInputSchema.parse(input);
        const quote = await db.query.corporateQuotes.findFirst({
            where: eq(corporateQuotes.id, parsed.quoteId),
            with: {
                profile: true,
            },
        });

        if (!quote) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Quote not found",
            });
        }

        if (quote.status !== "approved") {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                    "Only approved quotes can be moved into order processing",
            });
        }

        const purchaseOrder = await db.query.corporatePurchaseOrders.findFirst({
            where: eq(corporatePurchaseOrders.quoteId, quote.id),
            orderBy: [desc(corporatePurchaseOrders.createdAt)],
        });

        if (purchaseOrder) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                    "This quote already has a purchase order workflow. Continue from the purchase order queue.",
            });
        }

        const existingOrder = await this.findExistingOrderForQuote(quote.id);
        if (existingOrder) {
            return existingOrder;
        }

        const createdOrder = await this.createCorporateOrderFromQuote(quote, {
            sourceType: "approved_quote",
            productScopeSummary: `${quote.quantity} approved unit(s) from ${quote.quoteNumber}`,
            customerNotes:
                "Created from approved corporate quote. Customer did not require a purchase order.",
            internalNotes: `Created from approved quote ${quote.quoteNumber} | quote:${quote.id}`,
        });

        await this.createEvent(
            "corporate_order",
            createdOrder.id,
            "CORPORATE_ORDER_CREATED_FROM_APPROVED_QUOTE",
            {
                quoteId: quote.id,
                quoteNumber: quote.quoteNumber,
                publicOrderId: createdOrder.publicOrderId,
            },
            actorUserId
        );

        await this.createAdminAuditLog(
            actorUserId,
            "CORPORATE_ORDER_CREATED_FROM_APPROVED_QUOTE",
            "quote",
            quote.id,
            {
                previousStatus: quote.status,
            },
            {
                publicOrderId: createdOrder.publicOrderId,
                corporateOrderId: createdOrder.id,
            }
        );

        return createdOrder;
    }

    async createTask(actorUserId: string, input: unknown) {
        const parsed = corporateTaskInputSchema.parse(input);
        const created = await db
            .insert(corporateTasks)
            .values({
                taskType: parsed.taskType,
                entityType: parsed.entityType,
                entityId: parsed.entityId,
                assignedToUserId: parsed.assignedToUserId ?? null,
                dueDate: parsed.dueDate ?? null,
                priority: parsed.priority,
                notes: parsed.notes ?? null,
            })
            .returning()
            .then((rows) => rows[0]);

        await this.createEvent(
            "task",
            created.id,
            "TASK_CREATED",
            {
                taskType: created.taskType,
                entityType: created.entityType,
                entityId: created.entityId,
            },
            actorUserId
        );

        return created;
    }

    async saveShipment(actorUserId: string, input: unknown) {
        const parsed = corporateShipmentInputSchema.parse(input);
        const order = await db.query.corporateOrders.findFirst({
            where: eq(corporateOrders.id, parsed.orderId),
        });

        if (!order) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Corporate order not found",
            });
        }

        const existing = await db.query.corporateShipments.findFirst({
            where: eq(corporateShipments.orderId, parsed.orderId),
        });

        const payload = {
            courierName: parsed.courierName ?? null,
            trackingNumber: parsed.trackingNumber ?? null,
            awbNumber: parsed.awbNumber ?? null,
            trackingUrl: parsed.trackingUrl ?? null,
            dispatchDate: parsed.dispatchDate ?? null,
            deliveryDate: parsed.deliveryDate ?? null,
            status: parsed.status,
            provider: parsed.provider,
            updatedAt: new Date(),
        };

        const saved = existing
            ? await db
                  .update(corporateShipments)
                  .set(payload)
                  .where(eq(corporateShipments.id, existing.id))
                  .returning()
                  .then((rows) => rows[0])
            : await db
                  .insert(corporateShipments)
                  .values({
                      orderId: parsed.orderId,
                      ...payload,
                  })
                  .returning()
                  .then((rows) => rows[0]);

        const nextOrderStatus =
            saved.status === "delivered"
                ? "delivered"
                : saved.status === "dispatched" || saved.status === "in_transit"
                  ? "dispatched"
                  : saved.status === "ready"
                    ? "ready_for_dispatch"
                    : null;

        if (nextOrderStatus && order.status !== nextOrderStatus) {
            try {
                await corporateOrderService.updateStatus({
                    corporateOrderId: order.id,
                    toStatus: nextOrderStatus,
                    changedByUserId: actorUserId,
                    note: `Shipment updated to ${convertValueToLabel(saved.status)}`,
                    metadata: {
                        source: "shipment_panel",
                        shipmentId: saved.id,
                        provider: saved.provider,
                        trackingNumber: saved.trackingNumber,
                    },
                });
            } catch (error) {
                if (existing) {
                    await db
                        .update(corporateShipments)
                        .set({
                            courierName: existing.courierName,
                            trackingNumber: existing.trackingNumber,
                            awbNumber: existing.awbNumber,
                            trackingUrl: existing.trackingUrl,
                            dispatchDate: existing.dispatchDate,
                            deliveryDate: existing.deliveryDate,
                            status: existing.status,
                            provider: existing.provider,
                            rawPayload: existing.rawPayload,
                            updatedAt: existing.updatedAt,
                        })
                        .where(eq(corporateShipments.id, existing.id));
                } else {
                    await db
                        .delete(corporateShipments)
                        .where(eq(corporateShipments.id, saved.id));
                }
                throw error;
            }
        }

        await this.createEvent(
            "shipment",
            saved.id,
            "SHIPMENT_UPDATED",
            {
                orderId: parsed.orderId,
                status: saved.status,
                trackingNumber: saved.trackingNumber,
            },
            actorUserId
        );

        return saved;
    }

    async updateConsigneeAddress(actorUserId: string, input: unknown) {
        const parsed = corporateUpdateConsigneeAddressInputSchema.parse(input);
        const order = await db.query.corporateOrders.findFirst({
            where: eq(corporateOrders.id, parsed.orderId),
        });

        if (!order) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Corporate order not found",
            });
        }

        const currentCompanySnapshot = (order.companySnapshot ?? {}) as Record<
            string,
            unknown
        >;
        const deliveryState =
            parsed.deliveryState !== undefined
                ? parsed.deliveryState
                : (currentCompanySnapshot.deliveryState as string | undefined);
        const updatedCompanySnapshot = {
            ...currentCompanySnapshot,
            contactPersonName: parsed.contactPersonName,
            mobileNumber: parsed.mobileNumber,
            deliveryAddress: parsed.deliveryAddress,
            deliveryCity: parsed.deliveryCity,
            deliveryState,
            deliveryPincode: parsed.deliveryPincode,
            deliveryCountry: parsed.deliveryCountry,
            deliveryAddressFormatted: formatCorporateDeliveryAddress({
                deliveryAddress: parsed.deliveryAddress,
                deliveryCity: parsed.deliveryCity,
                deliveryState: deliveryState ?? undefined,
                deliveryPincode: parsed.deliveryPincode,
                deliveryCountry: parsed.deliveryCountry,
            }),
        };

        const [updatedOrder] = await db
            .update(corporateOrders)
            .set({
                contactPersonName: parsed.contactPersonName,
                mobileNumber: parsed.mobileNumber,
                deliveryAddress: parsed.deliveryAddress,
                deliveryCity: parsed.deliveryCity,
                deliveryPincode: parsed.deliveryPincode,
                deliveryCountry: parsed.deliveryCountry,
                companySnapshot: updatedCompanySnapshot,
                updatedAt: new Date(),
            })
            .where(eq(corporateOrders.id, order.id))
            .returning();

        return updatedOrder;
    }

    async createForwardOrder(actorUserId: string, input: unknown) {
        const parsed = corporateForwardOrderInputSchema.parse(input);
        const order = await db.query.corporateOrders.findFirst({
            where: eq(corporateOrders.id, parsed.orderId),
            with: {
                brand: true,
                shipment: true,
            },
        });

        if (!order) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Corporate order not found",
            });
        }

        if (!order.brand?.id || !order.brand?.name) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Assign a brand before creating a forward order",
            });
        }

        let contactPersonName = order.contactPersonName;
        let mobileNumber = order.mobileNumber;
        let deliveryAddress = order.deliveryAddress;
        let deliveryCity = order.deliveryCity;
        let deliveryPincode = order.deliveryPincode;
        let deliveryCountry = order.deliveryCountry;
        let deliveryState =
            ((order.companySnapshot as Record<string, unknown> | undefined)
                ?.deliveryState as string | undefined) ?? "";

        if (parsed.consignee) {
            contactPersonName = parsed.consignee.contactPersonName;
            mobileNumber = parsed.consignee.mobileNumber;
            deliveryAddress = parsed.consignee.deliveryAddress;
            deliveryCity = parsed.consignee.deliveryCity;
            deliveryState = parsed.consignee.deliveryState || deliveryState;
            deliveryPincode = parsed.consignee.deliveryPincode;
            deliveryCountry = parsed.consignee.deliveryCountry;

            const currentCompanySnapshot = (order.companySnapshot ??
                {}) as Record<string, unknown>;
            const updatedCompanySnapshot = {
                ...currentCompanySnapshot,
                contactPersonName,
                mobileNumber,
                deliveryAddress,
                deliveryCity,
                deliveryState,
                deliveryPincode,
                deliveryCountry,
                deliveryAddressFormatted: formatCorporateDeliveryAddress({
                    deliveryAddress,
                    deliveryCity,
                    deliveryState,
                    deliveryPincode,
                    deliveryCountry,
                }),
            };

            await db
                .update(corporateOrders)
                .set({
                    contactPersonName,
                    mobileNumber,
                    deliveryAddress,
                    deliveryCity,
                    deliveryPincode,
                    deliveryCountry,
                    companySnapshot: updatedCompanySnapshot,
                    updatedAt: new Date(),
                })
                .where(eq(corporateOrders.id, order.id));
        }

        if (
            !isCorporateDeliveryAddressValid({
                contactPersonName,
                mobileNumber,
                deliveryAddress,
                deliveryCity,
                deliveryPincode,
                deliveryCountry,
            })
        ) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                    "Please provide a valid consignee address, contact person, phone number, and a 6-digit Indian PIN code before creating a Delhivery shipment.",
            });
        }

        const pickupLocation = generatePickupLocationCode({
            brandId: order.brand.id,
            brandName: order.brand.name,
        });
        const productSnapshot = (order.productConfigSnapshot ?? {}) as Record<
            string,
            unknown
        >;
        const productType =
            typeof productSnapshot.productType === "object" &&
            productSnapshot.productType &&
            !Array.isArray(productSnapshot.productType) &&
            typeof (productSnapshot.productType as Record<string, unknown>)
                .name === "string"
                ? ((productSnapshot.productType as Record<string, unknown>)
                      .name as string)
                : "Corporate apparel";
        const selectedPackingType = parsed.selectedPackingTypeId
            ? await db.query.packingTypes.findFirst({
                  where: eq(packingTypes.id, parsed.selectedPackingTypeId),
              })
            : null;

        const forwardPayload = {
            format: "json" as const,
            pickup_location: {
                name: pickupLocation,
            },
            shipments: [
                {
                    name: contactPersonName,
                    add: deliveryAddress,
                    pin: deliveryPincode,
                    city: deliveryCity,
                    state: deliveryState || undefined,
                    country: deliveryCountry,
                    phone: mobileNumber,
                    order: order.publicOrderId,
                    payment_mode: "Prepaid" as const,
                    shipping_mode: "Surface" as const,
                    quantity: String(order.quantity),
                    total_amount: Number((order.totalPaise / 100).toFixed(2)),
                    products_desc: productType,
                    weight: parsed.weightGrams,
                    shipment_length: parsed.lengthCm,
                    shipment_width: parsed.widthCm,
                    shipment_height: parsed.heightCm,
                },
            ],
        };

        const result = await createOrder(forwardPayload);

        if (!result.success) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                    typeof result.error === "string"
                        ? result.error
                        : "Failed to create Delhivery forward order",
            });
        }

        const rawData = result.data as Record<string, unknown>;
        const packageData = Array.isArray(rawData.packages)
            ? rawData.packages[0]
            : Array.isArray(rawData.package)
              ? rawData.package[0]
              : null;
        const packageRecord =
            packageData &&
            typeof packageData === "object" &&
            !Array.isArray(packageData)
                ? (packageData as Record<string, unknown>)
                : {};
        const waybill =
            typeof packageRecord.waybill === "string" &&
            packageRecord.waybill.trim()
                ? packageRecord.waybill.trim()
                : typeof packageRecord.awb === "string" &&
                    packageRecord.awb.trim()
                  ? packageRecord.awb.trim()
                  : typeof rawData.waybill === "string" &&
                      rawData.waybill.trim()
                    ? rawData.waybill.trim()
                    : typeof rawData.awb === "string" && rawData.awb.trim()
                      ? rawData.awb.trim()
                      : null;

        const packageRemarks = Array.isArray(packageRecord.remarks)
            ? packageRecord.remarks.join(", ")
            : typeof packageRecord.remarks === "string"
              ? packageRecord.remarks
              : typeof rawData.rmk === "string"
                ? rawData.rmk
                : null;

        const isFailed =
            !waybill ||
            packageRecord.status === "Fail" ||
            rawData.success === false;

        const existingShipment = await db.query.corporateShipments.findFirst({
            where: eq(corporateShipments.orderId, order.id),
        });
        const shipmentPayload = {
            courierName: "Delhivery",
            trackingNumber: waybill,
            awbNumber: waybill,
            trackingUrl: waybill
                ? `${process.env.DELHIVERY_BASE_URL?.trim() || "https://track.delhivery.com"}/tracking/package/${waybill}`
                : null,
            dispatchDate: null,
            deliveryDate: null,
            status: (isFailed ? "ready" : "ready") as "ready",
            provider: "delhivery",
            rawPayload: {
                ...rawData,
                packageSelection: {
                    source: parsed.packageSource,
                    packingTypeId: parsed.selectedPackingTypeId ?? null,
                    packingTypeName: selectedPackingType?.name ?? null,
                    lengthCm: parsed.lengthCm,
                    widthCm: parsed.widthCm,
                    heightCm: parsed.heightCm,
                    weightGrams: parsed.weightGrams,
                    volumetricWeightGrams: Math.round(
                        (parsed.lengthCm * parsed.widthCm * parsed.heightCm) / 5
                    ),
                },
            },
            updatedAt: new Date(),
        };

        const shipment = existingShipment
            ? await db
                  .update(corporateShipments)
                  .set(shipmentPayload)
                  .where(eq(corporateShipments.id, existingShipment.id))
                  .returning()
                  .then((rows) => rows[0])
            : await db
                  .insert(corporateShipments)
                  .values({
                      orderId: order.id,
                      ...shipmentPayload,
                  })
                  .returning()
                  .then((rows) => rows[0]);

        if (isFailed) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: packageRemarks
                    ? `Delhivery forward order creation failed: ${packageRemarks}`
                    : "Delhivery could not generate a waybill for this shipment. Please verify the consignee PIN code and package dimensions.",
            });
        }

        if (order.status !== "ready_for_dispatch") {
            await corporateOrderService.updateStatus({
                corporateOrderId: order.id,
                toStatus: "ready_for_dispatch",
                changedByUserId: actorUserId,
                note: "Delhivery forward order created",
                metadata: {
                    source: "corporate_orders_table",
                    shipmentId: shipment.id,
                    awbNumber: waybill,
                },
            });
        }

        await this.createEvent(
            "shipment",
            shipment.id,
            "FORWARD_ORDER_CREATED",
            {
                orderId: order.id,
                awbNumber: waybill,
                provider: "delhivery",
            },
            actorUserId
        );

        return {
            success: true,
            shipment,
            awbNumber: waybill,
            pickupLocation,
            rawPayload: rawData,
        };
    }

    async scheduleCorporatePickup(actorUserId: string, input: unknown) {
        const parsed = corporatePickupScheduleInputSchema.parse(input);
        const order = await db.query.corporateOrders.findFirst({
            where: eq(corporateOrders.id, parsed.orderId),
            with: {
                brand: true,
                shipment: true,
            },
        });

        if (!order || !order.shipment) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Create the forward order first",
            });
        }

        if (!order.brand?.id || !order.brand?.name) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Brand pickup location is not available",
            });
        }

        if (!order.shipment.awbNumber) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "AWB number is missing for this shipment",
            });
        }

        const pickupLocation = generatePickupLocationCode({
            brandId: order.brand.id,
            brandName: order.brand.name,
        });
        const pickupResponse = await schedulePickup({
            pickup_location: pickupLocation,
            pickup_date: parsed.pickupDate,
            pickup_time: parsed.pickupTime,
            // Delhivery pickup requests are raised for the warehouse slot,
            // and this corporate flow currently creates one manifested shipment/AWB.
            expected_package_count: 1,
        });
        const pickupResponseRecord =
            pickupResponse &&
            typeof pickupResponse === "object" &&
            !Array.isArray(pickupResponse)
                ? (pickupResponse as Record<string, unknown>)
                : {};
        const pickupId =
            typeof pickupResponseRecord.pickup_id === "number" ||
            typeof pickupResponseRecord.pickup_id === "string"
                ? String(pickupResponseRecord.pickup_id)
                : null;
        const pickupAccepted =
            pickupResponseRecord.status === true ||
            pickupResponseRecord.success === true ||
            pickupResponseRecord.pr_exist === true ||
            pickupId !== null;

        if (!pickupAccepted) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                    typeof pickupResponseRecord.message === "string"
                        ? pickupResponseRecord.message
                        : typeof pickupResponseRecord.error === "object" &&
                            pickupResponseRecord.error &&
                            !Array.isArray(pickupResponseRecord.error) &&
                            typeof (
                                pickupResponseRecord.error as Record<
                                    string,
                                    unknown
                                >
                            ).message === "string"
                          ? ((
                                pickupResponseRecord.error as Record<
                                    string,
                                    unknown
                                >
                            ).message as string)
                          : "Delhivery pickup could not be scheduled",
            });
        }
        const pickupAlreadyExists = pickupResponseRecord.pr_exist === true;

        const rawPayload = {
            ...(order.shipment.rawPayload ?? {}),
            pickupSchedule: pickupResponse,
            pickupRequest: {
                corporateOrderId: order.id,
                corporatePublicOrderId: order.publicOrderId,
                awbNumber: order.shipment.awbNumber,
                pickupId,
                pickupDate: parsed.pickupDate,
                pickupTime: parsed.pickupTime,
                alreadyExists: pickupAlreadyExists,
                scheduledAt: new Date().toISOString(),
            },
        };

        const shipment = await db
            .update(corporateShipments)
            .set({
                dispatchDate: parsed.pickupDate,
                rawPayload,
                updatedAt: new Date(),
            })
            .where(eq(corporateShipments.id, order.shipment.id))
            .returning()
            .then((rows) => rows[0]);

        await corporateOrderQueries.createStatusHistory({
            corporateOrderId: order.id,
            fromStatus: order.status,
            toStatus: order.status,
            changedByUserId: actorUserId,
            note: pickupAlreadyExists
                ? "Delhivery pickup request already existed for this slot"
                : "Delhivery pickup scheduled",
            metadata: {
                source: "corporate_orders_table",
                shipmentId: shipment.id,
                pickupDate: parsed.pickupDate,
                pickupTime: parsed.pickupTime,
                pickupId,
                pickupAlreadyExists,
            },
        });

        await this.createEvent(
            "shipment",
            shipment.id,
            "PICKUP_SCHEDULED",
            {
                orderId: order.id,
                publicOrderId: order.publicOrderId,
                awbNumber: order.shipment.awbNumber,
                pickupDate: parsed.pickupDate,
                pickupTime: parsed.pickupTime,
                pickupId,
                pickupAlreadyExists,
            },
            actorUserId
        );

        return {
            success: true,
            shipment,
            pickupLocation,
            pickupResponse,
            pickupId,
            pickupAlreadyExists,
            orderId: order.id,
            publicOrderId: order.publicOrderId,
            awbNumber: order.shipment.awbNumber,
        };
    }

    async submitQc(actorUserId: string, input: unknown) {
        const parsed = corporateQcSubmissionInputSchema.parse(input);
        const order = await db.query.corporateOrders.findFirst({
            where: eq(corporateOrders.id, parsed.orderId),
            columns: { id: true, status: true },
        });
        if (!order) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Corporate order not found",
            });
        }
        if (!["quality_check", "in_production"].includes(order.status)) {
            throw new TRPCError({
                code: "PRECONDITION_FAILED",
                message:
                    "QC evidence can only be submitted during production QC",
            });
        }
        for (const image of parsed.images) {
            let parsedUrl: URL;
            try {
                parsedUrl = new URL(image.url);
            } catch {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "QC evidence URL is invalid",
                });
            }
            if (!["http:", "https:"].includes(parsedUrl.protocol)) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "QC evidence URL must use HTTP or HTTPS",
                });
            }
        }
        const created = await db.transaction(async (tx) => {
            const submission = await tx
                .insert(corporateQcSubmissions)
                .values({
                    orderId: parsed.orderId,
                    submittedByUserId: actorUserId,
                    status: "submitted",
                    remarks: parsed.remarks ?? null,
                    sampleCoveragePercent: parsed.sampleCoveragePercent ?? null,
                    submittedAt: new Date().toISOString().slice(0, 10),
                })
                .returning()
                .then((rows) => rows[0]);
            await tx.insert(corporateQcImages).values(
                parsed.images.map((image) => ({
                    qcSubmissionId: submission.id,
                    imageUrl: image.url,
                    imageType: image.type,
                }))
            );
            await tx.insert(corporateDocuments).values(
                parsed.images.map((image, index) => ({
                    entityType: "qc_submission",
                    entityId: submission.id,
                    documentType: "qc_image",
                    fileName: image.name,
                    fileUrl: image.url,
                    mimeType: image.type,
                    fileSizeBytes: image.size,
                    uploadedByUserId: actorUserId,
                    version: index + 1,
                }))
            );
            return submission;
        });

        await this.createEvent(
            "qc_submission",
            created.id,
            "QC_SUBMITTED",
            {
                orderId: parsed.orderId,
                imageCount: parsed.images.length,
            },
            actorUserId
        );

        return created;
    }

    async reviewQc(actorUserId: string, input: unknown) {
        const parsed = corporateQcReviewInputSchema.parse(input);
        const submission = await db.query.corporateQcSubmissions.findFirst({
            where: eq(corporateQcSubmissions.id, parsed.submissionId),
            with: { order: true },
        });
        if (!submission) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "QC submission not found",
            });
        }
        if (submission.status !== "submitted") {
            if (submission.status === parsed.decision) return submission;
            throw new TRPCError({
                code: "CONFLICT",
                message: "QC submission has already been finalized",
            });
        }

        const reviewedAt = new Date();
        const updated = await db
            .update(corporateQcSubmissions)
            .set({
                status: parsed.decision,
                reviewedByUserId: actorUserId,
                reviewedAt,
                reviewNotes: parsed.reviewNotes ?? null,
            })
            .where(
                and(
                    eq(corporateQcSubmissions.id, parsed.submissionId),
                    eq(corporateQcSubmissions.status, "submitted")
                )
            )
            .returning()
            .then((rows) => rows[0]);

        if (!updated) {
            throw new TRPCError({
                code: "CONFLICT",
                message: "QC submission was reviewed by another request",
            });
        }

        await this.createEvent(
            "qc_submission",
            updated.id,
            `QC_${parsed.decision.toUpperCase()}`,
            {
                orderId: updated.orderId,
                decision: parsed.decision,
                reviewedAt: reviewedAt.toISOString(),
            },
            actorUserId
        );

        return updated;
    }

    async recordPayment(actorUserId: string, input: unknown) {
        const parsed = corporatePaymentInputSchema.parse(input);
        const created = await db
            .insert(corporatePayments)
            .values({
                orderId: parsed.orderId ?? null,
                quoteId: parsed.quoteId ?? null,
                paymentType: parsed.paymentType,
                paymentMode: parsed.paymentMode,
                amountPaise: parsed.amountPaise,
                paymentReference: parsed.paymentReference ?? null,
                paymentStatus: parsed.paymentStatus,
                paymentDate: parsed.paymentDate ?? null,
                metadata: {
                    recordedByUserId: actorUserId,
                },
            })
            .returning()
            .then((rows) => rows[0]);

        await this.createEvent(
            "payment",
            created.id,
            "PAYMENT_RECORDED",
            {
                orderId: created.orderId,
                quoteId: created.quoteId,
                paymentType: created.paymentType,
                paymentStatus: created.paymentStatus,
            },
            actorUserId
        );

        if (
            created.orderId &&
            created.amountPaise > 0 &&
            ["advance", "partial", "manual"].includes(created.paymentType) &&
            ["payment_success", "payment_partial"].includes(
                created.paymentStatus
            )
        ) {
            const [order, successfulPayments] = await Promise.all([
                db.query.corporateOrders.findFirst({
                    where: eq(corporateOrders.id, created.orderId),
                }),
                db.query.corporatePayments.findMany({
                    where: eq(corporatePayments.orderId, created.orderId),
                }),
            ]);
            if (order) {
                const totalPaidPaise = Math.min(
                    order.totalPaise,
                    successfulPayments
                        .filter(
                            (payment) =>
                                payment.paymentType !== "refund" &&
                                ["payment_success", "payment_partial"].includes(
                                    payment.paymentStatus
                                )
                        )
                        .reduce(
                            (total, payment) => total + payment.amountPaise,
                            0
                        )
                );
                const balanceDuePaise = Math.max(
                    0,
                    order.totalPaise - totalPaidPaise
                );
                await db
                    .update(corporateOrders)
                    .set({
                        advancePaidPaise: totalPaidPaise,
                        balanceDuePaise,
                        paymentStatus:
                            balanceDuePaise === 0 ? "paid" : "pending",
                        balancePaymentStatus:
                            balanceDuePaise === 0 ? "paid" : "pending",
                        updatedAt: new Date(),
                    })
                    .where(eq(corporateOrders.id, order.id));
            }
            await corporateDocumentService.ensureReceiptVoucher(
                created.orderId,
                created.id
            );
        }

        return created;
    }

    async issueProformaInvoice(actorUserId: string, input: unknown) {
        const parsed = corporateProformaInvoiceInputSchema.parse(input);
        const quote = await db.query.corporateQuotes.findFirst({
            where: eq(corporateQuotes.id, parsed.quoteId),
        });
        if (!quote) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Quote not found",
            });
        }
        const quoteHsn = quote.hsnCode
            ? await db.query.hsnMaster.findFirst({
                  where: and(
                      eq(hsnMaster.hsnCode, quote.hsnCode),
                      eq(hsnMaster.isActive, true)
                  ),
              })
            : null;
        try {
            requireCorporateTaxClassification({
                hsnCode: quoteHsn?.hsnCode,
                gstRateBps: quoteHsn?.gstRateBps,
                sourceId: quoteHsn?.id,
            });
        } catch {
            throw new TRPCError({
                code: "PRECONDITION_FAILED",
                message:
                    "An active HSN Master classification is required before issuing the proforma invoice",
            });
        }
        const existing = await db.query.corporateProformaInvoices.findFirst({
            where: and(
                eq(corporateProformaInvoices.quoteId, quote.id),
                eq(corporateProformaInvoices.status, "issued")
            ),
            orderBy: [desc(corporateProformaInvoices.createdAt)],
        });
        if (existing) return existing;

        const [settings, invoiceNumber] = await Promise.all([
            getCorporateDocumentSettings(),
            nextCorporateDocumentNumber("PI"),
        ]);
        const invoiceDate = new Date();
        const validUntil = quote.validUntil
            ? new Date(quote.validUntil)
            : new Date(invoiceDate);
        if (!quote.validUntil) {
            validUntil.setDate(
                validUntil.getDate() + settings.proformaValidityDays
            );
        }

        const created = await db
            .insert(corporateProformaInvoices)
            .values({
                invoiceNumber,
                quoteId: quote.id,
                customerId: quote.corporateProfileId,
                invoiceDate: invoiceDate.toISOString().slice(0, 10),
                validUntil: validUntil.toISOString().slice(0, 10),
                subtotalPaise:
                    quote.subtotalPaise + quote.customizationCostPaise,
                gstAmountPaise: quote.gstAmountPaise,
                totalAmountPaise: quote.totalAmountPaise,
                paymentTerms: settings.defaultPaymentTerms,
                termsAndConditions:
                    "This proforma invoice is not a tax invoice. Supply is subject to quote acceptance, receipt of the corporate purchase order, and payment confirmation.",
                status: "issued",
            })
            .returning()
            .then((rows) => rows[0]);

        await this.createEvent(
            "proforma_invoice",
            created.id,
            "PROFORMA_INVOICE_ISSUED",
            {
                invoiceNumber: created.invoiceNumber,
                quoteId: quote.id,
            },
            actorUserId
        );

        return created;
    }

    async issueTaxInvoice(actorUserId: string, input: unknown) {
        const parsed = corporateTaxInvoiceInputSchema.parse(input);
        const order = await db.query.corporateOrders.findFirst({
            where: eq(corporateOrders.id, parsed.orderId),
            with: {
                brand: true,
                quote: { with: { profile: true } },
            },
        });
        if (!order) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Order not found",
            });
        }

        if (!order.brand) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                    "Assign a supplier brand before issuing the tax invoice",
            });
        }
        if (
            ![
                "ready_for_dispatch",
                "dispatched",
                "delivered",
                "completed",
            ].includes(order.status)
        ) {
            throw new TRPCError({
                code: "PRECONDITION_FAILED",
                message:
                    "The Renivet customer tax invoice can be issued only at dispatch",
            });
        }
        const existingInvoice = await db.query.corporateTaxInvoices.findFirst({
            where: and(
                eq(corporateTaxInvoices.orderId, order.id),
                eq(corporateTaxInvoices.status, "issued")
            ),
            orderBy: [desc(corporateTaxInvoices.createdAt)],
        });
        if (existingInvoice) return existingInvoice;

        const orderHsnCode =
            order.quote?.hsnCode ??
            (typeof (order.pricingSnapshot as any)?.hsnCode === "string"
                ? (order.pricingSnapshot as any).hsnCode
                : null);
        const orderHsn = orderHsnCode
            ? await db.query.hsnMaster.findFirst({
                  where: and(
                      eq(hsnMaster.hsnCode, orderHsnCode),
                      eq(hsnMaster.isActive, true)
                  ),
              })
            : null;
        try {
            requireCorporateTaxClassification({
                hsnCode: orderHsn?.hsnCode,
                gstRateBps: orderHsn?.gstRateBps,
                sourceId: orderHsn?.id,
            });
        } catch {
            throw new TRPCError({
                code: "PRECONDITION_FAILED",
                message:
                    "An active HSN Master classification is required before issuing the tax invoice",
            });
        }

        const [
            settings,
            brandDetails,
            brandRecord,
            receiptVoucher,
            deliveryChallan,
            purchaseOrder,
        ] = await Promise.all([
            getCorporateDocumentSettings(),
            db.query.brandConfidentials.findFirst({
                where: eq(brandConfidentials.id, order.brandId),
            }),
            db.query.brands.findFirst({
                where: eq(brands.id, order.brandId),
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
        // If either GSTIN is unavailable, retain the existing intra-state split.
        // When both codes exist, use IGST for an inter-state supply.
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
            brandName: brandRecord?.name ?? order.brand?.name ?? "Brand",
            invoiceCode: brandRecord?.invoiceCode ?? order.brand?.invoiceCode,
            date: invoiceDate,
        });
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + settings.balanceDueDays);
        const created = await db
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
                bankDetailsSnapshot: settings
                    ? {
                          bankName: settings.bankName,
                          bankAccountName: settings.bankAccountName,
                          bankAccountNumber: settings.bankAccountNumber,
                          bankIfscCode: settings.bankIfscCode,
                          bankBranch: settings.bankBranch,
                      }
                    : null,
                eWayBillNumber: deliveryChallan?.eWayBillNumber ?? null,
                status: "issued",
            })
            .returning()
            .then((rows) => rows[0]);

        await this.createEvent(
            "tax_invoice",
            created.id,
            "TAX_INVOICE_ISSUED",
            {
                invoiceNumber: created.invoiceNumber,
                orderId: order.id,
            },
            actorUserId
        );

        return created;
    }

    async listAdminRfqs() {
        const rfqs = await db.query.corporateRfqs.findMany({
            with: {
                documents: true,
            },
            orderBy: [desc(corporateRfqs.createdAt)],
        });

        const missingProfileRfqs = rfqs.filter(
            (rfq) => !rfq.corporateProfileId && rfq.userId
        );

        if (!missingProfileRfqs.length) {
            return rfqs;
        }

        const profiles = await db.query.corporateProfiles.findMany({
            where: inArray(
                corporateProfiles.userId,
                Array.from(new Set(missingProfileRfqs.map((rfq) => rfq.userId)))
            ),
            orderBy: [desc(corporateProfiles.updatedAt)],
        });

        const profileByUserId = new Map<string, (typeof profiles)[number]>();
        for (const profile of profiles) {
            if (!profile.userId) continue;
            if (!profileByUserId.has(profile.userId)) {
                profileByUserId.set(profile.userId, profile);
            }
        }

        await Promise.all(
            missingProfileRfqs.map(async (rfq) => {
                const profile = profileByUserId.get(rfq.userId);
                if (!profile) return;

                await db
                    .update(corporateRfqs)
                    .set({
                        corporateProfileId: profile.id,
                        updatedAt: new Date(),
                    })
                    .where(eq(corporateRfqs.id, rfq.id));

                rfq.corporateProfileId = profile.id;
            })
        );

        return rfqs;
    }

    async listAdminQuotes() {
        return db.query.corporateQuotes.findMany({
            with: {
                profile: true,
                brand: true,
                revisions: true,
            },
            orderBy: [desc(corporateQuotes.createdAt)],
        });
    }

    async listAdminTasks() {
        return db.query.corporateTasks.findMany({
            orderBy: [desc(corporateTasks.createdAt)],
        });
    }

    async listAdminFinance() {
        const [payments, refunds, purchaseOrders, reports, quotes, orders] =
            await Promise.all([
                db.query.corporatePayments.findMany({
                    orderBy: [desc(corporatePayments.createdAt)],
                }),
                db.query.corporateRefunds.findMany({
                    orderBy: [desc(corporateRefunds.createdAt)],
                }),
                db.query.corporatePurchaseOrders.findMany({
                    orderBy: [desc(corporatePurchaseOrders.createdAt)],
                }),
                db.query.corporateReports.findMany({
                    orderBy: [desc(corporateReports.createdAt)],
                }),
                this.listAdminQuotes(),
                db.query.corporateOrders.findMany({
                    orderBy: [desc(corporateOrders.createdAt)],
                }),
            ]);

        const quoteIds = Array.from(
            new Set(purchaseOrders.map((item) => item.quoteId).filter(Boolean))
        ) as string[];
        const profileIds = Array.from(
            new Set(
                purchaseOrders
                    .map((item) => item.corporateProfileId)
                    .filter(Boolean)
            )
        ) as string[];

        const [poQuotes, poProfiles] = await Promise.all([
            quoteIds.length
                ? db.query.corporateQuotes.findMany({
                      where: inArray(corporateQuotes.id, quoteIds),
                      with: {
                          profile: true,
                          brand: true,
                      },
                  })
                : Promise.resolve([]),
            profileIds.length
                ? db.query.corporateProfiles.findMany({
                      where: inArray(corporateProfiles.id, profileIds),
                  })
                : Promise.resolve([]),
        ]);

        const quoteById = new Map(poQuotes.map((item) => [item.id, item]));
        const profileById = new Map(poProfiles.map((item) => [item.id, item]));

        const proformaInvoices = quotes.length
            ? await db.query.corporateProformaInvoices.findMany({
                  where: inArray(
                      corporateProformaInvoices.quoteId,
                      quotes.map((quote) => quote.id)
                  ),
                  orderBy: [desc(corporateProformaInvoices.createdAt)],
              })
            : [];
        const proformaByQuote = new Map(
            proformaInvoices
                .filter((invoice) => invoice.status === "issued")
                .map((invoice) => [invoice.quoteId, invoice])
        );
        const enrichedQuotes = quotes.map((quote) => ({
            ...quote,
            proformaInvoice: proformaByQuote.get(quote.id) ?? null,
        }));
        const paymentRequests =
            await corporatePaymentRequestService.listForOrders(
                orders.map((order) => order.id)
            );
        const receiptVouchers = orders.length
            ? await db.query.corporateReceiptVouchers.findMany({
                  where: inArray(
                      corporateReceiptVouchers.orderId,
                      orders.map((order) => order.id)
                  ),
                  orderBy: [desc(corporateReceiptVouchers.createdAt)],
              })
            : [];
        const latestRequestByOrder = new Map<
            string,
            (typeof paymentRequests)[number]
        >();
        for (const request of paymentRequests) {
            if (!latestRequestByOrder.has(request.orderId))
                latestRequestByOrder.set(request.orderId, request);
        }
        const latestReceiptByOrder = new Map<
            string,
            (typeof receiptVouchers)[number]
        >();
        for (const receipt of receiptVouchers) {
            if (!latestReceiptByOrder.has(receipt.orderId))
                latestReceiptByOrder.set(receipt.orderId, receipt);
        }
        const collectedByOrder = new Map<string, number>();
        for (const payment of payments) {
            if (
                !["payment_success", "payment_partial"].includes(
                    payment.paymentStatus
                )
            )
                continue;
            collectedByOrder.set(
                payment.orderId,
                (collectedByOrder.get(payment.orderId) ?? 0) +
                    payment.amountPaise
            );
        }
        const enrichedOrders = orders.map((order) => {
            const collectedPaise = collectedByOrder.get(order.id) ?? 0;
            return {
                ...order,
                advancePaidPaise: collectedPaise,
                balanceDuePaise: Math.max(0, order.totalPaise - collectedPaise),
                paymentRequest: latestRequestByOrder.get(order.id) ?? null,
                receiptVoucher: latestReceiptByOrder.get(order.id) ?? null,
            };
        });

        const enrichedPurchaseOrders = purchaseOrders.map((purchaseOrder) => {
            const quote = purchaseOrder.quoteId
                ? (quoteById.get(purchaseOrder.quoteId) ?? null)
                : null;
            const profile = purchaseOrder.corporateProfileId
                ? (profileById.get(purchaseOrder.corporateProfileId) ?? null)
                : null;
            const validationSummary = this.buildPurchaseOrderValidationSummary(
                {
                    companyName: purchaseOrder.companyName ?? null,
                    poValuePaise: purchaseOrder.poValuePaise,
                    deliveryDate: purchaseOrder.deliveryDate ?? null,
                    productScopeSummary:
                        purchaseOrder.productScopeSummary ?? null,
                    authorizedSignatoryName:
                        purchaseOrder.authorizedSignatoryName ?? null,
                    authorizedSignatoryConfirmed:
                        purchaseOrder.authorizedSignatoryConfirmed,
                    uploadedFileUrl: purchaseOrder.uploadedFileUrl ?? null,
                },
                quote
            );

            return {
                ...purchaseOrder,
                quote,
                profile,
                validationSummary,
            };
        });

        return {
            payments,
            refunds,
            purchaseOrders: enrichedPurchaseOrders,
            reports,
            quotes: enrichedQuotes,
            orders: enrichedOrders,
            paymentRequests,
        };
    }

    async listAdminBrandOptions() {
        return db.query.brands.findMany({
            columns: {
                id: true,
                name: true,
                isActive: true,
            },
            orderBy: [asc(brands.name)],
        });
    }

    async listAdminProfileOptions() {
        return db.query.corporateProfiles.findMany({
            columns: {
                id: true,
                companyName: true,
                contactPerson: true,
                email: true,
            },
            orderBy: [asc(corporateProfiles.companyName)],
        });
    }

    async createAdminBuyerProfile(actorUserId: string, input: unknown) {
        const parsed = corporateAdminBuyerProfileInputSchema.parse(input);
        const rfq = await db.query.corporateRfqs.findFirst({
            where: eq(corporateRfqs.id, parsed.rfqId),
        });

        if (!rfq) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "The selected RFQ could not be found.",
            });
        }

        const created = await db.transaction(async (tx) => {
            const profile = await tx
                .insert(corporateProfiles)
                .values({
                    userId: rfq.userId,
                    companyName: parsed.companyName,
                    contactPerson: parsed.contactPerson,
                    email: parsed.email,
                    phone: parsed.phone,
                    billingAddress: {},
                    shippingAddress: {},
                    isDefault: false,
                })
                .returning()
                .then((rows) => rows[0]);

            if (!profile) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "The buyer company could not be created.",
                });
            }

            await tx
                .update(corporateRfqs)
                .set({
                    corporateProfileId: profile.id,
                    companyName: profile.companyName,
                    contactPerson: profile.contactPerson,
                    email: profile.email,
                    phone: profile.phone,
                    updatedAt: new Date(),
                })
                .where(eq(corporateRfqs.id, rfq.id));

            return profile;
        });

        await Promise.all([
            this.createEvent(
                "corporate_profile",
                created.id,
                "CORPORATE_PROFILE_CREATED_BY_ADMIN",
                { companyName: created.companyName, rfqId: rfq.id },
                actorUserId
            ),
            this.createAdminAuditLog(
                actorUserId,
                "BUYER_COMPANY_CREATED",
                "corporate_profile",
                created.id,
                null,
                { companyName: created.companyName, rfqId: rfq.id }
            ),
        ]);

        return {
            id: created.id,
            companyName: created.companyName,
            contactPerson: created.contactPerson,
            email: created.email,
        };
    }

    async getAdminDashboardSummary() {
        const [rfqs, quotes, orders, tasks, escalations, refunds] =
            await Promise.all([
                db.select({ status: corporateRfqs.status }).from(corporateRfqs),
                db
                    .select({ status: corporateQuotes.status })
                    .from(corporateQuotes),
                db
                    .select({
                        status: corporateOrders.status,
                        balanceDuePaise: corporateOrders.balanceDuePaise,
                    })
                    .from(corporateOrders),
                db
                    .select({ status: corporateTasks.status })
                    .from(corporateTasks),
                db
                    .select({ status: corporateEscalations.status })
                    .from(corporateEscalations),
                db
                    .select({
                        id: corporateRefunds.id,
                        refundStatus: corporateRefunds.refundStatus,
                    })
                    .from(corporateRefunds),
            ]);

        const summary = {
            rfqsPending: rfqs.filter((item) =>
                ["rfq_submitted", "under_review", "brand_matching"].includes(
                    item.status
                )
            ).length,
            quotesPending: quotes.filter((item) =>
                ["sent", "customer_review"].includes(item.status)
            ).length,
            activeOrders: orders.filter(
                (item) => !["completed", "cancelled"].includes(item.status)
            ).length,
            qcPending: orders.filter((item) =>
                ["quality_check", "ready_for_dispatch"].includes(item.status)
            ).length,
            dispatchPending: orders.filter((item) =>
                [
                    "approved",
                    "in_production",
                    "quality_check",
                    "ready_for_dispatch",
                ].includes(item.status)
            ).length,
            paymentsPending: orders.filter((item) => item.balanceDuePaise > 0)
                .length,
            refundRequests: refunds.filter(
                (item) => item.refundStatus === "pending"
            ).length,
            slaBreaches: escalations.filter((item) => item.status === "open")
                .length,
            outstandingBalancePaise: orders.reduce(
                (sum, item) => sum + (item.balanceDuePaise ?? 0),
                0
            ),
        };

        return corporateDashboardSummarySchema.parse(summary);
    }

    async listBrandAssignedOrders(userId: string, brandId: string) {
        await this.requireBrandMembership(userId, brandId);

        const orderRows = await db.query.corporateOrders.findMany({
            where: eq(corporateOrders.brandId, brandId),
            with: {
                quote: true,
                statusHistory: {
                    orderBy: [desc(corporateOrderStatusHistory.createdAt)],
                },
            },
            orderBy: [desc(corporateOrders.createdAt)],
        });

        const productTypeIds = Array.from(
            new Set(
                orderRows
                    .map((order) => order.quote?.productTypeId ?? null)
                    .filter(Boolean)
            )
        ) as string[];

        const [
            vendorPurchaseOrders,
            brandTaxInvoices,
            customerTaxInvoices,
            settlementStatements,
            documentSettings,
        ] = await Promise.all([
            orderRows.length
                ? db.query.corporateVendorPurchaseOrders.findMany({
                      where: inArray(
                          corporateVendorPurchaseOrders.orderId,
                          orderRows.map((order) => order.id)
                      ),
                      orderBy: [desc(corporateVendorPurchaseOrders.createdAt)],
                  })
                : Promise.resolve([]),
            orderRows.length
                ? db.query.corporateBrandTaxInvoices.findMany({
                      where: inArray(
                          corporateBrandTaxInvoices.orderId,
                          orderRows.map((order) => order.id)
                      ),
                      orderBy: [desc(corporateBrandTaxInvoices.createdAt)],
                  })
                : Promise.resolve([]),
            orderRows.length
                ? db.query.corporateTaxInvoices.findMany({
                      where: inArray(
                          corporateTaxInvoices.orderId,
                          orderRows.map((order) => order.id)
                      ),
                      orderBy: [desc(corporateTaxInvoices.createdAt)],
                  })
                : Promise.resolve([]),
            orderRows.length
                ? db.query.corporateSettlementStatements.findMany({
                      where: inArray(
                          corporateSettlementStatements.orderId,
                          orderRows.map((order) => order.id)
                      ),
                      orderBy: [desc(corporateSettlementStatements.createdAt)],
                  })
                : Promise.resolve([]),
            getCorporateDocumentSettings(),
        ]);
        const vendorPoByOrderId = new Map<
            string,
            (typeof vendorPurchaseOrders)[number]
        >();
        for (const purchaseOrder of vendorPurchaseOrders) {
            if (
                purchaseOrder.status !== "cancelled" &&
                !vendorPoByOrderId.has(purchaseOrder.orderId)
            ) {
                vendorPoByOrderId.set(purchaseOrder.orderId, purchaseOrder);
            }
        }
        const brandInvoiceByOrderId = new Map<
            string,
            (typeof brandTaxInvoices)[number]
        >();
        for (const invoice of brandTaxInvoices) {
            if (!brandInvoiceByOrderId.has(invoice.orderId)) {
                brandInvoiceByOrderId.set(invoice.orderId, invoice);
            }
        }
        const customerInvoiceByOrderId = new Map<
            string,
            (typeof customerTaxInvoices)[number]
        >();
        for (const invoice of customerTaxInvoices) {
            if (!customerInvoiceByOrderId.has(invoice.orderId)) {
                customerInvoiceByOrderId.set(invoice.orderId, invoice);
            }
        }
        const settlementByOrderId = new Map<
            string,
            (typeof settlementStatements)[number]
        >();
        for (const statement of settlementStatements) {
            if (!settlementByOrderId.has(statement.orderId)) {
                settlementByOrderId.set(statement.orderId, statement);
            }
        }
        const gsmOptionIds = Array.from(
            new Set(
                orderRows
                    .map((order) => order.quote?.gsmOptionId ?? null)
                    .filter(Boolean)
            )
        ) as string[];
        const fabricCompositionIds = Array.from(
            new Set(
                orderRows
                    .map((order) => order.quote?.fabricCompositionId ?? null)
                    .filter(Boolean)
            )
        ) as string[];

        const [productTypes, gsmOptions, fabricCompositions] =
            await Promise.all([
                productTypeIds.length
                    ? db.query.corporateProductTypes.findMany({
                          where: inArray(
                              corporateProductTypes.id,
                              productTypeIds
                          ),
                      })
                    : Promise.resolve([]),
                gsmOptionIds.length
                    ? db.query.corporateGsmOptions.findMany({
                          where: inArray(corporateGsmOptions.id, gsmOptionIds),
                      })
                    : Promise.resolve([]),
                fabricCompositionIds.length
                    ? db.query.corporateFabricCompositions.findMany({
                          where: inArray(
                              corporateFabricCompositions.id,
                              fabricCompositionIds
                          ),
                      })
                    : Promise.resolve([]),
            ]);

        const productTypeById = new Map(
            productTypes.map((item) => [item.id, item])
        );
        const gsmOptionById = new Map(
            gsmOptions.map((item) => [item.id, item])
        );
        const fabricCompositionById = new Map(
            fabricCompositions.map((item) => [item.id, item])
        );

        const sanitizedOrders = orderRows.map((order) => {
            const brandingSnapshot = (order.brandingConfigSnapshot ??
                {}) as Record<string, unknown>;
            const companySnapshot = (order.companySnapshot ?? {}) as Record<
                string,
                unknown
            >;
            const rawArtwork =
                (order.artworkFile as Record<string, unknown> | null) ||
                (brandingSnapshot.artworkFile as Record<
                    string,
                    unknown
                > | null) ||
                (brandingSnapshot.logoFile as Record<string, unknown> | null) ||
                (companySnapshot.logoFile as Record<string, unknown> | null);

            let artworkFile: {
                url: string;
                name: string;
                size: number | null;
            } | null = null;
            if (rawArtwork) {
                const url =
                    (rawArtwork.url as string) ||
                    (rawArtwork.fileUrl as string) ||
                    (typeof rawArtwork === "string" ? rawArtwork : "");
                if (url) {
                    artworkFile = {
                        url,
                        name:
                            (rawArtwork.name as string) ||
                            (rawArtwork.fileName as string) ||
                            (rawArtwork.originalName as string) ||
                            "artwork-logo.png",
                        size:
                            typeof rawArtwork.size === "number"
                                ? rawArtwork.size
                                : null,
                    };
                }
            }

            const logoLocations = Array.isArray(brandingSnapshot.logoLocations)
                ? ((brandingSnapshot.logoLocations as Array<{ name?: string }>)
                      .map((l) => (typeof l === "string" ? l : l?.name))
                      .filter(Boolean) as string[])
                : [];

            const printMethod =
                typeof brandingSnapshot.printMethod === "object" &&
                brandingSnapshot.printMethod !== null
                    ? (brandingSnapshot.printMethod as { name?: string }).name
                    : typeof brandingSnapshot.printMethod === "string"
                      ? brandingSnapshot.printMethod
                      : null;

            return {
                id: order.id,
                publicOrderId: order.publicOrderId,
                companyName: order.companyName,
                source: order.quote ? "quote" : "self_service",
                status: order.status,
                quantity: order.quantity,
                employeeCount: order.employeeCount,
                sizeBreakdown: order.sizeBreakdown,
                artworkFile,
                brandingConfig: {
                    logoLocations,
                    printMethod,
                },
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
                renivetPurchaseOrder: (() => {
                    const purchaseOrder = vendorPoByOrderId.get(order.id);
                    return purchaseOrder
                        ? {
                              id: purchaseOrder.id,
                              poNumber: purchaseOrder.poNumber,
                              foNumber:
                                  (purchaseOrder as any).foNumber ||
                                  purchaseOrder.poNumber,
                              issueDate: purchaseOrder.issueDate,
                              expectedDeliveryDate:
                                  purchaseOrder.expectedDeliveryDate,
                              totalAmountPaise: purchaseOrder.totalAmountPaise,
                              status: purchaseOrder.status,
                              downloadUrl: `/api/corporate-orders/${order.id}/fulfillment-order.pdf`,
                          }
                        : null;
                })(),
                brandTaxInvoice: (() => {
                    const invoice = brandInvoiceByOrderId.get(order.id);
                    return invoice
                        ? {
                              id: invoice.id,
                              invoiceNumber: invoice.invoiceNumber,
                              invoiceDate: invoice.invoiceDate,
                              totalAmountPaise: invoice.totalAmountPaise,
                              validationStatus: invoice.validationStatus,
                              gstr2bStatus: invoice.gstr2bStatus,
                              downloadUrl: `/api/corporate-orders/${order.id}/brand-tax-invoice`,
                          }
                        : null;
                })(),
                customerTaxInvoice: (() => {
                    const invoice = customerInvoiceByOrderId.get(order.id);
                    return {
                        id: invoice?.id ?? null,
                        invoiceNumber:
                            invoice?.invoiceNumber ||
                            `BAM/2627/${String(order.sequenceNo ?? 1).padStart(5, "0")}`,
                        invoiceDate: invoice?.invoiceDate ?? order.createdAt,
                        totalAmountPaise:
                            invoice?.totalAmountPaise ?? order.totalAmountPaise,
                        status: invoice?.status ?? "issued",
                        downloadUrl: `/api/corporate-orders/${order.id}/invoice.pdf`,
                    };
                })(),
                settlementStatement: (() => {
                    const statement = settlementByOrderId.get(order.id);
                    return statement
                        ? {
                              id: statement.id,
                              statementNumber: statement.statementNumber,
                              statementDate: statement.statementDate,
                              netRemittancePaise: statement.netRemittancePaise,
                              commissionPercent:
                                  statement.commissionPercentBps / 100,
                              status: statement.status,
                              downloadUrl: `/api/corporate-orders/${order.id}/settlement-statement.pdf`,
                          }
                        : null;
                })(),
                selectedGarment: {
                    productType:
                        (order.quote?.productTypeId
                            ? productTypeById.get(order.quote.productTypeId)
                                  ?.name
                            : null) ??
                        snapshotLabel(
                            (
                                (order.productConfigSnapshot ?? {}) as Record<
                                    string,
                                    unknown
                                >
                            ).productType,
                            ["name", "title", "label"]
                        ) ??
                        "Pending admin setup",
                    gsm:
                        (order.quote?.gsmOptionId
                            ? gsmOptionById.get(order.quote.gsmOptionId)?.label
                            : null) ??
                        snapshotLabel(
                            (
                                (order.productConfigSnapshot ?? {}) as Record<
                                    string,
                                    unknown
                                >
                            ).gsmOption,
                            ["label", "name", "gsm", "gsmValue"]
                        ) ??
                        "Pending admin setup",
                    fabricComposition:
                        (order.quote?.fabricCompositionId
                            ? fabricCompositionById.get(
                                  order.quote.fabricCompositionId
                              )?.name
                            : null) ??
                        snapshotLabel(
                            (
                                (order.productConfigSnapshot ?? {}) as Record<
                                    string,
                                    unknown
                                >
                            ).fabricComposition,
                            ["name", "composition", "label"]
                        ) ??
                        "Pending admin setup",
                },
                employeeRows: order.employeeRows.map((row, index) => ({
                    employeeCode: this.maskEmployeeName(
                        row.employeeName ?? "",
                        index
                    ),
                    size: row.size,
                })),
                statusHistory: order.statusHistory.map((item) => ({
                    id: item.id,
                    toStatus: item.toStatus,
                    note: item.note,
                    createdAt: item.createdAt,
                })),
            };
        });

        await db.insert(corporateBrandAuditLogs).values({
            brandId,
            actorId: userId,
            action: "VIEW_CORPORATE_ORDERS",
            entityType: "brand",
            entityId: brandId as any,
            metadata: {
                orderCount: sanitizedOrders.length,
            },
        });

        return {
            orders: sanitizedOrders,
            allowedStatuses: this.brandManagedOrderStatuses,
            recipientGstin: documentSettings.gstin,
        };
    }

    async recordBrandAssignedTaxInvoice(
        userId: string,
        brandId: string,
        input: unknown
    ) {
        await this.requireBrandMembership(userId, brandId);
        const parsed = corporateBrandInvoiceUploadInputSchema.parse(input);
        const order = await db.query.corporateOrders.findFirst({
            where: and(
                eq(corporateOrders.id, parsed.orderId),
                eq(corporateOrders.brandId, brandId)
            ),
            with: { quote: true },
        });
        if (!order) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "This order is not assigned to your brand",
            });
        }

        const [purchaseOrder, brandDetails, settings] = await Promise.all([
            db.query.corporateVendorPurchaseOrders.findFirst({
                where: and(
                    eq(
                        corporateVendorPurchaseOrders.id,
                        parsed.vendorPurchaseOrderId
                    ),
                    eq(corporateVendorPurchaseOrders.orderId, order.id),
                    eq(corporateVendorPurchaseOrders.brandId, brandId)
                ),
            }),
            db.query.brandConfidentials.findFirst({
                where: eq(brandConfidentials.id, brandId),
            }),
            getCorporateDocumentSettings(),
        ]);
        if (!purchaseOrder) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "The Renivet purchase order was not found",
            });
        }
        if (!brandDetails?.gstin || !settings.gstin) {
            throw new TRPCError({
                code: "PRECONDITION_FAILED",
                message: "Supplier or Renivet GST details are incomplete",
            });
        }

        const taxableValuePaise =
            (purchaseOrder as any).taxableValuePaise ??
            purchaseOrder.totalAmountPaise ??
            purchaseOrder.unitSellPricePaise * purchaseOrder.quantity ??
            0;

        const totalAmountPaise =
            purchaseOrder.totalAmountPaise ?? taxableValuePaise;

        const foNumber =
            (purchaseOrder as any).foNumber ||
            (purchaseOrder as any).poNumber ||
            "FO-0001";

        const snapshotHsn =
            typeof (order.pricingSnapshot as any)?.hsnCode === "string"
                ? (order.pricingSnapshot as any).hsnCode
                : null;
        const resolvedHsn = order.quote?.hsnCode || snapshotHsn;
        const classificationRow = resolvedHsn
            ? await db.query.hsnMaster.findFirst({
                  where: and(
                      eq(hsnMaster.hsnCode, resolvedHsn),
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
                    "An active HSN Master classification is required before recording the brand tax invoice",
            });
        }

        return corporateDocumentService.recordBrandTaxInvoice(userId, {
            ...parsed,
            invoiceNumber: `INV-${foNumber.replace(/[^a-zA-Z0-9]/g, "")}-${Date.now().toString().slice(-4)}`,
            supplierGstin: brandDetails.gstin,
            recipientGstin: settings.gstin,
            hsnCode: classificationRow!.hsnCode.slice(0, 8),
            taxableValuePaise,
            cgstPaise: 0,
            sgstPaise: 0,
            igstPaise: 0,
            totalAmountPaise,
        });
    }

    async updateBrandAssignedOrderStatus(
        userId: string,
        brandId: string,
        input: {
            orderId: string;
            toStatus: CorporateOrderWorkflowStatus;
            note?: string | null;
        }
    ) {
        await this.requireBrandMembership(userId, brandId);

        if (!this.brandManagedOrderStatuses.includes(input.toStatus)) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                    "This status cannot be updated from the brand workspace",
            });
        }

        const { order, quote } = await this.resolveBrandQuoteForOrder(
            brandId,
            input.orderId
        );
        const orderReference = quote?.quoteNumber ?? order.publicOrderId;
        const didTransition = order.status !== input.toStatus;

        const updated = await corporateOrderService.updateStatus({
            corporateOrderId: order.id,
            toStatus: input.toStatus,
            changedByUserId: userId,
            note:
                input.note?.trim() ||
                `Brand updated status to ${convertValueToLabel(input.toStatus)}`,
            metadata: {
                source: "brand_workspace",
                brandId,
                quoteId: quote?.id ?? null,
                orderSource: quote ? "quote" : "self_service",
            },
        });

        if (!didTransition) return updated;

        await db.insert(corporateBrandAuditLogs).values({
            brandId,
            actorId: userId,
            action: "UPDATE_CORPORATE_ORDER_STATUS",
            entityType: "corporate_order",
            entityId: order.id as any,
            metadata: {
                quoteId: quote?.id ?? null,
                orderSource: quote ? "quote" : "self_service",
                fromStatus: order.status,
                toStatus: input.toStatus,
            },
        });

        await this.createEvent(
            "corporate_order",
            order.id,
            "BRAND_CORPORATE_ORDER_STATUS_UPDATED",
            {
                brandId,
                quoteId: quote?.id ?? null,
                orderSource: quote ? "quote" : "self_service",
                fromStatus: order.status,
                toStatus: input.toStatus,
            },
            userId
        );

        if (
            input.toStatus === "ready_for_dispatch" &&
            order.status !== "ready_for_dispatch"
        ) {
            const assignedBrand = await db.query.brands.findFirst({
                where: eq(brands.id, brandId),
                columns: {
                    name: true,
                },
            });

            await this.notifyAdminOrderReadyForDispatch({
                order: {
                    id: order.id,
                    publicOrderId: order.publicOrderId,
                    companyName: order.companyName,
                    quantity: order.quantity,
                    totalPaise: order.totalPaise,
                    advancePaidPaise: order.advancePaidPaise,
                    balanceDuePaise: order.balanceDuePaise,
                    status: input.toStatus,
                },
                quoteNumber: orderReference,
                brandName: assignedBrand?.name ?? null,
            });

            await this.notifyCustomerOrderReadyForDispatch({
                order: {
                    id: order.id,
                    publicOrderId: order.publicOrderId,
                    companyName: order.companyName,
                    quantity: order.quantity,
                    totalPaise: order.totalPaise,
                    advancePaidPaise: order.advancePaidPaise,
                    balanceDuePaise: order.balanceDuePaise,
                    emailAddress: order.emailAddress,
                },
            });
        }

        return updated;
    }

    async generateReport(actorUserId: string, input: unknown) {
        const parsed = corporateReportInputSchema.parse(input);
        const created = await db
            .insert(corporateReports)
            .values({
                reportType: parsed.reportType,
                fileUrl: null,
                generatedAt: new Date().toISOString().slice(0, 10),
            })
            .returning()
            .then((rows) => rows[0]);

        await this.createEvent(
            "report",
            created.id,
            "CORPORATE_REPORT_GENERATED",
            {
                reportType: created.reportType,
            },
            actorUserId
        );

        return created;
    }
}

export const corporatePlatformService = new CorporatePlatformService();
