"use client";

import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import {
    CachedCart,
    CachedWishlist,
    ProductWithBrand,
} from "@/lib/validations";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
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
    const { data: wishlist } = trpc.general.users.wishlist.getWishlist.useQuery(
        { userId: userId! },
        { enabled: !!userId, initialData: initialWishlist }
    );

    const isWishlisted =
        wishlist?.some((item) => item.productId === product.id) ?? false;

    return (
        <>
            <div
                className={cn("flex flex-col gap-5 lg:flex-row", className)}
                {...props}
            >
                <div className="hidden basis-3/5 grid-cols-1 gap-5 md:grid md:grid-cols-2">
                    {product.imageUrls.map((url, i) => (
                        <div className="aspect-[3/4] overflow-hidden" key={i}>
                            <Image
                                src={url}
                                alt={`${product.name} ${i}`}
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
                        {product.imageUrls.map((url, i) => (
                            <CarouselItem
                                key={i}
                                className="p-0 text-center md:basis-1/2 lg:basis-1/4"
                            >
                                <div className="aspect-[3/4] size-full overflow-hidden">
                                    <Image
                                        src={url}
                                        alt={`${product.name} ${i}`}
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
        </>
    );
}
