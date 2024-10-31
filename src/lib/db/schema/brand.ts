import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { users } from "./user";

export const brands = pgTable("brands", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    name: text("name").notNull().unique(),
    logoUrl: text("logo_url"),
    registeredBy: text("registered_by")
        .notNull()
        .references(() => users.id, {
            onDelete: "cascade",
        }),
    bio: text("bio"),
    ...timestamps,
});
