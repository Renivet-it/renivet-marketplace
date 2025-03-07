CREATE TABLE IF NOT EXISTS "brand_confidentials" (
	"id" uuid PRIMARY KEY NOT NULL,
	"gstin" text NOT NULL,
	"pan" text NOT NULL,
	"bank_name" text NOT NULL,
	"bank_account_holder_name" text NOT NULL,
	"bank_account_number" text NOT NULL,
	"bank_ifsc_code" text NOT NULL,
	"bank_account_verification_document_url" text,
	"authorized_signatory_name" text NOT NULL,
	"authorized_signatory_email" text NOT NULL,
	"authorized_signatory_phone" text NOT NULL,
	"udyam_registration_certificate_url" text,
	"iec_certificate_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brand_confidentials_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "brand_requests" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "brand_requests" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "brand_requests" ADD COLUMN "gstin" text;--> statement-breakpoint
ALTER TABLE "brand_requests" ADD COLUMN "pan" text;--> statement-breakpoint
ALTER TABLE "brand_requests" ADD COLUMN "bank_name" text;--> statement-breakpoint
ALTER TABLE "brand_requests" ADD COLUMN "bank_account_holder_name" text;--> statement-breakpoint
ALTER TABLE "brand_requests" ADD COLUMN "bank_account_number" text;--> statement-breakpoint
ALTER TABLE "brand_requests" ADD COLUMN "bank_ifsc_code" text;--> statement-breakpoint
ALTER TABLE "brand_requests" ADD COLUMN "bank_account_verification_document_url" text;--> statement-breakpoint
ALTER TABLE "brand_requests" ADD COLUMN "authorized_signatory_name" text;--> statement-breakpoint
ALTER TABLE "brand_requests" ADD COLUMN "authorized_signatory_email" text;--> statement-breakpoint
ALTER TABLE "brand_requests" ADD COLUMN "authorized_signatory_phone" text;--> statement-breakpoint
ALTER TABLE "brand_requests" ADD COLUMN "udyam_registration_certificate_url" text;--> statement-breakpoint
ALTER TABLE "brand_requests" ADD COLUMN "iec_certificate_url" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_confidentials" ADD CONSTRAINT "brand_confidentials_id_brands_id_fk" FOREIGN KEY ("id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
