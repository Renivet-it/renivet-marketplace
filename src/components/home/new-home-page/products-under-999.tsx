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
        <div className="group/product w-[168px] flex-shrink-0 overflow-hidden rounded-2xl border border-[#f4d8bd] bg-white/95 p-2.5 shadow-[0_8px_30px_rgba(180,83,9,0.12)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(180,83,9,0.2)] md:w-full">
            <AnimatedProductLink href={productUrl} className="block">
                <div className="relative h-[190px] w-full overflow-hidden rounded-xl bg-[#fff6ea] md:h-[240px]">
                    <Image
                        src={imageUrl}
                        alt={product.title}
                        fill
                        sizes="(max-width: 768px) 168px, 260px"
                        className="object-cover transition-transform duration-300 group-hover/product:scale-105"
                    />

                    {discountPct && discountPct > 0 && (
                        <span className="absolute left-0 top-3 rounded-r-full bg-gradient-to-r from-[#dc2626] to-[#ea580c] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                            {discountPct}% OFF
                        </span>
                    )}
                    <span className="absolute right-2 top-2 rounded-full bg-[#111827]/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur">
                        Under 999
                    </span>
                </div>

                <div className="space-y-1.5 px-1 pb-1 pt-3">
                    <h3 className="line-clamp-2 h-9 text-[13px] leading-tight text-[#1f2937] md:text-[14px]">
                        {product.title}
                    </h3>

                    <div className="flex items-center gap-1.5">
                        <span className="text-[15px] font-semibold text-[#111827]">
                            Rs.{price}
                        </span>
                        {displayCompareAt ? (
                            <span className="text-[12px] text-[#9ca3af] line-through">
                                Rs.{displayCompareAt}
                            </span>
                        ) : null}
                    </div>
                </div>
            </AnimatedProductLink>

            <div className="mt-2 flex items-center gap-2">
                <button
                    onClick={handleAddToWishlist}
                    className="flex h-9 flex-1 items-center justify-center rounded-lg border border-[#f0c7a2] bg-[#fff8f0] transition-all duration-300 hover:border-[#ef4444] hover:bg-[#fff1f2]"
                >
                    {isWishlisted ? (
                        <Icons.Heart className="h-4 w-4 fill-current text-[#ef4444]" />
                    ) : (
                        <Icons.Heart className="h-4 w-4 text-[#7f1d1d]" />
                    )}
                </button>

                <button
                    onClick={handleAddToCart}
                    disabled={isLoading || isAdded}
                    className={cn(
                        "flex h-9 flex-1 items-center justify-center rounded-lg border transition-all duration-300 disabled:opacity-60",
                        isAdded
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-[#f0c7a2] bg-white hover:bg-[#fff8f0]"
                    )}
                >
                    {isLoading ? (
                        <Spinner className="h-4 w-4 animate-spin text-[#374151]" />
                    ) : isAdded ? (
                        <Check className="h-4 w-4" />
                    ) : (
                        <ShoppingCart className="h-4 w-4 text-[#7f1d1d]" />
                    )}
                </button>
            </div>
        </div>
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
                "relative overflow-hidden bg-gradient-to-b from-[#fff7ed] via-[#fffaf0] to-[#fff7e6] py-8 md:py-12",
                className
            )}
            {...props}
        >
            <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-[#fb923c]/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 right-0 h-56 w-56 rounded-full bg-[#f59e0b]/20 blur-3xl" />

            <div className="relative mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
                <div className="mb-6 text-center md:mb-8">
                    <p className="mx-auto mb-3 inline-flex rounded-full border border-[#f0c7a2] bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a3412]">
                        Budget Picks
                    </p>
                    <h2 className="font-playfair text-[24px] leading-tight text-[#7a2e0f] md:text-[36px]">
                        Products Under 999
                    </h2>
                    <p className="mx-auto mt-2 max-w-2xl text-[13px] text-[#9a3412] md:text-[15px]">
                        Handpicked style steals for your everyday wardrobe.
                    </p>
                </div>

                <div className="scrollbar-hide overflow-x-auto md:hidden">
                    <div className="flex w-max gap-3 pb-1">
                        {shownProducts.map((product) => (
                            <Under999ProductCard
                                key={product.id}
                                product={product}
                                userId={userId}
                            />
                        ))}
                    </div>
                </div>

                <div className="hidden md:grid md:grid-cols-3 md:gap-5 lg:grid-cols-4 xl:grid-cols-6">
                    {shownProducts.map((product) => (
                        <Under999ProductCard
                            key={product.id}
                            product={product}
                            userId={userId}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
