import { env } from "@/../env";
import { POSTHOG_EVENTS } from "@/config/posthog";
import { db } from "@/lib/db";
import {
    emailMessageLogs,
    marketingAutomationRuns,
    marketingCampaigns,
    newsletterSubscribers,
} from "@/lib/db/schema";
import { posthog } from "@/lib/posthog/client";
import { mediaCache } from "@/lib/redis/methods";
import { resend } from "@/lib/resend";
import { BlogDigestEmail, NewArrivalsDigestEmail } from "@/lib/resend/emails";
import { getAbsoluteURL } from "@/lib/utils";
import { SignJWT, jwtVerify } from "jose";
import { and, desc, eq, gte, or } from "drizzle-orm";
import React from "react";

export const MARKETING_CAMPAIGN_TYPES = [
    "welcome",
    "new_arrivals",
    "blog_digest",
    "promotional",
    "abandoned_cart",
    "post_purchase_review",
    "win_back",
] as const;

export type MarketingCampaignType = (typeof MARKETING_CAMPAIGN_TYPES)[number];

const GUARDED_MARKETING_TYPES: MarketingCampaignType[] = [
    "new_arrivals",
    "blog_digest",
    "promotional",
    "abandoned_cart",
    "post_purchase_review",
    "win_back",
];

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;

function getTokenSecret() {
    return new TextEncoder().encode(env.JWT_SECRET_KEY);
}

export async function buildUnsubscribeToken(email: string) {
    return new SignJWT({ email, scope: "newsletter-unsubscribe" })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
        .sign(getTokenSecret());
}

export async function verifyUnsubscribeToken(token: string) {
    const { payload } = await jwtVerify(token, getTokenSecret());
    if (payload.scope !== "newsletter-unsubscribe" || !payload.email) {
        throw new Error("Invalid unsubscribe token");
    }

    return {
        email: String(payload.email),
    };
}

export async function buildUnsubscribeUrl(email: string) {
    const token = await buildUnsubscribeToken(email);
    return getAbsoluteURL(`/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`);
}

export async function ensureSubscriber(input: {
    email: string;
    name?: string | null;
    source?: string;
    segments?: string[];
}) {
    const existing = await db.query.newsletterSubscribers.findFirst({
        where: eq(newsletterSubscribers.email, input.email),
    });

    if (existing) return existing;

    return db
        .insert(newsletterSubscribers)
        .values({
            email: input.email,
            name: input.name?.trim() || "Subscriber",
            source: input.source ?? "marketing",
            segments: input.segments ?? [],
        })
        .returning()
        .then((rows) => rows[0]);
}

export async function createMarketingCampaign(input: {
    name: string;
    type: MarketingCampaignType;
    subject: string;
    contentHtml?: string;
    createdBy?: string | null;
    status?: "draft" | "scheduled" | "sending" | "completed" | "failed";
    metadata?: Record<string, unknown>;
}) {
    return db
        .insert(marketingCampaigns)
        .values({
            name: input.name,
            type: input.type,
            subject: input.subject,
            contentHtml: input.contentHtml ?? "",
            createdBy: input.createdBy ?? null,
            status: input.status ?? "draft",
            metadata: input.metadata ?? {},
        })
        .returning()
        .then((rows) => rows[0]);
}

export async function updateMarketingCampaignStatus(
    campaignId: string,
    status: "draft" | "scheduled" | "sending" | "completed" | "failed"
) {
    return db
        .update(marketingCampaigns)
        .set({
            status,
            updatedAt: new Date(),
        })
        .where(eq(marketingCampaigns.id, campaignId));
}

async function getRecentMarketingSendCount(email: string) {
    const windowStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await db.query.emailMessageLogs.findMany({
        where: and(
            eq(emailMessageLogs.email, email),
            eq(emailMessageLogs.success, true),
            gte(emailMessageLogs.sentAt, windowStart),
            or(
                eq(emailMessageLogs.campaignType, "new_arrivals"),
                eq(emailMessageLogs.campaignType, "blog_digest"),
                eq(emailMessageLogs.campaignType, "promotional"),
                eq(emailMessageLogs.campaignType, "abandoned_cart"),
                eq(emailMessageLogs.campaignType, "post_purchase_review"),
                eq(emailMessageLogs.campaignType, "win_back")
            )
        ),
        orderBy: [desc(emailMessageLogs.sentAt)],
    });

    return rows.length;
}

