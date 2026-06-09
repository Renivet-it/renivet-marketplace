import { env } from "@/../env";
import { db } from "@/lib/db";
import { brandMembers, brands, notifications, users } from "@/lib/db/schema";
import { resend } from "@/lib/resend";
import { SupportNotificationEmail } from "@/lib/resend/emails";
import { getAbsoluteURL } from "@/lib/utils";
import { eq, inArray } from "drizzle-orm";

type NotificationSeed = {
    recipientId: string;
    actorId?: string | null;
    audience: "user" | "admin" | "brand";
    type: string;
    title: string;
    body: string;
    href?: string | null;
    metadata?: Record<string, unknown> | null;
};

export async function createNotifications(entries: NotificationSeed[]) {
    if (!entries.length) return [];

    return db
        .insert(notifications)
        .values(
            entries.map((entry) => ({
                recipientId: entry.recipientId,
                actorId: entry.actorId ?? null,
                audience: entry.audience,
                type: entry.type,
                title: entry.title,
                body: entry.body,
                href: entry.href ?? null,
                metadata: entry.metadata ?? null,
            }))
        )
        .returning();
}

async function sendSupportEmail({
    to,
    subject,
    intro,
    details,
    href,
    actionLabel,
    eyebrow,
    footerNote,
}: {
    to: string[];
    subject: string;
    intro: string;
    details: string[];
    href?: string | null;
    actionLabel?: string;
    eyebrow?: string;
    footerNote?: string;
}) {
    if (!to.length) return;

    const lines = [intro, "", ...details];
    if (href) {
        lines.push(
            "",
            `Open case: ${href.startsWith("http") ? href : getAbsoluteURL(href)}`
        );
    }

    await resend.emails.send({
        from: env.RESEND_EMAIL_FROM,
        to,
        subject,
        react: SupportNotificationEmail({
            subject,
            intro,
            details,
            href,
            actionLabel,
            eyebrow,
            footerNote,
        }),
        text: lines.join("\n"),
    });
}

export async function getAdminRecipients() {
    const supportForwardEmails = [
        "akshay@renivet.com",
        "ayanganguly333@gmail.com",
        "belmontdark8@gmail.com",
    ];

    return db.query.users.findMany({
        where: inArray(users.email, supportForwardEmails),
    });
}

export async function getBrandRecipients(brandId: string) {
    const brand = await db.query.brands.findFirst({
        where: eq(brands.id, brandId),
        with: {
            owner: true,
        },
    });

    const members = await db
        .select({
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
        })
        .from(brandMembers)
        .innerJoin(users, eq(brandMembers.memberId, users.id))
        .where(eq(brandMembers.brandId, brandId));

    const deduped = new Map<
        string,
        { id: string; email: string; firstName: string; lastName: string }
    >();

    if (brand?.owner) {
        deduped.set(brand.owner.id, {
            id: brand.owner.id,
            email: brand.owner.email,
            firstName: brand.owner.firstName,
            lastName: brand.owner.lastName,
        });
    }

    for (const member of members) {
        deduped.set(member.id, member);
    }

    return Array.from(deduped.values());
}

export async function notifyAdmins(input: {
    actorId?: string | null;
    type: string;
    title: string;
    body: string;
    href?: string | null;
    emailSubject: string;
    emailIntro: string;
    emailDetails: string[];
    metadata?: Record<string, unknown> | null;
}) {
    const admins = await getAdminRecipients();

    await createNotifications(
        admins.map((admin) => ({
            recipientId: admin.id,
            actorId: input.actorId ?? null,
            audience: "admin" as const,
            type: input.type,
            title: input.title,
            body: input.body,
            href: input.href ?? null,
            metadata: input.metadata ?? null,
        }))
    );

    const emails = Array.from(
        new Set(admins.map((admin) => admin.email))
    ).filter(Boolean);

    await sendSupportEmail({
        to: emails,
        subject: input.emailSubject,
        intro: input.emailIntro,
        details: input.emailDetails,
        href: input.href ?? null,
        actionLabel: "Open support desk",
        eyebrow: "Internal Support Forward",
        footerNote:
            "This is an automated support-forwarding email from the Renivet support system.",
    });
}

export async function notifyUser(input: {
    userId: string;
    actorId?: string | null;
    type: string;
    title: string;
    body: string;
    href?: string | null;
    emailSubject: string;
    emailIntro: string;
    emailDetails: string[];
    metadata?: Record<string, unknown> | null;
}) {
    const user = await db.query.users.findFirst({
        where: eq(users.id, input.userId),
    });

    if (!user) return;

    await createNotifications([
        {
            recipientId: user.id,
            actorId: input.actorId ?? null,
            audience: "user",
            type: input.type,
            title: input.title,
            body: input.body,
            href: input.href ?? null,
            metadata: input.metadata ?? null,
        },
    ]);

    await sendSupportEmail({
        to: [user.email],
        subject: input.emailSubject,
        intro: input.emailIntro,
        details: input.emailDetails,
        href: input.href ?? null,
        actionLabel: "Open support case",
        eyebrow: "Customer Support Update",
    });
}

export async function notifyBrandUsers(input: {
    brandId: string;
    actorId?: string | null;
    type: string;
    title: string;
    body: string;
    href?: string | null;
    emailSubject: string;
    emailIntro: string;
    emailDetails: string[];
    metadata?: Record<string, unknown> | null;
}) {
    const recipients = await getBrandRecipients(input.brandId);
    if (!recipients.length) return;

    await createNotifications(
        recipients.map((recipient) => ({
            recipientId: recipient.id,
            actorId: input.actorId ?? null,
            audience: "brand" as const,
            type: input.type,
            title: input.title,
            body: input.body,
            href: input.href ?? null,
            metadata: input.metadata ?? null,
        }))
    );

    await sendSupportEmail({
        to: recipients.map((recipient) => recipient.email),
        subject: input.emailSubject,
        intro: input.emailIntro,
        details: input.emailDetails,
        href: input.href ?? null,
        actionLabel: "Open support workspace",
        eyebrow: "Brand Support Update",
    });
}

export function buildSupportHref(ticketId: string) {
    return `/profile/help-center/${ticketId}`;
}

export function buildAdminSupportHref(
    ticketId: string,
    queue: "user" | "brand" | "disputes" = "user"
) {
    return `/dashboard/general/support?queue=${queue}&ticket=${ticketId}`;
}

export function buildBrandSupportHref(brandId: string, ticketId: string) {
    return `/dashboard/brands/${brandId}/support?queue=support&ticket=${ticketId}`;
}

export function buildBrandDisputeHref(brandId: string, disputeId: string) {
    return `/dashboard/brands/${brandId}/support?queue=disputes&ticket=${disputeId}`;
}
