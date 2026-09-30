import { expect, test } from "bun:test";

test("contact grievance form renders flattened validation errors", async () => {
    const source = await Bun.file("src/app/(home)/contact/page.tsx").text();

    expect(source).toContain("parsed.error.flatten().fieldErrors");
    expect(source).not.toContain("parsed.flatten().fieldErrors");
    expect(source).toContain("fieldErrors.description");
    expect(source).toContain("aria-invalid={Boolean(fieldErrors.description)}");
});

test("contact grievance redirects existing-account guests to sign in", async () => {
    const source = await Bun.file("src/app/(home)/contact/page.tsx").text();

    expect(source).toContain("result.requiresAccountAccess");
    expect(source).toContain("!result.requiresAccountCreation");
    expect(source).toContain("window.location.assign(result.accessPath)");
});

test("guest grievance identity matching includes Clerk identifiers", async () => {
    const source = await Bun.file(
        "src/lib/trpc/routes/general/legal.ts"
    ).text();

    expect(source).toContain("clerkClient");
    expect(source).toContain("emailAddresses.map");
    expect(source).toContain("phoneNumbers.map");
});

test("existing-account guests create only a temporary claim before login", async () => {
    const source = await Bun.file(
        "src/lib/trpc/routes/general/legal.ts"
    ).text();
    const existingAccountBlock = source.slice(
        source.indexOf('if (decision.kind === "link_existing")'),
        source.indexOf('if (decision.kind === "support_review")')
    );

    expect(existingAccountBlock).toContain("createPendingGrievanceClaim");
    expect(existingAccountBlock).toContain("expectedUserId: decision.userId");
    expect(existingAccountBlock).toContain("claim=");
    expect(existingAccountBlock).not.toContain("createGrievanceTicket");
});

test("grievance claims migration is registered with expected-user ownership", async () => {
    const migration = await Bun.file(
        "drizzle/0290_verified_grievance_claims.sql"
    ).text();
    const journal = await Bun.file("drizzle/meta/_journal.json").text();

    expect(migration).toContain(
        'CREATE TABLE IF NOT EXISTS "grievance_claims"'
    );
    expect(migration).toContain('"expected_user_id" text');
    expect(journal).toContain('"tag": "0290_verified_grievance_claims"');
});
