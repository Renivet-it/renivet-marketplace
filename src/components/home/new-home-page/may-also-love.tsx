"use client";

import { showAddToCartToast } from "@/components/globals/custom-toasts/add-to-cart-toast";
import { Icons } from "@/components/icons";
import { useGuestWishlist } from "@/lib/hooks/useGuestWishlist";
import { trpc } from "@/lib/trpc/client";
import { convertPaiseToRupees } from "@/lib/utils";
import { handleCartFlyAnimation } from "@/lib/utils/cartAnimation";
import { Banner } from "@/lib/validations";
import { Check, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

/* =============================
   ⭐ GUEST CART HOOK
============================= */
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
        showAddToCartToast(
            item.fullProduct,
            null,
            existing ? "Increased quantity in Cart" : "Item added to cart!"
        );
    };

    return { guestCart, addToGuestCart };
}

const PLACEHOLDER_IMAGE_URL =
    "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1";

// ⭐ PRODUCT CARD — MATCHES NEW LAYOUT
const ProductCard = ({
    banner,
    userId,
}: {
    banner: Banner;
    userId?: string;
}) => {
    const { product } = banner;

    const { addToGuestWishlist } = useGuestWishlist();
    const { addToGuestCart } = useGuestCart();
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [isAdded, setIsAdded] = useState(false);

    const { mutateAsync: addToCart, isLoading } =
        trpc.general.users.cart.addProductToCart.useMutation({
            onSuccess: () => {},
            onError: (err) =>
                toast.error(err.message || "Could not add to cart."),
        });

    const { mutateAsync: addToWishlist } =
        trpc.general.users.wishlist.addProductInWishlist.useMutation({
            onSuccess: () => toast.success("Added to Wishlist!"),
            onError: (err) =>
                toast.error(err.message || "Could not add to wishlist."),
        });

    if (!product) return null;

    const imageUrl =
        product.media?.[0]?.mediaItem?.url || PLACEHOLDER_IMAGE_URL;

    const rawPrice = product.variants?.[0]?.price ?? product.price ?? 0;
    const priceStr = convertPaiseToRupees(rawPrice);
    const price = Math.round(Number(priceStr));

    const compareAt =
        product.variants?.[0]?.compareAtPrice ?? product.compareAtPrice;

    const displayCompareAtStr =
        compareAt && compareAt > rawPrice
            ? convertPaiseToRupees(compareAt)
            : null;
    const displayCompareAt = displayCompareAtStr
        ? Math.round(Number(displayCompareAtStr))
        : null;

    const discountPct =
        compareAt && compareAt > rawPrice
            ? Math.round(((compareAt - rawPrice) / compareAt) * 100)
            : null;

    const variantId = product.variants?.[0]?.id || null;
    const productUrl = `/products/${product.slug}`;

    const handleAddToCart = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            if (userId) {
                await addToCart({
                    productId: product.id,
                    variantId,
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

            // Trigger flying animation
            handleCartFlyAnimation(e, imageUrl);

            setIsAdded(true);
            setTimeout(() => {
                setIsAdded(false);
            }, 2000);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Could not add to cart."
            );
        }
    };

    const handleWishlist = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            if (userId) {
                await addToWishlist({ productId: product.id });
            } else {
                addToGuestWishlist({
                    productId: product.id,
                    variantId: null,
                    title: product.title,
                    brand: product.brand?.name,
                    price: rawPrice,
                    image: imageUrl,
                    sku: null,
                    fullProduct: product,
                });
                toast.success("Added to Wishlist!");
            }
            setIsWishlisted(true);
        } catch (err) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : "Could not add to wishlist."
            );
        }
    };

    return (
        <Link
            href={productUrl}
            className="product-card-container group block w-[160px] flex-shrink-0 sm:w-[200px] md:w-full md:flex-shrink"
        >
            {/* IMAGE CONTAINER */}
            <div className="product-image-container relative h-[220px] w-full overflow-hidden bg-gray-50 sm:h-[260px] md:h-[350px]">
                <Image
                    src={imageUrl}
                    alt={product.title}
                    fill
                    sizes="(max-width: 768px) 160px, 300px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* 🔴 Rectangular discount strip */}
                {discountPct && discountPct > 0 && (
                    <span className="absolute left-0 top-2.5 z-10 whitespace-nowrap rounded-r-full bg-gradient-to-r from-rose-600 to-orange-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-md md:px-3 md:py-1 md:text-xs">
                        {discountPct}% OFF
                    </span>
                )}
            </div>

            {/* CONTENT */}
            <div className="pt-2 text-left">
                <h3 className="line-clamp-2 h-[36px] text-[12px] font-normal text-gray-800 sm:text-[14px]">
                    {product.title}
                </h3>

                {/* PRICE ROW */}
                <div className="mt-1 flex h-[26px] items-center gap-1 sm:gap-1.5">
                    <span className="text-[13px] font-semibold text-gray-900 sm:text-[15px]">
                        ₹{price}
                    </span>

                    {displayCompareAt ? (
                        <span className="text-[11px] text-gray-400 line-through sm:text-[12px]">
                            ₹{displayCompareAt}
                        </span>
                    ) : (
                        <span className="text-[11px] opacity-0 sm:text-[12px]">
                            ₹0000
                        </span>
                    )}
                </div>

                {/* BUTTONS ROW (CART + WISHLIST) */}
                <div className="mt-2 flex items-center gap-2">
                    <button
                        onClick={handleWishlist}
                        className="group flex h-9 flex-1 items-center justify-center rounded border border-gray-300 bg-white transition-all duration-300 hover:border-red-500 hover:bg-red-50 hover:shadow-sm md:h-10"
                    >
                        {isWishlisted ? (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 scale-110 text-red-500 md:h-5 md:w-5"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                            >
                                <path
                                    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42
                4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81
                14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0
                3.78-3.4 6.86-8.55 11.54L12 21.35z"
                                />
                            </svg>
                        ) : (
                            <Icons.Heart className="h-4 w-4 text-gray-500 transition-colors duration-300 group-hover:text-red-500 md:h-5 md:w-5" />
                        )}
                    </button>

                    <button
                        onClick={handleAddToCart}
                        disabled={isLoading || isAdded}
                        className={`flex h-9 flex-1 items-center justify-center rounded border transition-all duration-300 disabled:opacity-50 md:h-10 ${
                            isAdded
                                ? "border-green-600 bg-green-600 text-white"
                                : "border-gray-300 bg-white hover:bg-gray-50 hover:shadow-sm"
                        }`}
                    >
                        {isLoading ? (
                            <Icons.Loader2 className="h-4 w-4 shrink-0 animate-spin text-gray-700 md:h-5 md:w-5" />
                        ) : isAdded ? (
                            <Check className="h-4 w-4 shrink-0 text-white md:h-5 md:w-5" />
                        ) : (
                            <ShoppingCart className="h-4 w-4 shrink-0 text-gray-500 transition-colors duration-300 md:h-5 md:w-5" />
                        )}
                    </button>
                </div>
            </div>
        </Link>
    );
};

