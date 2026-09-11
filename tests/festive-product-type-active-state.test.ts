import { expect, test } from "bun:test";

test("uses festive pink only for active festive product-type pills", async () => {
    let getPillClassName:
        | undefined
        | ((options: { active: boolean; theme?: "festive" }) => string);

    try {
        const pillModule = await import(
            "../src/app/(marketing)/shop/search-component"
        );
        getPillClassName = pillModule.getProductTypePillClassName;
    } catch {
        getPillClassName = undefined;
    }

    expect(getPillClassName).toBeFunction();

    const activeFestive = getPillClassName!({
        active: true,
        theme: "festive",
    });
    const inactiveFestive = getPillClassName!({
        active: false,
        theme: "festive",
    });
    const activeDefault = getPillClassName!({ active: true });

    expect(activeFestive).toContain("bg-[#DF2463]");
    expect(activeFestive).toContain("text-white");
    expect(inactiveFestive).not.toContain("bg-[#DF2463]");
    expect(activeDefault).toContain("bg-[#1f3553]");
});
