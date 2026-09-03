ALTER TABLE "corporate_proforma_invoices"
ADD COLUMN IF NOT EXISTS "customizations" jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "corporate_quote_revisions"
ADD COLUMN IF NOT EXISTS "customizations" jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "corporate_tax_invoices"
ADD COLUMN IF NOT EXISTS "customizations" jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "corporate_settlement_statements"
ADD COLUMN IF NOT EXISTS "customizations" jsonb NOT NULL DEFAULT '[]'::jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS "corporate_fulfillment_orders_one_issued_per_order_idx"
ON "corporate_fulfillment_orders" ("order_id")
WHERE "status" = 'issued';

INSERT INTO "corporate_customizations"
    ("order_id", "customization_type", "cost_paise", "metadata")
SELECT o.id, 'Legacy Customization', o.customization_paise,
       jsonb_build_object('legacy', true, 'source', 'scalar_backfill')
FROM corporate_orders o
WHERE o.customization_paise > 0
  AND NOT EXISTS (
      SELECT 1 FROM corporate_customizations c WHERE c.order_id = o.id
  );

INSERT INTO "corporate_customizations"
    ("quote_id", "customization_type", "cost_paise", "metadata")
SELECT q.id, COALESCE(q.manual_extra_description, 'Legacy Customization'),
       COALESCE(q.customization_cost_paise, 0),
       jsonb_build_object('legacy', true, 'source', 'quote_scalar_backfill')
FROM corporate_quotes q
WHERE q.customization_cost_paise > 0
  AND NOT EXISTS (
      SELECT 1 FROM corporate_customizations c WHERE c.quote_id = q.id
  );
