"use client";

import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { Bookmark, Check, ShoppingBag, Sparkles } from "lucide-react";
import { useMemo } from "react";

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

    const suggestions = [
        {
            id: 1,
            badge: "Pairs with shirt",
            brand: "EARTHEN THREADS",
            title: "Organic Cotton Wide-Leg Pants - Navy",
            price: "€52.00",
            matchTag: "Pairs with shirt",
            worksWithCount: 3,
            deliveryDate: "Jan 17",
        },
        {
            id: 2,
            badge: "Completes outfit",
            brand: "SIMPLE GOODS",
            title: "Handwoven Canvas Belt - Earth Tones",
            price: "€38.00",
            matchTag: "Completes outfit",
            worksWithCount: 3,
            deliveryDate: "Jan 18",
        },
        {
            id: 3,
            badge: "Active",
            brand: "ARTISAN COLLECTIVE",
            title: "Handwoven Scarf - Earth...",
            price: "€45.00",
            matchTag: "Same artisan region",
            worksWithCount: 2,
            deliveryDate: "Jan 20",
        },
        {
            id: 4,
            badge: "Sole Purpose",
            brand: "SOLE PURPOSE",
            title: "Minimalist Leather...",
            price: "€78.00",
            matchTag: "Watches tone",
            worksWithCount: 2,
            deliveryDate: "Jan 22",
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
                <p className="mt-1 text-xs text-gray-500 md:text-sm">
                    Thoughtfully curated pieces that pair beautifully with your
                    selections
                </p>
            </div>

            {/* Why we suggest these */}
            <div className="mb-5 rounded-xl border border-gray-100 bg-gray-50 p-3 md:p-4">
                <p className="mb-2 text-xs font-semibold text-gray-800 md:text-sm">
                    Why these suggestions?
                </p>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 md:gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-600 md:text-xs">
                        <Check className="size-3 shrink-0 text-green-600 md:size-3.5" />
                        <span>Pairs with items in your cart</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-600 md:text-xs">
                        <Check className="size-3 shrink-0 text-green-600 md:size-3.5" />
                        <span>
                            Similar sustainability values (85+ Earth Score)
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-600 md:text-xs">
                        <Check className="size-3 shrink-0 text-green-600 md:size-3.5" />
                        <span>High versatility score (8+/10)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-600 md:text-xs">
                        <Check className="size-3 shrink-0 text-green-600 md:size-3.5" />
                        <span>Fills wardrobe versatility gaps</span>
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
                        <div className="p-2.5 md:p-3">
                            <p className="text-[9px] font-medium uppercase tracking-wide text-gray-400 md:text-[10px]">
                                {item.brand}
                            </p>
                            <h4 className="mt-0.5 line-clamp-2 text-xs font-semibold text-gray-900 md:text-sm">
                                {item.title}
                            </h4>
                            <p className="mt-1 text-xs font-bold text-gray-900 md:text-sm">
                                {item.price}
                            </p>

                            {/* Match tag */}
                            <div className="mt-1.5 flex items-center gap-1 text-[10px] text-gray-500">
                                <Check className="size-3 text-green-600" />
                                <span>{item.matchTag}</span>
                            </div>

                            {/* Mobile: delivery date */}
                            <p className="mt-0.5 text-[10px] text-gray-400 md:hidden">
                                Delivery {item.deliveryDate}
                            </p>

                            {/* Desktop: works with */}
                            <p className="mt-0.5 hidden text-[10px] text-gray-400 md:block">
                                Works with {item.worksWithCount} cart items
                            </p>

                            {/* Add to bag button */}
                            <button className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-1.5 text-[11px] font-medium text-gray-700 transition-colors hover:border-green-600 hover:bg-green-50 hover:text-green-700 md:mt-3 md:py-2 md:text-xs">
                                <ShoppingBag className="size-3" />
                                Add to Bag
                            </button>

                            {/* Mobile: Save here link */}
                            <button className="mt-1.5 flex w-full items-center justify-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 md:hidden">
                                <Bookmark className="size-3" />
                                Save here
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Mobile: Not interested / Save for later */}
            <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-gray-400 md:hidden">
                <button className="hover:text-gray-600 hover:underline">
                    Not interested?
                </button>
                <span>·</span>
                <button className="flex items-center gap-1 hover:text-gray-600 hover:underline">
                    <Bookmark className="size-3" />
                    Save for later
                </button>
            </div>
        </div>
    );
}
