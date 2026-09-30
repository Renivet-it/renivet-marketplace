import { BitFieldSitePermission } from "@/config/permissions";
import { db } from "@/lib/db";
import {
    grievanceClaims,
    userSupportMessages,
    userSupportTickets,
} from "@/lib/db/schema";
import {
    canAuthenticatedUserConsumeClaim,
    createGrievanceClaimToken,
    GRIEVANCE_CLAIM_TTL_MS,
    hashGrievanceClaimToken,
    isGrievanceClaimExpired,
} from "@/lib/grievance/claims";
import { decideGuestGrievanceResolution } from "@/lib/grievance/guest-flow";
import { resolveGrievanceIdentity } from "@/lib/grievance/identity";
import {
    grievanceSubmissionSchema,
    normalizeIndianGrievancePhone,
} from "@/lib/grievance/validation";
import {
    auditEntityChange,
    createOperationalAlert,
} from "@/lib/monitoring-sla/audit";
import { legalCache } from "@/lib/redis/methods";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
    publicProcedure,
} from "@/lib/trpc/trpc";
import { createLegalSchema } from "@/lib/validations";
import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";

async function insertGrievanceTicketRecord(
    executor: any,
    input: {
        userId: string;
        actorId: string | null;
        name: string;
        email: string;
        phone: string;
        orderId?: string;
        category: string;
        description: string;
    }
) {
    const now = new Date();
    const ticket = await executor
        .insert(userSupportTickets)
        .values({
            userId: input.userId,
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
                contactPhone: input.phone,
                orderId: input.orderId ?? null,
                grievanceCategory: input.category,
            },
        })
        .returning()
        .then((rows) => rows[0]);

    await executor.insert(userSupportMessages).values({
        ticketId: ticket.id,
        sender: "user",
        senderId: input.userId,
        text: input.description,
        metadata: {
            grievanceCategory: input.category,
            contactName: input.name,
            contactEmail: input.email,
            contactPhone: input.phone,
        },
    });

    return { ticket, createdAt: now };
}

async function recordGrievanceSideEffects(input: {
    ticket: { id: string };
    actorId: string | null;
    orderId?: string;
    category: string;
}) {
    await auditEntityChange({
        actorId: input.actorId,
        actionType: "grievance_submitted",
        entityType: "user_support_ticket",
        entityId: input.ticket.id,
        afterValue: {
            category: "GRIEVANCE",
            priority: "high",
            orderId: input.orderId ?? null,
        },
        reason: "consumer_protection_grievance",
    });

    await createOperationalAlert({
        actorId: input.actorId,
        type: "consumer_grievance_submitted",
        severity: "critical",
        entityType: "user_support_ticket",
        entityId: input.ticket.id,
        title: "Consumer grievance submitted",
        message: "A grievance submission was received.",
        ownerRole: "support_manager",
        channels: ["admin", "email", "whatsapp"],
        dedupeKey: `grievance:${input.ticket.id}`,
        metadata: {
            category: input.category,
            orderId: input.orderId ?? null,
        },
    });
}

async function createGrievanceTicket(input: {
    userId: string;
    actorId: string | null;
    name: string;
    email: string;
    phone: string;
    orderId?: string;
    category: string;
    description: string;
}) {
    const { ticket } = await insertGrievanceTicketRecord(db, input);
    await recordGrievanceSideEffects({
        ticket,
        actorId: input.actorId,
        orderId: input.orderId,
        category: input.category,
    });
    return ticket;
}

async function createPendingGrievanceClaim(input: {
    name: string;
    email: string;
    phone: string;
    orderId?: string;
    category: string;
    description: string;
    expectedUserId: string | null;
    accountCreationConsent: boolean;
}) {
    const claimToken = createGrievanceClaimToken();
    await db.insert(grievanceClaims).values({
        tokenHash: hashGrievanceClaimToken(claimToken),
        name: input.name,
        email: input.email,
        phone: input.phone,
        orderId: input.orderId ?? null,
        category: input.category,
        description: input.description,
        expectedUserId: input.expectedUserId,
        consentedAt: input.accountCreationConsent ? new Date() : null,
        expiresAt: new Date(Date.now() + GRIEVANCE_CLAIM_TTL_MS),
    });
    return claimToken;
}

