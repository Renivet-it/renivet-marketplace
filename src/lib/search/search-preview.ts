export function toSuggestionStrings(data: unknown): string[] {
    if (!Array.isArray(data)) return [];

    return data
        .map((item) => {
            if (typeof item === "string") return item;
            if (!item || typeof item !== "object") return "";

            const candidate = item as {
                displayText?: unknown;
                text?: unknown;
                keyword?: unknown;
            };

            if (typeof candidate.displayText === "string") {
                return candidate.displayText;
            }
            if (typeof candidate.text === "string") return candidate.text;
            if (typeof candidate.keyword === "string") {
                return candidate.keyword;
            }
            return "";
        })
        .filter(Boolean)
        .slice(0, 10);
}

export function toSearchPreviewProducts(data: unknown) {
    const rows = Array.isArray(data)
        ? data
        : data && typeof data === "object" && "data" in data
          ? (data as { data?: unknown }).data
          : [];

    if (!Array.isArray(rows)) return [];

    return rows.slice(0, 4).flatMap((item) => {
        if (!item || typeof item !== "object") return [];

        const product = item as {
            id?: unknown;
            slug?: unknown;
            name?: unknown;
            title?: unknown;
            price?: unknown;
            media?: unknown;
            brand?: { name?: unknown } | null;
        };
        const mediaRows = Array.isArray(product.media)
            ? product.media
            : product.media && typeof product.media === "object"
              ? [product.media]
              : [];
        const media = mediaRows.find(
            (entry) =>
                entry &&
                typeof entry === "object" &&
                typeof (
                    (entry as { mediaItem?: { url?: unknown } }).mediaItem
                        ?.url
                ) === "string"
        ) as { url?: unknown; mediaItem?: { url?: unknown } } | undefined;
        const mediaUrl =
            (typeof media?.mediaItem?.url === "string"
                ? media.mediaItem.url
                : undefined) ??
            (typeof media?.url === "string" ? media.url : undefined);
        const id = typeof product.id === "string" ? product.id : "";
        const name =
            typeof product.name === "string"
                ? product.name
                : typeof product.title === "string"
                  ? product.title
                  : "";

        if (!id || !name) return [];

        return [
            {
                id,
                slug: typeof product.slug === "string" ? product.slug : id,
                name,
                price:
                    typeof product.price === "number" ? product.price : 0,
                media: mediaUrl ? { url: mediaUrl } : null,
                ...(typeof product.brand?.name === "string"
                    ? { brand: { name: product.brand.name } }
                    : {}),
            },
        ];
    });
}
