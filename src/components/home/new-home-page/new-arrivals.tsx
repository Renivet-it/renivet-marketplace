"use client";

import { Icons } from "@/components/icons";
import { trpc } from "@/lib/trpc/client";
import { cn, convertPaiseToRupees } from "@/lib/utils";
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
        setGuestCart((prev) => {
            const existing = prev.find(
                (x) =>
                    x.productId === item.productId &&
                    (x.variantId || null) === (item.variantId || null)
            );

            const updated = existing
                ? prev.map((x) =>
                      x.productId === item.productId &&
                      (x.variantId || null) === (item.variantId || null)
                          ? { ...x, quantity: x.quantity + item.quantity }
                          : x
                  )
                : [...prev, item];

            localStorage.setItem("guest_cart", JSON.stringify(updated));
            window.dispatchEvent(new Event("guestCartUpdated"));
            toast.success(existing ? "Updated Cart" : "Added to Cart!");
            return updated;
        });
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
            className={cn("w-full bg-[#fcfbf4] py-8", className)}
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

    const { mutateAsync: addToCart, isLoading } =
        trpc.general.users.cart.addProductToCart.useMutation({
            onSuccess: () => toast.success("Added to Cart!"),
            onError: (err) =>
                toast.error(err.message || "Could not add to cart."),
        });

    const rawPrice = product.variants?.[0]?.price || product.price || 0;
    const price = convertPaiseToRupees(rawPrice);
    const variantId = product.variants?.[0]?.id || null;
    const imageUrl =
        product.media?.[0]?.mediaItem?.url ||
        "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1";

    /* ---- Discount calculation ---- */
    const originalPrice =
        product.variants?.[0]?.compareAtPrice ?? product.compareAtPrice;
    const displayOriginal =
        originalPrice && originalPrice > rawPrice
            ? convertPaiseToRupees(originalPrice)
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
                    <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                        <span className="text-xs font-semibold text-gray-900 sm:text-base">
                            ₹{price}
                        </span>

                        {displayOriginal && (
                            <span className="text-[9px] text-gray-400 line-through sm:text-xs">
                                ₹{displayOriginal}
                            </span>
                        )}
                    </div>

                    {/* Add to cart button */}
                    <button
                        onClick={handleAddToCart}
                        disabled={isLoading}
                        className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-md border border-gray-300 bg-white py-1.5 text-[11px] font-medium text-gray-700 transition-all duration-200 hover:border-gray-800 hover:bg-gray-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:py-2 sm:text-xs"
                        aria-label="Add to cart"
                    >
                        {isLoading ? (
                            <Icons.Loader2 className="size-3 animate-spin" />
                        ) : (
                            <>
                                <Icons.Plus className="size-3 sm:size-3.5" />
                                Add to Cart
                            </>
                        )}
                    </button>
                </div>
            </Link>
        </div>
    );
}
