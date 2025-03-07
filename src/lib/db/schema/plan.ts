import { boolean, index, integer, pgTable, text } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";

export const plans = pgTable(
    "plans",
    {
        id: text("id").primaryKey().notNull().unique(),
        interval: integer("interval").notNull().default(1),
        period: text("period", {
            enum: ["daily", "weekly", "monthly", "yearly"],
        })
            .notNull()
            .default("monthly"),
        amount: integer("amount").notNull(),
        name: text("name").notNull(),
        description: text("description"),
        isActive: boolean("is_active").notNull().default(false),
        ...timestamps,
    },
    (table) => ({
        planIsActiveIdx: index("plan_is_active_idx").on(table.isActive),
        planIdIsActiveIdx: index("plan_id_is_active_idx").on(
            table.id,
            table.isActive
        ),
    })
);
