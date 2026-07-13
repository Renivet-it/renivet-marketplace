import { z } from "zod";

export const marketingCampaignTypes = [
    "welcome",
    "new_arrivals",
    "blog_digest",
    "promotional",
    "abandoned_cart",
    "post_purchase_review",
    "win_back",
] as const;

export const marketingCampaignStatuses = [
    "draft",
    "scheduled",
    "sending",
    "completed",
    "failed",
] as const;

export const marketingPartnershipStatuses = [
    "planned",
    "live",
    "completed",
    "cancelled",
] as const;

const dateValue = z
    .union([z.string(), z.date()], {
        invalid_type_error: "Expected a date value",
    })
    .transform((value) => new Date(value));

export const marketingCampaignSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    type: z.enum(marketingCampaignTypes),
    subject: z.string().min(1),
    status: z.enum(marketingCampaignStatuses),
    scheduledAt: dateValue.nullable().optional(),
    contentHtml: z.string(),
    createdBy: z.string().nullable().optional(),
    metadata: z.record(z.string(), z.unknown()).default({}),
    createdAt: dateValue,
    updatedAt: dateValue,
});

export const createMarketingCampaignSchema = marketingCampaignSchema
    .omit({
        id: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
    })
    .extend({
        scheduledAt: z.coerce.date().nullable().optional(),
        metadata: z.record(z.string(), z.unknown()).optional().default({}),
    });

export const updateMarketingCampaignSchema = createMarketingCampaignSchema
    .partial()
    .extend({
        id: z.string().uuid(),
    });

export const sendMarketingCampaignSchema = z.object({
    id: z.string().uuid(),
});

export const marketingPartnershipSchema = z.object({
    id: z.string().uuid(),
    partnerName: z.string().min(1),
    brandId: z.string().uuid().nullable().optional(),
    campaignType: z.string().min(1),
    plannedDate: dateValue.nullable().optional(),
    liveDate: dateValue.nullable().optional(),
    goal: z.string().min(1),
    couponCode: z.string().nullable().optional(),
    trackingUrl: z.string().url().nullable().optional(),
    notes: z.string().nullable().optional(),
    status: z.enum(marketingPartnershipStatuses),
    metadata: z.record(z.string(), z.unknown()).default({}),
    createdAt: dateValue,
    updatedAt: dateValue,
});

export const createMarketingPartnershipSchema = marketingPartnershipSchema
    .omit({
        id: true,
        createdAt: true,
        updatedAt: true,
    })
    .extend({
        plannedDate: z.coerce.date().nullable().optional(),
        liveDate: z.coerce.date().nullable().optional(),
        trackingUrl: z
            .string()
            .trim()
            .url()
            .nullable()
            .optional()
            .or(z.literal("")),
        notes: z.string().nullable().optional(),
        couponCode: z.string().nullable().optional(),
        metadata: z.record(z.string(), z.unknown()).optional().default({}),
    })
    .transform((value) => ({
        ...value,
        trackingUrl: value.trackingUrl || null,
    }));

export const updateMarketingPartnershipSchema =
    createMarketingPartnershipSchema.partial().extend({
        id: z.string().uuid(),
    });

export type MarketingCampaign = z.infer<typeof marketingCampaignSchema>;
export type CreateMarketingCampaign = z.infer<
    typeof createMarketingCampaignSchema
>;
export type UpdateMarketingCampaign = z.infer<
    typeof updateMarketingCampaignSchema
>;
export type MarketingPartnership = z.infer<typeof marketingPartnershipSchema>;
export type CreateMarketingPartnership = z.infer<
    typeof createMarketingPartnershipSchema
>;
export type UpdateMarketingPartnership = z.infer<
    typeof updateMarketingPartnershipSchema
>;
