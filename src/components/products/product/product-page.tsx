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

    const { data: wishlist } = trpc.general.users.wishlist.getWishlist.useQuery(
        { userId: userId! },
        { enabled: !!userId, initialData: initialWishlist }
    );

    const isWishlisted =
        wishlist?.some((item) => item.productId === product.id) ?? false;

    const selectedVariant = product.variants.find(
        (variant) => variant.nativeSku === selectedSku
    );

    const images = product.media
        ?.map((media) => ({
            url: media.mediaItem?.url,
            alt: media.mediaItem?.alt,
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
        );

    const sortedImages = useMemo(() => {
        if (!selectedVariant?.image || !images?.length) return images;

        const variantMediaItem = selectedVariant.mediaItem;
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

    return (
        <>
            <div
                className={cn("flex flex-col gap-5 lg:flex-row", className)}
                {...props}
            >
                <div className="hidden h-min basis-3/6 grid-cols-1 gap-2 md:grid md:grid-cols-4">
                    {sortedImages?.map((image, i) => (
                        <div
                            className={cn(
                                "aspect-square cursor-pointer overflow-hidden",
                                i === 0 && "col-span-4 aspect-[3/3.5]"
                            )}
                            key={image.id}
                            onClick={() => setIsImageModalOpen(true)}
                        >
                            <Image
                                src={image.url}
                                alt={image.alt || `Product image ${i + 1}`}
                                width={1000}
                                height={1000}
                                className="size-full object-cover"
                            />
                        </div>
                    ))}
                </div>

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
                                        className="size-full object-cover"
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
                                            className="size-full object-cover"
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
