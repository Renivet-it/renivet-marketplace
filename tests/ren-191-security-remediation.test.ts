import { expect, test } from "bun:test";
import { buildEmbeddingServiceUrl } from "@/lib/python/service-url";
import { readFileSync } from "node:fs";

const uploadSource = readFileSync(
    new URL("../src/app/api/uploadthing/core.ts", import.meta.url),
    "utf8"
);
const productSource = readFileSync(
    new URL("../src/lib/db/queries/product.ts", import.meta.url),
    "utf8"
);

test("REN-191 bounds brand media uploads and removes generic blobs", () => {
    const brandMedia = uploadSource.slice(
        uploadSource.indexOf("BRAND_MEDIA_UPLOAD_LIMITS"),
        uploadSource.indexOf("reviewImageUploader")
    );
    expect(brandMedia).toContain("BRAND_MEDIA_UPLOAD_LIMITS");
    expect(brandMedia).toContain('maxFileCount: 20');
    expect(brandMedia).toContain('maxFileSize: "8MB"');
    expect(brandMedia).toContain('maxFileCount: 5');
    expect(brandMedia).toContain('maxFileSize: "64MB"');
    expect(brandMedia).not.toContain("blob:");
    expect(brandMedia).not.toContain("9999");
    expect(brandMedia).not.toContain("1024GB");
});

test("REN-191 accepts only secure embedding service origins", () => {
    const previous = process.env.EMBEDDING_SERVICE_URL;
    const appEnv = process.env.APP_ENV;
    const nodeEnv = process.env.NODE_ENV;
    try {
        process.env.APP_ENV = "production";
        process.env.NODE_ENV = "production";
        process.env.EMBEDDING_SERVICE_URL = "https://search.example.com";
        expect(buildEmbeddingServiceUrl("/search?q=a b")?.toString()).toBe(
            "https://search.example.com/search?q=a%20b"
        );
        for (const value of [
            "http://64.227.137.174:8000",
            "http://search.example.com",
            "https://user:pass@search.example.com",
            "https://search.example.com/base",
            "not-a-url",
        ]) {
            process.env.EMBEDDING_SERVICE_URL = value;
            expect(buildEmbeddingServiceUrl("/search")).toBeNull();
        }
        process.env.APP_ENV = "development";
        process.env.NODE_ENV = "development";
        process.env.EMBEDDING_SERVICE_URL = "http://localhost:8000";
        expect(buildEmbeddingServiceUrl("/search")?.toString()).toBe(
            "http://localhost:8000/search"
        );
    } finally {
        process.env.EMBEDDING_SERVICE_URL = previous;
        process.env.APP_ENV = appEnv;
        process.env.NODE_ENV = nodeEnv;
    }
});

test("REN-191 removes hardcoded insecure catalog transport", () => {
    expect(productSource).not.toContain("http://64.227.137.174:8000");
});
