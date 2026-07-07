import { env } from "@/../env";
import { db } from "@/lib/db";
import { financeComplianceQueries } from "@/lib/db/queries/finance-compliance";
import {
    addresses,
    orders,
    reviews,
    userConsents,
    userSupportMessages,
    userSupportTickets,
    users,
    wishlists,
} from "@/lib/db/schema";
import { writeFinanceAuditEvent } from "@/lib/finance/audit";
import { auditAndAlert } from "@/lib/monitoring-sla/audit";
import { posthog } from "@/lib/posthog/client";
import { resend } from "@/lib/resend";
import { eq } from "drizzle-orm";
import { createHash, randomUUID } from "crypto";

const CONSENT_TYPES = [
    "data_processing",
    "marketing_emails",
    "whatsapp_notifications",
    "analytics_tracking",
] as const;

type ConsentType = (typeof CONSENT_TYPES)[number];

function hashValue(value: string) {
    return createHash("sha256").update(value).digest("hex");
}

function buildDeletedEmail(originalEmail: string, userId: string) {
    const digest = hashValue(originalEmail.toLowerCase().trim() || userId);
    return `${digest}@deleted.renivet.com`;
}

async function deleteClerkUser(userId: string) {
    try {
        const response = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${env.CLERK_SECRET_KEY}`,
            },
        });

        if (!response.ok && response.status !== 404) {
            throw new Error(`Clerk delete failed with ${response.status}`);
        }

        return { status: response.status === 404 ? "not_found" : "deleted" };
    } catch (error) {
        return {
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown Clerk error",
        };
    }
}

async function bestEffortJsonRequest(input: {
    url?: string;
    method: string;
    headers?: Record<string, string>;
    body?: Record<string, unknown>;
    disabledReason: string;
}) {
    if (!input.url) {
        return { status: "skipped", reason: input.disabledReason };
    }

    try {
        const response = await fetch(input.url, {
            method: input.method,
            headers: {
                "Content-Type": "application/json",
                ...(input.headers ?? {}),
            },
            body: input.body ? JSON.stringify(input.body) : undefined,
        });

        return {
            status: response.ok ? "ok" : "failed",
            statusCode: response.status,
        };
    } catch (error) {
        return {
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown request error",
        };
    }
}

async function revokeMarketingEmail(email: string) {
    await financeComplianceQueries.syncNewsletterConsent(email, "Deleted User", false);

    return bestEffortJsonRequest({
        url: process.env.BREVO_CONTACT_DELETE_URL,
        method: "DELETE",
        headers: process.env.BREVO_API_KEY
            ? {
                  "api-key": process.env.BREVO_API_KEY,
              }
            : undefined,
        disabledReason: "BREVO_CONTACT_DELETE_URL not configured",
    });
}

async function revokeWhatsapp(phone: string | null) {
    if (!phone) {
        return { status: "skipped", reason: "No phone number on file" };
    }

    return bestEffortJsonRequest({
        url: process.env.AISENSY_OPTOUT_URL,
        method: "POST",
        headers: process.env.AISENSY_API_KEY
            ? {
                  Authorization: `Bearer ${process.env.AISENSY_API_KEY}`,
              }
            : undefined,
        body: {
            phone,
            optOut: true,
        },
        disabledReason: "AISENSY_OPTOUT_URL not configured",
    });
}

async function deletePosthogPerson(distinctId: string) {
    try {
        if (!process.env.POSTHOG_PERSONAL_API_KEY || !process.env.POSTHOG_PROJECT_ID) {
            return { status: "skipped", reason: "PostHog personal API credentials not configured" };
        }

        const host =
            env.NEXT_PUBLIC_POSTHOG_HOST?.replace(/\/$/, "") || "https://us.posthog.com";
        const response = await fetch(
            `${host}/api/projects/${process.env.POSTHOG_PROJECT_ID}/persons/?distinct_id=${encodeURIComponent(distinctId)}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${process.env.POSTHOG_PERSONAL_API_KEY}`,
                },
            }
        );

        if (!response.ok && response.status !== 404) {
            throw new Error(`PostHog delete failed with ${response.status}`);
        }

        await posthog.shutdownAsync();

        return {
            status: response.status === 404 ? "not_found" : "deleted",
        };
    } catch (error) {
        return {
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown PostHog error",
        };
    }
}

async function sendDeletionVerificationEmail(input: {
    email: string;
    requestId: string;
    verificationToken: string;
}) {
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/profile/security?dpdpVerify=${input.verificationToken}`;

    await resend.emails.send({
        from: env.RESEND_EMAIL_FROM,
        to: input.email,
        subject: "Verify your Renivet account deletion request",
        text: `We received a request to delete your Renivet account. Verify it here: ${verifyUrl}\n\nRequest ID: ${input.requestId}\nThis link expires in 24 hours.`,
    });
}

async function sendDeletionCompletionEmail(input: {
    email: string;
    requestId: string;
}) {
    await resend.emails.send({
        from: env.RESEND_EMAIL_FROM,
        to: input.email,
        subject: "Your Renivet deletion request is complete",
        text: `Your Renivet deletion request ${input.requestId} has been completed. Financial and tax records were retained only where required by law, and direct personal data has been anonymized.`,
    });
}

export async function getCurrentDpdpConsentVersion() {
    const legal = await financeComplianceQueries.getLegalContent();
    return legal?.dpdpConsentVersion?.trim() || "privacy-policy-v1";
}

export async function listUserConsentState(userId: string) {
    const [version, rows] = await Promise.all([
        getCurrentDpdpConsentVersion(),
        financeComplianceQueries.listConsents([userId]),
    ]);

    const latestByType = new Map<ConsentType, (typeof rows)[number]>();
    for (const type of CONSENT_TYPES) {
        const row = rows.find((item) => item.consentType === type);
        if (row) {
            latestByType.set(type, row);
        }
    }

    return {
        version,
        consents: CONSENT_TYPES.map((type) => {
            const row = latestByType.get(type);
            const granted = row ? row.consentGiven && !row.revokedAt : type === "data_processing" ? false : false;

            return {
                consentType: type,
                required: type === "data_processing",
                granted,
                consentVersion: row?.consentVersion ?? null,
                needsReconsent:
                    type === "data_processing" &&
                    (!row || row.consentVersion !== version || !granted),
                latestEvent: row ?? null,
            };
        }),
    };
}

export async function recordConsent(input: {
    userId: string;
    consentType: ConsentType;
    consentGiven: boolean;
    source?: string;
    consentVersion?: string;
    ipAddress?: string | null;
    userAgent?: string | null;
}) {
    const version = input.consentVersion ?? (await getCurrentDpdpConsentVersion());
    const user = await db.query.users.findFirst({
        where: eq(users.id, input.userId),
    });

    const row = await financeComplianceQueries.upsertConsent({
        userId: input.userId,
        consentType: input.consentType,
        consentGiven: input.consentGiven,
        consentGivenAt: new Date(),
        consentVersion: version,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        source: input.source ?? "web",
        revokedAt: input.consentGiven ? null : new Date(),
        metadata: {
            required: input.consentType === "data_processing",
        },
    });

    const downstreamActions: Record<string, unknown> = {};

    if (user?.email && input.consentType === "marketing_emails") {
        downstreamActions.marketing = await revokeMarketingEmail(user.email);
    }

    if (!input.consentGiven && input.consentType === "whatsapp_notifications") {
        downstreamActions.whatsapp = await revokeWhatsapp(user?.phone ?? null);
    }

    let deletionRequestId: string | null = null;
    if (!input.consentGiven && input.consentType === "data_processing" && user?.email) {
        const request = await createDeletionRequest({
            userId: input.userId,
            userEmail: user.email,
            notes: "Auto-created from data processing consent revocation.",
            actorId: input.userId,
        });
        deletionRequestId = request.id;
        downstreamActions.autoDeletionRequestId = request.id;
    }

    await writeFinanceAuditEvent({
        actorId: input.userId,
        actionType: "consent.recorded",
        entityType: "user_consent",
        entityId: row.id,
        afterValue: row as Record<string, unknown>,
        metadata: {
            consentType: input.consentType,
            downstreamActions,
            deletionRequestId,
        },
    });

    return {
        consent: row,
        downstreamActions,
        deletionRequestId,
    };
}

export async function createDeletionRequest(input: {
    userId: string;
    userEmail: string;
    notes?: string | null;
    actorId: string;
}) {
    const verificationToken = randomUUID();
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const row = await financeComplianceQueries.createDeletionRequest({
        userId: input.userId,
        userEmail: input.userEmail,
        requestedAt: new Date(),
        status: "identity_check",
        notes: input.notes ?? null,
        verificationToken,
        verificationExpiresAt,
        deletionScope: {},
        retentionScope: {},
        completionEvidence: {},
    });

    await sendDeletionVerificationEmail({
        email: input.userEmail,
        requestId: row.id,
        verificationToken,
    });

    await auditAndAlert({
        actorId: input.actorId,
        actionType: "data_deletion.requested",
        entityType: "data_deletion_request",
        entityId: row.id,
        afterValue: row as Record<string, unknown>,
        reason: input.notes ?? "user_requested_deletion",
        title: "DPDP deletion request created",
        message: `Deletion request ${row.id} is awaiting identity verification.`,
        severity: "info",
        ownerRole: "privacy_admin",
        type: "data_deletion_requested",
        dedupeKey: `dpdp:request:${row.id}`,
        channels: ["admin", "email"],
        metadata: {
            module: "finance_compliance",
            status: row.status,
        },
    });

    return row;
}

export async function verifyDeletionRequest(token: string, actorId?: string | null) {
    const request = await financeComplianceQueries.getDeletionRequestByVerificationToken(token);
    if (!request) {
        throw new Error("Invalid deletion verification token.");
    }
    if (request.verificationExpiresAt && request.verificationExpiresAt.getTime() < Date.now()) {
        throw new Error("Deletion verification token has expired.");
    }

    const updated = await financeComplianceQueries.updateDeletionRequest(request.id, {
        status: "pending",
        identityVerifiedAt: new Date(),
        verificationToken: null,
        verificationExpiresAt: null,
        updatedAt: new Date(),
    });

    await writeFinanceAuditEvent({
        actorId: actorId ?? request.userId,
        actionType: "data_deletion.identity_verified",
        entityType: "data_deletion_request",
        entityId: request.id,
        beforeValue: request as Record<string, unknown>,
        afterValue: updated as Record<string, unknown>,
    });

    return updated;
}

export async function reviewDeletionRequest(input: {
    requestId: string;
    actorId: string;
    status: "pending" | "in_progress" | "rejected";
    notes?: string | null;
    rejectionReason?: string | null;
}) {
    const request = await financeComplianceQueries.getDeletionRequest(input.requestId);
    if (!request) {
        throw new Error("Deletion request not found.");
    }

    if (input.status === "rejected" && !input.rejectionReason) {
        throw new Error("Rejection reason is required.");
    }

    const updated = await financeComplianceQueries.updateDeletionRequest(input.requestId, {
        status: input.status,
        notes: input.notes ?? request.notes ?? null,
        rejectionReason:
            input.status === "rejected"
                ? input.rejectionReason ?? null
                : null,
        executedBy: input.status === "in_progress" ? input.actorId : request.executedBy,
    });

    await writeFinanceAuditEvent({
        actorId: input.actorId,
        actionType: `data_deletion.${input.status}`,
        entityType: "data_deletion_request",
        entityId: input.requestId,
        beforeValue: request as Record<string, unknown>,
        afterValue: updated as Record<string, unknown>,
        reason: input.rejectionReason ?? input.notes ?? null,
    });

    return updated;
}

export async function executeDeletionRequest(requestId: string, actorId: string) {
    const request = await financeComplianceQueries.getDeletionRequest(requestId);
    if (!request) {
        throw new Error("Deletion request not found.");
    }
    if (request.status !== "in_progress" && request.status !== "pending") {
        throw new Error("Deletion request must be verified and under review before execution.");
    }

    const user = await db.query.users.findFirst({
        where: eq(users.id, request.userId),
    });

    if (!user) {
        throw new Error("User not found for deletion request.");
    }

    const originalEmail = request.userEmail || user.email;
    const originalPhone = user.phone;
    const anonymizedEmail = buildDeletedEmail(originalEmail, user.id);

    const result = await db.transaction(async (tx) => {
        await tx
            .update(users)
            .set({
                firstName: "Deleted",
                lastName: "User",
                email: anonymizedEmail,
                phone: null,
                avatarUrl: null,
                updatedAt: new Date(),
            })
            .where(eq(users.id, request.userId));

        await tx
            .update(addresses)
            .set({
                alias: "deleted",
                aliasSlug: `deleted-${request.userId.slice(-6)}`,
                fullName: "Deleted User",
                phone: "0000000000",
                street: "Redacted",
                city: "Redacted",
                state: "Redacted",
                zip: "000000",
                updatedAt: new Date(),
            })
            .where(eq(addresses.userId, request.userId));

        await tx
            .update(orders)
            .set({
                customerGstin: null,
                updatedAt: new Date(),
            })
            .where(eq(orders.userId, request.userId));

        await tx
            .update(reviews)
            .set({
                userId: null,
                authorName: "Deleted User",
                updatedAt: new Date(),
            })
            .where(eq(reviews.userId, request.userId));

        await tx.delete(wishlists).where(eq(wishlists.userId, request.userId));

        await tx
            .update(userSupportTickets)
            .set({
                userId: `deleted:${request.userId}`,
                updatedAt: new Date(),
            })
            .where(eq(userSupportTickets.userId, request.userId));

        await tx
            .update(userSupportMessages)
            .set({
                senderId: `deleted:${request.userId}`,
                updatedAt: new Date(),
            })
            .where(eq(userSupportMessages.senderId, request.userId));

        await tx
            .update(userConsents)
            .set({
                ipAddress: null,
                userAgent: null,
                metadata: {
                    anonymized: true,
                },
                updatedAt: new Date(),
            })
            .where(eq(userConsents.userId, request.userId));

        return true;
    });

    if (!result) {
        throw new Error("Deletion transaction failed.");
    }

    const downstream = {
        clerk: await deleteClerkUser(request.userId),
        brevo: await revokeMarketingEmail(originalEmail),
        aisensy: await revokeWhatsapp(originalPhone),
        posthog: await deletePosthogPerson(request.userId),
    };

    const deletionScope = {
        users: "name,email,phone,avatar anonymized",
        addresses: "address lines and phone anonymized",
        orders: "PII retained only in anonymized form via linked address; finance record preserved",
        reviews: "author anonymized",
        wishlists: "deleted",
        support: "user references anonymized",
        consents: "user reference anonymized",
        downstream,
    };

    const retentionScope = {
        legalBasis: "legal_obligation",
        retentionWindow: "7_years",
        preservedEntities: [
            "orders",
            "refunds",
            "gst_reports",
            "payout_records",
            "audit_logs",
        ],
    };

    const completionEvidence = {
        completedAt: new Date().toISOString(),
        originalEmailHash: hashValue(originalEmail.toLowerCase()),
        anonymizedEmail,
        downstream,
    };

    const updated = await financeComplianceQueries.updateDeletionRequest(request.id, {
        status: "completed",
        completedAt: new Date(),
        executedBy: actorId,
        deletionScope,
        retentionScope,
        completionEvidence,
        error: null,
    });

    await sendDeletionCompletionEmail({
        email: originalEmail,
        requestId: request.id,
    });

    await auditAndAlert({
        actorId,
        actionType: "data_deletion.executed",
        entityType: "data_deletion_request",
        entityId: request.id,
        beforeValue: request as Record<string, unknown>,
        afterValue: updated as Record<string, unknown>,
        reason: "dpdp_deletion_executed",
        title: "DPDP deletion request executed",
        message: `Deletion request ${request.id} completed with retained finance records preserved under legal obligation.`,
        severity: "info",
        ownerRole: "privacy_admin",
        type: "data_deletion_executed",
        dedupeKey: `dpdp:executed:${request.id}`,
        channels: ["admin", "email"],
        metadata: {
            module: "finance_compliance",
            deletionScope,
            retentionScope,
        },
    });

    return updated;
}

export async function runDeletionRequestSlaSweep(actorId: string) {
    const requests = await financeComplianceQueries.listDeletionRequests();
    const now = Date.now();
    const alerts: string[] = [];

    for (const request of requests) {
        if (request.status === "completed" || request.status === "rejected") {
            continue;
        }

        const ageDays = Math.floor(
            (now - request.requestedAt.getTime()) / (24 * 60 * 60 * 1000)
        );

        if (ageDays >= 7) {
            alerts.push(request.id);
            await auditAndAlert({
                actorId,
                actionType: "data_deletion.sla_breached",
                entityType: "data_deletion_request",
                entityId: request.id,
                title: "DPDP deletion SLA breached",
                message: `Deletion request ${request.id} has crossed the 7-day SLA and requires AJ escalation.`,
                severity: "critical",
                ownerRole: "privacy_admin",
                type: "dpdp_sla_breached",
                dedupeKey: `dpdp:sla:7:${request.id}`,
                channels: ["admin", "email", "whatsapp"],
                metadata: {
                    module: "finance_compliance",
                    ageDays,
                },
            });
        } else if (ageDays >= 5) {
            alerts.push(request.id);
            await auditAndAlert({
                actorId,
                actionType: "data_deletion.sla_warning",
                entityType: "data_deletion_request",
                entityId: request.id,
                title: "DPDP deletion SLA warning",
                message: `Deletion request ${request.id} is at day ${ageDays} and must be completed within 7 days.`,
                severity: "warning",
                ownerRole: "privacy_admin",
                type: "dpdp_sla_warning",
                dedupeKey: `dpdp:sla:5:${request.id}`,
                channels: ["admin", "email"],
                metadata: {
                    module: "finance_compliance",
                    ageDays,
                },
            });
        }
    }

    return {
        scanned: requests.length,
        alerts,
    };
}
