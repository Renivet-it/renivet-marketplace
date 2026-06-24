import { db } from "@/lib/db";
import {
    brandMembers,
    corporateActivityTimeline,
    corporateBrandAuditLogs,
    corporateDocuments,
    corporateEscalations,
    corporateNotifications,
    corporateOrders,
    corporatePayments,
    corporateProductConfigs,
    corporateProfiles,
    corporateProformaInvoices,
    corporatePurchaseOrders,
    corporateQcImages,
    corporateQcSubmissions,
    corporateQuoteRevisions,
    corporateQuotes,
    corporateReports,
    corporateRfqs,
    corporateRfqDocuments,
    corporateShipments,
    corporateTaxInvoices,
    corporateTasks,
    corporateRefunds,
    products,
} from "@/lib/db/schema";
import {
    corporateCatalogListInputSchema,
    corporateDashboardSummarySchema,
    corporatePaymentInputSchema,
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
import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, notInArray } from "drizzle-orm";

function makeNumber(prefix: string, sequence: number) {
    return `${prefix}-${String(sequence).padStart(5, "0")}`;
}

class CorporatePlatformService {
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
        const sequence = await db
            .select({ count: count() })
            .from(corporateRfqs)
            .then((rows) => (rows[0]?.count ?? 0) + 1);

        const created = await db
            .insert(corporateRfqs)
            .values({
                rfqNumber: makeNumber("RFQ", sequence),
                corporateProfileId: parsed.profileId ?? null,
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
                  : "customer_review";

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
                updatedAt: new Date(),
            })
            .where(eq(corporateQuotes.id, quote.id));

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
        const created = await db
            .insert(corporatePurchaseOrders)
            .values({
                quoteId: parsed.quoteId ?? null,
                corporateOrderId: parsed.corporateOrderId ?? null,
                corporateProfileId: parsed.corporateProfileId ?? null,
                poNumber: parsed.poNumber,
                poValuePaise: parsed.poValuePaise,
                poDate: parsed.poDate ?? null,
                deliveryDate: parsed.deliveryDate ?? null,
                uploadedFileUrl: parsed.uploadedFile?.url ?? null,
                reviewNotes: parsed.reviewNotes ?? null,
            })
            .returning()
            .then((rows) => rows[0]);

        if (parsed.uploadedFile) {
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
        }

        await this.createEvent(
            "purchase_order",
            created.id,
            "PURCHASE_ORDER_UPLOADED",
            {
                poNumber: created.poNumber,
                poValuePaise: created.poValuePaise,
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

        const updated = await db
            .update(corporatePurchaseOrders)
            .set({
                status: parsed.status,
                reviewNotes: parsed.reviewNotes ?? null,
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
            },
            actorUserId
        );

        return updated;
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
        return db.query.corporateRfqs.findMany({
            with: {
                documents: true,
            },
            orderBy: [desc(corporateRfqs.createdAt)],
        });
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

        return {
            payments,
            refunds,
            purchaseOrders,
            reports,
            quotes,
            orders,
        };
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

        const quoteRows = await db.query.corporateQuotes.findMany({
            where: eq(corporateQuotes.brandId, brandId),
            with: {
                profile: true,
                revisions: true,
            },
            orderBy: [desc(corporateQuotes.createdAt)],
        });

        await db.insert(corporateBrandAuditLogs).values({
            brandId,
            actorId: userId,
            action: "VIEW_CORPORATE_ORDERS",
            entityType: "brand",
            entityId: brandId as any,
            metadata: {
                quoteCount: quoteRows.length,
            },
        });

        return {
            quotes: quoteRows,
            orders: [],
        };
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
