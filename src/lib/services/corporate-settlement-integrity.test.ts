import { readFile } from "node:fs/promises";
import { expect, test } from "bun:test";

const serviceSource = readFile(
    new URL("./corporate-documents.ts", import.meta.url),
    "utf8"
);
const schemaSource = readFile(
    new URL("../db/schema/corporate-platform.ts", import.meta.url),
    "utf8"
);
const pdfRouteSource = readFile(
    new URL(
        "../../app/api/corporate-orders/[id]/settlement-statement.pdf/route.tsx",
        import.meta.url
    ),
    "utf8"
);
const commissionInvoiceRouteSource = readFile(
    new URL(
        "../../app/api/corporate-orders/[id]/commission-invoice.pdf/route.tsx",
        import.meta.url
    ),
    "utf8"
);

test("settlement issuance is idempotent and never deletes an issued statement", async () => {
    const source = await serviceSource;
    const settlementMethod = source.slice(
        source.indexOf("async issueSettlementStatement"),
        source.indexOf("async getOrderDocumentChain")
    );

    expect(settlementMethod).not.toContain(".delete(corporateSettlementStatements)");
    expect(settlementMethod).toContain(
        "if (existingStatement && !adjustmentReason) return existingStatement"
    );
});

test("settlement values are persisted, with no fabricated defaults or reseller deductions", async () => {
    const source = await serviceSource;
    const settlementMethod = source.slice(
        source.indexOf("async issueSettlementStatement"),
        source.indexOf("async getOrderDocumentChain")
    );

    expect(settlementMethod).not.toContain("802000");
    expect(settlementMethod).not.toContain("102000");
    expect(settlementMethod).not.toContain("tcsPercentBps = 50");
    expect(settlementMethod).not.toContain("tdsPercentBps = 10");
    expect(settlementMethod).toContain("commissionAmountPaise = order.commissionAmountPaise");
});

test("the settlement schema records immutable version and audit fields", async () => {
    const source = await schemaSource;
    const settlementSchema = source.slice(
        source.indexOf('"corporate_settlement_statements"'),
        source.indexOf("export const corporateTasks")
    );

    expect(settlementSchema).toContain('version: integer("version")');
    expect(settlementSchema).toContain('supersedesStatementId: uuid("supersedes_statement_id")');
    expect(settlementSchema).toContain('issuedByUserId: text("issued_by_user_id")');
    expect(settlementSchema).toContain('isCurrent: boolean("is_current")');
});

test("settlement PDFs render only persisted issued statements", async () => {
    const source = await pdfRouteSource;

    expect(source).toContain("Settlement statement has not been issued for this order");
    expect(source).not.toContain("802000");
    expect(source).not.toContain("102000");
    expect(source).not.toContain("default 20%");
    expect(source).not.toContain("statement?.tcsPercentBps ?? 50");
});

test("commission invoices use the agreed order snapshot without inventing commission", async () => {
    const source = await commissionInvoiceRouteSource;

    expect(source).not.toContain("default 10%");
    expect(source).not.toContain("order.quote?.commissionAmountPaise");
    expect(source).toContain("A complete agreed commission snapshot is required");
});
