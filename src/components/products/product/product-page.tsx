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
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import {
    CachedCart,
    CachedWishlist,
    ProductWithBrand,
} from "@/lib/validations";
import Autoplay from "embla-carousel-autoplay";
import { ZoomIn } from "lucide-react";
import Image from "next/image";
import { useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { ProductContent } from "./product-content";
import { ProductDetails } from "./product-detais";
import YouMayAlsoLike from "./product-recommendation";

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
                <div className="hidden w-1/2 lg:block">
                    <div className="flex justify-center gap-12 rounded-md border border-gray-300 bg-[#FCFBF4] p-4">
                        {/* Robustly Fixed Thumbnails Carousel */}
                        <div className="relative flex w-28 flex-col items-center py-6">
                            <Carousel
                                orientation="vertical"
                                opts={{
                                    align: "start",
                                    loop: true,
                                }}
                                className="h-[435px] w-full"
                            >
                                <CarouselContent
                                    classNames={{
                                        wrapper: "h-full overflow-hidden",
                                    }}
                                    className="-mt-4 h-full"
                                >
                                    {isEmptyArray(sortedImages) ? (
                                        <CarouselItem className="basis-1/5 pt-4">
                                            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
                                                <Image
                                                    src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1"
                                                    alt="Default Thumbnail"
                                                    width={80}
                                                    height={80}
                                                    className="aspect-square w-full object-contain"
                                                />
                                            </div>
                                        </CarouselItem>
                                    ) : (
                                        sortedImages.map((image, i) => (
                                            <CarouselItem
                                                key={image.id}
                                                className="basis-1/5 pt-4"
                                            >
                                                <div
                                                    className={cn(
                                                        "aspect-square cursor-pointer overflow-hidden rounded-lg border-2 bg-white transition-all duration-200",
                                                        i === selectedImage
                                                            ? "border-gray-800"
                                                            : "border-transparent hover:border-gray-300"
                                                    )}
                                                    onClick={() =>
                                                        setSelectedImage(i)
                                                    }
                                                >
                                                    <Image
                                                        src={image.url}
                                                        alt={
                                                            image.alt ||
                                                            `Thumbnail ${i + 1}`
                                                        }
                                                        width={100}
                                                        height={100}
                                                        className="size-full object-contain p-1"
                                                    />
                                                </div>
                                            </CarouselItem>
                                        ))
                                    )}
                                </CarouselContent>
                                {sortedImages.length > 5 && (
                                    <>
                                        <CarouselPrevious className="absolute -top-6 left-1/2 z-10 size-10 -translate-x-1/2 rotate-90 border-gray-200 bg-white shadow-md hover:bg-gray-50 focus:ring-0 active:scale-95" />
                                        <CarouselNext className="absolute -bottom-6 left-1/2 z-10 size-10 -translate-x-1/2 rotate-90 border-gray-200 bg-white shadow-md hover:bg-gray-50 focus:ring-0 active:scale-95" />
                                    </>
                                )}
                            </Carousel>
                        </div>

                        {/* Main Image */}
                        <div
                            id="pdp-main-image"
                            className="group relative flex cursor-pointer items-center justify-center bg-transparent transition-all duration-300"
                            style={{ width: "485px", height: "485px" }}
                            onClick={() => setIsImageModalOpen(true)}
                        >
                            <div className="flex size-full items-center justify-center">
                                <Image
                                    src={
                                        isEmptyArray(sortedImages)
                                            ? "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1"
                                            : sortedImages[selectedImage]?.url
                                    }
                                    alt={
                                        isEmptyArray(sortedImages)
                                            ? "Default Product Image"
                                            : sortedImages[selectedImage]
                                                  ?.alt || "Product image"
                                    }
                                    width={485}
                                    height={485}
                                    className="mx-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                                    style={{
                                        maxWidth: "100%",
                                        maxHeight: "100%",
                                        height: "auto",
                                        width: "auto",
                                    }}
                                />
                            </div>
                            {/* Zoom Indicator */}
                            <div className="absolute bottom-4 right-4 rounded-full bg-black/60 p-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                <ZoomIn className="size-5 text-white" />
                            </div>
                        </div>
                    </div>

                    {/* Bottom Info Strip */}
                    <div className="mt-3 flex justify-around rounded-b-md border-t border-gray-300 bg-[#C2CDD0] py-3 text-sm text-gray-700">
                        <span>100% Genuine Products</span>
                        <span>Easy Return Policy</span>
                        <span>Mindful Materials</span>
                    </div>
                    <ProductDetails product={product} />
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
                                        alt={
                                            image.alt ||
                                            `Product image ${i + 1}`
                                        }
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
                <div className="block md:hidden">
                    <ProductDetails product={product} />
                </div>
            </div>
            <Separator />
            <YouMayAlsoLike
                categoryId={product.categoryId}
                excludeProductId={product.id}
                className="mt-12"
            />
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
                                            alt={
                                                image.alt ||
                                                `Product image ${i + 1}`
                                            }
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