export async function logEmailSend(input: {
    email: string;
    firstName?: string | null;
    subscriberId?: string | null;
    subject: string;
    emailContent: string;
    campaignType?: MarketingCampaignType | null;
    campaignId?: string | null;
    automationKey?: string | null;
    stepNumber?: number | null;
    status: string;
    success: boolean;
    messageId?: string | null;
    error?: string | null;
    attempts?: number;
    metadata?: Record<string, unknown>;
    sentAt?: Date;
}) {
    return db
        .insert(emailMessageLogs)
        .values({
            email: input.email,
            firstName: input.firstName ?? null,
            subscriberId: input.subscriberId ?? null,
            subject: input.subject,
            emailContent: input.emailContent,
            campaignType: input.campaignType ?? null,
            campaignId: input.campaignId ?? null,
            automationKey: input.automationKey ?? null,
            stepNumber: input.stepNumber ?? null,
            status: input.status,
            success: input.success,
            messageId: input.messageId ?? null,
            error: input.error ?? null,
            attempts: input.attempts ?? 1,
            metadata: input.metadata ?? {},
            sentAt: input.sentAt ?? new Date(),
        })
        .returning()
        .then((rows) => rows[0]);
}

export async function sendMarketingEmail(input: {
    email: string;
    firstName?: string | null;
    name?: string | null;
    subject: string;
    emailContent: string;
    campaignType: MarketingCampaignType;
    campaignId?: string | null;
    automationKey?: string | null;
    stepNumber?: number | null;
    attempts?: number;
    metadata?: Record<string, unknown>;
    source?: string;
    segments?: string[];
    respectFrequencyCap?: boolean;
    bypassSubscriberGuards?: boolean;
    react?: React.ReactElement;
}) {
    const subscriber = await ensureSubscriber({
        email: input.email,
        name: input.name ?? input.firstName ?? "Subscriber",
        source: input.source ?? "marketing",
        segments: input.segments ?? [],
    });

    const guarded = GUARDED_MARKETING_TYPES.includes(input.campaignType);
    if (guarded) {
        if (!input.bypassSubscriberGuards && !subscriber.isActive) {
            const log = await logEmailSend({
                email: input.email,
                firstName: input.firstName,
                subscriberId: subscriber.id,
                subject: input.subject,
                emailContent: input.emailContent,
                campaignType: input.campaignType,
                campaignId: input.campaignId,
                automationKey: input.automationKey,
                stepNumber: input.stepNumber,
                status: "skipped_inactive",
                success: false,
                error: "Subscriber is inactive",
                attempts: input.attempts,
                metadata: input.metadata,
            });

            return { ok: false as const, reason: "inactive", log };
        }

        if (
            !input.bypassSubscriberGuards &&
            input.respectFrequencyCap !== false
        ) {
            const recentCount = await getRecentMarketingSendCount(input.email);
            if (recentCount >= 2) {
                const log = await logEmailSend({
                    email: input.email,
                    firstName: input.firstName,
                    subscriberId: subscriber.id,
                    subject: input.subject,
                    emailContent: input.emailContent,
                    campaignType: input.campaignType,
                    campaignId: input.campaignId,
                    automationKey: input.automationKey,
                    stepNumber: input.stepNumber,
                    status: "skipped_frequency_cap",
                    success: false,
                    error: "Subscriber reached marketing send cap",
                    attempts: input.attempts,
                    metadata: {
                        ...(input.metadata ?? {}),
                        recentMarketingSendCount: recentCount,
                    },
                });

                return { ok: false as const, reason: "frequency_cap", log };
            }
        }
    }

    try {
        const result = await resend.emails.send({
            from: env.RESEND_EMAIL_FROM,
            to: input.email,
            subject: input.subject,
            react: input.react,
        });

        const success = !result.error;
        const log = await logEmailSend({
            email: input.email,
            firstName: input.firstName,
            subscriberId: subscriber.id,
            subject: input.subject,
            emailContent: input.emailContent,
            campaignType: input.campaignType,
            campaignId: input.campaignId,
            automationKey: input.automationKey,
            stepNumber: input.stepNumber,
            status: success ? "sent" : "failed",
            success,
            messageId: result.data?.id ?? null,
            error: result.error?.message ?? null,
            attempts: input.attempts,
            metadata: input.metadata,
        });

        return {
            ok: success as true,
            reason: success ? null : "provider_error",
            log,
            subscriber,
        };
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Failed to send email";
        const log = await logEmailSend({
            email: input.email,
            firstName: input.firstName,
            subscriberId: subscriber.id,
            subject: input.subject,
            emailContent: input.emailContent,
            campaignType: input.campaignType,
            campaignId: input.campaignId,
            automationKey: input.automationKey,
            stepNumber: input.stepNumber,
            status: "failed",
            success: false,
            error: message,
            attempts: input.attempts,
            metadata: input.metadata,
        });

        return { ok: false as const, reason: "exception", log, subscriber };
    }
}

