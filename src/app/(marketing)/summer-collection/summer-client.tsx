"use client";

import { trackProductClick } from "@/actions/track-product";
import { trpc } from "@/lib/trpc/client";
import { ProductWithBrand } from "@/lib/validations";
import { keepPreviousData } from "@tanstack/react-query";
import Image from "next/image";
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
import { showAddToCartToast } from "@/components/globals/custom-toasts/add-to-cart-toast";
import { Icons } from "@/components/icons";
import { Pagination } from "@/components/ui/data-table-general";
import { useAddToCartTracking } from "@/lib/hooks/useAddToCartTracking";
import { convertPaiseToRupees, formatPriceTag } from "@/lib/utils";
import { handleCartFlyAnimation } from "@/lib/utils/cartAnimation";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/* --------------------------------------------------------
   GUEST CART HOOK
-------------------------------------------------------- */
function useGuestCart() {
    const [guestCart, setGuestCart] = useState<any[]>([]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem("guest_cart");
            if (stored) setGuestCart(JSON.parse(stored));
        } catch {
            setGuestCart([]);
        }
    }, []);

    const addToGuestCart = (item: any) => {
        const stored = localStorage.getItem("guest_cart");
        const prev = stored ? JSON.parse(stored) : [];

        const existing = prev.find(
            (x: any) =>
                x.productId === item.productId &&
                (x.variantId || null) === (item.variantId || null)
        );

        const updated = existing
            ? prev.map((x: any) =>
                  x.productId === item.productId &&
                  (x.variantId || null) === (item.variantId || null)
                      ? { ...x, quantity: x.quantity + item.quantity }
                      : x
              )
            : [...prev, item];

        localStorage.setItem("guest_cart", JSON.stringify(updated));
        setGuestCart(updated);
        window.dispatchEvent(new Event("guestCartUpdated"));
        if (item.fullProduct) {
            showAddToCartToast(
                item.fullProduct,
                null,
                existing ? "Increased quantity in Cart" : "Item added to cart!"
            );
        } else {
            toast.success(existing ? "Updated Cart" : "Added to Cart!");
        }
    };

    return { guestCart, addToGuestCart };
}

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
    const { trackAddToCartEvent } = useAddToCartTracking();
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
            minDiscount: minDiscount !== null ? minDiscount : undefined,
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

    const router = useRouter();
    const { addToGuestCart } = useGuestCart();

    const { mutateAsync: addToCart } =
        trpc.general.users.cart.addProductToCart.useMutation({
            onSuccess: () => {},
            onError: (err) =>
                toast.error(err.message || "Could not add to cart."),
        });

    const { data: user, isPending: isUserFetching } =
        trpc.general.users.currentUser.useQuery();

    const { data: wishlist, refetch: refetchWishlist } =
        trpc.general.users.wishlist.getWishlist.useQuery(
            { userId: userId! },
            { enabled: !!userId }
        );

    const { mutate: addToWishlist } =
        trpc.general.users.wishlist.addProductInWishlist.useMutation({
            onMutate: () => {
                toast.success("Added to wishlist");
            },
            onSuccess: () => refetchWishlist(),
            onError: (err) => toast.error(err.message),
        });

    const { mutate: removeFromWishlist } =
        trpc.general.users.wishlist.removeProductInWishlist.useMutation({
            onMutate: () => {
                toast.success("Removed from wishlist");
            },
            onSuccess: () => refetchWishlist(),
            onError: (err) => toast.error(err.message),
        });

    const handleWishlistToggle = (
        e: React.MouseEvent,
        productId: string,
        isWishlisted: boolean
    ) => {
        e.preventDefault();
        e.stopPropagation();

        if (isUserFetching) return toast.error("User fetching in progress...");
        if (!userId || !user) return router.push("/auth/signin");

        if (user.roles.length > 0)
            return toast.error("Only customers can use the wishlist");

        if (isWishlisted) {
            removeFromWishlist({ userId, productId });
        } else {
            addToWishlist({ userId, productId });
        }
    };

    const handleAddProductToCart = async (
        e: React.MouseEvent,
        product: ProductWithBrand,
        productPrice: number,
        imageUrl: string
    ) => {
        e.preventDefault();
        e.stopPropagation();

        const buttonEl = e.currentTarget as HTMLElement | null;

        // Trigger flying animation before async tracking
        if (buttonEl) {
            try {
                handleCartFlyAnimation(e, imageUrl);
            } catch {}
        }

        try {
            const rawPrice = product.variants?.[0]?.price || product.price || 0;
            const variantId = product.variants?.[0]?.id || null;

            await trackAddToCartEvent({
                productId: product.id,
                brandId: product.brandId,
                productTitle: product.title,
                brandName: product.brand?.name,
                productPrice: rawPrice,
                quantity: 1,
            });

            if (userId) {
                await addToCart({
                    productId: product.id,
                    variantId: variantId,
                    quantity: 1,
                    userId,
                });
                showAddToCartToast(product, null, "Item added to cart!");
            } else {
                addToGuestCart({
                    productId: product.id,
                    variantId,
                    quantity: 1,
                    title: product.title,
                    brand: product.brand?.name,
                    price: rawPrice,
                    image: imageUrl,
                    fullProduct: product,
                });
            }
        } catch (err: any) {
            toast.error(err.message || "Could not add to cart.");
        }
    };

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
                            value={
                                sortBy === "price"
                                    ? `price_${sortOrder}`
                                    : sortBy
                            }
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === "price_asc") {
                                    setSortBy("price");
                                    setSortOrder("asc");
                                } else if (val === "price_desc") {
                                    setSortBy("price");
                                    setSortOrder("desc");
                                } else {
                                    setSortBy(val as any);
                                }
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
                                        We couldn&apos;t find any products
                                        matching your filters.
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

                                        let productPrice = 0;
                                        let productCompareAtPrice = 0;

                                        if (!product.productHasVariants) {
                                            productPrice = product.price || 0;
                                            productCompareAtPrice =
                                                product.compareAtPrice || 0;
                                        } else {
                                            const minPriceVariant =
                                                product.variants?.[0];
                                            productPrice =
                                                minPriceVariant?.price || 0;
                                            productCompareAtPrice =
                                                minPriceVariant?.compareAtPrice ||
                                                0;
                                        }

                                        const offPercent =
                                            productCompareAtPrice > productPrice
                                                ? Math.round(
                                                      ((productCompareAtPrice -
                                                          productPrice) /
                                                          productCompareAtPrice) *
                                                          100
                                                  )
                                                : 0;

                                        const imageUrl =
                                            product.media?.[0]?.mediaItem
                                                ?.url ||
                                            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80";

                                        return (
                                            <Link
                                                href={`/products/${product.slug}`}
                                                key={product.id}
                                                className="card"
                                                onClick={() =>
                                                    handleProductClick(
                                                        product.id,
                                                        product.brandId
                                                    )
                                                }
                                            >
                                                <div className="card-img relative">
                                                    <Image
                                                        src={imageUrl}
                                                        alt={product.title}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                    {offPercent > 0 && (
                                                        <div className="tag tag-off">
                                                            {offPercent}% Off
                                                        </div>
                                                    )}
                                                    <div
                                                        className="wish"
                                                        onClick={(e) =>
                                                            handleWishlistToggle(
                                                                e,
                                                                product.id,
                                                                isWishlisted
                                                            )
                                                        }
                                                    >
                                                        <svg
                                                            viewBox="0 0 24 24"
                                                            fill={
                                                                isWishlisted
                                                                    ? "#C0607A"
                                                                    : "white"
                                                            }
                                                            stroke="#C0607A"
                                                            strokeWidth="2"
                                                        >
                                                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                                        </svg>
                                                    </div>
                                                    <div
                                                        className="quick"
                                                        onClick={(e) =>
                                                            handleAddProductToCart(
                                                                e,
                                                                product,
                                                                productPrice,
                                                                imageUrl
                                                            )
                                                        }
                                                    >
                                                        Quick Add
                                                    </div>
                                                </div>
                                                <div className="dots">
                                                    {product.media &&
                                                        product.media
                                                            .slice(0, 3)
                                                            .map((_, i) => (
                                                                <div
                                                                    key={i}
                                                                    className={`dot ${i === 0 ? "on" : ""}`}
                                                                ></div>
                                                            ))}
                                                    {(!product.media ||
                                                        product.media.length ===
                                                            0) && (
                                                        <div className="dot on"></div>
                                                    )}
                                                </div>
                                                <div className="card-info">
                                                    <div className="brand-name">
                                                        {product.brand?.name}
                                                    </div>
                                                    <div className="prod-name">
                                                        {product.title}
                                                    </div>
                                                    <div className="pricing">
                                                        <span className="price-now">
                                                            ₹
                                                            {formatPriceTag(
                                                                parseFloat(
                                                                    convertPaiseToRupees(
                                                                        productPrice
                                                                    )
                                                                )
                                                            )}
                                                        </span>
                                                        {productCompareAtPrice >
                                                            productPrice && (
                                                            <>
                                                                <span className="price-was">
                                                                    ₹
                                                                    {formatPriceTag(
                                                                        parseFloat(
                                                                            convertPaiseToRupees(
                                                                                productCompareAtPrice
                                                                            )
                                                                        )
                                                                    )}
                                                                </span>
                                                                <span className="price-off">
                                                                    {offPercent}
                                                                    % off
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                    {product.variants &&
                                                        product.variants
                                                            .length > 0 && (
                                                            <div className="swatches">
                                                                {product.variants
                                                                    .slice(0, 3)
                                                                    .map(
                                                                        (v) => (
                                                                            <div
                                                                                key={
                                                                                    v.id
                                                                                }
                                                                                className="swatch"
                                                                                style={{
                                                                                    background:
                                                                                        "#F2B8C0",
                                                                                }}
                                                                            ></div>
                                                                        )
                                                                    )}
                                                            </div>
                                                        )}
                                                </div>
                                            </Link>
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
