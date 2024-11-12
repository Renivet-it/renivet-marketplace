ALTER TABLE "contact_us" RENAME TO "tickets";--> statement-breakpoint
ALTER TABLE "tickets" DROP CONSTRAINT "contact_us_id_unique";--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_id_unique" UNIQUE("id");