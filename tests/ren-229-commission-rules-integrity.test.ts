import { expect, test } from "bun:test";

const migrationPath = "drizzle/0285_commission_rules_integrity.sql";
const journalPath = "drizzle/meta/_journal.json";
const schemaPath = "src/lib/db/schema/finance-compliance.ts";

test("REN-229 migration adds explicit restricted scope foreign keys", async () => {
    const migration = await Bun.file(migrationPath).text();

    expect(migration).toContain("commission_rules_brand_fk");
    expect(migration).toContain("commission_rules_category_fk");
    expect(migration).toContain("commission_rules_product_type_fk");
    expect(migration.match(/ON DELETE RESTRICT/g)).toHaveLength(3);
});

test("REN-229 migration adds named lookup indexes", async () => {
    const migration = await Bun.file(migrationPath).text();

    expect(migration).toContain("commission_rules_brand_idx");
    expect(migration).toContain("commission_rules_priority_idx");
});

test("REN-229 migration rejects invalid ranges and active exact-scope overlap", async () => {
    const migration = await Bun.file(migrationPath).text();

    expect(migration).toContain("btree_gist");
    expect(migration).toContain("commission_rules_effective_range_check");
    expect(migration).toContain("commission_rules_active_scope_dates_excl");
    expect(migration).toContain("COALESCE(brand_id");
    expect(migration).toContain("WHERE (is_active)");
});

test("REN-229 keeps the Drizzle model synchronized with the migration", async () => {
    const schema = await Bun.file(schemaPath).text();

    expect(schema).toContain('onDelete: "restrict"');
    expect(schema).toContain("categoryId: uuid(\"category_id\")");
    expect(schema).toContain("productTypeId: uuid(\"product_type_id\")");
    expect(schema).toContain("commissionRulesBrandIdx");
    expect(schema).toContain("commissionRulesPriorityIdx");
});

test("REN-229 migration is additive and has a documented reversal", async () => {
    const migration = await Bun.file(migrationPath).text();

    expect(migration).toContain("ALTER TABLE commission_rules");
    expect(migration).toContain("ROLLBACK");
    expect(migration).not.toContain("INSERT INTO commission_rules");
});

test("REN-229 migration is registered in the Drizzle journal", async () => {
    const journal = await Bun.file(journalPath).text();

    expect(journal).toContain('"tag": "0285_commission_rules_integrity"');
});
