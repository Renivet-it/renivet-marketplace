"use client";

import { trackProductClick } from "@/actions/track-product";
import { trpc } from "@/lib/trpc/client";
import { ProductWithBrand } from "@/lib/validations";
import { keepPreviousData } from "@tanstack/react-query";
import Link from "next/link";
import {
    parseAsArrayOf,
    parseAsInteger,
    parseAsString,
    parseAsStringLiteral,
    useQueryState,
} from "nuqs";
import { useEffect, useMemo, useState } from "react";
import "./summer.css";
import { ProductCard } from "@/components/globals/cards";
import { Icons } from "@/components/icons";
import { Pagination } from "@/components/ui/data-table-general";

interface SummerClientProps {
    initialData: {
        data: ProductWithBrand[];
        count: number;
    };
    brandsMeta: { id: string; name: string }[];
    categories: { id: string; name: string }[];
    userId?: string;
}

export function SummerClient({
    initialData,
    brandsMeta,
    categories,
    userId,
}: SummerClientProps) {
    const [page, setPage] = useQueryState(
        "page",
        parseAsInteger.withDefault(1)
    );
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(24)); // Changed to 24 for nicer grid
    const [search] = useQueryState("search", { defaultValue: "" });
    const [brandIds, setBrandIds] = useQueryState(
        "brandIds",
        parseAsArrayOf(parseAsString, ",").withDefault([])
    );
    const [minPrice, setMinPrice] = useQueryState(
        "minPrice",
        parseAsInteger.withDefault(0)
    );
    const [maxPrice, setMaxPrice] = useQueryState(
        "maxPrice",
        parseAsInteger.withDefault(1000000)
    );
    const [categoryId, setCategoryId] = useQueryState("categoryId", {
        defaultValue: "",
    });
    const [subCategoryId, setSubCategoryId] = useQueryState("subcategoryId", {
        defaultValue: "",
    });
    const [productTypeId, setProductTypeId] = useQueryState("productTypeId", {
        defaultValue: "",
    });
    const [colors, setColors] = useQueryState(
        "colors",
        parseAsArrayOf(parseAsString, ",").withDefault([])
    );
    const [sizes, setSizes] = useQueryState(
        "sizes",
        parseAsArrayOf(parseAsString, ",").withDefault([])
    );
    const [sortBy, setSortBy] = useQueryState(
        "sortBy",
        parseAsStringLiteral([
            "price",
            "createdAt",
            "recommended",
        ] as const).withDefault("recommended")
    );
    const [sortOrder, setSortOrder] = useQueryState(
        "sortOrder",
        parseAsStringLiteral(["asc", "desc"] as const).withDefault("desc")
    );
    const [minDiscount, setMinDiscount] = useQueryState(
        "minDiscount",
        parseAsInteger
    );

    const [initialParams] = useState(() =>
        JSON.stringify({
            page,
            limit,
            search,
            brandIds,
            minPrice,
            maxPrice,
            categoryId,
            subCategoryId,
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
        subCategoryId,
        productTypeId,
        sortBy,
        sortOrder,
        colors,
        sizes,
        minDiscount,
    });
    const isSameAsInitial = initialParams === currentParams;

    const {
        data: { data: products, count },
        isFetching,
    } = trpc.brands.products.getProducts.useQuery(
        {
            page,
            limit,
            search,
            brandIds,
            minPrice: minPrice < 0 ? 0 : minPrice,
            maxPrice,
            categoryId: !!categoryId.length ? categoryId : undefined,
            subcategoryId: !!subCategoryId.length ? subCategoryId : undefined,
            productTypeId: !!productTypeId.length ? productTypeId : undefined,
            sortBy: sortBy === "recommended" ? undefined : sortBy,
            sortOrder: sortBy === "recommended" ? undefined : sortOrder,
            colors: colors.length ? colors : undefined,
            sizes: sizes.length ? sizes : undefined,
            isPublished: true,
            isAvailable: true,
            isActive: true,
            isDeleted: false,
            verificationStatus: "approved",
            prioritizeBestSellers:
                !search && page === 1 && (!sortBy || sortBy === "recommended"),
            requireMedia: true,
            useRecommendations: !search,
        },
        {
            initialData: isSameAsInitial
                ? {
                      ...initialData,
                      recommendationSource: null,
                      topBrandMatch: null,
                  }
                : undefined,
            placeholderData: keepPreviousData,
        }
    );

    const { data: wishlist } = trpc.general.users.wishlist.getWishlist.useQuery(
        { userId: userId! },
        { enabled: !!userId }
    );

    const visibleProducts = useMemo(
        () =>
            Array.isArray(products)
                ? products.filter((p: ProductWithBrand) => !p?.isDeleted)
                : [],
        [products]
    );
    const pages = Math.ceil(count / limit) ?? 1;

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleProductClick = async (productId: string, brandId: string) => {
        try {
            await trackProductClick(productId, brandId);
        } catch (error) {
            console.error("Failed to track click:", error);
        }
    };

    const toggleBrand = (id: string) => {
        setBrandIds(
            brandIds.includes(id)
                ? brandIds.filter((b) => b !== id)
                : [...brandIds, id]
        );
        setPage(1);
    };

    const toggleDiscount = (val: number) => {
        setMinDiscount(minDiscount === val ? null : val);
        setPage(1);
    };

    // Derived states
    const activeBrandsCount = brandIds.length;
    const isFilterActive = (type: string, val: string | number) => {
        if (type === "brand") return brandIds.includes(val as string);
        if (type === "category") return categoryId === val;
        if (type === "discount") return minDiscount === val;
        return false;
    };

    useEffect(() => {
        document.title = "RENIVET — Summer Edit";
    }, []);

    const resetAll = () => {
        setBrandIds([]);
        setCategoryId("");
        setMinDiscount(null);
        setPage(1);
    };

    return (
        <div className="summer-page-wrapper">
            <div className="ticker">
                <div className="ticker-inner">
                    <div className="ticker-item">
                        <span>Free Shipping Above ₹999</span>
                        <div className="ticker-dot"></div>
                        <span>Summer Edit Now Live</span>
                        <div className="ticker-dot"></div>
                        <span>Up to 67% Off on Greensole</span>
                        <div className="ticker-dot"></div>
                        <span>120+ Sustainable Brands</span>
                        <div className="ticker-dot"></div>
                        <span>Eco-Friendly Packaging</span>
                        <div className="ticker-dot"></div>
                        <span>New Arrivals Daily</span>
                        <div className="ticker-dot"></div>
                    </div>
                </div>
            </div>

            <nav className="summer-nav">
                <Link href="/" className="logo">
                    <div className="logo-box">R</div>Renivet
                </Link>
                <div className="nav-right">
                    <div className="search-pill">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                        Search products...
                    </div>
                </div>
            </nav>

            <div className="hero">
                <div className="hero-left">
                    <div className="hero-eyebrow">
                        🌸 Summer Collection · 2026
                    </div>
                    <div className="hero-title">
                        The <em>Summer</em>
                        <br />
                        Edit is Here
                    </div>
                    <div className="hero-subtitle">
                        Sustainable fashion made for warm, golden days.
                    </div>
                    <div className="hero-cta-row">
                        <button
                            className="btn-primary"
                            onClick={() =>
                                window.scrollTo({
                                    top: 400,
                                    behavior: "smooth",
                                })
                            }
                        >
                            Shop the Edit
                        </button>
                    </div>
                </div>
                <div className="hero-right">
                    <div className="h-stat">
                        <div className="h-stat-num">
                            {brandsMeta.length > 0 ? brandsMeta.length : "120"}
                            <span>+</span>
                        </div>
                        <div className="h-stat-label">Brands</div>
                    </div>
                    <div className="h-stat">
                        <div className="h-stat-num">₹{minPrice || 0}</div>
                        <div className="h-stat-label">Starts At</div>
                    </div>
                    <div className="h-stat">
                        <div className="h-stat-num">
                            {count > 1000 ? Math.floor(count / 1000) : count}
                            <span>{count > 1000 ? "k+" : ""}</span>
                        </div>
                        <div className="h-stat-label">Products</div>
                    </div>
                    <div className="h-stat">
                        <div className="h-stat-num">
                            70<span>%</span>
                        </div>
                        <div className="h-stat-label">Max Discount</div>
                    </div>
                </div>
            </div>

            <div className="layout">
                <aside className="sidebar">
                    <div className="filter-top">
                        <span className="filter-heading">Filters</span>
                        <button className="reset-all" onClick={resetAll}>
                            ↺ Reset All
                        </button>
                    </div>

                    <div className="f-group">
                        <div className="f-group-title">Category</div>
                        <div
                            className={`f-item ${!categoryId ? "active" : ""}`}
                            onClick={() => {
                                setCategoryId("");
                                setPage(1);
                            }}
                        >
                            <div className="f-radio"></div>All Items
                        </div>
                        {categories.slice(0, 8).map((cat) => (
                            <div
                                key={cat.id}
                                className={`f-item ${isFilterActive("category", cat.id) ? "active" : ""}`}
                                onClick={() => {
                                    setCategoryId(
                                        cat.id === categoryId ? "" : cat.id
                                    );
                                    setPage(1);
                                }}
                            >
                                <div className="f-radio"></div>
                                {cat.name}
                            </div>
                        ))}
                    </div>

                    <div className="f-group">
                        <div className="f-group-title">Brands</div>
                        {brandsMeta.slice(0, 10).map((brand) => (
                            <div
                                key={brand.id}
                                className={`f-item ${isFilterActive("brand", brand.id) ? "active" : ""}`}
                                onClick={() => toggleBrand(brand.id)}
                            >
                                <div className="f-check"></div>
                                {brand.name}
                            </div>
                        ))}
                    </div>

                    <div className="f-group">
                        <div className="f-group-title">Discount</div>
                        {[10, 20, 30, 50, 70].map((val) => (
                            <div
                                key={val}
                                className={`f-item ${isFilterActive("discount", val) ? "active" : ""}`}
                                onClick={() => toggleDiscount(val)}
                            >
                                <div className="f-check"></div>
                                {val}% and above
                            </div>
                        ))}
                    </div>
                </aside>

                <main className="main">
                    <div className="cat-strip">
                        <button
                            className={`cat-pill ${!categoryId ? "on" : ""}`}
                            onClick={() => {
                                setCategoryId("");
                                setPage(1);
                            }}
                        >
                            All Items
                        </button>
                        {categories.slice(0, 6).map((cat) => (
                            <button
                                key={cat.id}
                                className={`cat-pill ${categoryId === cat.id ? "on" : ""}`}
                                onClick={() => {
                                    setCategoryId(cat.id);
                                    setPage(1);
                                }}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    <div className="toolbar">
                        <div className="result-info">
                            Showing <strong>{count} products</strong> in Summer
                            Edit
                        </div>
                        <select
                            className="sort-sel"
                            value={sortBy}
                            onChange={(e) => {
                                setSortBy(e.target.value as any);
                                setPage(1);
                            }}
                        >
                            <option value="recommended">Recommended</option>
                            <option value="price_asc">
                                Price: Low to High
                            </option>
                            <option value="price_desc">
                                Price: High to Low
                            </option>
                            <option value="createdAt">Newest First</option>
                        </select>
                    </div>

                    <div className="summer-inline">
                        <div className="si-left">
                            <h3>Sustainable Fashion for Warm Days</h3>
                            <p>
                                Eco-crafted items across multiple brands —
                                curated just for summer
                            </p>
                        </div>
                    </div>

                    {isFetching && !visibleProducts.length ? (
                        <div className="flex justify-center py-10">
                            <Icons.Loader2 className="size-6 animate-spin text-[var(--summer-peach)]" />
                        </div>
                    ) : (
                        <>
                            {visibleProducts.length === 0 ? (
                                <div className="py-20 text-center">
                                    <h3 className="mb-2 text-xl font-semibold">
                                        No products found
                                    </h3>
                                    <p className="text-gray-500">
                                        We couldn't find any products matching
                                        your filters.
                                    </p>
                                    <button
                                        className="btn-primary mt-6"
                                        onClick={resetAll}
                                    >
                                        Reset Filters
                                    </button>
                                </div>
                            ) : (
                                <div className="summer-grid">
                                    {visibleProducts.map((product) => {
                                        const isWishlisted =
                                            wishlist?.some(
                                                (item) =>
                                                    item.productId ===
                                                    product.id
                                            ) ?? false;
                                        return (
                                            <div
                                                key={product.id}
                                                onClick={() =>
                                                    handleProductClick(
                                                        product.id,
                                                        product.brandId
                                                    )
                                                }
                                            >
                                                {/* Re-using the standard ProductCard rather than the heavy custom HTML, 
                                                but letting the summer-grid control sizing. */}
                                                <ProductCard
                                                    product={product}
                                                    isWishlisted={isWishlisted}
                                                    userId={userId}
                                                    className="max-w-full border-[1px] border-[var(--summer-border-soft)] bg-[var(--summer-bg-card)] shadow-sm transition-all hover:border-[var(--summer-peach)] hover:shadow-md"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {count > limit && (
                                <div className="custom-pagination-wrapper mt-8 flex justify-center">
                                    <Pagination total={pages} />
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>

            <button className="btt" onClick={scrollToTop}>
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                >
                    <path d="M18 15l-6-6-6 6" />
                </svg>
            </button>
        </div>
    );
}
