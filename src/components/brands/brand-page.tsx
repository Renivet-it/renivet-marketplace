"use client";

import {
    cn,
    convertPaiseToRupees,
    formatPriceTag,
    getAbsoluteURL,
} from "@/lib/utils";
import { CachedBrand } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef } from "react";
import { toast } from "sonner";
import { Icons } from "../icons";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button-general";
import { Card } from "../ui/card";
import { Separator } from "../ui/separator";

interface PageProps {
    brand: CachedBrand;
}

export function BrandPage({ brand }: PageProps) {
    const websiteUrlRaw = brand.website;
    const doesUrlIncludeHttp =
        websiteUrlRaw?.includes("http://") ||
        websiteUrlRaw?.includes("https://");
    const websiteUrl = doesUrlIncludeHttp
        ? websiteUrlRaw
        : `http://${websiteUrlRaw}`;

    return (
        <>
            <div className="space-y-2 md:space-y-0">
                <div
                    className={cn(
                        "relative flex aspect-[4/1] items-center justify-center overflow-hidden border border-secondary",
                        !brand.coverUrl && "bg-muted"
                    )}
                >
                    {!!brand.coverUrl && (
                        <>
                            <Image
                                src={brand.coverUrl}
                                alt="Pottery Design"
                                height={2000}
                                width={2000}
                                className="size-full object-cover"
                            />
                        </>
                    )}
                </div>

                <div className="flex items-center justify-between gap-5 px-2 md:-translate-y-5 md:px-10">
                    <div className="flex items-center gap-4">
                        <Avatar className="relative size-14 border-2 border-secondary md:size-32">
                            <AvatarImage
                                src={brand.logoUrl}
                                alt="Brand Logo"
                                className="size-full object-cover"
                            />
                            <AvatarFallback>{brand.name[0]}</AvatarFallback>
                        </Avatar>

                        <div>
                            <h3 className="text-lg font-bold md:text-2xl">
                                {brand.name}
                            </h3>
                            <p className="text-xs text-muted-foreground md:text-sm">
                                @{brand.slug}
                            </p>
                        </div>
                    </div>

                    <div>
                        <Button
                            size="sm"
                            className="text-xs md:text-sm"
                            onClick={() => {
                                navigator.clipboard.writeText(
                                    getAbsoluteURL(`/brands/${brand.id}`)
                                );
                                toast.success("Link copied to clipboard");
                            }}
                        >
                            <Icons.Forward />
                            Share
                        </Button>
                    </div>
                </div>
            </div>

            <Separator className="md:-translate-y-5" />

            <div className="grid gap-10 md:-translate-y-5 md:grid-cols-6">
                <div className="h-min space-y-4 border border-secondary p-4 md:col-span-2">
                    <h3 className="font-semibold">About</h3>

                    <p className="flex justify-center text-center text-sm">
                        {!!brand.bio?.length ? brand.bio : "No bio available"}
                    </p>

                    <Separator />

                    <div className="space-y-1">
                        <Link
                            href={`mailto:${brand.email}`}
                            className="flex items-center gap-2 text-sm"
                        >
                            <Icons.Mail className="size-4" />
                            <span>{brand.email}</span>
                        </Link>

                        <Link
                            href={`tel:${brand.phone}`}
                            className="flex items-center gap-2 text-sm"
                        >
                            <Icons.Phone className="size-4" />
                            <span>{brand.phone}</span>
                        </Link>

                        {!!websiteUrl && (
                            <Link
                                href={websiteUrl}
                                className="flex items-center gap-2 text-sm"
                            >
                                <Icons.Globe className="size-4" />
                                <span>{brand.website}</span>
                            </Link>
                        )}
                    </div>
                </div>

                <div className="space-y-4 md:col-span-4">
                    {brand.pageSections
                        .filter((section) => section.sectionProducts.length > 0)
                        .map((section) => (
                            <PageSectionCarousel
                                key={section.id}
                                pageSection={section}
                            />
                        ))}
                </div>
            </div>
        </>
    );
}

interface PageSectionCarouselProps {
    pageSection: CachedBrand["pageSections"][number];
}

function PageSectionCarousel({ pageSection }: PageSectionCarouselProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const isMobile = window.innerWidth < 768;
        const cardWidth = isMobile ? 160 : 200;
        const gap = isMobile ? 12 : 16;
        const scrollAmount = cardWidth + gap;

        const currentScroll = container.scrollLeft;
        const maxScroll = container.scrollWidth - container.clientWidth;

        const newScroll =
            direction === "left"
                ? Math.max(0, currentScroll - scrollAmount)
                : Math.min(maxScroll, currentScroll + scrollAmount);

        container.scrollTo({
            left: newScroll,
            behavior: "smooth",
        });
    };

    return (
        <div className="space-y-2 md:space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold md:text-xl">
                    {pageSection.name}
                </h2>

                <div className="flex gap-1 md:gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-7 md:size-8"
                        onClick={() => scroll("left")}
                    >
                        <Icons.ChevronLeft className="size-3 md:size-4" />
                    </Button>

                    <Button
                        variant="outline"
                        size="icon"
                        className="size-7 md:size-8"
                        onClick={() => scroll("right")}
                    >
                        <Icons.ChevronRight className="size-3 md:size-4" />
                    </Button>
                </div>
            </div>

            <div className="relative">
                <div
                    ref={scrollContainerRef}
                    className="scrollbar-hide flex snap-x gap-3 overflow-x-auto md:gap-4"
                    style={{
                        scrollBehavior: "smooth",
                        WebkitOverflowScrolling: "touch",
                    }}
                >
                    {pageSection.sectionProducts.map(({ product }) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </div>
    );
}

interface ProductCardProps {
    product: CachedBrand["pageSections"][number]["sectionProducts"][number]["product"];
}

function ProductCard({ product }: ProductCardProps) {
    const price = useMemo(() => {
        if (product.variants.length === 0) {
            return formatPriceTag(
                parseFloat(convertPaiseToRupees(product.price ?? 0)),
                true
            );
        }

        const minPriceRaw = Math.min(...product.variants.map((x) => x.price));
        const maxPriceRaw = Math.max(...product.variants.map((x) => x.price));

        const minPrice = formatPriceTag(
            parseFloat(convertPaiseToRupees(minPriceRaw)),
            true
        );
        const maxPrice = formatPriceTag(
            parseFloat(convertPaiseToRupees(maxPriceRaw)),
            true
        );

        return minPriceRaw === maxPriceRaw
            ? minPrice
            : `${minPrice} - ${maxPrice}`;
    }, [product.variants, product.price]);

    return (
        <Card
            key={product.id}
            className="relative w-[160px] shrink-0 snap-start rounded-none md:w-[200px]"
        >
            <Link href={`/products/${product.slug}`} target="_blank">
                <div className="relative aspect-square overflow-hidden">
                    <Image
                        src={product.media[0].mediaItem!.url}
                        alt={product.title}
                        width={200}
                        height={200}
                        className="size-full object-cover"
                    />
                </div>

                <div className="p-3">
                    <h3 className="line-clamp-1 text-sm font-medium md:text-base">
                        {product.title}
                    </h3>
                    <p className="text-xs text-muted-foreground md:text-sm">
                        {price}
                    </p>
                </div>
            </Link>
        </Card>
    );
}
