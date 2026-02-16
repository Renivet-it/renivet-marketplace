"use client";

import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { Check, Loader2, ShoppingBag, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

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

    const { data: suggestions, isLoading } =
        trpc.general.users.cart.getWardrobeSuggestions.useQuery(
            { userId },
            {
                enabled: !!userCart && userCart.length > 0,
            }
        );

    if (!userCart || userCart.length === 0) return null;
    if (isLoading) return <SuggestionsSkeleton />;
    if (!suggestions || suggestions.length === 0) return null;

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
                        <span>Matched using AI-powered similarity</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-600 md:text-xs">
                        <Check className="size-3 shrink-0 text-green-600 md:size-3.5" />
                        <span>Complements your style choices</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-600 md:text-xs">
                        <Check className="size-3 shrink-0 text-green-600 md:size-3.5" />
                        <span>Fills wardrobe versatility gaps</span>
                    </div>
                </div>
            </div>

            {/* Suggestion cards grid */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {suggestions.map((item, index) => (
                    <SuggestionCard
                        key={item.id}
                        item={item}
                        userId={userId}
                        index={index}
                    />
                ))}
            </div>
        </div>
    );
}

interface SuggestionItem {
    id: string;
    title: string;
    slug: string;
    price: number | null;
    compareAtPrice: number | null;
    brandId: string;
    brandName: string | null;
    categoryId: string;
    imageUrl: string | null;
    distance: number;
    defaultVariantId?: string | null;
}

function SuggestionCard({
    item,
    userId,
    index,
}: {
    item: SuggestionItem;
    userId: string;
    index: number;
}) {
    const LABELS = ["Pairs well", "Complements", "Style match", "Great fit"];
    const label = LABELS[index % LABELS.length];
    const [addedToBag, setAddedToBag] = useState(false);
    const utils = trpc.useUtils();

    const addToCartMutation =
        trpc.general.users.cart.addProductToCart.useMutation({
            onSuccess: () => {
                setAddedToBag(true);
                // Invalidate cart queries so the cart count updates
                utils.general.users.cart.getCartForUser.invalidate({ userId });
                utils.general.users.cart.getWardrobeSuggestions.invalidate({
                    userId,
                });
            },
        });

    const handleAddToBag = () => {
        if (addedToBag || addToCartMutation.isPending) return;
        addToCartMutation.mutate({
            userId,
            productId: item.id,
            variantId: item.defaultVariantId || null,
            quantity: 1,
        });
    };

    const priceDisplay = useMemo(() => {
        if (!item.price) return null;
        const price = (item.price / 100).toFixed(2);
        const compareAt =
            item.compareAtPrice && item.compareAtPrice > item.price
                ? (item.compareAtPrice / 100).toFixed(2)
                : null;
        return { price, compareAt };
    }, [item.price, item.compareAtPrice]);

    return (
        <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-md">
            {/* Product image */}
            <Link href={`/products/${item.slug}`} className="shrink-0">
                <div className="relative aspect-[4/5] bg-stone-100">
                    {item.imageUrl ? (
                        <Image
                            src={item.imageUrl}
                            alt={item.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 768px) 50vw, 25vw"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <ShoppingBag className="size-8 text-stone-300" />
                        </div>
                    )}
                    <div className="absolute right-2 top-2 rounded-full bg-green-600 px-2 py-0.5 text-[9px] font-semibold text-white">
                        {label}
                    </div>
                </div>
            </Link>

            {/* Info */}
            <div className="flex flex-1 flex-col p-2.5 md:p-3">
                <p className="text-[9px] font-medium uppercase tracking-wide text-gray-400 md:text-[10px]">
                    {item.brandName ?? "Brand"}
                </p>
                <Link href={`/products/${item.slug}`}>
                    <h4 className="mt-0.5 line-clamp-2 text-xs font-semibold text-gray-900 hover:underline md:text-sm">
                        {item.title}
                    </h4>
                </Link>

                {priceDisplay && (
                    <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-xs font-bold text-gray-900 md:text-sm">
                            ₹{priceDisplay.price}
                        </span>
                        {priceDisplay.compareAt && (
                            <span className="text-[10px] text-gray-400 line-through md:text-xs">
                                ₹{priceDisplay.compareAt}
                            </span>
                        )}
                    </div>
                )}

                {/* Match tag */}
                <div className="mt-auto pt-3">
                    <div className="mb-2 flex items-center gap-1 text-[10px] text-gray-500">
                        <Check className="size-3 text-green-600" />
                        <span>Complements your cart</span>
                    </div>

                    {/* Add to bag button */}
                    <button
                        onClick={handleAddToBag}
                        disabled={addedToBag || addToCartMutation.isPending}
                        className={cn(
                            "flex w-full items-center justify-center gap-1.5 rounded-lg border py-1.5 text-[11px] font-medium transition-colors md:py-2 md:text-xs",
                            addedToBag
                                ? "border-green-200 bg-green-50 text-green-700"
                                : "border-gray-200 text-gray-700 hover:border-green-600 hover:bg-green-50 hover:text-green-700"
                        )}
                    >
                        {addToCartMutation.isPending ? (
                            <Loader2 className="size-3 animate-spin" />
                        ) : addedToBag ? (
                            <>
                                <Check className="size-3" />
                                Added to Bag
                            </>
                        ) : (
                            <>
                                <ShoppingBag className="size-3" />
                                Add to Bag
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

function SuggestionsSkeleton() {
    return (
        <div className="mt-8">
            <div className="mb-4">
                <div className="h-6 w-64 animate-pulse rounded bg-gray-200" />
                <div className="mt-2 h-4 w-48 animate-pulse rounded bg-gray-100" />
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                    >
                        <div className="aspect-[4/5] animate-pulse bg-gray-100" />
                        <div className="space-y-2 p-3">
                            <div className="h-3 w-16 animate-pulse rounded bg-gray-100" />
                            <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
                            <div className="h-4 w-12 animate-pulse rounded bg-gray-100" />
                            <div className="h-8 w-full animate-pulse rounded bg-gray-100" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
