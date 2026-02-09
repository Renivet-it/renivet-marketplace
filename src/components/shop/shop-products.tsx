"use client";

import { trackProductClick } from "@/actions/track-product";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { CachedWishlist, ProductWithBrand } from "@/lib/validations";
import Link from "next/link";
import {
    parseAsArrayOf,
    parseAsInteger,
    parseAsString,
    parseAsStringLiteral,
    useQueryState,
} from "nuqs";
import { useEffect, useState } from "react";
import { ProductCard } from "../globals/cards";
import { Icons } from "../icons";
import { Button } from "../ui/button-general";
import { Pagination } from "../ui/data-table-general";
import {
    EmptyPlaceholder,
    EmptyPlaceholderContent,
    EmptyPlaceholderDescription,
    EmptyPlaceholderIcon,
    EmptyPlaceholderTitle,
} from "../ui/empty-placeholder-general";
import { Separator } from "../ui/separator";

interface PageProps extends GenericProps {
    initialData: {
        data: ProductWithBrand[];
        count: number;
    };
    initialWishlist?: CachedWishlist[];
    userId?: string;
}

export function ShopProducts({
    className,
    initialData,
    initialWishlist,
    userId,
    ...props
}: PageProps) {
    const handleProductClick = async (productId: string, brandId: string) => {
        try {
            await trackProductClick(productId, brandId);
        } catch (error) {
            console.error("Failed to track click:", error);
        }
    };

    const [page, setPage] = useQueryState(
        "page",
        parseAsInteger.withDefault(1)
    );
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(28));
    const [search] = useQueryState("search", { defaultValue: "" });
    const [brandIds] = useQueryState(
        "brandIds",
        parseAsArrayOf(parseAsString, ",").withDefault([])
    );
    const [minPrice] = useQueryState("minPrice", parseAsInteger.withDefault(0));
    const [maxPrice] = useQueryState(
        "maxPrice",
        parseAsInteger.withDefault(1000000)
    );
    const [categoryId] = useQueryState("categoryId", { defaultValue: "" });
    const [subCategoryId] = useQueryState("subcategoryId", {
        defaultValue: "",
    });
    const [productTypeId] = useQueryState("productTypeId", {
        defaultValue: "",
    });
    const [colors] = useQueryState(
        "colors",
        parseAsArrayOf(parseAsString, ",").withDefault([])
    );
    const [sizes] = useQueryState(
        "sizes",
        parseAsArrayOf(parseAsString, ",").withDefault([])
    );
    const [sortBy] = useQueryState(
        "sortBy",
        parseAsStringLiteral(["price", "createdAt"] as const).withDefault(
            "createdAt"
        )
    );
    const [sortOrder] = useQueryState(
        "sortOrder",
        parseAsStringLiteral(["asc", "desc"] as const).withDefault("desc")
    );
    const [minDiscount] = useQueryState("minDiscount", parseAsInteger);

    const {
        data: { data: products, count },
        isFetching,
    } = trpc.brands.products.getProducts.useQuery(
        {
            page,
            limit,
            search,
            isPublished: true,
            isAvailable: true,
            isActive: true,
            isDeleted: false,
            verificationStatus: "approved",
            brandIds,
            minPrice: minPrice < 0 ? 0 : minPrice,
            maxPrice: maxPrice,
            categoryId: !!categoryId.length ? categoryId : undefined,
            subcategoryId: !!subCategoryId.length ? subCategoryId : undefined,
            productTypeId: !!productTypeId.length ? productTypeId : undefined,
            sortBy,
            sortOrder,
            colors: colors.length ? colors : undefined,
            sizes: sizes.length ? sizes : undefined,
            minDiscount: minDiscount ? Number(minDiscount) : undefined,
            prioritizeBestSellers: true,
            requireMedia: true,
            // Enable personalized recommendations on all pages (when no filters)
            useRecommendations: true,
        },
        {
            initialData: { ...initialData, recommendationSource: null },
            // Only apply staleTime when no filters active (for recommendations)
            // When filters are active, allow immediate refetch
            staleTime:
                !search &&
                !categoryId.length &&
                !subCategoryId.length &&
                !productTypeId.length &&
                !brandIds?.length &&
                !colors.length &&
                !sizes.length &&
                !minDiscount
                    ? 60 * 1000
                    : 0,
        }
    );

    const { data: wishlist } = trpc.general.users.wishlist.getWishlist.useQuery(
        { userId: userId! },
        { enabled: !!userId, initialData: initialWishlist }
    );

    // --- FILTER PRODUCTS ---
    // We now filter for media on the server (requireMedia: true), so we trust the server count
    const visibleProducts: ProductWithBrand[] = Array.isArray(products)
        ? products.filter((p: any) => !p?.isDeleted)
        : [];

    const pages = Math.ceil(count / limit) ?? 1;
    const [checkedPages, setCheckedPages] = useState<number[]>([]);

    // --- AUTO-SKIP EMPTY PAGE LOGIC ---
    useEffect(() => {
        if (!isFetching && visibleProducts.length === 0 && page < pages) {
            if (!checkedPages.includes(page)) {
                setCheckedPages((prev) => [...prev, page]);
                setPage(page + 1);
            }
        }
    }, [visibleProducts, page, pages, isFetching, checkedPages, setPage]);

    // --- LOADING INDICATOR ---
    if (isFetching && !visibleProducts.length) {
        return (
            <div className="flex justify-center py-10">
                <Icons.Loader2 className="size-6 animate-spin" />
            </div>
        );
    }

    // --- FINAL CHECK ---
    if (!visibleProducts.length && page >= pages) {
        return <NoProductCard />;
    }

    return (
        <>
            <div
                className={cn(
                    "grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-20 lg:grid-cols-3 xl:grid-cols-4",
                    className
                )}
                {...props}
            >
                {visibleProducts.map((product) => {
                    const isWishlisted =
                        wishlist?.some(
                            (item) => item.productId === product.id
                        ) ?? false;

                    return (
                        <div
                            key={product.id}
                            onClick={() =>
                                handleProductClick(product.id, product.brandId)
                            }
                            className="cursor-pointer"
                        >
                            <ProductCard
                                product={product}
                                isWishlisted={isWishlisted}
                                userId={userId}
                            />
                        </div>
                    );
                })}
            </div>

            <Separator />

            <Pagination total={pages} />
        </>
    );
}

function NoProductCard() {
    return (
        <div className="flex flex-col items-center justify-center gap-5 p-6">
            <EmptyPlaceholder
                isBackgroundVisible={false}
                className="w-full max-w-full border-none"
            >
                <EmptyPlaceholderIcon>
                    <Icons.AlertTriangle className="size-10" />
                </EmptyPlaceholderIcon>

                <EmptyPlaceholderContent>
                    <EmptyPlaceholderTitle>
                        No products found
                    </EmptyPlaceholderTitle>
                    <EmptyPlaceholderDescription>
                        We couldn&apos;t find any products matching your search.
                        Try again with different filters.
                    </EmptyPlaceholderDescription>
                </EmptyPlaceholderContent>

                <Button asChild>
                    <Link href="/">Go back</Link>
                </Button>
            </EmptyPlaceholder>
        </div>
    );
}
