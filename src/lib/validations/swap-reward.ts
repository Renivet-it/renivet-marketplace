import { z } from "zod";

export const swapRewardStatusSchema = z.enum([
    "locked",
    "unlocked",
    "redeemed",
]);

export const swapRewardEventTypeSchema = z.enum([
    "stamp_earned",
    "stamp_revoked",
    "reward_unlocked",
    "reward_redeemed",
    "reward_relocked",
]);

export const rewardRedemptionStatusSchema = z.enum([
    "initiated",
    "completed",
    "cancelled",
]);

export const userSwapRewardSchema = z.object({
    userId: z.string(),
    totalStampCount: z.number().int().nonnegative(),
    currentCycleStampCount: z.number().int().min(0).max(5),
    rewardStatus: swapRewardStatusSchema,
    unlockedAt: z.string().nullable(),
    redeemedAt: z.string().nullable(),
    totalRewardsEarned: z.number().int().nonnegative(),
    activeRewardCycle: z.number().int().positive(),
    lastStampOrderId: z.string().nullable(),
    createdAt: z.union([z.string(), z.date()]).transform((v) => new Date(v)),
    updatedAt: z.union([z.string(), z.date()]).transform((v) => new Date(v)),
});

export const swapRewardEventSchema = z.object({
    id: z.string().uuid(),
    userId: z.string(),
    orderId: z.string().nullable(),
    rewardCycle: z.number().int().positive(),
    type: swapRewardEventTypeSchema,
    stampDelta: z.number().int(),
    metadata: z.record(z.string(), z.unknown()).nullable(),
    createdAt: z.union([z.string(), z.date()]).transform((v) => new Date(v)),
    updatedAt: z.union([z.string(), z.date()]).transform((v) => new Date(v)),
});

export const rewardRedemptionSchema = z.object({
    id: z.string().uuid(),
    userId: z.string(),
    orderId: z.string().nullable(),
    productId: z.string().uuid(),
    variantId: z.string().uuid().nullable(),
    rewardCycle: z.number().int().positive(),
    rewardValue: z.number().int().nonnegative(),
    status: rewardRedemptionStatusSchema,
    createdAt: z.union([z.string(), z.date()]).transform((v) => new Date(v)),
    updatedAt: z.union([z.string(), z.date()]).transform((v) => new Date(v)),
});

export type UserSwapReward = z.infer<typeof userSwapRewardSchema>;
export type SwapRewardEvent = z.infer<typeof swapRewardEventSchema>;
export type RewardRedemption = z.infer<typeof rewardRedemptionSchema>;
