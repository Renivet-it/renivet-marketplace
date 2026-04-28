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
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { ProductCard } from "../globals/cards";
import { Icons } from "../icons";
import { Button } from "../ui/button-general";
import {
    EmptyPlaceholder,
    EmptyPlaceholderContent,
    EmptyPlaceholderDescription,
    EmptyPlaceholderIcon,
    EmptyPlaceholderTitle,
} from "../ui/empty-placeholder-general";
import { Spinner } from "../ui/spinner";

interface PageProps extends GenericProps {
    initialData: {
        data: ProductWithBrand[];
        count: number;
    };
    initialWishlist?: CachedWishlist[];
    userId?: string;
    initialPage?: number;
}

export function ShopProducts({
    className,
    initialData,
    initialWishlist,
    userId,
    initialPage = 1,
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
        "shopPage",
        parseAsInteger.withDefault(initialPage)
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
    const [subCategoryId] = useQueryState("subCategoryId", {
        defaultValue: "",
    });
    const [legacySubCategoryId] = useQueryState("subcategoryId", {
        defaultValue: "",
    });
    const effectiveSubCategoryId = subCategoryId || legacySubCategoryId;
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
        parseAsStringLiteral([
            "price",
            "createdAt",
            "recommended",
            "best-sellers",
        ] as const).withDefault("recommended")
    );
    const [sortOrder] = useQueryState(
        "sortOrder",
        parseAsStringLiteral(["asc", "desc"] as const).withDefault("desc")
    );
    const [minDiscount] = useQueryState("minDiscount", parseAsInteger);

    const [initialParams] = useState(() =>
        JSON.stringify({
            page,
            limit,
            search,
            brandIds,
            minPrice,
            maxPrice,
            categoryId,
            subCategoryId: effectiveSubCategoryId,
            productTypeId,
            sortBy,
            sortOrder,
            colors,
            sizes,
            minDiscount,
        })
    );

    const currentParams = JSON.stringify({
        page,
        limit,
        search,
        brandIds,
        minPrice,
        maxPrice,
        categoryId,
        subCategoryId: effectiveSubCategoryId,
        productTypeId,
        sortBy,
        sortOrder,
        colors,
        sizes,
        minDiscount,
    });

    const isSameAsInitial = initialParams === currentParams;

    const {
        data: queryData,
        isFetching,
        isError,
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
            subcategoryId: !!effectiveSubCategoryId.length
                ? effectiveSubCategoryId
                : undefined,
            productTypeId: !!productTypeId.length ? productTypeId : undefined,
            sortBy: sortBy === "recommended" ? undefined : sortBy,
            sortOrder: sortBy === "recommended" ? undefined : sortOrder,
            colors: colors.length ? colors : undefined,
            sizes: sizes.length ? sizes : undefined,
            // Don't boost best sellers when search is active; search relevance should win.
            prioritizeBestSellers:
                !search && page === 1 && (!sortBy || sortBy === "recommended"),
            requireMedia: true,
            // Only enable recommendations for the default "recommended" sort.
            useRecommendations:
                !search && (!sortBy || sortBy === "recommended"),
        },
        {
            // Prevent a duplicate client fetch on first render when server data already matches.
            enabled: !isSameAsInitial,
            initialData: isSameAsInitial
                ? {
                      ...initialData,
                      recommendationSource: null,
                      topBrandMatch: null,
                  }
                : undefined,
            // Never cache search results; always fetch fresh so search is accurate.
            // Only apply staleTime when showing default browse (no filters at all).
            staleTime:
                !search &&
                !categoryId.length &&
                !effectiveSubCategoryId.length &&

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

    const count = queryData?.count ?? 0;

    const visibleProducts: ProductWithBrand[] = useMemo(() => {
        const products = queryData?.data ?? [];
        return Array.isArray(products)
            ? products.filter((p: ProductWithBrand) => !p?.isDeleted)
            : [];
    }, [queryData?.data]);

    const [allProducts, setAllProducts] = useState<ProductWithBrand[]>(() =>
        Array.isArray(initialData?.data)
            ? initialData.data.filter((p) => !p?.isDeleted)
            : []
    );
    const [totalCount, setTotalCount] = useState<number>(
        initialData?.count ?? 0
    );
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const loadedPagesRef = useRef<Set<number>>(new Set([page || 1]));
    const autoLoadTriggerRef = useRef<HTMLButtonElement | null>(null);

    const hasMoreProducts = allProducts.length < totalCount;

    const loadMoreProducts = useCallback(() => {
        if (isFetching || isLoadingMore || !hasMoreProducts) return;

        setIsLoadingMore(true);
        void setPage((page || 1) + 1);
    }, [hasMoreProducts, isFetching, isLoadingMore, page, setPage]);

    useEffect(() => {
        if (isFetching) return;

        const currentPage = page || 1;

        if (currentPage === 1) {
            loadedPagesRef.current = new Set([1]);
            setAllProducts(visibleProducts);
            setTotalCount(count);
            setIsLoadingMore(false);
            return;
        }

        if (loadedPagesRef.current.has(currentPage)) {
            setIsLoadingMore(false);
            return;
        }

        loadedPagesRef.current.add(currentPage);
        setTotalCount(count);
        setAllProducts((previousProducts) => {
            const existingIds = new Set(previousProducts.map((p) => p.id));
            const uniqueNewProducts = visibleProducts.filter(
                (p) => !existingIds.has(p.id)
            );

            return [...previousProducts, ...uniqueNewProducts];
        });
        setIsLoadingMore(false);
    }, [count, isFetching, page, visibleProducts]);

    // The "Show more" button IS the sentinel — when it scrolls into view it
    // auto-fires loadMoreProducts, so no extra invisible div is needed.
    useEffect(() => {
        if (!autoLoadTriggerRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (!entries[0]?.isIntersecting) return;
                if (hasMoreProducts && !isFetching && !isLoadingMore) {
                    loadMoreProducts();
                }
            },
            {
                // Start loading as soon as the button is 200px away from entering view
                rootMargin: "0px 0px 200px 0px",
                threshold: 0,
            }
        );

        observer.observe(autoLoadTriggerRef.current);
        return () => observer.disconnect();
    }, [hasMoreProducts, isFetching, isLoadingMore, loadMoreProducts]);

    useEffect(() => {
        if (!isError) return;
        setIsLoadingMore(false);
    }, [isError]);

    if (isFetching && !allProducts.length) {
        return (
            <div className="flex justify-center py-10">
                <Spinner className="size-6 animate-spin" />
            </div>
        );
    }

    if (!allProducts.length && !isFetching) {
        return <NoProductCard />;
    }

    return (
        <>
            <div
                className={cn(
                    "grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 md:gap-x-4 md:gap-y-8 lg:grid-cols-4 xl:grid-cols-4",
                    className
                )}
                {...props}
            >
                {allProducts.map((product) => {
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

            <div className="mt-1 flex flex-col items-center gap-3 border-t border-[#e4e9ef] py-8">
                {hasMoreProducts ? (
                    <Button
                        ref={
                            autoLoadTriggerRef as React.RefObject<HTMLButtonElement>
                        }
                        onClick={loadMoreProducts}
                        disabled={isFetching || isLoadingMore}
                        className="min-w-[180px] rounded-full border border-[#d2dbe5] bg-white px-7 text-[#243754] shadow-none hover:bg-[#f5f8fc]"
                    >
                        {isFetching || isLoadingMore ? (
                            <span className="inline-flex items-center gap-2">
                                <Spinner className="size-4 animate-spin" />
                                Loading...
                            </span>
                        ) : (
                            "Show more"
                        )}
                    </Button>
                ) : (
                    allProducts.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                            You&apos;ve reached the end of this list.
                        </p>
                    )
                )}

                {isError && (
                    <p className="text-sm text-destructive">
                        Could not load more products. Please try again.
                    </p>
                )}
            </div>
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
