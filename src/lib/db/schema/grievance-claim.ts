import { uuid, pgTable, text, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";

export const grievanceClaims = pgTable(
    "grievance_claims",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        tokenHash: text("token_hash").notNull(),
        name: text("name").notNull(),
        email: text("email").notNull(),
        phone: text("phone").notNull(),
        orderId: text("order_id"),
        category: text("category").notNull(),
        description: text("description").notNull(),
        consentedAt: timestamp("consented_at").notNull(),
        expiresAt: timestamp("expires_at").notNull(),
        consumedAt: timestamp("consumed_at"),
        consumedByUserId: text("consumed_by_user_id"),
        ticketId: uuid("ticket_id"),
        ...timestamps,
    },
    (table) => ({
        tokenHashUnique: uniqueIndex("grievance_claims_token_hash_idx").on(
            table.tokenHash
        ),
        expiresAtIdx: index("grievance_claims_expires_at_idx").on(table.expiresAt),
        consumedByUserIdx: index("grievance_claims_consumed_by_user_idx").on(
            table.consumedByUserId
        ),
    })
);
