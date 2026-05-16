import { jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";

export const notifications = pgTable("notifications", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    recipientId: text("recipient_id").notNull(),
    actorId: text("actor_id"),
    audience: text("audience").notNull().default("user"),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    href: text("href"),
    readAt: text("read_at"),
    metadata: jsonb("metadata").$type<Record<string, unknown> | null>().default(null),
    ...timestamps,
});
