import { Button } from "@/components/ui/button-general";
import { formatPriceTag } from "@/lib/utils";
import { Product, Variant } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { toast } from "sonner";

export const AddToCartToast = ({
    product,
    variant,
    message,
    t,
}: {
    product: Product;
    variant: Variant | null;
    message: string;
    t: string | number;
}) => {
    const productName = product.title;

    let imageSrc = "/images/placeholder.png";
    if (variant && variant.images && variant.images.length > 0) {
        imageSrc = variant.images[0].url;
    } else if (variant && variant.image) {
        imageSrc = variant.image as string;
    } else if (
        product.media &&
        product.media.length > 0 &&
        product.media[0].url
    ) {
        imageSrc = product.media[0].url;
    }

    return (
        <div className="flex w-full items-center justify-between gap-4 rounded-lg border border-gray-100 bg-white p-4 shadow-lg">
            <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-md bg-gray-50">
                    <Image
                        src={imageSrc}
                        alt={productName}
                        fill
                        className="object-cover"
                    />
                </div>
                <div className="flex flex-col">
                    <span className="line-clamp-1 text-sm font-medium text-gray-900">
                        {productName}
                    </span>
                    <span className="text-xs text-gray-500">{message}</span>
                </div>
            </div>
            <Button
                size="sm"
                variant="default"
                className="shrink-0 text-xs"
                asChild
                onClick={() => toast.dismiss(t)}
            >
                <Link href="/mycart">View Cart</Link>
            </Button>
        </div>
    );
};

export const showAddToCartToast = (
    product: Product,
    variant: Variant | null = null,
    message: string = "Added to Cart!"
) => {
    toast.custom(
        (t) => (
            <AddToCartToast
                product={product}
                variant={variant}
                message={message}
                t={t}
            />
        ),
        {
            duration: 4000,
            position: "top-center",
        }
    );
};
