CREATE TABLE IF NOT EXISTS "brand_sustainability_certs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "brand_id" uuid NOT NULL,
    "cert_type" text NOT NULL,
    "cert_number" text,
    "cert_name_other" text,
    "file_url" text NOT NULL,
    "issued_at" date NOT NULL,
    "expires_at" date NOT NULL,
    "verification_status" text DEFAULT 'pending' NOT NULL,
    "verified_by" text,
    "verified_at" timestamp,
    "applies_to" text DEFAULT 'all_products' NOT NULL,
    "applicable_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "notes" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "brand_sustainability_certs_brand_id_brands_id_fk"
        FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade,
    CONSTRAINT "brand_sustainability_certs_verified_by_users_id_fk"
        FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE set null,
    CONSTRAINT "brand_sustainability_certs_cert_type_check"
        CHECK ("cert_type" IN (
            'GOTS',
            'OEKO_TEX',
            'FSC',
            'FAIR_TRADE',
            'BCI',
            'BLUESIGN',
            'RECYCLED_CONTENT',
            'OTHER'
        )),
    CONSTRAINT "brand_sustainability_certs_verification_status_check"
        CHECK ("verification_status" IN ('pending', 'verified', 'expired', 'rejected')),
    CONSTRAINT "brand_sustainability_certs_applies_to_check"
        CHECK ("applies_to" IN ('all_products', 'specific_category', 'specific_products'))
);

CREATE INDEX IF NOT EXISTS "brand_sustainability_certs_brand_idx"
ON "brand_sustainability_certs" ("brand_id");

CREATE INDEX IF NOT EXISTS "brand_sustainability_certs_status_idx"
ON "brand_sustainability_certs" ("verification_status");

CREATE INDEX IF NOT EXISTS "brand_sustainability_certs_expiry_idx"
ON "brand_sustainability_certs" ("expires_at");
