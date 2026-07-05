import { financeComplianceQueries } from "@/lib/db/queries/finance-compliance";
import { db } from "@/lib/db";
import { addresses, orders, users } from "@/lib/db/schema";
import { auditAndAlert } from "@/lib/monitoring-sla/audit";
import { eq } from "drizzle-orm";

async function anonymizeUserCore(userId: string) {
    const maskedEmail = `deleted+${userId}@renivet.local`;
    const maskedPhone = `000000${userId.slice(-4)}`;

    await Promise.all([
        db
            .update(users)
            .set({
                firstName: "Deleted",
                lastName: "User",
                email: maskedEmail,
                phone: maskedPhone,
                avatarUrl: null,
                updatedAt: new Date(),
            })
            .where(eq(users.id, userId)),
        db
            .update(addresses)
            .set({
                alias: "deleted",
                aliasSlug: "deleted",
                fullName: "Deleted User",
                phone: maskedPhone,
                street: "Redacted",
                city: "Redacted",
                state: "Redacted",
                zip: "000000",
                updatedAt: new Date(),
            })
            .where(eq(addresses.userId, userId)),
        db
            .update(orders)
            .set({
                customerGstin: null,
                updatedAt: new Date(),
            })
            .where(eq(orders.userId, userId)),
    ]);

    return {
        maskedEmail,
        maskedPhone,
    };
}

export async function recordConsent(input: {
    userId: string;
    consentType: string;
    version: string;
    source: string;
    isGranted: boolean;
}) {
    const row = await financeComplianceQueries.upsertConsent({
        userId: input.userId,
        consentType: input.consentType,
        version: input.version,
        source: input.source,
        isGranted: input.isGranted,
        grantedAt: new Date(),
        revokedAt: input.isGranted ? null : new Date(),
        metadata: {
            propagatedNewsletter: input.consentType === "marketing",
        },
    });

    const user = await db.query.users.findFirst({
        where: eq(users.id, input.userId),
    });

    if (user?.email && input.consentType === "marketing") {
        await financeComplianceQueries.syncNewsletterConsent(
            user.email,
            `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "User",
            input.isGranted
        );
    }

    return row;
}

export async function executeDeletionRequest(requestId: string, actorId: string) {
    const request = await financeComplianceQueries.getDeletionRequest(requestId);
    if (!request) {
        throw new Error("Deletion request not found.");
    }
    if (!["approved", "processing"].includes(request.status)) {
        throw new Error("Deletion request must be approved before execution.");
    }

    const user = await db.query.users.findFirst({
        where: eq(users.id, request.userId),
    });

    await financeComplianceQueries.updateDeletionRequest(request.id, {
        status: "processing",
        reviewedBy: actorId,
        reviewedAt: new Date(),
    });

    const anonymized = await anonymizeUserCore(request.userId);
    const evidence = {
        anonymizedAt: new Date().toISOString(),
        userId: request.userId,
        maskedEmail: anonymized.maskedEmail,
        downstream: {
            clerk: "manual_follow_up_required",
            posthog: "manual_follow_up_required",
            resend: "manual_follow_up_required",
            newsletter: user?.email ? "suppressed" : "not_found",
        },
    };

    const updated = await financeComplianceQueries.updateDeletionRequest(request.id, {
        status: "completed",
        executedAt: new Date(),
        completionEvidence: evidence,
        error: null,
    });

    await auditAndAlert({
        actorId,
        actionType: "data_deletion_executed",
        entityType: "data_deletion_request",
        entityId: request.id,
        beforeValue: request as Record<string, unknown>,
        afterValue: updated as Record<string, unknown>,
        reason: "dpdp_deletion_executed",
        title: "DPDP deletion request executed",
        message: `Deletion request ${request.id} was completed with retained finance-record anonymization.`,
        severity: "info",
        ownerRole: "privacy_admin",
        type: "data_deletion_executed",
        dedupeKey: `dpdp:executed:${request.id}`,
        channels: ["admin", "email"],
        metadata: {
            module: "finance_compliance",
            evidence,
        },
    });

    return updated;
}
