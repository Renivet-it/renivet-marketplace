ALTER TABLE "products"
ADD COLUMN IF NOT EXISTS "size_chart_media" jsonb DEFAULT '[]'::jsonb NOT NULL;
