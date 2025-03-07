import { relations } from "drizzle-orm";
import { integer, pgTable, text } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { orders } from "./order";
import { users } from "./user";

export const refunds = pgTable("refunds", {
    id: text("id").primaryKey().notNull().unique(),
    userId: text("user_id")
        .notNull()
        .references(() => users.id, {
            onDelete: "cascade",
        }),
    orderId: text("order_id")
        .notNull()
        .references(() => orders.id, {
            onDelete: "cascade",
        }),
    paymentId: text("payment_id").notNull().unique(),
    status: text("status", {
        enum: ["pending", "processed", "failed"],
    })
        .notNull()
        .default("pending"),
    amount: integer("amount").notNull(),
    ...timestamps,
});

export const refundRelations = relations(refunds, ({ one }) => ({
    user: one(users, {
        fields: [refunds.userId],
        references: [users.id],
    }),
    order: one(orders, {
        fields: [refunds.orderId],
        references: [orders.id],
    }),
}));
