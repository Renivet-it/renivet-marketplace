import { pgTable, text, unique, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";

export const typeMasters = pgTable(
    "type_masters",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        code: text("code"),
        name: text("name"),
        ...timestamps,
    },
    (t) => [unique("code_unique_idx").on(t.code)]
);
