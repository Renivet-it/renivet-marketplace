"use client";

import { cn, convertPaiseToRupees, formatPriceTag } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar, Leaf, RotateCcw, ShoppingBag, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface GenericProps {
    className?: string;
    [key: string]: any;
}

interface CartItem {
    id: string;
    product: {
        id: string;
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
    onRemove?: (item: CartItem) => void;
    isRemoving?: boolean;
}

export function OrderProductCard({
    orderItems,
    onRemove,
    isRemoving,
    className,
    ...props
}: OrderProductCardProps) {
    const totalItems = orderItems.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-[#f0f4eb]">
                        <ShoppingBag className="size-4 text-[#6B7A5E]" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Order Details
                        </h2>
                        <p className="text-xs text-gray-500">
                            {totalItems} {totalItems === 1 ? "item" : "items"}{" "}
                            ready for checkout
                        </p>
                    </div>
                </div>
            </div>

            {orderItems.length > 0 ? (
                <div className="space-y-4">
                    {orderItems.map((item) => {
                        const itemMedia =
                            item.product.media?.[0]?.mediaItem ?? null;
                        const imageUrl =
                            itemMedia?.url ??
                            "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1";
                        const imageAlt = itemMedia?.alt ?? item.product.title;

                        const itemPrice =
                            item.variantId && item.product.variants?.length > 0
                                ? (item.product.variants.find(
                                      (variant) => variant.id === item.variantId
                                  )?.price ??
                                  item.product.price ??
                                  0)
                                : (item.product.price ?? 0);

                        const itemCompareAtPrice =
                            item.variantId && item.product.variants?.length > 0
                                ? (item.product.variants.find(
                                      (variant) => variant.id === item.variantId
                                  )?.compareAtPrice ??
                                  item.product.compareAtPrice ??
                                  itemPrice)
                                : (item.product.compareAtPrice ?? itemPrice);

                        return (
                            <div
                                key={item.id}
                                className={cn(
                                    "group relative rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-[#c5d1b8] hover:shadow-sm",
                                    className
                                )}
                                {...props}
                            >
                                <div className="flex gap-4">
                                    {/* Product image with eco badge */}
                                    <div className="relative">
                                        <div className="relative aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-[#fafaf5]">
                                            <Image
                                                src={imageUrl}
                                                alt={imageAlt}
                                                width={200}
                                                height={260}
                                                className="size-full object-contain p-1"
                                            />
                                        </div>
                                        {/* Eco badge */}
                                        <div className="absolute -bottom-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full border-2 border-white bg-[#f0f4eb]">
                                            <Leaf className="size-3 text-[#6B7A5E]" />
                                        </div>
                                    </div>

                                    {/* Product details */}
                                    <div className="flex flex-1 flex-col justify-between">
                                        <div className="space-y-1">
                                            {/* Brand */}
                                            <Link
                                                href={`/brands/${item.product.brand.id}`}
                                                className="text-[11px] font-semibold uppercase tracking-widest text-[#6B7A5E] transition-colors hover:text-[#536845]"
                                            >
                                                {item.product.brand.name}
                                            </Link>

                                            {/* Title */}
                                            <h3 className="text-sm font-medium leading-snug text-gray-900">
                                                <Link
                                                    href={`/products/${item.product.slug}`}
                                                    target="_blank"
                                                    referrerPolicy="no-referrer"
                                                    className="transition-colors hover:text-[#6B7A5E]"
                                                >
                                                    {item.product.title}
                                                </Link>
                                            </h3>

                                            {/* Price */}
                                            <div className="flex items-end gap-2 text-base font-bold text-gray-900">
                                                <span>
                                                    {formatPriceTag(
                                                        parseFloat(
                                                            convertPaiseToRupees(
                                                                itemPrice
                                                            )
                                                        ),
                                                        true
                                                    )}
                                                </span>
                                                {itemCompareAtPrice >
                                                    itemPrice && (
                                                    <>
                                                        <span className="text-sm text-gray-400 line-through">
                                                            {formatPriceTag(
                                                                parseFloat(
                                                                    convertPaiseToRupees(
                                                                        itemCompareAtPrice
                                                                    )
                                                                ),
                                                                true
                                                            )}
                                                        </span>
                                                        <span className="text-sm font-semibold text-green-600">
                                                            {Math.round(
                                                                ((itemCompareAtPrice -
                                                                    itemPrice) /
                                                                    itemCompareAtPrice) *
                                                                    100
                                                            )}
                                                            % OFF
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                            {onRemove && (
                                                <button
                                                    onClick={() =>
                                                        onRemove(item)
                                                    }
                                                    disabled={isRemoving}
                                                    className="mt-1 flex items-center gap-1 text-[11px] font-medium text-red-500 transition-colors hover:text-red-700 disabled:opacity-50"
                                                >
                                                    <Trash2 className="size-3" />
                                                    Remove
                                                </button>
                                            )}
                                        </div>

                                        {/* Variant pills */}
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                                                Qty: {item.quantity}
                                            </span>
                                            {item.variantId &&
                                                item.product.options.map(
                                                    (option) => {
                                                        const selectedValue =
                                                            item.product.variants.find(
                                                                (v) =>
                                                                    v.id ===
                                                                    item.variantId
                                                            )?.combinations[
                                                                option.id
                                                            ];
                                                        const optionValue =
                                                            option.values.find(
                                                                (v) =>
                                                                    v.id ===
                                                                    selectedValue
                                                            );

                                                        return (
                                                            <span
                                                                key={option.id}
                                                                className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600"
                                                            >
                                                                {option.name}:{" "}
                                                                {
                                                                    optionValue?.name
                                                                }
                                                            </span>
                                                        );
                                                    }
                                                )}
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom info bar */}
                                <div className="mt-3 flex items-center gap-4 border-t border-dashed border-gray-100 pt-3">
                                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                                        <Calendar className="size-3" />
                                        Added{" "}
                                        {format(
                                            new Date(item.createdAt),
                                            "MMM dd, yyyy"
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 rounded-full border border-[#d4deca] bg-[#f5f8f0] px-2 py-0.5 text-[11px] font-medium text-[#6B7A5E]">
                                        <RotateCcw className="size-2.5" />
                                        10-day returns
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="rounded-xl border border-dashed border-gray-200 px-6 py-10 text-center">
                    <ShoppingBag className="mx-auto mb-2 size-8 text-gray-300" />
                    <p className="text-sm text-gray-500">
                        No items in your cart.
                    </p>
                </div>
            )}
        </div>
    );
}
