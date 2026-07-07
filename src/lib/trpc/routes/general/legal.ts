import { db } from "@/lib/db";
import { userSupportMessages, userSupportTickets } from "@/lib/db/schema";
import {
    auditEntityChange,
    createOperationalAlert,
} from "@/lib/monitoring-sla/audit";
import { BitFieldSitePermission } from "@/config/permissions";
import { legalCache } from "@/lib/redis/methods";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
    publicProcedure,
} from "@/lib/trpc/trpc";
import { createLegalSchema } from "@/lib/validations";
import { z } from "zod";

export const legalRouter = createTRPCRouter({
    getLegal: publicProcedure.query(async () => {
        const legal = await legalCache.get();
        return legal;
    }),
    getActiveLegalContacts: publicProcedure.query(async ({ ctx }) => {
        return ctx.queries.financeCompliance.getActiveLegalContacts();
    }),
    submitGrievance: publicProcedure
        .input(
            z.object({
                name: z.string().min(2),
                email: z.string().email(),
                orderId: z.string().optional(),
                category: z.enum([
                    "order_issue",
                    "refund_dispute",
                    "delivery_issue",
                    "product_quality",
                    "other",
                ]),
                description: z.string().min(10),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const now = new Date();
            const requesterId = ctx.user?.id ?? `guest:${input.email.toLowerCase()}`;
            const ticket = await db
                .insert(userSupportTickets)
                .values({
                    userId: requesterId,
                    orderId: input.orderId ?? null,
                    brandId: null,
                    title: `Grievance: ${input.category.replace(/_/g, " ")}`,
                    category: "GRIEVANCE",
                    issueType: "consumer_protection_grievance",
                    issueLabel: input.category,
                    description: input.description,
                    priority: "high",
                    sourceChannel: "web_form",
                    firstResponseDueAt: new Date(now.getTime() + 48 * 60 * 60 * 1000),
                    resolutionDueAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
                    autoAckSentAt: now,
                    autoAckTemplateKey: "GRIEVANCE_AUTO_ACK",
                    latestMessageAt: now,
                    statusChangedAt: now,
                    status: "acknowledged",
                    intakeContext: {
                        contactName: input.name,
                        contactEmail: input.email,
                        orderId: input.orderId ?? null,
                        grievanceCategory: input.category,
                    },
                })
                .returning()
                .then((rows) => rows[0]);

            await db.insert(userSupportMessages).values({
                ticketId: ticket.id,
                sender: "user",
                senderId: requesterId,
                text: input.description,
                metadata: {
                    grievanceCategory: input.category,
                    contactName: input.name,
                    contactEmail: input.email,
                },
            });

            await auditEntityChange({
                actorId: ctx.user?.id ?? null,
                actionType: "grievance_submitted",
                entityType: "user_support_ticket",
                entityId: ticket.id,
                afterValue: {
                    category: "GRIEVANCE",
                    priority: "high",
                    orderId: input.orderId ?? null,
                    contactEmail: input.email,
                },
                reason: "consumer_protection_grievance",
            });

            await createOperationalAlert({
                actorId: ctx.user?.id ?? null,
                type: "consumer_grievance_submitted",
                severity: "critical",
                entityType: "user_support_ticket",
                entityId: ticket.id,
                title: "Consumer grievance submitted",
                message: `A grievance submission was received from ${input.email}.`,
                ownerRole: "support_manager",
                channels: ["admin", "email", "whatsapp"],
                dedupeKey: `grievance:${ticket.id}`,
                metadata: {
                    category: input.category,
                    orderId: input.orderId ?? null,
                },
            });

            return {
                success: true,
                ticketId: ticket.id,
            };
        }),
    updateLegal: protectedProcedure
        .input(createLegalSchema)
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_SETTINGS))
        .mutation(async ({ ctx, input }) => {
            const { queries } = ctx;
            const {
                termsOfService,
                privacyPolicy,
                refundPolicy,
                shippingPolicy,
                grievanceOfficerName,
                grievanceOfficerEmail,
                grievanceOfficerPhone,
                grievanceOfficerAddress,
                supportEmail,
                supportPhone,
                dpdpConsentVersion,
                isConsumerProtectionPublished,
            } = input;

            const existingLegal = await queries.legal.getLegal();
            if (existingLegal) {
                const updated =
                    privacyPolicy !== existingLegal.privacyPolicy &&
                    termsOfService !== existingLegal.termsOfService
                        ? "all"
                        : privacyPolicy !== existingLegal.privacyPolicy
                          ? "privacyPolicy"
                          : termsOfService !== existingLegal.termsOfService
                            ? "termsOfService"
                            : refundPolicy !== existingLegal.refundPolicy
                              ? "refundPolicy"
                              : shippingPolicy !== existingLegal.shippingPolicy
                                ? "shippingPolicy"
                                : null;

                await queries.legal.updateLegal({
                    termsOfService,
                    privacyPolicy,
                    refundPolicy,
                    shippingPolicy,
                    grievanceOfficerName,
                    grievanceOfficerEmail,
                    grievanceOfficerPhone,
                    grievanceOfficerAddress,
                    supportEmail,
                    supportPhone,
                    dpdpConsentVersion,
                    isConsumerProtectionPublished,
                    updated,
                });
            } else
                await queries.legal.createLegal({
                    termsOfService,
                    privacyPolicy,
                    refundPolicy,
                    shippingPolicy,
                    grievanceOfficerName,
                    grievanceOfficerEmail,
                    grievanceOfficerPhone,
                    grievanceOfficerAddress,
                    supportEmail,
                    supportPhone,
                    dpdpConsentVersion,
                    isConsumerProtectionPublished,
                });

            await legalCache.remove();
            return true;
        }),
});
