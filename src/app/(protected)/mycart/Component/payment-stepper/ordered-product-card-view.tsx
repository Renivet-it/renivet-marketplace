"use client";

import { convertPaiseToRupees, formatPriceTag } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface GenericProps {
    className?: string;
    [key: string]: any;
}

interface CartItem {
    id: string;
    product: {
        slug: string;
        title: string;
        price: number;
        brand: { id: string; name: string };
        media: Array<{ mediaItem: { url: string; alt: string } }>;
        variants: Array<{
            id: string;
            price: number;
            combinations: { [optionId: string]: string };
        }>;
        options: Array<{
            id: string;
            name: string;
            values: Array<{ id: string; name: string }>;
        }>;
    };
    variantId?: string;
    quantity: number;
    createdAt: string | Date;
}

interface OrderProductCardProps extends GenericProps {
    orderItems: CartItem[];
}

export function OrderProductCard({ orderItems, className, ...props }: OrderProductCardProps) {
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Order Details</h2>
            {orderItems.length > 0 ? (
                <ul className="space-y-4">
                    {orderItems.map((item) => {
                        const itemMedia = item.product.media?.[0]?.mediaItem ?? null;
                        const imageUrl =
                            itemMedia?.url ??
                            "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1";
                        const imageAlt = itemMedia?.alt ?? item.product.title;

                        const itemPrice =
                            item.variantId && item.product.variants.length > 0
                                ? item.product.variants.find((variant) => variant.id === item.variantId)?.price ??
                                  item.product.price ??
                                  0
                                : item.product.price ?? 0;

                        return (
                            <li
                                key={item.id}
                                className={cn(
                                    "relative flex items-start gap-3 rounded-md border border-gray-200 p-3 shadow-sm hover:bg-gray-50",
                                    className
                                )}
                                {...props}
                            >
                                <div className="group relative aspect-[4/5] max-w-28 shrink-0">
                                    <Image
                                        src={imageUrl}
                                        alt={imageAlt}
                                        width={1000}
                                        height={1000}
                                        className="size-full object-cover rounded-sm"
                                    />
                                </div>

                                <div className="flex-1 space-y-1">
                                    <div className="space-y-0.5">
                                        <h2 className="text-base font-semibold leading-tight">
                                            <Link
                                                href={`/products/${item.product.slug}`}
                                                target="_blank"
                                                referrerPolicy="no-referrer"
                                            >
                                                {item.product.title}
                                            </Link>
                                        </h2>

                                        <p className="text-xs text-gray-500">
                                            <Link href={`/brands/${item.product.brand.id}`}>
                                                {item.product.brand.name}
                                            </Link>
                                        </p>
                                    </div>

                                    <div className="text-lg font-bold">
                                        {formatPriceTag(
                                            parseFloat(convertPaiseToRupees(itemPrice)),
                                            true
                                        )}
                                    </div>

                                    <div className="text-xs text-gray-600">
                                        <p>
                                            <span className="font-medium">Qty: </span>
                                            {item.quantity}
                                        </p>

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
                                                        <p key={option.id}>
                                                            <span className="font-medium">
                                                                {option.name}:{" "}
                                                            </span>
                                                            {optionValue?.name}
                                                        </p>
                                                    );
                                                })}
                                            </>
                                        )}

                                        <p>
                                            <span className="font-medium">Added on: </span>
                                            {format(new Date(item.createdAt), "MMM dd, yyyy")}
                                        </p>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className="text-sm text-gray-500">No items in your cart.</p>
            )}
        </div>
    );
}