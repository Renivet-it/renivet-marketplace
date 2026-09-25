import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

const read = (path: string) => readFile(path, "utf8");

describe("REN-208 private brand agreements", () => {
    test("uses private UploadThing ACL without changing existing upload defaults", async () => {
        const source = await read("src/app/api/uploadthing/core.ts");
        expect(source).toContain("brandAgreementUploader");
        expect(source).toContain('acl: "private"');
        expect(source).toContain("maxFileSize: \"16MB\"");
    });

    test("stores the UploadThing key and generates signed URLs only after authorization", async () => {
        const source = await read("src/lib/trpc/routes/general/brand-agreements.ts");
        expect(source).toContain("fileKey: input.file.key");
        expect(source).toContain("canReadAgreement");
        expect(source).toContain("utApi.getSignedURL");
        expect(source).toContain("expiresIn: 300");
        expect(source).toContain("deleteFiles([input.file.key])");
        expect(source).not.toContain("file.url");
    });

    test("keeps agreements additive and versioned", async () => {
        const schema = await read("src/lib/db/schema/brand-agreement.ts");
        const migration = await read("drizzle/0287_brand_agreement_repository.sql");
        expect(schema).toContain('"brand_agreements"');
        expect(schema).toContain("brand_agreements_brand_version_unique");
        expect(migration).toContain("CREATE TABLE IF NOT EXISTS \"brand_agreements\"");
        expect(migration).toContain("ON DELETE restrict");
    });
});
