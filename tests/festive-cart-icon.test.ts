import { expect, test } from "bun:test";

const sourcePath = new URL(
    "../src/components/globals/layouts/navbar/navbar-home.tsx",
    import.meta.url
);

test("uses a smaller festive pink cart icon on the festive route", async () => {
    const source = await Bun.file(sourcePath).text();

    expect(source).toContain('const isFestivePage = usePathname() === "/festive"');
    expect(source).toContain('"size-4 text-[#DF2463]"');
    expect(source).toContain('isFestivePage &&');
});
