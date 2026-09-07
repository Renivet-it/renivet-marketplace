import { expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

test("renders festive mobile actions with functional sides and centered artwork", async () => {
    let Frame:
        | undefined
        | ((props: {
              filters: React.ReactNode;
              sort: React.ReactNode;
          }) => React.ReactNode);

    try {
        const frameModule = await import(
            "../src/components/shop/festive-mobile-actions-frame"
        );
        Frame = frameModule.FestiveMobileActionsFrame;
    } catch {
        Frame = undefined;
    }

    expect(Frame).toBeFunction();

    const html = renderToStaticMarkup(
        createElement(Frame!, {
            filters: createElement("button", null, "Filters"),
            sort: createElement("button", null, "Recommended"),
        })
    );

    expect(html).toContain("Filters");
    expect(html).toContain("Recommended");
    expect(html).toContain(
        "/assets/festive-season/festive-mobile-actions-lotus.svg"
    );
    expect(html).toContain(
        "/assets/festive-season/festive-mobile-actions-border.svg"
    );
    expect(html).toContain("grid-cols-[1fr_auto_1fr]");
    expect(html).toContain("data-festive-lotus-medallion=\"true\"");
    expect(html).toContain("data-festive-bottom-spacing=\"true\"");
    expect(html).toContain("h-16");
    expect(html).toContain("size-[48px]");
    expect(html).toContain("[&amp;_button]:text-base");
    expect(html).toContain("h-4");
    expect(html).not.toContain("size-[58px]");
});
