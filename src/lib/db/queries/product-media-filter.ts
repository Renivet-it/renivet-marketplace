type ProductWithResolvedMedia = {
    media: Array<{
        mediaItem?: {
            url?: string | null;
        } | null;
    }>;
};

export type CatalogMediaPostFilterObservation = {
    event: "catalog_media_post_filter";
    inputCount: number;
    outputCount: number;
    removedCount: number;
    hasSearch: boolean;
};

export const shouldRequireCatalogMedia = (requireMedia?: boolean) =>
    requireMedia === true;

export const getCatalogRequireMediaPredicate = (requireMedia?: boolean) =>
    shouldRequireCatalogMedia(requireMedia)
        ? hasMedia(products, "media")
        : undefined;

export const filterProductsByResolvedMedia = <T extends ProductWithResolvedMedia>(
    products: T[],
    requireMedia: boolean
) => {
    if (!requireMedia) return products;

    return products.filter((product) =>
        product.media.some((media) => Boolean(media.mediaItem?.url))
    );
};

export const buildCatalogMediaPostFilterObservation = ({
    inputCount,
    outputCount,
    hasSearch,
}: {
    inputCount: number;
    outputCount: number;
    hasSearch: boolean;
}): CatalogMediaPostFilterObservation | null => {
    const removedCount = Math.max(0, inputCount - outputCount);
    if (removedCount === 0) return null;

    return {
        event: "catalog_media_post_filter",
        inputCount,
        outputCount,
        removedCount,
        hasSearch,
    };
};

export const emitCatalogMediaPostFilterObservation = (
    observation: CatalogMediaPostFilterObservation,
    sink: (observation: CatalogMediaPostFilterObservation) => void = (value) =>
        console.info(JSON.stringify(value))
) => {
    try {
        sink(observation);
    } catch {
        // Catalog results must not depend on best-effort observability.
    }
};
import { hasMedia } from "@/lib/db/helperfilter";

import { products } from "../schema";
