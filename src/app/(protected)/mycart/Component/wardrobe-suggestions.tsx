"use client";

import { Icons } from "@/components/icons";
import { trpc } from "@/lib/trpc/client";
import {
    cn,
    convertPaiseToRupees,
    formatPriceTag,
    handleClientError,
} from "@/lib/utils";
import { Check, ShoppingBag, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { toast } from "sonner";

interface WardrobeSuggestionsProps {
    userId: string;
    className?: string;
}

export default function WardrobeSuggestions({
    userId,
    className,
}: WardrobeSuggestionsProps) {
    const { data: userCart } = trpc.general.users.cart.getCartForUser.useQuery({
        userId,
    });

    // Get category IDs from cart to suggest similar items
    const cartCategoryIds = useMemo(() => {
        if (!userCart) return [];
        return [...new Set(userCart.map((item) => item.product.categoryId))];
    }, [userCart]);

    // For now, this is a static UI section since we don't have a dedicated recommendations endpoint
    // The section will display properly with the design, and can be wired up to real data later

    const suggestions = [
        {
            id: 1,
            badge: "Pairs with shirt",
            brand: "EARTHEN THREADS",
            title: "Navy Organic Cotton Pants",
            price: "€58.00",
            matchTag: "Pairs with shirt",
            worksWithCount: 3,
        },
        {
            id: 2,
            badge: "Completes outfit",
            brand: "SIMPLE GOODS",
            title: "Natural Canvas Belt",
            price: "€32.00",
            matchTag: "Completes outfit",
            worksWithCount: 3,
        },
        {
            id: 3,
            badge: "Active",
            brand: "ARTISAN COLLECTIVE",
            title: "Handwoven Scarf - Earth...",
            price: "€45.00",
            matchTag: "Same artisan region",
            worksWithCount: 2,
        },
        {
            id: 4,
            badge: "Sole Purpose",
            brand: "SOLE PURPOSE",
            title: "Minimalist Leather...",
            price: "€78.00",
            matchTag: "Watches tone",
            worksWithCount: 2,
        },
    ];

    if (!userCart || userCart.length === 0) return null;

    return (
        <div className={cn("mt-8", className)}>
            {/* Header */}
            <div className="mb-4">
                <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                    <Sparkles className="size-5 text-amber-500" />
                    Complete Your Conscious Wardrobe
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                    Based on your cart, these pieces create more outfit
                    possibilities
                </p>
            </div>

            {/* Why we suggest these */}
            <div className="mb-5 rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="mb-2 text-sm font-semibold text-gray-800">
                    Why we suggest these:
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Check className="size-3.5 text-green-600" />
                        <span>Pairs with items in your cart</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Check className="size-3.5 text-green-600" />
                        <span>Fills a gap in your wardrobe composition</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Check className="size-3.5 text-green-600" />
                        <span>High versatility score (8+/10)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Check className="size-3.5 text-green-600" />
                        <span>
                            Similar sustainability values (85+ Earth Score)
                        </span>
                    </div>
                </div>
            </div>

            {/* Suggestion cards grid */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {suggestions.map((item) => (
                    <div
                        key={item.id}
                        className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-md"
                    >
                        {/* Image placeholder with badge */}
                        <div className="relative aspect-[4/5] bg-stone-100">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <ShoppingBag className="size-8 text-stone-300" />
                            </div>
                            <div className="absolute right-2 top-2 rounded-full bg-green-600 px-2 py-0.5 text-[9px] font-semibold text-white">
                                {item.badge}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="p-3">
                            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                                {item.brand}
                            </p>
                            <h4 className="mt-0.5 line-clamp-2 text-sm font-semibold text-gray-900">
                                {item.title}
                            </h4>
                            <p className="mt-1 text-sm font-bold text-gray-900">
                                {item.price}
                            </p>

                            {/* Match tag */}
                            <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-500">
                                <Check className="size-3 text-green-600" />
                                <span>{item.matchTag}</span>
                            </div>
                            <p className="mt-0.5 text-[10px] text-gray-400">
                                Works with {item.worksWithCount} cart items
                            </p>

                            {/* Add to bag button */}
                            <button className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-700 transition-colors hover:border-green-600 hover:bg-green-50 hover:text-green-700">
                                <ShoppingBag className="size-3.5" />
                                Add to Bag
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
