"use client";

import { ProductCartAddForm } from "@/components/globals/forms";
import { ProductShareModal } from "@/components/globals/modals";
import { Icons } from "@/components/icons";
import { RichTextViewer } from "@/components/ui/rich-text-viewer";
import { Separator } from "@/components/ui/separator";
import { cn, convertPaiseToRupees, formatPriceTag } from "@/lib/utils";
import { CachedCart, ProductWithBrand } from "@/lib/validations";
import Link from "next/link";
import { useState } from "react";

interface PageProps extends GenericProps {
    initialCart?: CachedCart[];
    product: ProductWithBrand;
    isWishlisted: boolean;
    userId?: string;
}

export function ProductContent({
    className,
    initialCart,
    product,
    isWishlisted,
    userId,
    ...props
}: PageProps) {
    const [isProductShareModalOpen, setIsProductShareModalOpen] =
        useState(false);

    return (
        <>
            <div className={cn("", className)} {...props}>
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
                        {formatPriceTag(
                            parseFloat(convertPaiseToRupees(product.price))
                        )}
                    </p>

                    <p className="text-xs font-semibold text-accent/80 md:text-sm">
                        + 7% platform fee at checkout
                    </p>
                </div>

                <ProductCartAddForm
                    product={product}
                    userId={userId}
                    isWishlisted={isWishlisted}
                    initialCart={initialCart}
                />

                <Separator />

                <RichTextViewer content={product.description} />
            </div>

            <ProductShareModal
                isOpen={isProductShareModalOpen}
                setIsOpen={setIsProductShareModalOpen}
                product={product}
            />
        </>
    );
}
