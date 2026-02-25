"use client";

import { showAddToCartToast } from "@/components/globals/custom-toasts/add-to-cart-toast";
import { Icons } from "@/components/icons";
import { useGuestWishlist } from "@/lib/hooks/useGuestWishlist";
import { trpc } from "@/lib/trpc/client";
import { cn, convertPaiseToRupees } from "@/lib/utils";
import { handleCartFlyAnimation } from "@/lib/utils/cartAnimation";
import { Banner } from "@/lib/validations";
import { Check, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/* =============================
   ⭐ GUEST CART HOOK (UNCHANGED)
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

const PLACEHOLDER_IMAGE_URL =
    "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1";

/* =============================
   ⭐ PRODUCT CARD
============================= */

interface ProductCardProps {
    banner: Banner;
    userId?: string;
}

const ProductCard = ({ banner, userId }: ProductCardProps) => {
    const { product } = banner;

    const { addToGuestCart } = useGuestCart();
    const { addToGuestWishlist } = useGuestWishlist();

    const [isWishlisted, setIsWishlisted] = useState(false);
    const [isAdded, setIsAdded] = useState(false);

    /* CART MUTATION (UNCHANGED) */
    const { mutateAsync: addToCart, isLoading } =
        trpc.general.users.cart.addProductToCart.useMutation({
            onSuccess: () => {},
            onError: (err) =>
                toast.error(err.message || "Could not add to cart"),
        });

    /* WISHLIST MUTATION (NEW – SAME AS SWIPECARD) */
    const { mutateAsync: addToWishlist } =
        trpc.general.users.wishlist.addProductInWishlist.useMutation({
            onSuccess: () => toast.success("Added to Wishlist!"),
            onError: (err) =>
                toast.error(err.message || "Could not add to wishlist"),
        });

    if (!product) return null;

    const rawPrice = product.variants?.[0]?.price ?? product.price ?? 0;
    const priceStr = convertPaiseToRupees(rawPrice);
    const price = Math.round(Number(priceStr));

    const originalPrice =
        product.variants?.[0]?.compareAtPrice ?? product.compareAtPrice;

    const displayPriceStr = originalPrice
        ? convertPaiseToRupees(originalPrice)
        : null;
    const displayPrice = displayPriceStr
        ? Math.round(Number(displayPriceStr))
        : null;

    const discount =
        displayPrice && price
            ? Math.round(
                  ((Number(displayPrice) - Number(price)) /
                      Number(displayPrice)) *
                      100
              )
            : null;

    const imageUrl =
        product.media?.[0]?.mediaItem?.url || PLACEHOLDER_IMAGE_URL;

    const variantId = product.variants?.[0]?.id || null;
    const productUrl = product.slug ? `/products/${product.slug}` : "/shop";

    /* =============================
     🛒 CART HANDLER (UNCHANGED)
  ============================= */
    const handleAddToCart = async (e: any) => {
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
        } catch (err: any) {
            toast.error(err.message || "Could not add to cart");
        }
    };

    /* =============================
     ❤️ WISHLIST HANDLER (REAL)
  ============================= */
    const handleAddToWishlist = async (e: any) => {
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
        } catch (err: any) {
            toast.error(err.message || "Could not add to wishlist");
        }
    };

    return (
        <div className="product-card-container group w-[146px] flex-shrink-0 cursor-pointer md:flex md:w-[260px] md:flex-col">
            <Link href={productUrl}>
                <div className="product-image-container relative h-[223px] w-[156px] overflow-hidden bg-gray-50 md:h-[350px] md:w-full">
                    {/* (Icons Removed from Image) */}
                    <Image
                        src={imageUrl}
                        alt={product.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 146px, 350px"
                    />

                    {/* 🏷️ Discount badge */}
                    {discount && discount > 0 && (
                        <span className="absolute left-0 top-2.5 z-10 rounded-r-full bg-gradient-to-r from-rose-600 to-orange-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-md md:px-2.5 md:py-1 md:text-xs">
                            {discount}% OFF
                        </span>
                    )}
                </div>
            </Link>

            {/* TITLE */}
            <div className="h-[42px] overflow-hidden pb-2 pt-3 text-left md:h-[48px]">
                <Link href={productUrl}>
                    <h3 className="line-clamp-2 text-[12px] font-normal leading-tight text-gray-800 sm:text-[14px]">
                        {product.title}
                    </h3>
                </Link>
            </div>

            {/* PRICE ROW */}
            <div className="flex h-[26px] items-center gap-1 sm:gap-1.5">
                <span className="text-[13px] font-semibold text-gray-900 sm:text-[15px]">
                    ₹{price}
                </span>

                {displayPrice ? (
                    <span className="text-[11px] text-gray-400 line-through sm:text-[12px]">
                        ₹{displayPrice}
                    </span>
                ) : (
                    <span className="text-[11px] opacity-0 sm:text-[12px]">
                        ₹0000
                    </span>
                )}
            </div>

            {/* BUTTONS ROW (CART + WISHLIST) */}
            <div className="mt-2.5 flex items-center gap-2">
                <button
                    onClick={handleAddToWishlist}
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
    );
};

/* =============================
   ⭐ SWAPSPACE (UNCHANGED)
============================= */

interface SwapSpaceProps {
    banners: Banner[];
    userId?: string;
    className?: string;
}

export function SwapSpace({ banners, userId, className }: SwapSpaceProps) {
    const desktopRef = useRef<HTMLDivElement>(null);
    const mobileRef = useRef<HTMLDivElement>(null);

    if (!banners.length) return null;

    const scroll = (ref: any, direction: "left" | "right") => {
        if (ref.current) {
            ref.current.scrollBy({
                left: direction === "left" ? -400 : 400,
                behavior: "smooth",
            });
        }
    };

    return (
        <section className={cn("w-full bg-[#FCFBF4] py-6", className)}>
            <h2 className="mb-6 text-center font-playfair text-[18px] font-[400] leading-[1.3] tracking-[0.5px] text-[#7A6338] md:text-[26px]">
                Best Sellers
            </h2>

            {/* DESKTOP */}
            <div className="max-w-screen-3xl relative mx-auto hidden px-6 md:block">
                <button
                    onClick={() => scroll(desktopRef, "left")}
                    className="absolute left-0 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center bg-white shadow-md"
                >
                    <Icons.ChevronLeft className="h-6 w-6 text-gray-700" />
                </button>

                <div
                    ref={desktopRef}
                    className="scrollbar-hide overflow-x-auto scroll-smooth"
                >
                    <div className="flex w-max space-x-6">
                        {banners.map((item) => (
                            <ProductCard
                                key={item.id}
                                banner={item}
                                userId={userId}
                            />
                        ))}
                    </div>
                </div>

                <button
                    onClick={() => scroll(desktopRef, "right")}
                    className="absolute right-0 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center bg-white shadow-md"
                >
                    <Icons.ChevronRight className="h-6 w-6 text-gray-700" />
                </button>
            </div>

            {/* MOBILE */}
            <div className="scrollbar-hide overflow-x-auto px-4 md:hidden">
                <div ref={mobileRef} className="flex space-x-6">
                    {banners.map((item) => (
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
