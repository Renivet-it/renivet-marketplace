import { expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

test("renders the festive lotus above the mobile search content", async () => {
    let DecoratedSearch:
        | undefined
        | ((props: { children: React.ReactNode }) => React.ReactNode);

    try {
        const searchModule = await import(
            "../src/components/shop/festive-mobile-search"
        );
        DecoratedSearch = searchModule.FestiveMobileSearch;
    } catch {
        DecoratedSearch = undefined;
    }

    expect(DecoratedSearch).toBeFunction();

    const html = renderToStaticMarkup(
        createElement(
            DecoratedSearch!,
            null,
            createElement("div", { role: "search" }, "Product search")
        )
    );

    const lotusPosition = html.indexOf(
        "/assets/festive-season/festive-mobile-actions-lotus.svg"
    );
    const searchPosition = html.indexOf("Product search");

    expect(lotusPosition).toBeGreaterThan(-1);
    expect(searchPosition).toBeGreaterThan(lotusPosition);
    expect(html).toContain("data-festive-search-lotus=\"true\"");
    expect(html).toContain("self-end");
});
