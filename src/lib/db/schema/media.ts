import { relations } from "drizzle-orm";
import {
    bigint,
    boolean,
    foreignKey,
    pgTable,
    text,
    uniqueIndex,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { exchangeShipments, returnShipments } from "./order-shipment";

export const mediaMaster = pgTable(
    "media_master",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        fileName: text("file_name"),
        filePath: text("file_path"),
        fileType: text("file_type"),
        fileSize: bigint("file_size", { mode: "number" }),
        extension: text("extension"),
        title: varchar("title", { length: 255 }),
        description: text("description"),
        mediaType: varchar("media_type", { length: 255 }),
        width: bigint("width", { mode: "number" }),
        height: bigint("height", { mode: "number" }),
        duration: bigint("duration", { mode: "number" }),
        isPublic: boolean("is_public").default(false),
        ...timestamps,
    },
    (t) => [uniqueIndex("file_path_unique_idx").on(t.filePath)]
);

export const mediaReturnShipment = pgTable(
    "media_return_shipments",
    {
        id: uuid().primaryKey().defaultRandom(),
        mediaId: uuid("media_id"),
        returnId: uuid("return_id"),
    },
    (t) => [
        foreignKey({
            name: "media_mrs_fk",
            columns: [t.mediaId],
            foreignColumns: [mediaMaster.id],
        }).onDelete("cascade"),
        foreignKey({
            name: "return_mrs_fk",
            columns: [t.returnId],
            foreignColumns: [returnShipments.id],
        }).onDelete("cascade"),
    ]
);

export const mediaExchangeShipment = pgTable(
    "media_exchnage_shipments",
    {
        id: uuid().primaryKey().defaultRandom(),
        mediaId: uuid("media_id"),
        exchangeId: uuid("exchange_id"),
    },
    (t) => [
        foreignKey({
            name: "media_mes_fk",
            columns: [t.mediaId],
            foreignColumns: [mediaMaster.id],
        }).onDelete("cascade"),
        foreignKey({
            name: "exchange_mes_fk",
            columns: [t.exchangeId],
            foreignColumns: [exchangeShipments.id],
        }).onDelete("cascade"),
    ]
);

export const mediaRelations = relations(mediaMaster, ({ many }) => ({
    mediaReturn: many(mediaReturnShipment),
    mediaExchange: many(mediaExchangeShipment),
}));

export const mediaReturnRelations = relations(
    mediaReturnShipment,
    ({ one }) => ({
        media: one(mediaMaster, {
            fields: [mediaReturnShipment.mediaId],
            references: [mediaMaster.id],
        }),
        returnShipment: one(returnShipments, {
            fields: [mediaReturnShipment.returnId],
            references: [returnShipments.id],
        }),
    })
);

export const mediaExchnageRelations = relations(
    mediaReturnShipment,
    ({ one }) => ({
        media: one(mediaMaster, {
            fields: [mediaReturnShipment.mediaId],
            references: [mediaMaster.id],
        }),
        exchnageShipment: one(exchangeShipments, {
            fields: [mediaReturnShipment.returnId],
            references: [exchangeShipments.id],
        }),
    })
);
