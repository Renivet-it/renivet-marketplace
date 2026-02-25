"use client";

import { Icons } from "@/components/icons";
import { useGuestWishlist } from "@/lib/hooks/useGuestWishlist";
import { trpc } from "@/lib/trpc/client";
import { cn, convertPaiseToRupees } from "@/lib/utils";
import { ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
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
        toast.success(existing ? "Updated Cart" : "Added to Cart!");
    };

    return { guestCart, addToGuestCart };
}

/* --------------------------------------------------------
   TYPES
-------------------------------------------------------- */

interface Product {
    slug: any;
    id: string;
    media: { mediaItem: { url: string } }[];
    title: string;
    brand?: { name: string };
    compareAtPrice?: number;
    variants?: {
        id: string;
        price: number;
        compareAtPrice?: number;
    }[];
    price?: number;
}

interface ProductWrapper {
    id: string;
    category: string;
    product: Product;
}

interface ProductGridProps extends React.HTMLAttributes<HTMLDivElement> {
    products: ProductWrapper[];
    title?: string;
    userId?: string;
}

/* --------------------------------------------------------
   SECTIONS TO DISPLAY
-------------------------------------------------------- */

const SECTIONS = ["Most Ordered", "In Season"] as const;

/* --------------------------------------------------------
   MAIN GRID
-------------------------------------------------------- */

export function ProductGridNewArrivals({
    className,
    products,
    userId,
    ...props
}: ProductGridProps) {
    if (!products?.length) return null;

    return (
        <section
            className={cn("w-full bg-[#fcfbf4] py-3", className)}
            {...props}
        >
            <div className="mx-auto max-w-screen-2xl space-y-10 px-4 sm:px-6 lg:px-8">
                {SECTIONS.map((section) => {
                    const sectionProducts = products.filter(
                        (item) => item.category === section
                    );
                    if (!sectionProducts.length) return null;

                    return (
                        <div key={section}>
                            {/* Section heading */}
                            <h2 className="mb-6 text-center font-playfair text-[18px] font-[400] leading-[1.3] tracking-[0.5px] text-[#7A6338] md:text-[26px]">
                                {section}
                            </h2>

                            {/* Product grid */}
                            <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
                                {sectionProducts.map(({ product }) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        userId={userId}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

/* --------------------------------------------------------
   PRODUCT CARD (PLUS = ADD TO CART)
-------------------------------------------------------- */

function ProductCard({
    product,
    userId,
}: {
    product: Product;
    userId?: string;
}) {
    const { addToGuestCart } = useGuestCart();
    const { addToGuestWishlist } = useGuestWishlist();
    const [isWishlisted, setIsWishlisted] = useState(false);

    const { mutateAsync: addToCart, isLoading } =
        trpc.general.users.cart.addProductToCart.useMutation({
            onSuccess: () => toast.success("Added to Cart!"),
            onError: (err) =>
                toast.error(err.message || "Could not add to cart."),
        });

    const { mutateAsync: addToWishlist } =
        trpc.general.users.wishlist.addProductInWishlist.useMutation({
            onSuccess: () => toast.success("Added to Wishlist!"),
            onError: (err) =>
                toast.error(err.message || "Could not add to wishlist"),
        });

    const rawPrice = product.variants?.[0]?.price || product.price || 0;
    const priceStr = convertPaiseToRupees(rawPrice);
    const price = Math.round(Number(priceStr));

    const variantId = product.variants?.[0]?.id || null;
    const imageUrl =
        product.media?.[0]?.mediaItem?.url ||
        "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1";

    /* ---- Discount calculation ---- */
    const originalPrice =
        product.variants?.[0]?.compareAtPrice ?? product.compareAtPrice;

    const displayOriginalStr =
        originalPrice && originalPrice > rawPrice
            ? convertPaiseToRupees(originalPrice)
            : null;
    const displayOriginal = displayOriginalStr
        ? Math.round(Number(displayOriginalStr))
        : null;

    const discountPct =
        displayOriginal && originalPrice
            ? Math.round(((originalPrice - rawPrice) / originalPrice) * 100)
            : null;

    const handleAddToCart = async (e: React.MouseEvent) => {
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

    const handleAddToWishlist = async (e: React.MouseEvent) => {
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
        <div className="group flex-shrink-0 cursor-pointer overflow-hidden rounded-lg bg-white shadow-sm transition-all duration-300 hover:shadow-lg">
            <Link href={`/products/${product.slug}`} className="block">
                {/* Image + discount badge */}
                <div className="relative aspect-[1/1] w-full overflow-hidden">
                    <Image
                        src={imageUrl}
                        alt={product.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 33vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                    />

                    {/* 🏷️ Discount badge */}
                    {discountPct && discountPct > 0 && (
                        <span className="absolute left-0 top-2 rounded-r-full bg-gradient-to-r from-rose-600 to-orange-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-md sm:px-2.5 sm:py-1 sm:text-xs">
                            {discountPct}% OFF
                        </span>
                    )}
                </div>

                {/* Info */}
                <div className="space-y-1 p-2 sm:p-2.5">
                    {/* Title */}
                    <h3 className="truncate text-xs font-medium text-gray-700 sm:text-sm">
                        {product.title}
                    </h3>

                    {/* Price row */}
                    <div className="flex h-[26px] items-center gap-1 sm:gap-1.5">
                        <span className="text-[13px] font-semibold text-gray-900 sm:text-[15px]">
                            ₹{price}
                        </span>

                        {displayOriginal ? (
                            <span className="text-[11px] text-gray-400 line-through sm:text-[12px]">
                                ₹{displayOriginal}
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
                            disabled={isLoading}
                            className="group flex h-9 flex-1 items-center justify-center gap-1.5 rounded border border-gray-300 bg-white text-[12px] font-medium text-gray-700 transition-all duration-300 hover:border-black hover:bg-black hover:shadow-sm disabled:opacity-50 md:h-10 md:text-sm"
                        >
                            {isLoading ? (
                                <Icons.Loader2 className="h-4 w-4 animate-spin text-gray-700 md:h-5 md:w-5" />
                            ) : (
                                <ShoppingCart className="h-4 w-4 text-gray-500 transition-colors duration-300 group-hover:text-white md:h-5 md:w-5" />
                            )}
                        </button>
                    </div>
                </div>
            </Link>
        </div>
    );
}
