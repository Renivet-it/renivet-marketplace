import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";

export const tickets = pgTable("tickets", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    company: text("company"),
    message: text("message").notNull(),
    ...timestamps,
});
