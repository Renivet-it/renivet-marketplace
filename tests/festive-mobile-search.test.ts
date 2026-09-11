import { expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

test("does not add a standalone lotus beside the festive search", async () => {
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

    const searchPosition = html.indexOf("Product search");

    expect(searchPosition).toBeGreaterThan(-1);
    expect(html).not.toContain("festive-mobile-actions-lotus.svg");
    expect(html).not.toContain("data-festive-search-lotus");
});
