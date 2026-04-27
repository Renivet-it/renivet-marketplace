"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-general";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import {
    CachedCart,
    CachedWishlist,
    ProductWithBrand,
} from "@/lib/validations";
import { X, ZoomIn } from "lucide-react";
import Image from "next/image";
import { useQueryState } from "nuqs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ProductContent } from "./product-content";
import { ProductDetails } from "./product-detais";
import YouMayAlsoLike from "./product-recommendation";
import { ProductCard } from "./product-static";

interface PageProps extends GenericProps {
    product: ProductWithBrand;
    initialWishlist?: CachedWishlist[];
    initialCart?: CachedCart[];
    userId?: string;
}

const FALLBACK_IMAGE_URL =
    "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1";

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

    const openModal = useCallback((index: number) => {
        setModalImageIndex(index);
        setIsImageModalOpen(true);
    }, []);

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
                        {/* Desktop 2-col image grid */}
                        <div className="hidden lg:grid lg:grid-cols-2 lg:gap-3">
                            {displayImages.map((image, i) => (
                                <div
                                    key={image.id}
                                    id={i === 0 ? "pdp-main-image" : undefined}
                                    className="group relative aspect-[3/4] cursor-zoom-in overflow-hidden bg-[#f5f5f0]"
                                    onClick={() => openModal(i)}
                                >
                                    <Image
                                        src={image.url}
                                        alt={
                                            image.alt ||
                                            `Product image ${i + 1}`
                                        }
                                        fill
                                        sizes="(max-width: 1440px) 30vw, 432px"
                                        className="object-contain object-center transition-transform duration-500 group-hover:scale-[1.03]"
                                        priority={i < 2}
                                    />
                                    <div className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 opacity-0 shadow-sm backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
                                        <ZoomIn className="size-4 text-neutral-700" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Mobile: single-column images */}
                        <div className="flex flex-col gap-[2px] lg:hidden">
                            {displayImages.map((image, i) => (
                                <div
                                    key={image.id}
                                    id={i === 0 ? "pdp-main-image" : undefined}
                                    className="relative aspect-[4/5] w-full overflow-hidden bg-[#f5f5f0]"
                                    onClick={() => openModal(i)}
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
                                </div>
                            ))}
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

                            {/* Accordions — sit below product info inside the sticky panel */}
                            <div className="border-t border-neutral-200 px-6 md:px-8">
                                <ProductDetails product={product} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Decode X / Story Section ── */}
            <div className="mx-auto w-full max-w-[1440px]">
                <ProductCard product={product} />
            </div>

            {/* ── You May Also Like ── */}
            <div className="mx-auto mt-16 w-full max-w-[1440px] border-t border-neutral-200 pt-12">
                <YouMayAlsoLike
                    categoryId={product.categoryId}
                    excludeProductId={product.id}
                />
            </div>

            {/* ── Lightbox Modal ── */}
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
