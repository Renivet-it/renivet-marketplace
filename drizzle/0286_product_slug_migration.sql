CREATE TABLE IF NOT EXISTS product_slug_migration_runs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    manifest_hash text NOT NULL,
    actor_id text NOT NULL,
    status text NOT NULL,
    expires_at timestamp NOT NULL,
    manifest jsonb NOT NULL,
    counts jsonb NOT NULL,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS product_slug_migration_runs_manifest_hash_idx
    ON product_slug_migration_runs (manifest_hash);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS product_slug_migration_runs_actor_id_idx
    ON product_slug_migration_runs (actor_id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS product_slug_migration_batches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id uuid NOT NULL REFERENCES product_slug_migration_runs(id) ON DELETE CASCADE,
    batch_number text NOT NULL,
    status text NOT NULL,
    counts jsonb NOT NULL,
    error text,
    started_at timestamp,
    completed_at timestamp,
    CONSTRAINT product_slug_migration_run_batch_unique UNIQUE (run_id, batch_number)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS product_slug_migration_batches_run_id_idx
    ON product_slug_migration_batches (run_id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS product_slug_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    old_slug text NOT NULL UNIQUE,
    new_slug text NOT NULL,
    run_id uuid NOT NULL,
    batch_id uuid NOT NULL,
    actor_id text NOT NULL,
    migrated_at timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS product_slug_history_product_id_idx
    ON product_slug_history (product_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS product_slug_history_run_id_idx
    ON product_slug_history (run_id);
