import { expect, test } from "bun:test";

test("REN-261 restores the editorial carousel to the current festive route", async () => {
    const page = await Bun.file("src/app/(home)/festive/page.tsx").text();

    expect(page).toContain(
        'import { FestiveEditorialCarousel } from "@/components/festive-home/festive-editorial-carousel";'
    );
    expect(page).toContain("<FestiveEditorialCarousel />");
    expect(page.match(/<FestiveEditorialCarousel \/>/g) ?? []).toHaveLength(1);
});
