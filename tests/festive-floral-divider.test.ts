import { expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

test("renders the festive floral divider as a decorative repeating rail", async () => {
    let Divider: undefined | (() => React.ReactNode);

    try {
        const dividerModule = await import(
            "../src/components/shop/festive-floral-divider"
        );
        Divider = dividerModule.FestiveFloralDivider;
    } catch {
        Divider = undefined;
    }

    expect(Divider).toBeFunction();

    const html = renderToStaticMarkup(createElement(Divider!));
    expect(html).toContain("aria-hidden=\"true\"");
    expect(html).toContain("/assets/festive-season/festive-mixed-floral-rail.svg");
    expect(html).not.toContain("festive-divider-tile.svg");
    expect(html).toContain("repeat-x");
});

test("uses alternating green leaf and pink flower motifs", async () => {
    const asset = await Bun.file(
        "public/assets/festive-season/festive-mixed-floral-rail.svg"
    ).text();

    expect(asset).toContain("id=\"green-leaf\"");
    expect(asset).toContain("id=\"pink-flower\"");
});
