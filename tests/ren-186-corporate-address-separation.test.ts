import { readFileSync } from "node:fs";
import { expect, test } from "bun:test";

test("REN-186 migration adds nullable operational address fields without backfill", () => {
    const migration = readFileSync(
        new URL("../drizzle/0284_corporate_document_operational_address.sql", import.meta.url),
        "utf8"
    );

    for (const column of [
        "operational_address_line_1",
        "operational_address_line_2",
        "operational_city",
        "operational_state",
        "operational_postal_code",
        "operational_country",
    ]) {
        expect(migration).toContain(`ADD COLUMN IF NOT EXISTS \"${column}\" text`);
    }
    expect(migration).not.toContain("UPDATE corporate_document_settings");
});

test("REN-186 corporate routes do not fabricate Renivet GST identity", () => {
    const commission = readFileSync(
        new URL(
            "../src/app/api/corporate-orders/[id]/commission-invoice.pdf/route.tsx",
            import.meta.url
        ),
        "utf8"
    );
    const settlement = readFileSync(
        new URL(
            "../src/app/api/corporate-orders/[id]/settlement-statement.pdf/route.tsx",
            import.meta.url
        ),
        "utf8"
    );

    expect(commission).not.toContain('"19AAACR1234F1Z5"');
    expect(settlement).not.toContain('"19AAACR1234F1Z5"');
    expect(commission).toContain("assertCorporateLegalIdentity(settings)");
    expect(settlement).toContain("assertCorporateLegalIdentity(settings)");
});

test("REN-186 settings distinguish registration and operational address fields", () => {
    const panel = readFileSync(
        new URL(
            "../src/components/dashboard/general/corporate-orders/corporate-document-settings-panel.tsx",
            import.meta.url
        ),
        "utf8"
    );
    expect(panel).toContain("GST registration address");
    expect(panel).toContain("Operational / office address");
    expect(panel).toContain("operationalAddressLine1");
});
