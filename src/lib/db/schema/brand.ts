import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { users } from "./user";

export const brands = pgTable("brands", {
    id: uuid().primaryKey().notNull().unique().defaultRandom(),
    name: text().notNull().unique(),
    logoUrl: text(),
    registeredBy: text()
        .notNull()
        .references(() => users.id, {
            onDelete: "cascade",
        }),
    bio: text(),
    ...timestamps,
});
