import { env } from "@/../env";
import {
    extractCorporateDeliveryAddress,
    fillCorporateDeliveryAddressDefaults,
    formatCorporateDeliveryAddress,
} from "@/lib/corporate-delivery-address";
import { db } from "@/lib/db";
import { corporateOrderQueries } from "@/lib/db/queries/corporate-order";
import { createOrder } from "@/lib/delhivery/orders";
import { schedulePickup } from "@/lib/delhivery/pickup";
import {
    brands,
    brandMembers,
    corporateActivityTimeline,
    corporateAdminAuditLogs,
    corporateBrandAuditLogs,
    corporateDocuments,
    corporateEscalations,
    corporateNotifications,
    corporateOrderStatusHistory,
    corporateOrders,
    corporatePayments,
    corporateProductConfigs,
    corporateProductTypes,
    corporateProfiles,
    corporateProformaInvoices,
    corporatePurchaseOrders,
    corporateFabricCompositions,
    corporateGsmOptions,
    corporateQcImages,
    corporateQcSubmissions,
    corporateQuoteRevisions,
    corporateQuotes,
    corporateReports,
    corporateRfqs,
    corporateRfqBrandMatches,
    corporateRfqDocuments,
    corporateShipments,
    corporateTaxInvoices,
    corporateTasks,
    corporateRefunds,
    products,
} from "@/lib/db/schema";
import {
    corporateCatalogListInputSchema,
    corporateApprovedQuoteOrderInputSchema,
    corporateDashboardSummarySchema,
    corporateForwardOrderInputSchema,
    corporatePaymentInputSchema,
    corporatePickupScheduleInputSchema,
    corporateProfileInputSchema,
    corporateReportInputSchema,
    corporatePurchaseOrderInputSchema,
    corporatePurchaseOrderReviewInputSchema,
    corporateQcSubmissionInputSchema,
    corporateQuoteDecisionInputSchema,
    corporateQuoteInputSchema,
    corporateQuoteRevisionInputSchema,
    corporateRfqInputSchema,
    corporateShipmentInputSchema,
    corporateProformaInvoiceInputSchema,
    corporateTaskInputSchema,
    corporateTaxInvoiceInputSchema,
} from "@/lib/validations/corporate-platform";
import { CorporateOrderWorkflowStatus } from "@/lib/validations/corporate-order";
import { resend } from "@/lib/resend";
import {
    CorporateOrderCustomerReadyForDispatchEmail,
    CorporateOrderReadyForDispatchEmail,
} from "@/lib/resend/emails";
import {
    convertValueToLabel,
    generatePickupLocationCode,
    getAbsoluteURL,
} from "@/lib/utils";
import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, inArray, isNotNull, like, notInArray } from "drizzle-orm";
import crypto from "crypto";

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

class CorporatePlatformService {
    private readonly brandManagedOrderStatuses: CorporateOrderWorkflowStatus[] = [
        "under_review",
        "approved",
        "in_production",
        "quality_check",
        "ready_for_dispatch",
        "dispatched",
        "delivered",
        "completed",
    ];

