"use client";

import { showAddToCartToast } from "@/components/globals/custom-toasts/add-to-cart-toast";
import { AnimatedProductLink } from "@/components/home/new-home-page/animated-product-link";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog-general";
import { Spinner } from "@/components/ui/spinner";
import { useAddToCartTracking } from "@/lib/hooks/useAddToCartTracking";
import { trpc } from "@/lib/trpc/client";
import { handleCartFlyAnimation } from "@/lib/utils/cartAnimation";
import { cn, convertPaiseToRupees, formatPriceTag } from "@/lib/utils";
import { ProductWithBrand } from "@/lib/validations";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

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

interface PageProps extends GenericProps {
    product: ProductWithBrand;
    isWishlisted: boolean;
    userId?: string;
}

const PLACEHOLDER_IMAGE_URL =
    "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1";

export function ProductCard({
    className,
    product,
    userId,
    ...props
}: PageProps) {
    const router = useRouter();
    const { trackAddToCartEvent } = useAddToCartTracking();
    const { addToGuestCart } = useGuestCart();

    const [isProductHovered, setIsProductHovered] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [selectedOptions, setSelectedOptions] = useState<
        Record<string, string>
    >({});
    const [quickViewImageIndex, setQuickViewImageIndex] = useState(0);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

    const { mutateAsync: addToCart, isLoading } =
        trpc.general.users.cart.addProductToCart.useMutation({
            onSuccess: () => {},
            onError: (err) =>
                toast.error(err.message || "Could not add to cart."),
        });

    const mediaUrls =
        Array.from(
            new Set(
                product.media
                    ?.filter((media) => media.mediaItem?.url)
                    .map((media) => media.mediaItem?.url || "")
            )
        ) || [];

    const imageUrl = mediaUrls[0] || PLACEHOLDER_IMAGE_URL;
    const activeCardImage =
        isProductHovered && mediaUrls.length > 1
            ? mediaUrls[currentImageIndex] || imageUrl
            : imageUrl;
    const quickViewImages = Array.from(
        new Set([imageUrl, ...mediaUrls])
    ).filter(Boolean);

    const rawPrice = product.variants?.[0]?.price || product.price || 0;
    const originalPrice =
        product.variants?.[0]?.compareAtPrice ?? product.compareAtPrice;
    const displayOriginal =
        originalPrice && originalPrice > rawPrice
            ? Math.round(Number(convertPaiseToRupees(originalPrice)))
            : null;
    const displayCurrent = Math.round(Number(convertPaiseToRupees(rawPrice)));
    const discount =
        originalPrice && originalPrice > rawPrice
            ? Math.round(((originalPrice - rawPrice) / originalPrice) * 100)
            : null;

    const selectedVariant = useMemo(() => {
        if (!product.variants?.length) return null;
        if (!product.options?.length || !Object.keys(selectedOptions).length) {
            return product.variants[0];
        }

        return (
            product.variants.find((variant) =>
                Object.entries(selectedOptions).every(
                    ([optionId, valueId]) =>
                        (variant.combinations as Record<string, string>)?.[
                            optionId
                        ] === valueId
                )
            ) ?? product.variants[0]
        );
    }, [product.options, product.variants, selectedOptions]);

    useEffect(() => {
        if (!isProductHovered) {
            setCurrentImageIndex(0);
        }
    }, [isProductHovered]);

    useEffect(() => {
        let slideshowInterval: number | undefined;

        if (isProductHovered && mediaUrls.length > 1) {
            slideshowInterval = window.setInterval(() => {
                setCurrentImageIndex((prevIndex) =>
                    prevIndex === mediaUrls.length - 1 ? 0 : prevIndex + 1
                );
            }, 800);
        }

        return () => {
            if (slideshowInterval !== undefined) {
                window.clearInterval(slideshowInterval);
            }
        };
    }, [isProductHovered, mediaUrls.length]);

    useEffect(() => {
        let interval: number | undefined;

        if (isQuickViewOpen && quickViewImages.length > 1) {
            interval = window.setInterval(() => {
                setQuickViewImageIndex((previousIndex) =>
                    previousIndex === quickViewImages.length - 1
                        ? 0
                        : previousIndex + 1
                );
            }, 3000);
        }

        return () => {
            if (interval) window.clearInterval(interval);
        };
    }, [isQuickViewOpen, quickViewImages.length]);

    useEffect(() => {
        if (!isQuickViewOpen || typeof window === "undefined") return;

        quickViewImages.slice(0, 4).forEach((src) => {
            const preloadedImage = new window.Image();
            preloadedImage.src = src;
        });
    }, [isQuickViewOpen, quickViewImages]);

    const handleQuickViewChange = (open: boolean) => {
        setIsQuickViewOpen(open);

        if (open) {
            setQuickViewImageIndex(0);
        }
    };

    const handleQuickAddCart = async (
        e: React.MouseEvent<HTMLButtonElement>
    ) => {
        e.preventDefault();
        e.stopPropagation();
        handleCartFlyAnimation(e, imageUrl);

        try {
            await trackAddToCartEvent({
                productId: product.id,
                brandId: product.brandId,
                productTitle: product.title,
                brandName: product.brand?.name,
                productPrice: selectedVariant?.price ?? rawPrice,
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
                    product,
                    selectedVariant ?? null,
                    "Item added to cart!"
                );
            } else {
                addToGuestCart({
                    productId: product.id,
                    variantId: selectedVariant?.id || null,
                    quantity,
                    title: product.title,
                    brand: product.brand?.name,
                    price: selectedVariant?.price ?? rawPrice,
                    image: imageUrl,
                    fullProduct: product,
                });
            }
        } catch (err: any) {
            toast.error(err.message || "Could not add to cart.");
        }
    };

    const handleBuyNow = async (e: React.MouseEvent<HTMLButtonElement>) => {
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
                    title: product.title,
                    brand: product.brand?.name,
                    price: selectedVariant?.price ?? rawPrice,
                    image: imageUrl,
                    fullProduct: product,
                });
            }

            router.push(
                `/checkout?buy_now=true&item=${product.id}&variant=${selectedVariant?.id || ""}&qty=${quantity}`
            );
        } catch (err: any) {
            toast.error(err.message || "Could not proceed.");
        }
    };

    return (
        <div
            className={cn("", className)}
            title={product.title}
            {...props}
            onMouseEnter={() => setIsProductHovered(true)}
            onMouseLeave={() => setIsProductHovered(false)}
        >
            <div className="group/card relative block">
                <Dialog
                    open={isQuickViewOpen}
                    onOpenChange={handleQuickViewChange}
                >
                    <AnimatedProductLink href={`/products/${product.slug}`}>
                        <div className="relative aspect-[3/4] overflow-hidden bg-[#f5f5f5]">
                            <Image
                                src={activeCardImage}
                                alt={product.title || "Product image"}
                                fill
                                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                                className={cn(
                                    "object-cover transition-all duration-300 ease-in-out",
                                    isProductHovered ? "scale-105" : "scale-100"
                                )}
                            />

                        {discount ? (
                            <span className="absolute left-0 top-2 z-20 rounded-r-sm bg-[#E95123] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                                -{discount}%
                            </span>
                        ) : null}

                        <div
                            className={cn(
                                "absolute inset-x-0 bottom-0 z-20 hidden p-2 transition-all duration-500 ease-out md:block",
                                isProductHovered
                                    ? "translate-y-0 opacity-100"
                                    : "translate-y-full opacity-0"
                            )}
                        >
                            <div
                                className="rounded-xl bg-[linear-gradient(180deg,rgba(255,253,249,0.82)_0%,rgba(245,236,220,0.94)_100%)] p-2 shadow-[0_20px_40px_rgba(32,26,18,0.14)] backdrop-blur-md"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                            >
                                <DialogTrigger asChild>
                                    <button className="btn-liquid btn-liquid-primary flex h-10 w-full items-center justify-center rounded-lg text-[10px] font-bold uppercase tracking-[0.12em] shadow-[0_12px_24px_rgba(49,58,31,0.22)]">
                                        Quick Buy
                                    </button>
                                </DialogTrigger>
                            </div>
                        </div>
                        </div>
                    </AnimatedProductLink>

                    <div
                        className="absolute bottom-2 right-2 z-20 md:hidden"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                    >
                        <DialogTrigger asChild>
                            <button
                                className={cn(
                                    "relative flex h-12 w-12 items-center justify-center rounded-full border border-[#dfcda6] bg-[radial-gradient(circle_at_30%_30%,#fffaf0_0%,#f7edd8_45%,#dcc28f_100%)] text-primary shadow-[0_14px_34px_rgba(144,112,44,0.3)] transition-all duration-300 active:scale-95",
                                    isQuickViewOpen &&
                                        "border-primary bg-[linear-gradient(180deg,#485231_0%,#2e381d_100%)] text-primary-foreground shadow-[0_18px_36px_rgba(49,58,31,0.34)]"
                                )}
                                aria-label="Quick buy"
                            >
                                <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.5)_0%,rgba(255,255,255,0)_68%)] opacity-70" />
                                <ShoppingCart className="size-[18px]" />
                            </button>
                        </DialogTrigger>
                    </div>

                    <DialogContent
                        className="max-h-[95dvh] w-[96vw] max-w-5xl overflow-hidden rounded-[24px] border border-[#ebe7df] bg-white p-0 shadow-[0_24px_70px_rgba(29,24,18,0.14)] md:h-[85vh]"
                        onCloseAutoFocus={(e) => e.preventDefault()}
                    >
                        <DialogTitle className="sr-only">
                            {product.title}
                        </DialogTitle>

                        <div className="flex h-full flex-col overflow-y-auto bg-white md:flex-row md:overflow-hidden">
                            <div className="group/slider relative h-[320px] w-full shrink-0 bg-[#f7f7f7] sm:h-[380px] md:h-full md:w-1/2">
                                <Image
                                    src={
                                        quickViewImages[quickViewImageIndex] ||
                                        imageUrl
                                    }
                                    alt={product.title}
                                    fill
                                    priority={isQuickViewOpen}
                                    fetchPriority={
                                        isQuickViewOpen ? "high" : undefined
                                    }
                                    quality={90}
                                    className="object-contain md:object-cover md:object-center"
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                />

                                {quickViewImages.length > 1 && (
                                    <>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setQuickViewImageIndex((prev) =>
                                                    prev === 0
                                                        ? quickViewImages.length -
                                                          1
                                                        : prev - 1
                                                );
                                            }}
                                            className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-sm opacity-0 transition-opacity group-hover/slider:opacity-100 hover:bg-white"
                                        >
                                            <ChevronLeft className="h-5 w-5 text-gray-600" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setQuickViewImageIndex((prev) =>
                                                    prev ===
                                                    quickViewImages.length - 1
                                                        ? 0
                                                        : prev + 1
                                                );
                                            }}
                                            className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-sm opacity-0 transition-opacity group-hover/slider:opacity-100 hover:bg-white"
                                        >
                                            <ChevronRight className="h-5 w-5 text-gray-600" />
                                        </button>
                                        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
                                            {quickViewImages.map((_, index) => (
                                                <div
                                                    key={index}
                                                    className={cn(
                                                        "h-1.5 w-1.5 rounded-full transition-colors",
                                                        index ===
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

                            <div className="scrollbar-hide flex flex-col p-4 md:w-1/2 md:overflow-y-auto md:p-12">
                                <h2 className="pr-8 font-serif text-xl font-light leading-tight text-gray-900 sm:text-2xl md:text-[32px]">
                                    {product.title}
                                </h2>

                                <div className="mt-2 flex items-baseline gap-3 md:mt-5">
                                    <span className="text-lg font-medium text-gray-900 md:text-xl">
                                        Rs.{" "}
                                        {formatPriceTag(
                                            parseFloat(
                                                convertPaiseToRupees(
                                                    selectedVariant?.price ||
                                                        rawPrice
                                                )
                                            ),
                                            true
                                        )}
                                    </span>
                                    {originalPrice ? (
                                        <span className="text-sm font-medium text-gray-400 line-through">
                                            Rs.{" "}
                                            {formatPriceTag(
                                                parseFloat(
                                                    convertPaiseToRupees(
                                                        originalPrice
                                                    )
                                                ),
                                                true
                                            )}
                                        </span>
                                    ) : null}
                                    {discount ? (
                                        <span className="rounded-full border border-[#ebe7df] bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
                                            Save {discount}%
                                        </span>
                                    ) : null}
                                </div>

                                {product.description ? (
                                    <div
                                        className="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-500 md:mt-6 md:line-clamp-3 md:text-sm"
                                        dangerouslySetInnerHTML={{
                                            __html: product.description,
                                        }}
                                    />
                                ) : null}

                                <div className="mt-4 space-y-3 md:mt-8 md:space-y-6">
                                    {product.options?.map((option) => {
                                        const selectedValue =
                                            selectedOptions[option.id] ||
                                            option.values[0]?.id;

                                        return (
                                            <div key={option.id}>
                                                <div className="mb-2 flex items-center gap-2 text-xs md:text-sm">
                                                    <span className="font-medium text-gray-900">
                                                        {option.name} :
                                                    </span>
                                                    <span className="text-gray-500">
                                                        {
                                                            option.values.find(
                                                                (value) =>
                                                                    value.id ===
                                                                    selectedValue
                                                            )?.name
                                                        }
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5 md:gap-2.5">
                                                    {option.values.map(
                                                        (value) => (
                                                            <button
                                                                key={value.id}
                                                                onClick={() =>
                                                                    setSelectedOptions(
                                                                        (
                                                                            prev
                                                                        ) => ({
                                                                            ...prev,
                                                                            [option.id]:
                                                                                value.id,
                                                                        })
                                                                    )
                                                                }
                                                                className={cn(
                                                                    "h-8 min-w-[36px] border px-3 text-xs font-medium transition-colors md:h-10 md:px-4 md:text-sm",
                                                                    selectedValue ===
                                                                        value.id
                                                                        ? "border-gray-900 text-gray-900"
                                                                        : "border-gray-300 text-gray-600 hover:border-gray-400"
                                                                )}
                                                            >
                                                                {value.name}
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

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
                                                -
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

                                    {product.specifications &&
                                    product.specifications.length > 0 ? (
                                        <div className="mt-4 border-t border-gray-100 pt-4">
                                            <p className="mb-3 text-[9px] font-medium uppercase tracking-[0.18em] text-gray-400">
                                                Specifications
                                            </p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {product.specifications.map(
                                                    (spec, index) => (
                                                        <div
                                                            key={index}
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
                                    ) : null}

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

                <div className="space-y-1.5 pt-2 pb-1">
                    <p className="truncate text-[11px] font-normal leading-tight text-gray-800 sm:text-xs">
                        {product.title}
                    </p>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-[12px] font-semibold text-gray-900">
                            Rs.{displayCurrent}
                        </span>
                        {displayOriginal ? (
                            <span className="text-[10px] text-gray-400 line-through">
                                Rs.{displayOriginal}
                            </span>
                        ) : null}
                    </div>
                    <p className="truncate text-[10px] text-[#7f7662]">
                        {product.brand?.name}
                    </p>
                </div>
            </div>
        </div>
    );
}