export async function unsubscribeByEmail(email: string) {
    const subscriber = await db.query.newsletterSubscribers.findFirst({
        where: eq(newsletterSubscribers.email, email),
    });

    if (!subscriber) return null;

    const updated = await db
        .update(newsletterSubscribers)
        .set({
            isActive: false,
            unsubscribedAt: new Date(),
            updatedAt: new Date(),
        })
        .where(eq(newsletterSubscribers.email, email))
        .returning()
        .then((rows) => rows[0]);

    posthog.capture({
        event: POSTHOG_EVENTS.NEWSLETTER.UNSUBSCRIBED,
        distinctId: updated.id,
        properties: {
            email: updated.email,
            source: "signed_unsubscribe_link",
        },
    });

    return updated;
}

export async function upsertAutomationRun(input: {
    automationType: "abandoned_cart" | "post_purchase_review" | "win_back";
    automationKey: string;
    email: string;
    userId?: string | null;
    subscriberId?: string | null;
    campaignId?: string | null;
    stepNumber?: number;
    status?: "pending" | "sent" | "skipped" | "stopped" | "failed";
    error?: string | null;
    metadata?: Record<string, unknown>;
    sentAt?: Date | null;
}) {
    const existing = await db.query.marketingAutomationRuns.findFirst({
        where: eq(marketingAutomationRuns.automationKey, input.automationKey),
    });

    if (existing) {
        return db
            .update(marketingAutomationRuns)
            .set({
                status: input.status ?? existing.status,
                error: input.error ?? existing.error,
                metadata: input.metadata ?? existing.metadata,
                sentAt: input.sentAt ?? existing.sentAt,
                lastAttemptAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(marketingAutomationRuns.id, existing.id))
            .returning()
            .then((rows) => rows[0]);
    }

    return db
        .insert(marketingAutomationRuns)
        .values({
            automationType: input.automationType,
            automationKey: input.automationKey,
            email: input.email,
            userId: input.userId ?? null,
            subscriberId: input.subscriberId ?? null,
            campaignId: input.campaignId ?? null,
            stepNumber: input.stepNumber ?? 1,
            status: input.status ?? "pending",
            error: input.error ?? null,
            metadata: input.metadata ?? {},
            sentAt: input.sentAt ?? null,
            lastAttemptAt: new Date(),
        })
        .returning()
        .then((rows) => rows[0]);
}

function priceLabelFromPaise(value?: number | null) {
    if (!value || value <= 0) return null;
    return `INR ${(value / 100).toFixed(0)}`;
}

function stripHtml(value?: string | null) {
    if (!value) return null;

    return value
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, "\"")
        .replace(/&#39;/gi, "'")
        .replace(/\s+/g, " ")
        .trim();
}

function limitWords(value?: string | null, maxWords = 30) {
    if (!value) return null;

    const words = value.trim().split(/\s+/);
    if (words.length <= maxWords) return value.trim();

    return `${words.slice(0, maxWords).join(" ")}...`;
}

function parseManualRecipients(value: unknown) {
    if (!Array.isArray(value)) return [];

    const seen = new Set<string>();

    return value
        .map((entry) => String(entry ?? "").trim().toLowerCase())
        .filter((email) => {
            if (!email) return false;
            const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            if (!valid || seen.has(email)) return false;
            seen.add(email);
            return true;
        })
        .map((email) => ({
            email,
            name: email.split("@")[0]?.replace(/[._-]+/g, " ") || "Subscriber",
        }));
}

async function getCampaignDigestContent(campaignId: string) {
    const campaign = await db.query.marketingCampaigns.findFirst({
        where: eq(marketingCampaigns.id, campaignId),
    });

    if (!campaign) {
        throw new Error("Marketing campaign not found");
    }

    if (campaign.type !== "new_arrivals" && campaign.type !== "blog_digest") {
        throw new Error("Only digest campaigns are supported by this sender");
    }

    const metadata = campaign.metadata ?? {};
    const defaultLimit = Math.max(1, Number(metadata.defaultLimit ?? 6));
    const selectedProductIds = Array.isArray(metadata.featuredProductIds)
        ? metadata.featuredProductIds.map(String)
        : [];
    const selectedBlogIds = Array.isArray(metadata.featuredBlogIds)
        ? metadata.featuredBlogIds.map(String)
        : [];

    if (campaign.type === "new_arrivals") {
        const rows = selectedProductIds.length
            ? await db.query.products.findMany({
                  where: (product, { and, eq, inArray }) =>
                      and(
                          inArray(product.id, selectedProductIds),
                          eq(product.isPublished, true),
                          eq(product.isActive, true)
                      ),
                  with: {
                      brand: true,
                      variants: true,
                  },
                  orderBy: (product, { desc }) => [desc(product.publishedAt)],
              })
            : await db.query.products.findMany({
                  where: (product, { and, eq }) =>
                      and(
                          eq(product.isPublished, true),
                          eq(product.isActive, true)
                      ),
                  with: {
                      brand: true,
                      variants: true,
                  },
                  orderBy: (product, { desc }) => [desc(product.publishedAt)],
                  limit: defaultLimit,
              });

        const mediaIds = new Set<string>();
        for (const row of rows) {
            for (const media of row.media ?? []) {
                if (media?.id) mediaIds.add(media.id);
            }
            for (const variant of row.variants ?? []) {
                if (variant.image) mediaIds.add(variant.image);
            }
        }

        const mediaItems = await mediaCache.getByIds(Array.from(mediaIds));
        const mediaMap = new Map(mediaItems.data.map((item) => [item.id, item]));

        return {
            campaign,
            items: rows.map((row) => ({
                title: row.title,
                description: limitWords(stripHtml(row.description), 30),
                url: getAbsoluteURL(`/products/${row.slug}`),
                brandName: row.brand?.name ?? null,
                priceLabel: priceLabelFromPaise(row.price),
                imageUrl:
                    row.media?.[0]?.id
                        ? (mediaMap.get(row.media[0].id)?.url ?? null)
                        : row.variants?.find((variant) => variant.image)?.image
                          ? (mediaMap.get(
                                row.variants.find((variant) => variant.image)?.image ?? ""
                            )?.url ?? null)
                          : null,
                imageAlt:
                    row.media?.[0]?.id
                        ? (mediaMap.get(row.media[0].id)?.alt ?? row.title)
                        : row.title,
            })),
        };
    }

    const rows = selectedBlogIds.length
        ? await db.query.blogs.findMany({
              where: (blog, { and, eq, inArray }) =>
                  and(inArray(blog.id, selectedBlogIds), eq(blog.isPublished, true)),
              orderBy: (blog, { desc }) => [desc(blog.publishedAt)],
          })
        : await db.query.blogs.findMany({
              where: (blog, { eq }) => eq(blog.isPublished, true),
              orderBy: (blog, { desc }) => [desc(blog.publishedAt)],
              limit: defaultLimit,
          });

    return {
        campaign,
        items: rows.map((row) => ({
            title: row.title,
            description: row.metaDescription ?? row.description,
            url: getAbsoluteURL(`/blogs/${row.slug}`),
            targetKeyword: row.targetKeyword,
            imageUrl: row.thumbnailUrl,
            imageAlt: row.thumbnailAltText ?? row.title,
        })),
    };
}

export async function sendDigestCampaign(campaignId: string) {
    const { campaign, items } = await getCampaignDigestContent(campaignId);
    const audienceType =
        campaign.metadata?.audienceType === "manual" ? "manual" : "subscribers";
    const manualRecipients = parseManualRecipients(
        campaign.metadata?.manualRecipients
    );
    const subscribers =
        audienceType === "manual"
            ? manualRecipients.map((recipient) => ({
                  email: recipient.email,
                  name: recipient.name,
                  segments: [] as string[],
              }))
            : await db.query.newsletterSubscribers.findMany({
                  where: eq(newsletterSubscribers.isActive, true),
                  orderBy: [desc(newsletterSubscribers.createdAt)],
              });

    if (items.length === 0) {
        await updateMarketingCampaignStatus(campaignId, "failed");
        return {
            campaignId,
            type: campaign.type,
            sent: 0,
            skipped: 0,
            failed: 0,
            message: "No digest content available for this campaign",
        };
    }

    if (subscribers.length === 0) {
        await updateMarketingCampaignStatus(campaignId, "failed");
        return {
            campaignId,
            type: campaign.type,
            sent: 0,
            skipped: 0,
            failed: 0,
            message:
                audienceType === "manual"
                    ? "No valid manual recipient emails were provided"
                    : "No active subscribers available for this campaign",
        };
    }

    await updateMarketingCampaignStatus(campaignId, "sending");

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const subscriber of subscribers) {
        const unsubscribeUrl = await buildUnsubscribeUrl(subscriber.email);
        const intro =
            typeof campaign.metadata?.intro === "string"
                ? campaign.metadata.intro
                : undefined;
        const result = await sendMarketingEmail({
            email: subscriber.email,
            firstName: subscriber.name,
            name: subscriber.name,
            subject: campaign.subject,
            emailContent: campaign.contentHtml,
            campaignType: campaign.type,
            campaignId: campaign.id,
            source: "scheduled_campaign",
            segments: subscriber.segments ?? [],
            respectFrequencyCap: audienceType !== "manual",
            bypassSubscriberGuards: audienceType === "manual",
            metadata: {
                ...campaign.metadata,
                digestItemCount: items.length,
                audienceType,
            },
            react:
                campaign.type === "new_arrivals"
                    ? React.createElement(NewArrivalsDigestEmail, {
                          firstName: subscriber.name,
                          intro,
                          ctaUrl: getAbsoluteURL("/shop?sort=newest"),
                          products: items,
                          unsubscribeUrl,
                      })
                    : React.createElement(BlogDigestEmail, {
                          firstName: subscriber.name,
                          intro,
                          ctaUrl: getAbsoluteURL("/blogs"),
                          posts: items,
                          unsubscribeUrl,
                      }),
        });

        if (result.ok) {
            sent += 1;
        } else if (
            result.reason === "inactive" ||
            result.reason === "frequency_cap"
        ) {
            skipped += 1;
        } else {
            failed += 1;
        }
    }

    await updateMarketingCampaignStatus(
        campaignId,
        failed > 0 && sent === 0 ? "failed" : "completed"
    );

    return {
        campaignId,
        type: campaign.type,
        sent,
        skipped,
        failed,
        message:
            failed > 0
                ? `Sent ${sent}, skipped ${skipped}, failed ${failed}`
                : `Sent ${sent}, skipped ${skipped}`,
    };
}
