CREATE EXTENSION IF NOT EXISTS btree_gist;
--> statement-breakpoint

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'commission_rules_brand_fk'
    ) THEN
        ALTER TABLE commission_rules
            ADD CONSTRAINT commission_rules_brand_fk
            FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE RESTRICT;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'commission_rules_category_fk'
    ) THEN
        ALTER TABLE commission_rules
            ADD CONSTRAINT commission_rules_category_fk
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'commission_rules_product_type_fk'
    ) THEN
        ALTER TABLE commission_rules
            ADD CONSTRAINT commission_rules_product_type_fk
            FOREIGN KEY (product_type_id) REFERENCES product_types(id) ON DELETE RESTRICT;
    END IF;
END $$;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS commission_rules_brand_idx
    ON commission_rules (brand_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS commission_rules_priority_idx
    ON commission_rules (priority);
--> statement-breakpoint

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'commission_rules_effective_range_check'
    ) THEN
        ALTER TABLE commission_rules
            ADD CONSTRAINT commission_rules_effective_range_check
            CHECK (
                effective_from IS NULL
                OR effective_to IS NULL
                OR effective_from <= effective_to
            );
    END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'commission_rules_active_scope_dates_excl'
    ) THEN
        ALTER TABLE commission_rules
            ADD CONSTRAINT commission_rules_active_scope_dates_excl
            EXCLUDE USING gist (
                (COALESCE(brand_id, '00000000-0000-0000-0000-000000000000'::uuid)) WITH =,
                (COALESCE(category_id, '00000000-0000-0000-0000-000000000000'::uuid)) WITH =,
                (COALESCE(product_type_id, '00000000-0000-0000-0000-000000000000'::uuid)) WITH =,
                (daterange(
                    COALESCE(effective_from, '-infinity'::date),
                    COALESCE(effective_to, 'infinity'::date),
                    '[]'
                )) WITH &&
            ) WHERE (is_active);
    END IF;
END $$;
--> statement-breakpoint

-- ROLLBACK (manual reversal for the forward-only Drizzle migration):
-- ALTER TABLE commission_rules DROP CONSTRAINT commission_rules_active_scope_dates_excl;
-- ALTER TABLE commission_rules DROP CONSTRAINT commission_rules_effective_range_check;
-- DROP INDEX IF EXISTS commission_rules_priority_idx;
-- DROP INDEX IF EXISTS commission_rules_brand_idx;
-- ALTER TABLE commission_rules DROP CONSTRAINT commission_rules_product_type_fk;
-- ALTER TABLE commission_rules DROP CONSTRAINT commission_rules_category_fk;
-- ALTER TABLE commission_rules DROP CONSTRAINT commission_rules_brand_fk;
