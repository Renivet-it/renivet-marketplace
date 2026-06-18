import { relations } from "drizzle-orm";
import {
    index,
    integer,
    jsonb,
    pgTable,
    text,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { orders } from "./order";
import { products } from "./product";
import { users } from "./user";

export const userSwapRewards = pgTable(
    "user_swap_rewards",
    {
        userId: text("user_id")
            .primaryKey()
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        totalStampCount: integer("total_stamp_count").notNull().default(0),
        currentCycleStampCount: integer("current_cycle_stamp_count")
            .notNull()
            .default(0),
        rewardStatus: text("reward_status", {
            enum: ["locked", "unlocked", "redeemed"],
        })
            .notNull()
            .default("locked"),
        unlockedAt: text("unlocked_at"),
        redeemedAt: text("redeemed_at"),
        totalRewardsEarned: integer("total_rewards_earned").notNull().default(0),
        activeRewardCycle: integer("active_reward_cycle").notNull().default(1),
        lastStampOrderId: text("last_stamp_order_id"),
        ...timestamps,
    },
    (table) => ({
        rewardStatusIdx: index("user_swap_rewards_status_idx").on(
            table.rewardStatus
        ),
    })
);

export const swapRewardEvents = pgTable(
    "swap_reward_events",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        orderId: text("order_id"),
        rewardCycle: integer("reward_cycle").notNull().default(1),
        type: text("type", {
            enum: [
                "stamp_earned",
                "stamp_revoked",
                "reward_unlocked",
                "reward_redeemed",
                "reward_relocked",
            ],
        }).notNull(),
        stampDelta: integer("stamp_delta").notNull().default(0),
        metadata: jsonb("metadata")
            .$type<Record<string, unknown> | null>()
            .default(null),
        ...timestamps,
    },
    (table) => ({
        userEventIdx: index("swap_reward_events_user_id_idx").on(table.userId),
        orderEventIdx: index("swap_reward_events_order_id_idx").on(table.orderId),
        userCycleIdx: index("swap_reward_events_user_cycle_idx").on(
            table.userId,
            table.rewardCycle
        ),
    })
);

export const rewardRedemptions = pgTable(
    "reward_redemptions",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        orderId: text("order_id").references(() => orders.id, {
            onDelete: "set null",
        }),
        productId: uuid("product_id")
            .notNull()
            .references(() => products.id, { onDelete: "cascade" }),
        variantId: uuid("variant_id"),
        rewardCycle: integer("reward_cycle").notNull(),
        rewardValue: integer("reward_value").notNull(),
        status: text("status", {
            enum: ["initiated", "completed", "cancelled"],
        })
            .notNull()
            .default("initiated"),
        ...timestamps,
    },
    (table) => ({
        rewardRedemptionOrderIdx: index("reward_redemptions_order_idx").on(
            table.orderId
        ),
        rewardRedemptionUserIdx: index("reward_redemptions_user_idx").on(
            table.userId
        ),
        rewardRedemptionCycleUnique: uniqueIndex(
            "reward_redemptions_user_cycle_unique"
        ).on(table.userId, table.rewardCycle),
    })
);

export const userSwapRewardsRelations = relations(
    userSwapRewards,
    ({ one, many }) => ({
        user: one(users, {
            fields: [userSwapRewards.userId],
            references: [users.id],
        }),
        events: many(swapRewardEvents),
        redemptions: many(rewardRedemptions),
    })
);

export const swapRewardEventsRelations = relations(
    swapRewardEvents,
    ({ one }) => ({
        user: one(users, {
            fields: [swapRewardEvents.userId],
            references: [users.id],
        }),
        order: one(orders, {
            fields: [swapRewardEvents.orderId],
            references: [orders.id],
        }),
    })
);

export const rewardRedemptionsRelations = relations(
    rewardRedemptions,
    ({ one }) => ({
        user: one(users, {
            fields: [rewardRedemptions.userId],
            references: [users.id],
        }),
        order: one(orders, {
            fields: [rewardRedemptions.orderId],
            references: [orders.id],
        }),
        product: one(products, {
            fields: [rewardRedemptions.productId],
            references: [products.id],
        }),
    })
);
