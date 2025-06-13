import {
    bigint,
    boolean,
    foreignKey,
    pgTable,
    text,
    uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { typeMasters } from "./types";
import { relations } from "drizzle-orm";

export const reasonMasters = pgTable(
    "reason_master",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        name: text("name"),
        description: text("description"),
        parentId: uuid("parent_id"),
        level: bigint("level", { mode: "number" }),
        isActive: boolean("is_active").default(true),
        shortOrder: bigint("short_order", { mode: "number" }),
        reasonType: text("reason_type"),
        ...timestamps,
    },
    (t) => [
        foreignKey({
            columns: [t.parentId],
            foreignColumns: [t.id],
            name: "reason_master_parent_id_fkey",
        }).onDelete("cascade"),
        foreignKey({
            columns: [t.reasonType],
            foreignColumns: [typeMasters.code],
            name: "reason_master_reason_type_fkey",
        }),
    ]
);

export const reasonMastersRelations = relations(
    reasonMasters,
    ({ one, many }) => ({
        parent: one(reasonMasters, {
            fields: [reasonMasters.parentId],
            references: [reasonMasters.id],
        }),
        children: many(reasonMasters),
    })
);
