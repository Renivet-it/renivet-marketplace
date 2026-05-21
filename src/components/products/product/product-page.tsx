"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-general";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    type CarouselApi,
} from "@/components/ui/carousel";
import { trpc } from "@/lib/trpc/client";
import { cn, formatINR } from "@/lib/utils";
import {
    CachedCart,
    CachedWishlist,
    ProductWithBrand,
} from "@/lib/validations";
import { Lock, X, ZoomIn } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useQueryState } from "nuqs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ProductContent } from "./product-content";
import { ProductDetails } from "./product-detais";
import YouMayAlsoLike from "./product-recommendation";
import { ProductReviews } from "./product-reviews";
import { ProductCard } from "./product-static";

/**
 * Feature flag — Decode X / Behind The Product block.
 * Set to `true` when the module is ready to ship (P1-FE-009).
 */
const SHOW_DECODEX = false;

interface PageProps extends GenericProps {
    product: ProductWithBrand;
    initialWishlist?: CachedWishlist[];
    initialCart?: CachedCart[];
    userId?: string;
}

const FALLBACK_IMAGE_URL =
    "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1";

type RecentlyViewedProduct = {
    id: string;
    slug: string;
    title: string;
    brand: string;
    image: string;
    price: number;
};

const RECENTLY_VIEWED_KEY = "renivet_recently_viewed_products";

