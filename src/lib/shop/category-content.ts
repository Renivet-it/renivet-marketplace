const EDITORIAL_FALLBACK =
    "Explore this category through a considered selection of products from the Renivet marketplace. The collection brings together relevant options from participating brands while preserving the live availability, pricing, and product information shown throughout the catalogue. Use the catalogue controls to narrow the selection by subcategory, product type, brand, price, colour, size, discount, search term, or sort order. Each filter refines the current category without changing its primary identity, making the page straightforward to browse, share, and revisit. Product cards continue to link to their existing detail pages, where current descriptions, materials, care information, delivery details, and seller information can be reviewed before purchase. As products are added, updated, paused, or sold out, this category page continues to reflect the marketplace catalogue rather than a fixed promotional list. Shoppers can compare available options, save favourites, and move between broader and narrower selections using the same controls available in the main shop. This introduction is intentionally factual and general, so it remains accurate as the assortment changes and does not introduce claims that are not supported by category or product records.";

const hasEditorialLength = (copy: string) => {
    const words = copy.trim().split(/\s+/).filter(Boolean).length;
    return words >= 150 && words <= 300;
};

export function getCategoryEditorialCopy(
    description: string | null | undefined
) {
    const copy = description?.trim();
    return copy && hasEditorialLength(copy) ? copy : EDITORIAL_FALLBACK;
}
