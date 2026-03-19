"use client";

import { showAddToCartToast } from "@/components/globals/custom-toasts/add-to-cart-toast";
import { AnimatedProductLink } from "@/components/home/new-home-page/animated-product-link";
import { Icons } from "@/components/icons";
import { Spinner } from "@/components/ui/spinner";
import { useAddToCartTracking } from "@/lib/hooks/useAddToCartTracking";
import { useGuestWishlist } from "@/lib/hooks/useGuestWishlist";
import { trpc } from "@/lib/trpc/client";
import { cn, convertPaiseToRupees } from "@/lib/utils";
import { handleCartFlyAnimation } from "@/lib/utils/cartAnimation";
import { ProductWithBrand } from "@/lib/validations";
import { Check, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

const PLACEHOLDER_IMAGE_URL =
    "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1";

function useGuestCart() {
    type GuestCartItem = {
        productId: string;
        variantId?: string | null;
        quantity: number;
        title?: string;
        brand?: string;
        price?: number;
        image?: string;
        sku?: string | null;
        fullProduct?: ProductWithBrand;
    };

    const addToGuestCart = (item: GuestCartItem) => {
        const stored = localStorage.getItem("guest_cart");
        const prev: GuestCartItem[] = stored ? JSON.parse(stored) : [];

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

    return { addToGuestCart };
}

function Under999ProductCard({
    product,
    userId,
}: {
    product: ProductWithBrand;
    userId?: string;
}) {
    const { trackAddToCartEvent } = useAddToCartTracking();
    const { addToGuestCart } = useGuestCart();
    const { addToGuestWishlist } = useGuestWishlist();
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [isAdded, setIsAdded] = useState(false);

    const { mutateAsync: addToCart, isLoading } =
        trpc.general.users.cart.addProductToCart.useMutation({
            onError: (err) => toast.error(err.message || "Could not add to cart"),
        });

    const { mutateAsync: addToWishlist } =
        trpc.general.users.wishlist.addProductInWishlist.useMutation({
            onSuccess: () => toast.success("Added to Wishlist!"),
            onError: (err) =>
                toast.error(err.message || "Could not add to wishlist"),
        });

    const rawPrice = product.variants?.[0]?.price ?? product.price ?? 0;
    const price = Math.round(Number(convertPaiseToRupees(rawPrice)));

    const compareAt =
        product.variants?.[0]?.compareAtPrice ?? product.compareAtPrice;
    const displayCompareAt =
        compareAt && compareAt > rawPrice
            ? Math.round(Number(convertPaiseToRupees(compareAt)))
            : null;

    const discountPct =
        compareAt && compareAt > rawPrice
            ? Math.round(((compareAt - rawPrice) / compareAt) * 100)
            : null;

    const imageUrl = product.media?.[0]?.mediaItem?.url || PLACEHOLDER_IMAGE_URL;
    const variantId = product.variants?.[0]?.id || null;
    const productUrl = product.slug ? `/products/${product.slug}` : "/shop";

    const handleAddToCart = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        handleCartFlyAnimation(e, imageUrl);

        try {
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

            setIsAdded(true);
            setTimeout(() => setIsAdded(false), 2000);
        } catch (err: unknown) {
            toast.error(
                err instanceof Error ? err.message : "Could not add to cart"
            );
        }
    };

    const handleAddToWishlist = async (
        e: React.MouseEvent<HTMLButtonElement>
    ) => {
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
        } catch (err: unknown) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : "Could not add to wishlist"
            );
        }
    };

    return (
        <article className="product-card-container group/product w-full cursor-pointer overflow-hidden rounded-lg bg-white shadow-sm transition-all duration-300 hover:shadow-lg">
            <AnimatedProductLink href={productUrl} className="block">
                <div className="product-image-container relative aspect-[1/1] w-full overflow-hidden bg-gray-50">
                    <Image
                        src={imageUrl}
                        alt={product.title}
                        fill
                        sizes="(max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                        className="object-cover object-center transition-transform duration-300 group-hover/product:scale-105"
                    />

                    {discountPct && discountPct > 0 && (
                        <span className="absolute left-0 top-2 rounded-r-full bg-gradient-to-r from-rose-600 to-orange-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-md sm:px-2.5 sm:py-1 sm:text-xs">
                            {discountPct}% OFF
                        </span>
                    )}
                </div>

                <div className="space-y-1 p-2 sm:p-2.5">
                    <h3 className="line-clamp-2 h-9 text-[12px] font-normal text-gray-800 sm:text-[14px]">
                        {product.title}
                    </h3>

                    <div className="flex h-[26px] items-center gap-1 sm:gap-1.5">
                        <span className="text-[13px] font-semibold text-gray-900 sm:text-[15px]">
                            Rs.{price}
                        </span>
                        {displayCompareAt ? (
                            <span className="text-xs text-[#9ca3af] line-through">
                                Rs.{displayCompareAt}
                            </span>
                        ) : null}
                    </div>
                    {discountPct && discountPct > 0 ? (
                        <p className="text-xs font-medium text-emerald-700">
                            You save {discountPct}%
                        </p>
                    ) : (
                        <p className="text-xs font-medium text-[#64748b]">
                            Great value pick
                        </p>
                    )}
                </div>
            </AnimatedProductLink>

            <div className="px-2 pb-2 sm:px-2.5 sm:pb-2.5">
                <div className="mt-2.5 flex items-center gap-2">
                <button
                    onClick={handleAddToWishlist}
                    className="group flex h-9 flex-1 items-center justify-center rounded border border-gray-300 bg-white transition-all duration-300 hover:border-red-500 hover:bg-red-50 hover:shadow-sm md:h-10"
                >
                    {isWishlisted ? (
                        <Icons.Heart className="size-4 fill-current text-red-500" />
                    ) : (
                        <Icons.Heart className="h-4 w-4 text-gray-500 transition-colors duration-300 group-hover:text-red-500 md:h-5 md:w-5" />
                    )}
                </button>

                <button
                    onClick={handleAddToCart}
                    disabled={isLoading || isAdded}
                    className={cn(
                        "flex h-9 flex-1 items-center justify-center gap-1.5 rounded border text-[12px] font-medium transition-all duration-300 disabled:opacity-50 md:h-10 md:text-sm",
                        isAdded
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:shadow-sm"
                    )}
                >
                    {isLoading ? (
                        <Spinner className="h-4 w-4 shrink-0 animate-spin text-gray-700 md:h-5 md:w-5" />
                    ) : isAdded ? (
                        <Check className="h-4 w-4 shrink-0 text-white md:h-5 md:w-5" />
                    ) : (
                        <ShoppingCart className="h-4 w-4 shrink-0 text-gray-500 transition-colors duration-300 md:h-5 md:w-5" />
                    )}
                </button>
                </div>
            </div>
        </article>
    );
}

