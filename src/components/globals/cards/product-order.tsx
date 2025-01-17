"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-general";
import { cn, convertPaiseToRupees, formatPriceTag } from "@/lib/utils";
import { OrderWithItemAndBrand } from "@/lib/validations";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";

interface PageProps extends GenericProps {
    item: OrderWithItemAndBrand["items"][number];
}

export function ProductOrderCard({ className, item, ...props }: PageProps) {
    const itemMedia =
        item.variantId && item.product.variants.length > 0
            ? !!item.product.variants.find(
                  (variant) => variant.id === item.variantId
              )
                ? item.product.variants.find(
                      (variant) => variant.id === item.variantId
                  )!.mediaItem!
                : item.product.media![0].mediaItem!
            : item.product.media![0].mediaItem!;

    const itemPrice =
        item.variantId && item.product.variants.length > 0
            ? !!item.product.variants.find(
                  (variant) => variant.id === item.variantId
              )
                ? item.product.variants.find(
                      (variant) => variant.id === item.variantId
                  )!.price!
                : item.product.price!
            : item.product.price!;

    const isAvailable =
        item.product.verificationStatus === "approved" &&
        !item.product.isDeleted &&
        item.product.isAvailable &&
        (!!item.product.quantity ? item.product.quantity > 0 : true) &&
        (!item.variant ||
            (item.variant &&
                !item.variant.isDeleted &&
                item.variant.quantity > 0));

    return (
        <div
            key={item.id}
            className={cn(
                "relative flex flex-col gap-3 border p-4 md:flex-row md:gap-5 md:p-6",
                className
            )}
            {...props}
        >
            <div className="group relative aspect-[4/5] size-full max-w-36 shrink-0">
                <Image
                    src={itemMedia.url}
                    alt={itemMedia.alt ?? item.product.title}
                    width={1000}
                    height={1000}
                    className="size-full object-cover"
                />
            </div>

            <div className="w-full space-y-2 md:space-y-4">
                <div className="space-y-1">
                    <h2 className="text-lg font-semibold leading-tight md:text-2xl md:leading-normal">
                        <Link
                            href={`/products/${item.product.slug}`}
                            target="_blank"
                            referrerPolicy="no-referrer"
                        >
                            {item.product.title}
                        </Link>
                    </h2>

                    <p className="w-min bg-accent p-1 px-2 text-xs text-accent-foreground">
                        <Link href={`/brands/${item.product.brand.id}`}>
                            {item.product.brand.name}
                        </Link>
                    </p>
                </div>

                <div className="flex">
                    <div className="flex items-center gap-1 bg-muted px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50">
                        Qty: {item.quantity}
                    </div>
                </div>

                <div className="text-lg font-semibold md:text-xl">
                    {formatPriceTag(
                        parseFloat(convertPaiseToRupees(itemPrice)),
                        true
                    )}
                </div>

                <div>
                    {item.variantId && (
                        <>
                            {item.product.options.map((option) => {
                                const selectedValue =
                                    item.product.variants.find(
                                        (v) => v.id === item.variantId
                                    )?.combinations[option.id];
                                const optionValue = option.values.find(
                                    (v) => v.id === selectedValue
                                );

                                return (
                                    <p key={option.id} className="text-sm">
                                        <span className="font-semibold">
                                            {option.name}:{" "}
                                        </span>
                                        {optionValue?.name}
                                    </p>
                                );
                            })}
                        </>
                    )}
                    <p className="text-sm">
                        <span className="font-semibold">Added on: </span>
                        {format(new Date(item.createdAt), "MMM dd, yyyy")}
                    </p>{" "}
                </div>
            </div>

            <div className="space-y-2">
                <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    disabled={!isAvailable}
                    asChild
                >
                    <Link
                        href={`/products/${item.product.slug}`}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        className={cn(
                            !isAvailable &&
                                "cursor-default opacity-50 hover:bg-background hover:text-foreground"
                        )}
                        onClick={(e) => {
                            if (!isAvailable) e.preventDefault();
                        }}
                    >
                        <Icons.RotateCcw />
                        Buy Again
                    </Link>
                </Button>

                <Button size="sm" className="w-full">
                    <Icons.Star />
                    Rate Item
                </Button>
            </div>
        </div>
    );
}
