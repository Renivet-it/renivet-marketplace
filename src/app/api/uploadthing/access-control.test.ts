import { expect, test } from "bun:test";

const source = await Bun.file(new URL("./core.ts", import.meta.url)).text();

function routeConfig(routeName: string) {
    const start = source.indexOf(`    ${routeName}: f(`);
    const end = source.indexOf("    }),", start);
    return source.slice(start, end === -1 ? source.length : end);
}

function sharedMediaLimits() {
    const start = source.indexOf("export const BRAND_MEDIA_UPLOAD_LIMITS");
    const end = source.indexOf("} as const;", start);
    return source.slice(start, end === -1 ? source.length : end);
}

test("product media uploads remain publicly readable", () => {
    expect(sharedMediaLimits()).toContain('acl: "public-read"');
    expect(routeConfig("brandMediaUploader")).toContain(
        "...BRAND_MEDIA_UPLOAD_LIMITS"
    );
});

test("contract and finance uploads remain private", () => {
    expect(routeConfig("brandRequestDocUploader")).toContain('acl: "private"');
    expect(routeConfig("corporateDocumentUploader")).toContain(
        'acl: "private"'
    );
    expect(routeConfig("financeProofUploader")).toContain('acl: "private"');
});
