"use client";

import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
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
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import { useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { ProductContent } from "./product-content";

interface PageProps extends GenericProps {
    product: ProductWithBrand;
    initialWishlist?: CachedWishlist[];
    initialCart?: CachedCart[];
    userId?: string;
}

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
    const [selectedImage, setSelectedImage] = useState(0);

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
            product.media
                ?.map((media) => ({
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

    function isEmptyArray(arr: Array<any>): boolean {
        return arr.length === 0;
    }

    return (
        <>
            <div
                className={cn("flex flex-col gap-5 lg:flex-row", className)}
                {...props}
            >
                {/* Desktop Layout */}
                <div className="hidden lg:block w-1/2">
                    <div className="border border-gray-300 rounded-md p-4 flex bg-[#f4f0ec]">
                        {/* Thumbnails */}
                        <div className="flex flex-col gap-3 w-24 items-center">
                            {isEmptyArray(sortedImages) ? (
                                <div className="border border-gray-300 rounded-md overflow-hidden">
                                    <Image
                                        src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1"
                                        alt="Default Thumbnail"
                                        width={80}
                                        height={80}
                                        className="w-full h-24 object-contain"
                                    />
                                </div>
                            ) : (
                                sortedImages.map((image, i) => (
                                    <div
                                        key={image.id}
                                        className={cn(
                                            "cursor-pointer overflow-hidden rounded-md border transition-all duration-200",
                                            i === selectedImage
                                                ? "border-black ring-2 ring-gray-400"
                                                : "border-gray-300 hover:border-gray-500"
                                        )}
                                        onClick={() => setSelectedImage(i)}
                                    >
                                        <Image
                                            src={image.url}
                                            alt={image.alt || `Thumbnail ${i + 1}`}
                                            width={80}
                                            height={80}
                                            className="w-full h-24 object-contain"
                                        />
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Main Image */}
<div
    className="ml-4 flex items-center justify-center rounded-md"
    style={{ width: "485px", height: "485px" }}
>
    <div
        className="cursor-pointer relative"
        onClick={() => setIsImageModalOpen(true)}
        style={{ width: "100%", height: "100%" }}
    >
        <Image
            src={
                isEmptyArray(sortedImages)
                    ? "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1"
                    : sortedImages[selectedImage]?.url
            }
            alt={
                isEmptyArray(sortedImages)
                    ? "Default Product Image"
                    : sortedImages[selectedImage]?.alt || "Product image"
            }
            fill
            className="object-contain"
        />
    </div>
</div>
                    </div>

                    {/* Bottom Info Strip */}
                    <div className="border-t border-gray-300 bg-[#C2CDD0] text-sm text-gray-700 flex justify-around py-3 mt-3 rounded-b-md">
                        <span>100% Genuine Products</span>
                        <span>Easy Return Policy</span>
                        <span>Mindful Materials</span>
                    </div>
                </div>

                {/* Mobile Carousel */}
                <Carousel
                    plugins={[
                        Autoplay({
                            delay: 5000,
                        }),
                    ]}
                    opts={{
                        loop: true,
                        align: "start",
                    }}
                    className="md:hidden"
                >
                    <CarouselContent className="m-0 flex flex-row gap-4">
                        {sortedImages?.map((image, i) => (
                            <CarouselItem
                                key={image.id}
                                className="p-0 text-center md:basis-1/2 lg:basis-1/4"
                            >
                                <div className="aspect-[3/4] size-full overflow-hidden">
                                    <Image
                                        src={image.url}
                                        alt={image.alt || `Product image ${i + 1}`}
                                        width={1000}
                                        height={1000}
                                        className="size-full object-contain"
                                    />
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>

                <div className="w-px bg-border" />

                <ProductContent
                    className="basis-2/5 space-y-3 md:space-y-5"
                    product={product}
                    initialCart={initialCart}
                    isWishlisted={isWishlisted}
                    userId={userId}
                />
            </div>

            {/* Modal */}
            <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
                <DialogContent className="p-0">
                    <DialogHeader className="hidden">
                        <DialogTitle>Images of {product.title}</DialogTitle>
                    </DialogHeader>

                    <Carousel
                        plugins={[
                            Autoplay({
                                delay: 5000,
                            }),
                        ]}
                        opts={{
                            loop: true,
                            align: "start",
                        }}
                    >
                        <CarouselContent className="m-0">
                            {sortedImages?.map((image, i) => (
                                <CarouselItem
                                    key={image.id}
                                    className="p-0 text-center"
                                >
                                    <div className="aspect-[3/4] size-full overflow-hidden">
                                        <Image
                                            src={image.url}
                                            alt={image.alt || `Product image ${i + 1}`}
                                            width={1000}
                                            height={1000}
                                            className="size-full object-contain"
                                        />
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious />
                        <CarouselNext />
                    </Carousel>
                </DialogContent>
            </Dialog>
        </>
    );
}
