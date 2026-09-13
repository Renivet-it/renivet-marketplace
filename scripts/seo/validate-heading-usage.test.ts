import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "bun:test";

const homepageSectionFiles = [
    "src/components/home/new-home-page/discount-section.tsx",
    "src/components/home/new-home-page/everyday-essential.tsx",
    "src/components/home/shop-slow.tsx",
    "src/components/home/women/top-collection.tsx",
    "src/components/home/men/new-collection.tsx",
    "src/components/home/beauty-personal/product-new-arrival.tsx",
];

const routeFixtures: Record<string, string> = {
    "src/app/(home)/page.tsx": "<h1>Home</h1>",
    "src/app/(home)/layout.tsx": "export {};",
    "src/app/(marketing)/shop/page.tsx": "<h1>Shop</h1>",
    "src/app/(marketing)/shop/layout.tsx": "export {};",
    "src/components/globals/layouts/footer/footer.tsx": "export {};",
    "src/components/shop/storefront-catalog-page.tsx": "export {};",
    "src/app/(home)/festive/page.tsx": 'headingLevel="h1"',
    "src/components/home/new-home-page/festive-season.tsx":
        "const Heading = headingLevel;\n<Heading>{heading}</Heading>",
};

async function writeFixtureFile(root: string, file: string, source: string) {
    const destination = join(root, file);
    await Bun.write(destination, source);
}

test.each(homepageSectionFiles)(
    "rejects a bare H1 reintroduced in %s",
    async (sectionFile) => {
        const fixtureRoot = await mkdtemp(join(tmpdir(), "renivet-heading-"));

        try {
            const guardSource = await readFile(
                "scripts/seo/validate-heading-usage.ts",
                "utf8"
            );

            await Promise.all([
                ...Object.entries(routeFixtures).map(([file, source]) =>
                    writeFixtureFile(fixtureRoot, file, source)
                ),
                ...homepageSectionFiles.map((file) =>
                    writeFixtureFile(
                        fixtureRoot,
                        file,
                        file === sectionFile ? "<h1>Regression</h1>" : "<h2>Section</h2>"
                    )
                ),
                writeFixtureFile(
                    fixtureRoot,
                    "scripts/seo/validate-heading-usage.ts",
                    guardSource
                ),
            ]);

            const guardProcess = Bun.spawn(
                [process.execPath, "scripts/seo/validate-heading-usage.ts"],
                {
                    cwd: fixtureRoot,
                    stderr: "pipe",
                    stdout: "pipe",
                }
            );
            const [exitCode, stderr] = await Promise.all([
                guardProcess.exited,
                new Response(guardProcess.stderr).text(),
            ]);

            expect(exitCode).toBe(1);
            expect(stderr).toContain("/ must compose exactly one H1");
        } finally {
            await rm(fixtureRoot, { force: true, recursive: true });
        }
    }
);
