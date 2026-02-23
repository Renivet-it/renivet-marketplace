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
    variants?: {
        id: string;
        price: number;
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
                            <h2 className="mb-4 text-center text-lg font-semibold text-gray-800 sm:text-xl">
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
        <div className="group flex-shrink-0 cursor-pointer overflow-hidden bg-white shadow-sm transition-all duration-300 hover:shadow-lg">
            <Link href={`/products/${product.slug}`} className="block">
                <div className="relative aspect-[1/1] w-full">
                    <Image
                        src={imageUrl}
                        alt={product.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 33vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                    />
                </div>

                <div className="p-1.5 text-center sm:p-2">
                    <h3 className="truncate text-xs font-normal text-gray-700 sm:text-sm">
                        {product.title}
                    </h3>

                    <div className="mt-1 flex items-center justify-center space-x-2 sm:space-x-3">
                        <p className="text-xs font-medium text-gray-900 sm:text-sm">
                            ₹{price}
                        </p>

                        {/* ➕ ADD TO CART */}
                        <button
                            onClick={handleAddToCart}
                            disabled={isLoading}
                            className="flex size-5 items-center justify-center rounded-full bg-blue-100 text-blue-600 transition-colors hover:bg-blue-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:size-6"
                            aria-label="Add to cart"
                        >
                            {isLoading ? (
                                <Icons.Loader2 className="size-3 animate-spin" />
                            ) : (
                                <Icons.Plus className="size-3 sm:size-4" />
                            )}
                        </button>
                    </div>
                </div>
            </Link>
        </div>
    );
}
