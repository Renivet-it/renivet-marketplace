import { jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";

export const capiLogs = pgTable("capi_logs", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    eventName: text("event_name").notNull(),
    eventId: text("event_id").notNull(),
    userData: jsonb("user_data"),
    customData: jsonb("custom_data"),
    status: text("status").notNull(),
    response: jsonb("response"),
    ...timestamps,
});
