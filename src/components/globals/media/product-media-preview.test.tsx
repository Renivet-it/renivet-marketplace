import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ProductMediaPreview } from "./product-media-preview";

test("loads admin product media directly and eagerly", () => {
    const url =
        "https://new-upload-app.ufs.sh/f/product-image.webp?token=private-preview";
    const html = renderToStaticMarkup(
        <ProductMediaPreview
            src={url}
            alt="Product front view"
            className="object-cover"
        />
    );

    expect(html).toContain(`src="${url.replace("&", "&amp;")}"`);
    expect(html).toContain('loading="eager"');
    expect(html).not.toContain("/_next/image");
});