// ⭐ MAIN — 2 ROW CAROUSEL (MOBILE) + GRID (DESKTOP)
export function MayAlsoLoveThese({
    banners,
    userId,
}: {
    banners: Banner[];
    userId?: string;
}) {
    if (!banners.length) return null;

    const items = banners.slice(0, 18);

    return (
        <section className="w-full bg-[#FCFBF4] py-8">
            <h2 className="mb-6 text-center font-playfair text-[18px] font-normal leading-[1.3] tracking-[0.5px] text-[#7A6338] md:text-[26px]">
                You&apos;ll Love These
            </h2>

            {/* 📱 MOBILE — SINGLE ROW HORIZONTAL SCROLL */}
            <div className="scrollbar-hide overflow-x-auto px-4 md:hidden">
                <div className="flex w-max gap-3 sm:gap-4">
                    {items.map((item) => (
                        <ProductCard
                            key={item.id}
                            banner={item}
                            userId={userId}
                        />
                    ))}
                </div>
            </div>

            {/* 🖥 DESKTOP — 6 COLUMN GRID */}
            <div className="mx-auto hidden max-w-screen-2xl px-6 md:block">
                <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                    {items.map((item) => (
                        <ProductCard
                            key={item.id}
                            banner={item}
                            userId={userId}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
