import {
    boolean,
    index,
    integer,
    pgTable,
    text,
    uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "../helper";

export const advertisements = pgTable(
    "advertisements",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        title: text("title").notNull(),
        description: text("description"),
        imageUrl: text("image_url").notNull(),
        url: text("url"),
        position: integer("position").notNull().default(0),
        height: integer("height").notNull().default(100),
        isPublished: boolean("is_published").notNull().default(false),
        ...timestamps,
    },
    (table) => ({
        advertisementPositionIdx: index("advertisement_position_idx").on(
            table.position
        ),
    })
);
