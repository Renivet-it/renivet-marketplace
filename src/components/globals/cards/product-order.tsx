"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-general";
import { cn, formatPriceTag } from "@/lib/utils";
import { OrderWithItemAndBrand } from "@/lib/validations";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";

interface PageProps extends GenericProps {
    item: OrderWithItemAndBrand["items"][number];
}

export function ProductOrderCard({ className, item, ...props }: PageProps) {
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
                    src={item.product.imageUrls[0]}
                    alt={item.product.name}
                    width={1000}
                    height={1000}
                    className={cn("size-full object-cover")}
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
                            {item.product.name}
                        </Link>
                    </h2>

                    <p className="w-min bg-accent p-1 px-2 text-xs text-accent-foreground">
                        <Link href={`/brands/${item.product.brand.id}`}>
                            {item.product.brand.name}
                        </Link>
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-muted px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50">
                        Size: {item.size}
                    </div>

                    <div className="flex items-center gap-1 bg-muted px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50">
                        Qty: {item.quantity}
                    </div>
                </div>

                <div className="text-lg font-semibold md:text-xl">
                    {formatPriceTag(item.product.price, true)}
                </div>

                <div>
                    {item.color && (
                        <p className="text-sm">
                            <span className="font-semibold">Color: </span>
                            {item.color.name}
                        </p>
                    )}

                    <p className="text-sm">
                        <span className="font-semibold">Added on: </span>
                        {format(new Date(item.createdAt), "MMM dd, yyyy")}
                    </p>
                </div>
            </div>

            <div className="space-y-2">
                <Button size="sm" variant="outline" className="w-full" asChild>
                    <Link
                        href={`/products/${item.product.slug}`}
                        target="_blank"
                        referrerPolicy="no-referrer"
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
