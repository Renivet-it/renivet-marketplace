import { describe, expect, test } from "bun:test";

async function source(path: string) {
    return Bun.file(new URL(`../${path}`, import.meta.url)).text();
}

describe("REN-105 leaf client-boundary pilot", () => {
    test("keeps the separator wrapper server-compatible", async () => {
        expect(await source("src/components/ui/separator.tsx")).not.toMatch(
            /^"use client";/m
        );
    });

    test("keeps the label wrapper server-compatible", async () => {
        expect(await source("src/components/ui/label.tsx")).not.toMatch(
            /^"use client";/m
        );
    });
});
