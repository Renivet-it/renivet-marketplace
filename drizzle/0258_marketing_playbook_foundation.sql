ALTER TABLE "blogs"
ADD COLUMN IF NOT EXISTS "meta_title" text,
ADD COLUMN IF NOT EXISTS "meta_description" text,
ADD COLUMN IF NOT EXISTS "target_keyword" text,
ADD COLUMN IF NOT EXISTS "thumbnail_alt_text" text;

ALTER TABLE "newsletter_subscribers"
ADD COLUMN IF NOT EXISTS "unsubscribed_at" timestamp,
ADD COLUMN IF NOT EXISTS "source" text DEFAULT 'website' NOT NULL,
ADD COLUMN IF NOT EXISTS "segments" jsonb DEFAULT '[]'::jsonb NOT NULL;

ALTER TABLE "email_message_logs"
ADD COLUMN IF NOT EXISTS "subscriber_id" uuid,
ADD COLUMN IF NOT EXISTS "campaign_type" text,
ADD COLUMN IF NOT EXISTS "campaign_id" uuid,
ADD COLUMN IF NOT EXISTS "automation_key" text,
ADD COLUMN IF NOT EXISTS "step_number" integer,
ADD COLUMN IF NOT EXISTS "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'email_message_logs_subscriber_id_newsletter_subscribers_id_fk'
    ) THEN
        ALTER TABLE "email_message_logs"
        ADD CONSTRAINT "email_message_logs_subscriber_id_newsletter_subscribers_id_fk"
        FOREIGN KEY ("subscriber_id") REFERENCES "public"."newsletter_subscribers"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'email_message_logs_campaign_id_marketing_campaigns_id_fk'
    ) THEN
        ALTER TABLE "email_message_logs"
        ADD CONSTRAINT "email_message_logs_campaign_id_marketing_campaigns_id_fk"
        FOREIGN KEY ("campaign_id") REFERENCES "public"."marketing_campaigns"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "marketing_campaigns" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "type" text NOT NULL,
    "subject" text NOT NULL,
    "status" text DEFAULT 'draft' NOT NULL,
    "scheduled_at" timestamp,
    "content_html" text DEFAULT '' NOT NULL,
    "created_by" text,
    "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "marketing_automation_runs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "automation_type" text NOT NULL,
    "automation_key" text NOT NULL,
    "campaign_id" uuid,
    "user_id" text,
    "subscriber_id" uuid,
    "email" text NOT NULL,
    "step_number" integer DEFAULT 1 NOT NULL,
    "status" text DEFAULT 'pending' NOT NULL,
    "last_attempt_at" timestamp,
    "sent_at" timestamp,
    "error" text,
    "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "marketing_automation_runs_automation_key_unique" UNIQUE("automation_key")
);

CREATE TABLE IF NOT EXISTS "marketing_partnerships" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "partner_name" text NOT NULL,
    "brand_id" uuid,
    "campaign_type" text NOT NULL,
    "planned_date" timestamp,
    "live_date" timestamp,
    "goal" text NOT NULL,
    "coupon_code" text,
    "tracking_url" text,
    "notes" text,
    "status" text DEFAULT 'planned' NOT NULL,
    "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'marketing_campaigns_created_by_users_id_fk'
    ) THEN
        ALTER TABLE "marketing_campaigns"
        ADD CONSTRAINT "marketing_campaigns_created_by_users_id_fk"
        FOREIGN KEY ("created_by") REFERENCES "public"."users"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'marketing_automation_runs_campaign_id_marketing_campaigns_id_fk'
    ) THEN
        ALTER TABLE "marketing_automation_runs"
        ADD CONSTRAINT "marketing_automation_runs_campaign_id_marketing_campaigns_id_fk"
        FOREIGN KEY ("campaign_id") REFERENCES "public"."marketing_campaigns"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'marketing_automation_runs_user_id_users_id_fk'
    ) THEN
        ALTER TABLE "marketing_automation_runs"
        ADD CONSTRAINT "marketing_automation_runs_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'marketing_automation_runs_subscriber_id_newsletter_subscribers_id_fk'
    ) THEN
        ALTER TABLE "marketing_automation_runs"
        ADD CONSTRAINT "marketing_automation_runs_subscriber_id_newsletter_subscribers_id_fk"
        FOREIGN KEY ("subscriber_id") REFERENCES "public"."newsletter_subscribers"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;