export function ProductPage({
    className,
    product,
    initialWishlist,
    initialCart,
    userId,
    ...props
}: PageProps) {
    const [selectedSku] = useQueryState("sku");
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [modalImageIndex, setModalImageIndex] = useState(0);
    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);
    const [recentlyViewed, setRecentlyViewed] = useState<
        RecentlyViewedProduct[]
    >([]);

    useEffect(() => {
        if (!api) return;
        setCurrent(api.selectedScrollSnap() + 1);
        api.on("select", () => {
            setCurrent(api.selectedScrollSnap() + 1);
        });
    }, [api]);

    const { data: wishlist } = trpc.general.users.wishlist.getWishlist.useQuery(
        { userId: userId! },
        { enabled: !!userId, initialData: initialWishlist }
    );

    const isWishlisted =
        wishlist?.some((item) => item.productId === product.id) ?? false;

    const selectedVariant = product.variants.find(
        (variant) => variant.nativeSku === selectedSku
    );

    const images = Array.from(
        new Map(
            (product.media ?? [])
                .map((media) => ({
                    url: media?.mediaItem?.url,
                    alt: media?.mediaItem?.alt,
                    id: media.id,
                    position: media.position,
                }))
                .filter(
                    (
                        url
                    ): url is {
                        url: string;
                        alt: string;
                        id: string;
                        position: number;
                    } => !!url.url
                )
                .map((item) => [item.url, item])
        ).values()
    );

    const sortedImages = useMemo(() => {
        if (!selectedVariant?.image || !images?.length) return images;
        const variantMediaItem = selectedVariant?.mediaItem;
        if (!variantMediaItem?.url) return images;
        const variantImageIndex = images.findIndex(
            (img) => img.id === selectedVariant.image
        );
        if (variantImageIndex === -1) {
            return [
                {
                    url: variantMediaItem.url,
                    alt: variantMediaItem.alt ?? `${product.title} variant`,
                    id: selectedVariant.image,
                    position: -1,
                },
                ...images,
            ];
        }
        const newImages = [...images];
        const [variantImage] = newImages.splice(variantImageIndex, 1);
        return [variantImage, ...newImages];
    }, [
        images,
        selectedVariant?.image,
        selectedVariant?.mediaItem,
        product.title,
    ]);

    const displayImages =
        sortedImages.length > 0
            ? sortedImages
            : [
                  {
                      id: "fallback",
                      url: FALLBACK_IMAGE_URL,
                      alt: "Default Product Image",
                      position: -1,
                  },
              ];
    const primaryImageUrl = displayImages[0]?.url ?? FALLBACK_IMAGE_URL;

    const openModal = useCallback((index: number) => {
        setModalImageIndex(index);
        setIsImageModalOpen(true);
    }, []);

    useEffect(() => {
        try {
            const raw = window.localStorage.getItem(RECENTLY_VIEWED_KEY);
            const previous = raw
                ? (JSON.parse(raw) as RecentlyViewedProduct[])
                : [];

            setRecentlyViewed(previous.filter((item) => item.id !== product.id));

            const currentProduct: RecentlyViewedProduct = {
                id: product.id,
                slug: product.slug ?? product.id,
                title: product.title,
                brand: product.brand.name,
                image: primaryImageUrl,
                price: product.variants?.[0]?.price ?? product.price ?? 0,
            };
            const next = [
                currentProduct,
                ...previous.filter((item) => item.id !== product.id),
            ].slice(0, 8);

            window.localStorage.setItem(
                RECENTLY_VIEWED_KEY,
                JSON.stringify(next)
            );
        } catch {
            setRecentlyViewed([]);
        }
    }, [
        primaryImageUrl,
        product.brand.name,
        product.id,
        product.price,
        product.slug,
        product.title,
        product.variants,
    ]);

    useEffect(() => {
        if (!isImageModalOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight")
                setModalImageIndex((i) =>
                    Math.min(i + 1, displayImages.length - 1)
                );
            if (e.key === "ArrowLeft")
                setModalImageIndex((i) => Math.max(i - 1, 0));
            if (e.key === "Escape") setIsImageModalOpen(false);
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [isImageModalOpen, displayImages.length]);

    return (
        <>
            {/* ══ Main PDP wrapper ══ */}
            <div
                className={cn(
                    "mx-auto w-full max-w-[1440px] bg-white",
                    className
                )}
                {...props}
            >
                {/* ══ Two-column layout ══ */}
                <div className="flex flex-col lg:flex-row lg:items-start">
                    {/* ── LEFT: 2-column image grid (60%) ── */}
                    <div className="w-full lg:w-[60%]">
                        {/* Desktop image layout: centered single image, 2-col for multiple */}
                        <div
                            className={cn(
                                "hidden lg:grid lg:gap-3",
                                displayImages.length === 1
                                    ? "lg:grid-cols-1 lg:place-items-center"
                                    : "lg:grid-cols-2"
                            )}
                        >
                            {displayImages.map((image, i) => (
                                <div
                                    key={image.id}
                                    id={i === 0 ? "pdp-main-image" : undefined}
                                    className={cn(
                                        "group relative aspect-[3/4] w-full cursor-zoom-in overflow-hidden bg-[#f5f5f0]",
                                        displayImages.length === 1 &&
                                            "max-w-[620px]"
                                    )}
                                    onClick={() => openModal(i)}
                                >
                                    <Image
                                        src={image.url}
                                        alt={
                                            image.alt ||
                                            `Product image ${i + 1}`
                                        }
                                        fill
                                        sizes={
                                            displayImages.length === 1
                                                ? "(max-width: 1440px) 52vw, 620px"
                                                : "(max-width: 1440px) 30vw, 432px"
                                        }
                                        className="object-contain object-center transition-transform duration-500 group-hover:scale-[1.03]"
                                        priority={i < 2}
                                    />
                                    <div className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 opacity-0 shadow-sm backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
                                        <ZoomIn className="size-4 text-neutral-700" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Mobile: carousel images */}
                        <div className="lg:hidden">
                            <Carousel setApi={setApi} className="w-full">
                                <CarouselContent className="ml-0">
                                    {displayImages.map((image, i) => (
                                        <CarouselItem
                                            key={image.id}
                                            className="pl-0"
                                            onClick={() => openModal(i)}
                                        >
                                            <div
                                                id={i === 0 ? "pdp-main-image" : undefined}
                                                className="relative aspect-[4/5] w-full overflow-hidden bg-[#f5f5f0] [touch-action:pinch-zoom]"
                                            >
                                                <Image
                                                    src={image.url}
                                                    alt={
                                                        image.alt ||
                                                        `Product image ${i + 1}`
                                                    }
                                                    fill
                                                    sizes="100vw"
                                                    className="object-contain object-center"
                                                    priority={i === 0}
                                                />
                                                <div className="absolute bottom-4 left-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 shadow-sm backdrop-blur-sm">
                                                    <ZoomIn className="size-4 text-neutral-700" />
                                                </div>
                                            </div>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                {displayImages.length > 1 && (
                                    <div className="absolute bottom-4 right-4 z-10 rounded-full bg-black/50 px-3 py-1 text-[10px] font-bold tracking-widest text-white backdrop-blur-sm">
                                        {current} / {displayImages.length}
                                    </div>
                                )}
                            </Carousel>
                        </div>
                    </div>

                    {/* ── RIGHT: sticky product panel (40%) ── */}
                    <div className="w-full border-l border-neutral-200 lg:w-[40%]">
                        {/* sticky wrapper — no scrollbar, no max-height */}
                        <div className="lg:sticky lg:top-0">
                            {/* Product info */}
                            <ProductContent
                                className="px-6 py-8 md:px-8 md:py-10"
                                product={product}
                                initialCart={initialCart}
                                isWishlisted={isWishlisted}
                                userId={userId}
                            />

                            <div className="border-t border-neutral-200 px-6 py-4 md:px-8">
                                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                                    100% Secure Checkout
                                </p>
                                <div className="flex flex-wrap items-center justify-between gap-2.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="rounded border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-lg font-black italic leading-none text-[#1a2e8a]">
                                            VISA
                                        </span>
                                        <span className="rounded border border-neutral-300 bg-neutral-50 px-3 py-1.5">
                                            <span className="inline-flex items-center">
                                                <span className="size-3.5 rounded-full bg-[#eb001b]" />
                                                <span className="-ml-1.5 size-3.5 rounded-full bg-[#f79e1b]" />
                                            </span>
                                        </span>
                                        <span className="rounded border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-base font-bold leading-none text-[#097939]">
                                            UPI
                                        </span>
                                        <span className="rounded border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-base font-semibold leading-none text-[#1858b9]">
                                            RuPay
                                        </span>
                                        <span className="rounded border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-xs font-semibold tracking-wide text-neutral-600">
                                            COD
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                                        <Lock className="size-3.5" />
                                        <span>SSL Encrypted</span>
                                    </div>
                                </div>
                            </div>

                            {/* Accordions — sit below product info inside the sticky panel */}
                            <div className="border-t border-neutral-200 px-6 md:px-8">
                                <ProductDetails product={product} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Decode X / Story Section — hidden until module ships (P1-FE-009) ── */}
            {SHOW_DECODEX && (
                <div className="mx-auto w-full max-w-[1440px]">
                    <div className="relative h-[420px] overflow-hidden rounded-[34px] border border-neutral-200 bg-[#fcfbf4] md:h-[520px]">
                        <div className="pointer-events-none absolute inset-0 select-none opacity-55 blur-[4px]">
                            <ProductCard product={product} />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center bg-[#fcfbf4]/58">
                            <div className="px-4 text-center text-[#162038]">
                                <p className="text-[52px] font-semibold leading-[1.05] tracking-tight md:text-[64px]">
                                    Decode X
                                </p>
                                <p className="mt-1 text-[44px] font-semibold leading-[1.06] tracking-tight md:text-[56px]">
                                    Behind The Product
                                </p>
                                <div className="mx-auto mt-5 h-[2px] w-52 bg-[#efe4d0]" />
                                <p className="mt-3 text-[28px] font-medium tracking-[0.2em] text-[#28476b] md:text-[34px]">
                                    COMING SOON
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Customer Reviews ── */}
            <div className="mx-auto w-full max-w-[1440px] border-t border-neutral-200">
                <ProductReviews productId={product.id} userId={userId} />
            </div>

            {/* ── You May Also Like ── */}
            <div className="mx-auto mt-0 w-full max-w-[1440px] border-t border-neutral-200 pt-3">
                <YouMayAlsoLike
                    brandId={product.brandId}
                    categoryId={product.categoryId}
                    excludeProductId={product.id}
                    userId={userId}
                />
            </div>

            {/* ── Lightbox Modal ── */}
            {recentlyViewed.length > 0 && (
                <div className="mx-auto w-full max-w-[1440px] border-t border-neutral-200 px-4 py-8 md:px-8">
                    <h2 className="mb-5 text-sm font-semibold uppercase tracking-[0.16em] text-neutral-900">
                        Recently Viewed
                    </h2>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                        {recentlyViewed.slice(0, 4).map((item) => (
                            <Link
                                key={item.id}
                                href={`/products/${item.slug}`}
                                className="group block"
                            >
                                <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100">
                                    <Image
                                        src={item.image}
                                        alt={item.title}
                                        fill
                                        sizes="(max-width: 768px) 50vw, 25vw"
                                        className="object-contain transition-transform duration-500 group-hover:scale-[1.03]"
                                    />
                                </div>
                                <div className="mt-2 min-w-0">
                                    <p className="truncate text-13 font-semibold text-neutral-900">
                                        {item.title}
                                    </p>
                                    <p className="truncate text-12 text-neutral-500">
                                        {item.brand}
                                    </p>
                                    <p className="mt-1 text-13 font-semibold text-neutral-900">
                                        {formatINR(item.price, { input: "paise" })}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
                <DialogContent className="max-w-screen flex h-screen max-h-screen w-screen items-center justify-center bg-black/95 p-0">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Product Images</DialogTitle>
                    </DialogHeader>

                    <button
                        className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                        onClick={() => setIsImageModalOpen(false)}
                    >
                        <X className="size-5" />
                    </button>

                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white backdrop-blur-sm">
                        {modalImageIndex + 1} / {displayImages.length}
                    </div>

                    {modalImageIndex > 0 && (
                        <button
                            className="absolute left-4 top-1/2 z-50 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                            onClick={() => setModalImageIndex((i) => i - 1)}
                        >
                            ‹
                        </button>
                    )}
                    {modalImageIndex < displayImages.length - 1 && (
                        <button
                            className="absolute right-4 top-1/2 z-50 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                            onClick={() => setModalImageIndex((i) => i + 1)}
                        >
                            ›
                        </button>
                    )}

                    <div className="relative h-full w-full">
                        <Image
                            src={
                                displayImages[modalImageIndex]?.url ??
                                FALLBACK_IMAGE_URL
                            }
                            alt={
                                displayImages[modalImageIndex]?.alt ||
                                "Product image"
                            }
                            fill
                            className="object-contain"
                            style={{ touchAction: "pinch-zoom" }}
                            sizes="100vw"
                        />
                    </div>

                    <div className="absolute bottom-16 left-1/2 flex -translate-x-1/2 gap-2 overflow-x-auto px-4 py-2">
                        {displayImages.map((img, i) => (
                            <button
                                key={img.id}
                                onClick={() => setModalImageIndex(i)}
                                className={cn(
                                    "relative h-14 w-11 flex-shrink-0 overflow-hidden border-2 transition-all",
                                    i === modalImageIndex
                                        ? "border-white"
                                        : "border-white/30 opacity-60 hover:opacity-100"
                                )}
                            >
                                <Image
                                    src={img.url}
                                    alt={img.alt || `Thumb ${i + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="44px"
                                />
                            </button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
