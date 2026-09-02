import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

test("REN-178 migration adds the corporate quote customization snapshot column", async () => {
    const migration = await readFile(
        new URL("../drizzle/0282_corporate_quote_customizations.sql", import.meta.url),
        "utf8"
    );

    expect(migration).toContain('ALTER TABLE "corporate_quotes"');
    expect(migration).toContain('ADD COLUMN IF NOT EXISTS "customizations" jsonb');
});
