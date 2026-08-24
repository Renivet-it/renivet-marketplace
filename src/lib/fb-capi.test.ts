import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

test("reads the CAPI access token from the typed server environment", async () => {
    const [capiSource, envSource] = await Promise.all([
        readFile(new URL("./fb-capi.ts", import.meta.url), "utf8"),
        readFile(new URL("../../env.ts", import.meta.url), "utf8"),
    ]);

    expect(capiSource).toContain('import { env } from "../../env";');
    expect(capiSource).toContain(
        "const ACCESS_TOKEN = env.FACEBOOK_CAPI_ACCESS_TOKEN;"
    );
    expect(capiSource).not.toMatch(/const ACCESS_TOKEN\s*=\s*["']/);
    expect(envSource).toContain("FACEBOOK_CAPI_ACCESS_TOKEN");
});