    private async createEvent(entityType: string, entityId: string, eventName: string, details: Record<string, unknown>, createdBy?: string) {
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
        quote: {
            totalAmountPaise: number;
            profile?: { companyName: string | null } | null;
        } | null
    ) {
        const companyNameMatches = !!(
            quote?.profile?.companyName &&
            purchaseOrder.companyName &&
            quote.profile.companyName.trim().toLowerCase() ===
                purchaseOrder.companyName.trim().toLowerCase()
        );
        const orderValueMatches = !!quote && quote.totalAmountPaise === purchaseOrder.poValuePaise;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const deliveryDateFeasible = purchaseOrder.deliveryDate
            ? new Date(purchaseOrder.deliveryDate) >= today
            : false;
        const productScopeMatches = !!purchaseOrder.productScopeSummary?.trim();
        const authorizedSignatoryPresent = !!(
            purchaseOrder.authorizedSignatoryConfirmed &&
            purchaseOrder.authorizedSignatoryName?.trim()
        );

        const issues = [
            companyNameMatches ? null : "Company name does not match the approved quote",
            orderValueMatches ? null : "Purchase order value does not match the quote total",
            deliveryDateFeasible ? null : "Delivery date is missing or not feasible",
            productScopeMatches ? null : "Product scope confirmation is missing",
            authorizedSignatoryPresent
                ? null
                : "Authorized signatory details are missing",
            purchaseOrder.uploadedFileUrl ? null : "Purchase order document is missing",
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
                where: like(
                    corporateOrders.customerNotes,
                    `%${quoteNumber}%`
                ),
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
                eq(corporateOrders.brandId, brandId),
                isNotNull(corporateOrders.quoteId)
            ),
            with: {
                quote: true,
            },
        });

        if (!order || !order.quote) {
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
                userId: string;
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
        }
    ) {
        if (!quote.profile) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Cannot create enterprise order without a linked buyer profile",
            });
        }

        const taxableValue =
            quote.subtotalPaise + quote.customizationCostPaise;
        const gstRateBps = taxableValue
            ? Math.round((quote.gstAmountPaise / taxableValue) * 10000)
            : 0;
        const deliveryDetails = fillCorporateDeliveryAddressDefaults(
            extractCorporateDeliveryAddress(quote.profile.shippingAddress)
        );

        const createdOrder = await db
            .insert(corporateOrders)
            .values({
                publicOrderId: `REN-CORP-PO-${Date.now()}`,
                userId: quote.profile.userId,
                quoteId: quote.id,
                brandId: quote.brandId,
                status: "under_review",
                paymentStatus: "pending",
                companyName: quote.profile.companyName,
                contactPersonName: quote.profile.contactPerson,
                emailAddress: quote.profile.email,
                mobileNumber: quote.profile.phone,
                gstNumber: quote.profile.gstNumber ?? null,
                deliveryCountry: deliveryDetails.deliveryCountry,
                deliveryCity: deliveryDetails.deliveryCity,
                deliveryPincode: deliveryDetails.deliveryPincode,
                deliveryAddress: deliveryDetails.deliveryAddress,
                numberOfEmployees: quote.quantity,
                employeeCount: quote.quantity,
                quantity: quote.quantity,
                sizeBreakdown: {},
                employeeRows: [],
                companySnapshot: {
                    companyName: quote.profile.companyName,
                    contactPersonName: quote.profile.contactPerson,
                    emailAddress: quote.profile.email,
                    mobileNumber: quote.profile.phone,
                    gstNumber: quote.profile.gstNumber ?? null,
                    deliveryCountry: deliveryDetails.deliveryCountry,
                    deliveryCity: deliveryDetails.deliveryCity,
                    deliveryPincode: deliveryDetails.deliveryPincode,
                    deliveryAddress: deliveryDetails.deliveryAddress,
                    deliveryAddressFormatted:
                        formatCorporateDeliveryAddress(deliveryDetails),
                    shippingAddress: quote.profile.shippingAddress ?? {},
                    numberOfEmployees: quote.quantity,
                },
                productConfigSnapshot: {
                    productId: quote.productId,
                    corporateProductConfigId: quote.corporateProductConfigId,
                    productTypeId: quote.productTypeId,
                    gsmOptionId: quote.gsmOptionId,
                    fabricCompositionId: quote.fabricCompositionId,
                    quoteNumber: quote.quoteNumber,
                    quantity: quote.quantity,
                    sourcedFrom: context.sourceType,
                },
                brandingConfigSnapshot: {
                    poNumber: context.poNumber ?? null,
                    productScopeSummary:
                        context.productScopeSummary ?? "As per approved quote",
                },
                pricingSnapshot: {
                    subtotalPaise: quote.subtotalPaise,
                    customizationCostPaise: quote.customizationCostPaise,
                    gstAmountPaise: quote.gstAmountPaise,
                    totalAmountPaise: quote.totalAmountPaise,
                },
                artworkFile: null,
                employeeSheetFile: null,
                subtotalPaise: quote.subtotalPaise,
                customizationPaise: quote.customizationCostPaise,
                gstRateBps,
                gstPaise: quote.gstAmountPaise,
                totalPaise: quote.totalAmountPaise,
                advancePercentBps: quote.totalAmountPaise
                    ? Math.round(
                          (quote.advanceAmountPaise / quote.totalAmountPaise) * 10000
                      )
                    : 0,
                advancePaidPaise: 0,
                balanceDuePaise: quote.balanceAmountPaise || quote.totalAmountPaise,
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

    async getMyProfile(userId: string) {
        return db.query.corporateProfiles.findFirst({
            where: eq(corporateProfiles.userId, userId),
            orderBy: [desc(corporateProfiles.updatedAt)],
        });
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
            if (parsed.categoryId && row.product.categoryId !== parsed.categoryId)
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
                if (!haystack.includes(parsed.search.toLowerCase())) return false;
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
                : and(eq(products.isDeleted, false), eq(products.isPublished, true)),
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
                corporateDescription: product.description ?? "Corporate-ready product",
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
                priceRangeMaxPaise: product.compareAtPrice ?? product.price ?? 0,
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
                corporateProductConfigId: parsed.corporateProductConfigId ?? null,
                productTypeId: parsed.productTypeId ?? null,
                gsmOptionId: parsed.gsmOptionId ?? null,
                fabricCompositionId: parsed.fabricCompositionId ?? null,
                quantity: parsed.quantity,
                subtotalPaise: parsed.subtotalPaise,
                customizationCostPaise: parsed.customizationCostPaise,
                gstAmountPaise: parsed.gstAmountPaise,
                totalAmountPaise: parsed.totalAmountPaise,
                advanceAmountPaise: parsed.advanceAmountPaise,
                balanceAmountPaise: parsed.balanceAmountPaise,
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

    async listMyQuotes(userId: string) {
        const profile = await this.getMyProfile(userId);
        if (!profile) return [];

        return db.query.corporateQuotes.findMany({
            where: eq(corporateQuotes.corporateProfileId, profile.id),
            with: {
                revisions: true,
                brand: true,
            },
            orderBy: [desc(corporateQuotes.createdAt)],
        });
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
                message: "You do not have access to create a purchase order for this quote",
            });
        }

        if (quote.status !== "approved") {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Purchase orders can only be uploaded after the quote is approved",
            });
        }

        if (parsed.corporateProfileId !== quote.corporateProfileId) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Purchase order buyer company does not match the approved quote",
            });
        }

        const validationSummary = this.buildPurchaseOrderValidationSummary(
            {
                companyName: parsed.companyName,
                poValuePaise: parsed.poValuePaise,
                deliveryDate: parsed.deliveryDate ?? null,
                productScopeSummary: parsed.productScopeSummary,
                authorizedSignatoryName: parsed.authorizedSignatoryName,
                authorizedSignatoryConfirmed: parsed.authorizedSignatoryConfirmed,
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
                authorizedSignatoryConfirmed: parsed.authorizedSignatoryConfirmed,
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

        const computedValidationSummary = this.buildPurchaseOrderValidationSummary(
            {
                companyName: purchaseOrder.companyName ?? null,
                poValuePaise: purchaseOrder.poValuePaise,
                deliveryDate: purchaseOrder.deliveryDate ?? null,
                productScopeSummary: purchaseOrder.productScopeSummary ?? null,
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
                validationSummary.productScopeMatches,
                validationSummary.authorizedSignatoryPresent,
            ].filter((item) => !item).length;

            if (failedChecks > 0) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message:
                        "Purchase order cannot be accepted until all validation checks pass",
                });
            }
        }

        let createdOrderId = purchaseOrder.corporateOrderId ?? null;
        if (parsed.status === "po_accepted" && !purchaseOrder.corporateOrderId) {
            if (!quote) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "A linked quote is required before approving the purchase order",
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
                message: "Only approved quotes can be moved into order processing",
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
            await corporateOrderQueries.updateCorporateOrder(order.id, {
                status: nextOrderStatus,
            });

            await corporateOrderQueries.createStatusHistory({
                corporateOrderId: order.id,
                fromStatus: order.status,
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
            typeof (productSnapshot.productType as Record<string, unknown>).name ===
                "string"
                ? ((productSnapshot.productType as Record<string, unknown>)
                      .name as string)
                : "Corporate apparel";

        const forwardPayload = {
            format: "json" as const,
            pickup_location: {
                name: pickupLocation,
            },
            shipments: [
                {
                    name: order.contactPersonName,
                    add: order.deliveryAddress,
                    pin: order.deliveryPincode,
                    city: order.deliveryCity,
                    country: order.deliveryCountry,
                    phone: order.mobileNumber,
                    order: order.publicOrderId,
                    payment_mode: "Prepaid" as const,
                    shipping_mode: "Surface" as const,
                    quantity: String(order.quantity),
                    total_amount: Number((order.totalPaise / 100).toFixed(2)),
                    products_desc: productType,
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
            typeof packageRecord.waybill === "string"
                ? packageRecord.waybill
                : typeof packageRecord.awb === "string"
                  ? packageRecord.awb
                  : typeof rawData.waybill === "string"
                    ? rawData.waybill
                    : typeof rawData.awb === "string"
                      ? rawData.awb
                      : null;

        const existingShipment = await db.query.corporateShipments.findFirst({
            where: eq(corporateShipments.orderId, order.id),
        });
        const shipmentPayload = {
            courierName: "Delhivery",
            trackingNumber: waybill,
            awbNumber: waybill,
            trackingUrl: waybill
                ? `${env.DELHIVERY_BASE_URL?.trim() || "https://track.delhivery.com"}/tracking/package/${waybill}`
                : null,
            dispatchDate: null,
            deliveryDate: null,
            status: "ready" as const,
            provider: "delhivery",
            rawPayload: rawData,
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

        if (order.status !== "ready_for_dispatch") {
            await corporateOrderQueries.updateCorporateOrder(order.id, {
                status: "ready_for_dispatch",
            });

            await corporateOrderQueries.createStatusHistory({
                corporateOrderId: order.id,
                fromStatus: order.status,
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
            expected_package_count: order.quantity,
        });

        const rawPayload = {
            ...(order.shipment.rawPayload ?? {}),
            pickupSchedule: pickupResponse,
        };

        const shipment = await db
            .update(corporateShipments)
            .set({
                dispatchDate: parsed.pickupDate,
                status: "dispatched",
                rawPayload,
                updatedAt: new Date(),
            })
            .where(eq(corporateShipments.id, order.shipment.id))
            .returning()
            .then((rows) => rows[0]);

        if (order.status !== "dispatched") {
            await corporateOrderQueries.updateCorporateOrder(order.id, {
                status: "dispatched",
            });

            await corporateOrderQueries.createStatusHistory({
                corporateOrderId: order.id,
                fromStatus: order.status,
                toStatus: "dispatched",
                changedByUserId: actorUserId,
                note: "Delhivery pickup scheduled",
                metadata: {
                    source: "corporate_orders_table",
                    shipmentId: shipment.id,
                    pickupDate: parsed.pickupDate,
                    pickupTime: parsed.pickupTime,
                },
            });
        }

        await this.createEvent(
            "shipment",
            shipment.id,
            "PICKUP_SCHEDULED",
            {
                orderId: order.id,
                pickupDate: parsed.pickupDate,
                pickupTime: parsed.pickupTime,
            },
            actorUserId
        );

        return {
            success: true,
            shipment,
            pickupLocation,
            pickupResponse,
        };
    }

    async submitQc(actorUserId: string, input: unknown) {
        const parsed = corporateQcSubmissionInputSchema.parse(input);
        const created = await db
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

        await db.insert(corporateQcImages).values(
            parsed.images.map((image) => ({
                qcSubmissionId: created.id,
                imageUrl: image.url,
                imageType: image.type,
            }))
        );

        await db.insert(corporateDocuments).values(
            parsed.images.map((image, index) => ({
                entityType: "qc_submission",
                entityId: created.id,
                documentType: "qc_image",
                fileName: image.name,
                fileUrl: image.url,
                mimeType: image.type,
                fileSizeBytes: image.size,
                uploadedByUserId: actorUserId,
                version: index + 1,
            }))
        );

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

        const sequence = await db
            .select({ count: count() })
            .from(corporateProformaInvoices)
            .then((rows) => (rows[0]?.count ?? 0) + 1);

        const created = await db
            .insert(corporateProformaInvoices)
            .values({
                invoiceNumber: makeNumber("PI", sequence),
                quoteId: quote.id,
                customerId: quote.corporateProfileId,
                invoiceDate: new Date().toISOString().slice(0, 10),
                subtotalPaise: quote.subtotalPaise,
                gstAmountPaise: quote.gstAmountPaise,
                totalAmountPaise: quote.totalAmountPaise,
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
        });
        if (!order) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Order not found",
            });
        }

        const sequence = await db
            .select({ count: count() })
            .from(corporateTaxInvoices)
            .then((rows) => (rows[0]?.count ?? 0) + 1);

        const gstHalf = Math.round(order.gstPaise / 2);
        const created = await db
            .insert(corporateTaxInvoices)
            .values({
                invoiceNumber: makeNumber("TI", sequence),
                orderId: order.id,
                invoiceDate: new Date().toISOString().slice(0, 10),
                taxableValuePaise: order.subtotalPaise + order.customizationPaise,
                cgstPaise: gstHalf,
                sgstPaise: order.gstPaise - gstHalf,
                igstPaise: 0,
                totalAmountPaise: order.totalPaise,
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
        const [payments, refunds, purchaseOrders, reports, quotes, orders] = await Promise.all([
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
                purchaseOrders.map((item) => item.corporateProfileId).filter(Boolean)
            )
        ) as string[];

        const [poQuotes, poProfiles] = await Promise.all([
            quoteIds.length
                ? db.query.corporateQuotes.findMany({
                      where: inArray(corporateQuotes.id, quoteIds),
                      with: {
                          profile: true,
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

        const enrichedPurchaseOrders = purchaseOrders.map((purchaseOrder) => {
            const quote = purchaseOrder.quoteId
                ? quoteById.get(purchaseOrder.quoteId) ?? null
                : null;
            const profile = purchaseOrder.corporateProfileId
                ? profileById.get(purchaseOrder.corporateProfileId) ?? null
                : null;
            const validationSummary = this.buildPurchaseOrderValidationSummary(
                {
                    companyName: purchaseOrder.companyName ?? null,
                    poValuePaise: purchaseOrder.poValuePaise,
                    deliveryDate: purchaseOrder.deliveryDate ?? null,
                    productScopeSummary: purchaseOrder.productScopeSummary ?? null,
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
            quotes,
            orders,
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

    async getAdminDashboardSummary() {
        const [rfqs, quotes, orders, tasks, escalations, refunds] =
            await Promise.all([
                db.query.corporateRfqs.findMany(),
                db.query.corporateQuotes.findMany(),
                db.query.corporateOrders.findMany(),
                db.query.corporateTasks.findMany(),
                db.query.corporateEscalations.findMany(),
                db.query.corporateRefunds.findMany(),
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
            activeOrders: orders.filter((item) =>
                !["completed", "cancelled"].includes(item.status)
            ).length,
            qcPending: orders.filter((item) =>
                ["quality_check", "ready_for_dispatch"].includes(item.status)
            ).length,
            dispatchPending: orders.filter((item) =>
                ["approved", "in_production", "quality_check", "ready_for_dispatch"].includes(
                    item.status
                )
            ).length,
            paymentsPending: orders.filter((item) => item.balanceDuePaise > 0).length,
            refundRequests: refunds.filter((item) => item.refundStatus === "pending")
                .length,
            slaBreaches: escalations.filter((item) => item.status === "open").length,
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
            where: and(
                eq(corporateOrders.brandId, brandId),
                isNotNull(corporateOrders.quoteId)
            ),
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

        const [productTypes, gsmOptions, fabricCompositions] = await Promise.all([
            productTypeIds.length
                ? db.query.corporateProductTypes.findMany({
                      where: inArray(corporateProductTypes.id, productTypeIds),
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

        const productTypeById = new Map(productTypes.map((item) => [item.id, item]));
        const gsmOptionById = new Map(gsmOptions.map((item) => [item.id, item]));
        const fabricCompositionById = new Map(
            fabricCompositions.map((item) => [item.id, item])
        );

        const sanitizedOrders = orderRows.map((order) => ({
            id: order.id,
            publicOrderId: order.publicOrderId,
            status: order.status,
            paymentStatus: order.paymentStatus,
            quantity: order.quantity,
            employeeCount: order.employeeCount,
            sizeBreakdown: order.sizeBreakdown,
            subtotalPaise: order.subtotalPaise,
            customizationPaise: order.customizationPaise,
            gstPaise: order.gstPaise,
            totalPaise: order.totalPaise,
            advancePaidPaise: order.advancePaidPaise,
            balanceDuePaise: order.balanceDuePaise,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            selectedGarment: {
                productType:
                    (order.quote?.productTypeId
                        ? productTypeById.get(order.quote.productTypeId)?.name
                        : null) ?? "Pending admin setup",
                gsm:
                    (order.quote?.gsmOptionId
                        ? gsmOptionById.get(order.quote.gsmOptionId)?.label
                        : null) ?? "Pending admin setup",
                fabricComposition:
                    (order.quote?.fabricCompositionId
                        ? fabricCompositionById.get(
                              order.quote.fabricCompositionId
                          )?.name
                        : null) ?? "Pending admin setup",
            },
            employeeRows: order.employeeRows.map((row, index) => ({
                employeeCode: this.maskEmployeeName(row.employeeName ?? "", index),
                size: row.size,
            })),
            statusHistory: order.statusHistory.map((item) => ({
                id: item.id,
                toStatus: item.toStatus,
                note: item.note,
                createdAt: item.createdAt,
            })),
        }));

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
        };
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
                message: "This status cannot be updated from the brand workspace",
            });
        }

        const { order, quote } = await this.resolveBrandQuoteForOrder(
            brandId,
            input.orderId
        );

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
            changedByUserId: userId,
            note:
                input.note?.trim() ||
                `Brand updated status to ${convertValueToLabel(input.toStatus)}`,
            metadata: {
                source: "brand_workspace",
                brandId,
                quoteId: quote.id,
            },
        });

        await db.insert(corporateBrandAuditLogs).values({
            brandId,
            actorId: userId,
            action: "UPDATE_CORPORATE_ORDER_STATUS",
            entityType: "corporate_order",
            entityId: order.id as any,
            metadata: {
                quoteId: quote.id,
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
                quoteId: quote.id,
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
                quoteNumber: quote.quoteNumber,
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
