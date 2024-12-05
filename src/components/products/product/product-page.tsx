"use client";

import { ProductShareModal } from "@/components/globals/modals";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-general";
import { Label } from "@/components/ui/label";
import { RichTextViewer } from "@/components/ui/rich-text-viewer";
import { Separator } from "@/components/ui/separator";
import { cn, formatPriceTag } from "@/lib/utils";
import { ProductWithBrand } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface PageProps extends GenericProps {
    product: ProductWithBrand;
}

export function ProductPage({ className, product, ...props }: PageProps) {
    const [isProductShareModalOpen, setIsProductShareModalOpen] =
        useState(false);

    return (
        <>
            <div
                className={cn("flex flex-col gap-5 md:flex-row", className)}
                {...props}
            >
                <div className="grid basis-3/5 grid-cols-1 gap-5 md:grid-cols-2">
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

                <div className="w-px bg-border" />

                <div className="basis-2/5 space-y-3 md:space-y-5">
                    <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                            <h2 className="text-2xl font-semibold md:text-4xl">
                                {product.name}
                            </h2>

                            <button
                                className="mt-2"
                                onClick={() => setIsProductShareModalOpen(true)}
                            >
                                <span className="sr-only">Share</span>
                                <Icons.Share className="size-5" />
                            </button>
                        </div>

                        <p>
                            <Link
                                href={`/brands/${product.brand.id}`}
                                className="bg-accent p-1 px-2 text-xs text-accent-foreground md:text-sm"
                            >
                                {product.brand.name}
                            </Link>
                        </p>
                    </div>

                    <Separator />

                    <div className="md:space-y-1">
                        <p className="text-2xl font-semibold md:text-3xl">
                            {formatPriceTag(parseFloat(product.price))}
                        </p>

                        <p className="text-xs font-semibold text-accent/80 md:text-sm">
                            inclusive all taxes
                        </p>
                    </div>

                    {product.colors.length > 0 && (
                        <div className="space-y-4">
                            <Label className="font-semibold uppercase">
                                More Colors
                            </Label>

                            <div className="flex flex-wrap gap-2">
                                {product.colors.map((color) => (
                                    <div
                                        key={color.name}
                                        className="flex flex-col items-center gap-2"
                                    >
                                        <button
                                            title={color.name}
                                            className="size-12 cursor-pointer rounded-full border border-foreground/10 disabled:cursor-not-allowed disabled:opacity-60"
                                            style={{
                                                backgroundColor: color.hex,
                                            }}
                                        >
                                            <span className="sr-only">
                                                {color.name}
                                            </span>
                                        </button>

                                        <span className="text-sm">
                                            {color.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <Separator />

                    <div className="space-y-4">
                        <Label className="font-semibold uppercase">
                            Select Size
                        </Label>

                        <div className="flex flex-wrap gap-2">
                            {product.sizes.map((size) => (
                                <button
                                    key={size.name}
                                    className="flex size-12 cursor-pointer items-center justify-center rounded-full border border-foreground/30 p-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                                    disabled={size.quantity === 0}
                                >
                                    {size.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 md:flex-row md:gap-4">
                        <Button
                            size="lg"
                            className="w-full font-semibold uppercase md:h-12 md:basis-2/3 md:text-base"
                        >
                            <Icons.ShoppingCart />
                            Add to Cart
                        </Button>

                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full font-semibold uppercase md:h-12 md:basis-1/3 md:text-base"
                        >
                            <Icons.Heart />
                            Wishlist
                        </Button>
                    </div>

                    <Separator />

                    <RichTextViewer content={product.description} />
                </div>
            </div>

            <ProductShareModal
                isOpen={isProductShareModalOpen}
                setIsOpen={setIsProductShareModalOpen}
                product={product}
            />
        </>
    );
}
