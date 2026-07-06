"use client";

import { showAddToCartToast } from "@/components/globals/custom-toasts/add-to-cart-toast";
import { ProductShareModal } from "@/components/globals/modals";
import { AnimatedProductLink } from "@/components/home/new-home-page/animated-product-link";
import { Icons } from "@/components/icons";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog-general";
import { DiscountBadge } from "@/components/ui/discount-badge";
import { Spinner } from "@/components/ui/spinner";
import { useAddToCartTracking } from "@/lib/hooks/useAddToCartTracking";
import { useGuestWishlist } from "@/lib/hooks/useGuestWishlist";
import { trpc } from "@/lib/trpc/client";
import { cn, convertPaiseToRupees, formatINR } from "@/lib/utils";
import { handleCartFlyAnimation } from "@/lib/utils/cartAnimation";
import { ProductWithBrand } from "@/lib/validations";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
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
    const router = useRouter();
    const { addToGuestCart } = useGuestCart();
    const { addToGuestWishlist } = useGuestWishlist();
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [selectedOptions, setSelectedOptions] = useState<
        Record<string, string>
    >({});
    const [quickViewImageIndex, setQuickViewImageIndex] = useState(0);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);

    const { mutateAsync: addToCart, isLoading } =
        trpc.general.users.cart.addProductToCart.useMutation({
            onSuccess: () => {},
            onError: (err) =>
                toast.error(err.message || "Could not add to cart"),
        });
    const { mutateAsync: addToWishlist } =
        trpc.general.users.wishlist.addProductInWishlist.useMutation({
            onSuccess: () => toast.success("Added to Wishlist!"),
            onError: (err) =>
                toast.error(err.message || "Could not add to wishlist"),
        });

    const rawPrice = product.variants?.[0]?.price ?? product.price ?? 0;
    const originalPrice =
        product.variants?.[0]?.compareAtPrice ?? product.compareAtPrice;
    const discount =
        originalPrice && originalPrice > rawPrice
            ? Math.round(((originalPrice - rawPrice) / originalPrice) * 100)
            : null;
    const mediaUrls = Array.from(
        new Set(
            product.media
                ?.filter((m: any) => m.mediaItem?.url)
                .map((m: any) => m.mediaItem.url)
        )
    ) as string[];
    const imageUrl = mediaUrls[0] || PLACEHOLDER_IMAGE_URL;
    const quickViewImages = Array.from(
        new Set([imageUrl, ...mediaUrls])
    ).filter(Boolean) as string[];
    const productUrl = product.slug ? `/products/${product.slug}` : "/shop";

    const selectedVariant = React.useMemo(() => {
        if (!product.variants?.length) return null;
        const opts = (product as any).options;
        if (!opts?.length || !Object.keys(selectedOptions).length)
            return product.variants[0];
        return (
            product.variants.find((v: any) =>
                Object.entries(selectedOptions).every(
                    ([oid, vid]) => (v.combinations as any)?.[oid] === vid
                )
            ) || product.variants[0]
        );
    }, [product.variants, (product as any).options, selectedOptions]);

    useEffect(() => {
        let interval: number | undefined;
        if (isQuickViewOpen && quickViewImages.length > 1) {
            interval = window.setInterval(
                () =>
                    setQuickViewImageIndex((p) =>
                        p === quickViewImages.length - 1 ? 0 : p + 1
                    ),
                3000
            );
        }
        return () => {
            if (interval) window.clearInterval(interval);
        };
    }, [isQuickViewOpen, quickViewImages.length]);

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
                    fullProduct: product as any,
                });
                toast.success("Added to Wishlist!");
            }
            setIsWishlisted(true);
        } catch (err: any) {
            toast.error(err.message || "Could not add to wishlist");
        }
    };

    const handleQuickAddCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        handleCartFlyAnimation(e, imageUrl);
        try {
            await trackAddToCartEvent({
                productId: product.id,
                brandId: product.brandId || "",
                productTitle: product.title,
                brandName: product.brand?.name,
                productPrice: rawPrice,
                quantity,
            });
            if (userId) {
                await addToCart({
                    productId: product.id,
                    variantId: selectedVariant?.id || null,
                    quantity,
                    userId,
                });
                showAddToCartToast(
                    product as any,
                    selectedVariant as any,
                    "Item added to cart!"
                );
            } else {
                addToGuestCart({
                    productId: product.id,
                    variantId: selectedVariant?.id || null,
                    quantity,
                    price: selectedVariant?.price ?? rawPrice,
                    image: imageUrl,
                    fullProduct: product,
                });
            }
        } catch (err: any) {
            toast.error(err.message || "Could not add to cart");
        }
    };

    const handleBuyNow = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            if (userId) {
                await addToCart({
                    productId: product.id,
                    variantId: selectedVariant?.id || null,
                    quantity,
                    userId,
                });
            } else {
                addToGuestCart({
                    productId: product.id,
                    variantId: selectedVariant?.id || null,
                    quantity,
                    price: selectedVariant?.price ?? rawPrice,
                    image: imageUrl,
                    fullProduct: product,
                });
            }
            router.push(
                `/checkout?buy_now=true&item=${product.id}&variant=${selectedVariant?.id || ""}&qty=${quantity}`
            );
        } catch (err: any) {
            toast.error(err.message || "Could not proceed");
        }
    };

    const price = Math.round(Number(convertPaiseToRupees(rawPrice)));
    const displayOriginal =
        originalPrice && originalPrice > rawPrice
            ? Math.round(Number(convertPaiseToRupees(originalPrice)))
            : null;

    return (
        <div className="group/card relative flex w-[140px] shrink-0 cursor-pointer flex-col overflow-hidden bg-white sm:w-[200px] md:w-[240px]">
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F5F5F5]">
                <AnimatedProductLink
                    href={productUrl}
                    className="absolute inset-0 z-10"
                >
                    <span className="sr-only">{product.title}</span>
                </AnimatedProductLink>
                <Image
                    src={imageUrl}
                    alt={product.title}
                    fill
                    className="z-0 object-cover transition-transform duration-500 group-hover/card:scale-105"
                    sizes="(max-width: 640px) 33vw, 14vw"
                />
                {discount && discount > 0 && (
                    <DiscountBadge
                        discount={discount}
                        compact
                        className="absolute left-0 top-3 z-20"
                    />
                )}

                {/* Wishlist — top right */}
                <button
                    onClick={handleAddToWishlist}
                    className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm transition-all hover:scale-110 hover:bg-white"
                >
                    <Icons.Heart
                        className={cn(
                            "h-3.5 w-3.5 transition-colors",
                            isWishlisted
                                ? "fill-red-500 text-red-500"
                                : "text-gray-600 hover:text-red-500"
                        )}
                    />
                </button>

                {/* Quick View trigger — bottom right on mobile (icon), desktop hover pill */}
                <Dialog
                    open={isQuickViewOpen}
                    onOpenChange={setIsQuickViewOpen}
                >
                    <div
                        className="absolute bottom-2 right-2 z-20 md:hidden"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                    >
                        <DialogTrigger asChild>
                            <button className="btn-liquid btn-liquid-secondary group/btn flex h-7 w-7 items-center justify-center rounded-full shadow-sm">
                                <svg
                                    className="h-3.5 w-3.5 text-inherit"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.75"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6h11M10 21a1 1 0 100-2 1 1 0 000 2zm7 0a1 1 0 100-2 1 1 0 000 2z"
                                    />
                                </svg>
                            </button>
                        </DialogTrigger>
                    </div>
                    {/* Desktop hover pill */}
                    <div
                        className="absolute inset-x-0 bottom-0 z-20 hidden translate-y-full transition-transform duration-300 ease-out group-hover/card:translate-y-0 md:block"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                    >
                        <DialogTrigger asChild>
                            <button className="btn-liquid btn-liquid-primary flex w-full items-center justify-center py-2.5 text-[10px] font-bold uppercase tracking-[0.12em]">
                                QUICK BUY
                            </button>
                        </DialogTrigger>
                    </div>

                    <DialogContent
                        className="max-h-[95dvh] w-[96vw] max-w-5xl overflow-y-auto rounded-md p-0 md:h-[85vh]"
                        onCloseAutoFocus={(e) => e.preventDefault()}
                    >
                        <DialogTitle className="sr-only">
                            {product.title}
                        </DialogTitle>
                        <div className="flex h-full flex-col overflow-y-auto bg-white md:flex-row md:overflow-hidden">
                            {/* Image side */}
                            <div className="group/slider relative mt-3 h-[320px] w-[calc(100%-1.5rem)] shrink-0 self-center overflow-hidden rounded-t-lg bg-[#F5F5F5] sm:h-[380px] md:mt-0 md:h-full md:w-1/2 md:rounded-none">
                                <Image
                                    src={
                                        quickViewImages[quickViewImageIndex] ||
                                        imageUrl
                                    }
                                    alt={product.title}
                                    fill
                                    className="object-contain md:object-cover md:object-center"
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                />
                                {quickViewImages.length > 1 && (
                                    <>
                                        <button
                                            type="button"
                                            aria-label="Show next product image"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setQuickViewImageIndex((p) =>
                                                    p ===
                                                    quickViewImages.length - 1
                                                        ? 0
                                                        : p + 1
                                                );
                                            }}
                                            className="absolute bottom-5 right-5 z-20 flex size-9 items-center justify-center rounded-full border border-white/70 bg-white/90 text-gray-800 shadow-[0_12px_30px_rgba(15,23,42,0.16)] backdrop-blur transition-all hover:bg-white active:scale-95 md:bottom-6 md:right-6 md:size-10"
                                        >
                                            <ChevronRight className="size-4" />
                                        </button>
                                        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
                                            {quickViewImages.map((_, i) => (
                                                <button
                                                    type="button"
                                                    key={i}
                                                    aria-label={`Show product image ${i + 1}`}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setQuickViewImageIndex(
                                                            i
                                                        );
                                                    }}
                                                    className={cn(
                                                        "size-1.5 rounded-full transition-all hover:scale-125",
                                                        i ===
                                                            quickViewImageIndex
                                                            ? "bg-gray-800"
                                                            : "bg-gray-300"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Details side */}
                            <div className="scrollbar-hide flex flex-col p-4 md:w-1/2 md:overflow-y-auto md:p-12">
                                <div className="flex items-start justify-between gap-3">
                                    <h2 className="font-serif text-xl font-light leading-tight text-gray-900 sm:text-2xl md:text-[32px]">
                                        {product.title}
                                    </h2>
                                    <button
                                        type="button"
                                        onClick={() => setIsShareOpen(true)}
                                        className="flex h-9 shrink-0 items-center gap-2 rounded-full border border-gray-200 px-3 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                                    >
                                        <Icons.Share className="size-3.5" />
                                        Share
                                    </button>
                                </div>
                                <div className="mt-2 flex items-baseline gap-3 md:mt-5">
                                    <span className="text-lg font-medium text-gray-900 md:text-xl">
                                        {formatINR(
                                            selectedVariant?.price || rawPrice,
                                            {
                                                input: "paise",
                                                keepDecimals: true,
                                            }
                                        )}
                                    </span>
                                    {originalPrice && (
                                        <span className="text-sm font-medium text-gray-400 line-through">
                                            {formatINR(originalPrice, {
                                                input: "paise",
                                                keepDecimals: true,
                                            })}
                                        </span>
                                    )}
                                </div>
                                {product.description && (
                                    <div
                                        className="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-500 md:mt-6 md:line-clamp-3 md:text-sm"
                                        dangerouslySetInnerHTML={{
                                            __html: product.description,
                                        }}
                                    />
                                )}

                                <div className="mt-4 space-y-3 md:mt-8 md:space-y-6">
                                    {(product as any).options?.map(
                                        (opt: any) => {
                                            const selectedVal =
                                                selectedOptions[opt.id] ||
                                                opt.values[0]?.id;
                                            return (
                                                <div key={opt.id}>
                                                    <div className="mb-2 flex items-center gap-2 text-xs md:text-sm">
                                                        <span className="font-medium text-gray-900">
                                                            {opt.name} :
                                                        </span>
                                                        <span className="text-gray-500">
                                                            {
                                                                opt.values.find(
                                                                    (v: any) =>
                                                                        v.id ===
                                                                        selectedVal
                                                                )?.name
                                                            }
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5 md:gap-2.5">
                                                        {opt.values.map(
                                                            (val: any) => (
                                                                <button
                                                                    key={val.id}
                                                                    onClick={() =>
                                                                        setSelectedOptions(
                                                                            (
                                                                                p
                                                                            ) => ({
                                                                                ...p,
                                                                                [opt.id]:
                                                                                    val.id,
                                                                            })
                                                                        )
                                                                    }
                                                                    className={cn(
                                                                        "h-8 min-w-[36px] border px-3 text-xs font-medium transition-colors md:h-10 md:px-4 md:text-sm",
                                                                        selectedVal ===
                                                                            val.id
                                                                            ? "border-gray-900 text-gray-900"
                                                                            : "border-gray-300 text-gray-600 hover:border-gray-400"
                                                                    )}
                                                                >
                                                                    {val.name}
                                                                </button>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        }
                                    )}

                                    <div className="mt-4 flex items-stretch gap-2 md:mt-10">
                                        <div className="flex h-11 w-24 shrink-0 items-center border border-gray-300">
                                            <button
                                                onClick={() =>
                                                    setQuantity(
                                                        Math.max(
                                                            1,
                                                            quantity - 1
                                                        )
                                                    )
                                                }
                                                className="flex h-full flex-1 items-center justify-center text-lg text-gray-500 hover:text-gray-900"
                                            >
                                                −
                                            </button>
                                            <span className="flex-1 text-center text-sm font-medium">
                                                {quantity}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    setQuantity(quantity + 1)
                                                }
                                                className="flex h-full flex-1 items-center justify-center text-lg text-gray-500 hover:text-gray-900"
                                            >
                                                +
                                            </button>
                                        </div>
                                        <button
                                            onClick={handleQuickAddCart}
                                            disabled={isLoading}
                                            className="btn-liquid btn-liquid-secondary flex h-11 flex-1 items-center justify-center rounded-sm text-[10px] font-semibold tracking-[0.08em] md:text-sm"
                                        >
                                            {isLoading ? (
                                                <Spinner className="h-4 w-4 animate-spin text-gray-700" />
                                            ) : (
                                                "ADD TO CART"
                                            )}
                                        </button>
                                        <button
                                            onClick={handleBuyNow}
                                            disabled={isLoading}
                                            className="btn-liquid btn-liquid-primary group/btn flex h-11 flex-1 items-center justify-center rounded-sm text-[10px] font-semibold tracking-[0.08em] md:text-sm"
                                        >
                                            {isLoading ? (
                                                <Spinner className="h-4 w-4 animate-spin text-white group-hover/btn:text-black" />
                                            ) : (
                                                "BUY NOW"
                                            )}
                                        </button>
                                    </div>

                                    {(product as any).specifications &&
                                        (product as any).specifications.length >
                                            0 && (
                                            <div className="mt-4 border-t border-gray-100 pt-4">
                                                <p className="mb-3 text-[9px] font-medium uppercase tracking-[0.18em] text-gray-400">
                                                    Specifications
                                                </p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {(
                                                        product as any
                                                    ).specifications.map(
                                                        (
                                                            spec: any,
                                                            i: number
                                                        ) => (
                                                            <div
                                                                key={i}
                                                                className="rounded bg-gray-50 px-3 py-2"
                                                            >
                                                                <span className="mb-0.5 block text-[8px] uppercase tracking-widest text-gray-400">
                                                                    {spec.key}
                                                                </span>
                                                                <span className="block text-[11px] font-semibold leading-tight text-gray-800">
                                                                    {spec.value}
                                                                </span>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                    <div className="mt-4 border-t border-gray-100 pt-4">
                                        <p className="mb-3 text-[9px] font-medium uppercase tracking-[0.18em] text-gray-400">
                                            100% Secure Checkout
                                        </p>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <div className="flex h-8 items-center justify-center rounded border border-gray-200 bg-white px-3">
                                                <span className="text-[11px] font-black italic tracking-tight text-[#1A1F71]">
                                                    VISA
                                                </span>
                                            </div>
                                            <div className="flex h-8 items-center justify-center gap-0.5 rounded border border-gray-200 bg-white px-2.5">
                                                <div className="h-[14px] w-[14px] rounded-full bg-[#EB001B]" />
                                                <div className="-ml-[7px] h-[14px] w-[14px] rounded-full bg-[#F79E1B]" />
                                            </div>
                                            <div className="flex h-8 items-center justify-center rounded border border-gray-200 bg-white px-3">
                                                <span
                                                    className="text-[11px] font-black tracking-tight"
                                                    style={{
                                                        background:
                                                            "linear-gradient(90deg,#097939 40%,#ed752e 100%)",
                                                        WebkitBackgroundClip:
                                                            "text",
                                                        WebkitTextFillColor:
                                                            "transparent",
                                                    }}
                                                >
                                                    UPI
                                                </span>
                                            </div>
                                            <div className="flex h-8 items-center justify-center rounded border border-gray-200 bg-white px-3">
                                                <span className="text-[10px] font-black tracking-tight text-[#1a6dd4]">
                                                    RuPay
                                                </span>
                                            </div>
                                            <div className="flex h-8 items-center justify-center rounded border border-gray-200 bg-white px-3">
                                                <span className="text-[9px] font-bold tracking-widest text-gray-500">
                                                    COD
                                                </span>
                                            </div>
                                            <div className="ml-auto flex items-center gap-1.5 text-[10px] text-gray-400">
                                                <svg
                                                    className="h-3.5 w-3.5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <rect
                                                        x="3"
                                                        y="11"
                                                        width="18"
                                                        height="11"
                                                        rx="2"
                                                        ry="2"
                                                    />
                                                    <path d="M7 11V7a5 5 0 0110 0v4" />
                                                </svg>
                                                SSL Encrypted
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
                <ProductShareModal
                    isOpen={isShareOpen}
                    setIsOpen={setIsShareOpen}
                    product={product as any}
                />
            </div>

            <AnimatedProductLink
                href={productUrl}
                className="relative z-10 block pb-1 pt-2"
            >
                <h3 className="truncate text-[11px] font-normal leading-tight text-gray-800 sm:text-xs">
                    {product.title}
                </h3>
                <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-[12px] font-semibold text-gray-900">
                        ₹{price}
                    </span>
                    {displayOriginal && (
                        <span className="text-[10px] text-gray-400 line-through">
                            ₹{displayOriginal}
                        </span>
                    )}
                </div>
            </AnimatedProductLink>
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
    const desktopRef = useRef<HTMLDivElement>(null);
    const mobileRef = useRef<HTMLDivElement>(null);

    if (!products?.length) return null;

    const scroll = (ref: any, direction: "left" | "right") => {
        if (ref.current) {
            ref.current.scrollBy({
                left: direction === "left" ? -400 : 400,
                behavior: "smooth",
            });
        }
    };

    const shownProducts = products.slice(0, 18);

    return (
        <section
            className={cn("w-full bg-white py-10 md:py-14", className)}
            {...props}
        >
            <div className="max-w-screen-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8 flex flex-col items-start">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 md:text-[11px]">
                        Affordable Picks
                    </span>
                    <h2 className="mt-2 font-playfair text-[28px] font-normal uppercase leading-[1.3] text-gray-900 md:text-[36px]">
                        Products Under 999
                    </h2>
                </div>
            </div>

            {/* DESKTOP */}
            <div className="max-w-screen-3xl relative mx-auto hidden px-4 sm:px-6 md:block lg:px-8">
                <button
                    onClick={() => scroll(desktopRef, "left")}
                    className="absolute left-2 top-1/3 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-100 bg-white shadow-md hover:bg-gray-50"
                >
                    <ChevronLeft className="h-5 w-5 text-gray-700" />
                </button>

                <div
                    ref={desktopRef}
                    className="scrollbar-hide overflow-x-auto scroll-smooth pb-4"
                >
                    <div className="flex w-max space-x-5">
                        {shownProducts.map((product) => (
                            <Under999ProductCard
                                key={product.id}
                                product={product}
                                userId={userId}
                            />
                        ))}
                    </div>
                </div>

                <button
                    onClick={() => scroll(desktopRef, "right")}
                    className="absolute right-2 top-1/3 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-100 bg-white shadow-md hover:bg-gray-50"
                >
                    <ChevronRight className="h-5 w-5 text-gray-700" />
                </button>
            </div>

            {/* MOBILE */}
            <div className="scrollbar-hide overflow-x-auto px-4 pb-4 md:hidden">
                <div ref={mobileRef} className="flex space-x-3">
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