export const legalRouter = createTRPCRouter({
    getLegal: publicProcedure.query(async () => {
        const legal = await legalCache.get();
        return legal;
    }),
    getActiveLegalContacts: publicProcedure.query(async ({ ctx }) => {
        return ctx.queries.financeCompliance.getActiveLegalContacts();
    }),
    submitGrievance: publicProcedure
        .input(grievanceSubmissionSchema)
        .mutation(async ({ ctx, input }) => {
            if (ctx.user) {
                const ticket = await createGrievanceTicket({
                    userId: ctx.user.id,
                    actorId: ctx.user.id,
                    ...input,
                });
                return { success: true, ticketId: ticket.id };
            }

            const identity = await resolveGrievanceIdentity(
                { email: input.email, phone: input.phone },
                async () => {
                    const localUsers = await db.query.users.findMany({
                        columns: { id: true, email: true, phone: true },
                    });

                    try {
                        const client = await clerkClient();
                        const [emailMatches, phoneMatches] = await Promise.all([
                            client.users.getUserList({
                                emailAddress: [
                                    input.email.trim().toLowerCase(),
                                ],
                                limit: 10,
                            }),
                            client.users.getUserList({
                                phoneNumber: [
                                    normalizeIndianGrievancePhone(input.phone),
                                ],
                                limit: 10,
                            }),
                        ]);
                        const clerkUsers = new Map(
                            [...emailMatches.data, ...phoneMatches.data].map(
                                (user) => [user.id, user]
                            )
                        );

                        return localUsers.map((user) => {
                            const clerkUser = clerkUsers.get(user.id);
                            if (!clerkUser) return user;
                            return {
                                ...user,
                                emails: clerkUser.emailAddresses.map(
                                    (email) => email.emailAddress
                                ),
                                phones: clerkUser.phoneNumbers.map(
                                    (phone) => phone.phoneNumber
                                ),
                            };
                        });
                    } catch {
                        // A temporary Clerk lookup failure must not block a
                        // grievance; local identity matching remains available.
                        return localUsers;
                    }
                }
            );
            const decision = decideGuestGrievanceResolution(
                identity,
                input.accountCreationConsent
            );

            if (decision.kind === "consent_required") {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message:
                        "Please accept the account-tracking notice to continue.",
                });
            }

            if (decision.kind === "link_existing") {
                const claimToken = await createPendingGrievanceClaim({
                    ...input,
                    expectedUserId: decision.userId,
                });
                return {
                    success: true,
                    requiresAccountAccess: true,
                    accessPath: `/auth/signin?redirect_url=${encodeURIComponent(`/profile/grievances?claim=${encodeURIComponent(claimToken)}`)}`,
                };
            }

            if (decision.kind === "support_review") {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message:
                        "We could not verify these details against one account.",
                });
            }

            const claimToken = await createPendingGrievanceClaim({
                ...input,
                expectedUserId: null,
            });

            const redirectPath = `/profile/grievances?claim=${encodeURIComponent(claimToken)}`;
            return {
                success: true,
                requiresAccountCreation: true,
                accessPath: `/auth/signup?redirect_url=${encodeURIComponent(redirectPath)}`,
            };
        }),
    claimGuestGrievance: protectedProcedure
        .input(z.object({ token: z.string().min(40) }))
        .mutation(async ({ ctx, input }) => {
            const now = new Date();
            const ticket = await db.transaction(async (tx) => {
                const claim = await tx.query.grievanceClaims.findFirst({
                    where: and(
                        eq(
                            grievanceClaims.tokenHash,
                            hashGrievanceClaimToken(input.token)
                        ),
                        isNull(grievanceClaims.consumedAt)
                    ),
                });

                if (!claim || isGrievanceClaimExpired(now, claim.expiresAt)) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message:
                            "This grievance access link is invalid or expired.",
                    });
                }

                if (
                    !canAuthenticatedUserConsumeClaim(claim, {
                        id: ctx.user.id,
                        email: ctx.user.email,
                        phone: ctx.user.phone,
                    })
                ) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message:
                            "This grievance must be completed with the matching account.",
                    });
                }

                const claimed = await tx
                    .update(grievanceClaims)
                    .set({
                        consumedAt: now,
                        consumedByUserId: ctx.user.id,
                        updatedAt: now,
                    })
                    .where(
                        and(
                            eq(grievanceClaims.id, claim.id),
                            isNull(grievanceClaims.consumedAt)
                        )
                    )
                    .returning()
                    .then((rows) => rows[0]);

                if (!claimed) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message:
                            "This grievance access link is invalid or expired.",
                    });
                }

                const { ticket } = await insertGrievanceTicketRecord(tx, {
                    userId: ctx.user.id,
                    actorId: ctx.user.id,
                    name: claimed.name,
                    email: claimed.email,
                    phone: claimed.phone,
                    orderId: claimed.orderId ?? undefined,
                    category: claimed.category,
                    description: claimed.description,
                });

                await tx
                    .update(grievanceClaims)
                    .set({ ticketId: ticket.id, updatedAt: new Date() })
                    .where(eq(grievanceClaims.id, claimed.id));

                return { ticket, claim: claimed };
            });

            await recordGrievanceSideEffects({
                ticket: ticket.ticket,
                actorId: ctx.user.id,
                orderId: ticket.claim.orderId ?? undefined,
                category: ticket.claim.category,
            });

            return { success: true, ticketId: ticket.ticket.id };
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