interface ProductsUnder999Props extends React.HTMLAttributes<HTMLDivElement> {
    products: ProductWithBrand[];
    userId?: string;
}

export function ProductsUnder999({
    products,
    userId,
    className,
    ...props
}: ProductsUnder999Props) {
    if (!products?.length) return null;

    const shownProducts = products.slice(0, 18);

    return (
        <section
            className={cn(
                "relative w-full overflow-hidden bg-[#FCFBF4] py-4 md:py-6",
                className
            )}
            {...props}
        >
            <div className="pointer-events-none absolute inset-0" />
            <div className="under999-glow pointer-events-none absolute -left-20 top-16 h-44 w-44 rounded-full bg-amber-200/35 blur-3xl" />
            <div className="under999-glow pointer-events-none absolute -right-20 bottom-4 h-48 w-48 rounded-full bg-orange-200/35 blur-3xl" />

            <div className="relative mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
                <div className="mb-6 text-center md:mb-8">
                    <h2 className="font-playfair text-[18px] font-normal leading-[1.3] tracking-[0.5px] text-[#7A6338] md:text-[26px]">
                        Products Under 999
                    </h2>
                    <div className="mx-auto mt-2 h-[2px] w-28 overflow-hidden rounded-full bg-[#e7dccf]">
                        <div className="under999-shimmer h-full w-16 rounded-full bg-gradient-to-r from-transparent via-[#d8b27b] to-transparent" />
                    </div>
                </div>

                <div className="md:hidden">
                    <div className="grid grid-cols-3 gap-3">
                        {shownProducts.map((product, idx) => (
                            <div
                                key={product.id}
                                className="under999-reveal"
                                style={{
                                    animationDelay: `${Math.min(idx, 8) * 70}ms`,
                                }}
                            >
                                <Under999ProductCard
                                    product={product}
                                    userId={userId}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="hidden md:grid md:grid-cols-3 md:gap-5 lg:grid-cols-4 xl:grid-cols-6">
                    {shownProducts.map((product, idx) => (
                        <div
                            key={product.id}
                            className="under999-reveal"
                            style={{
                                animationDelay: `${(idx % 6) * 90}ms`,
                            }}
                        >
                            <Under999ProductCard
                                product={product}
                                userId={userId}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
                .under999-reveal {
                    animation: under999FadeUp 0.55s ease both;
                }

                .under999-shimmer {
                    animation: under999Shimmer 2.8s linear infinite;
                }

                .under999-glow {
                    animation: under999Float 6s ease-in-out infinite;
                }

                @keyframes under999FadeUp {
                    0% {
                        opacity: 0;
                        transform: translateY(8px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes under999Shimmer {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(220%);
                    }
                }

                @keyframes under999Float {
                    0%,
                    100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-10px);
                    }
                }
            `}</style>
        </section>
    );
}
