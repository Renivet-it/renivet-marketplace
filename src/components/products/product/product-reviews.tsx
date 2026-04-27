"use client";

import { Star, CheckCircle2, ChevronDown, SlidersHorizontal, Image as ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc/client";
import { WriteReviewModal } from "./write-review-modal";
import { format } from "date-fns";

interface ProductReviewsProps {
    productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
    const [activeFilter, setActiveFilter] = useState<"All" | "Photos">("All");

    const { data: reviews, isLoading, error } = trpc.general.customerReviews.getReviewsByProduct.useQuery({
        productId,
    });

    const filteredReviews = useMemo(() => {
        if (!reviews) return [];
        if (activeFilter === "Photos") {
            return reviews.filter(r => r.images && r.images.length > 0);
        }
        return reviews;
    }, [reviews, activeFilter]);

    const averageRating = useMemo(() => {
        if (!reviews || reviews.length === 0) return 0;
        const total = reviews.reduce((acc, r) => acc + r.rating, 0);
        return Number((total / reviews.length).toFixed(1));
    }, [reviews]);

    if (error) {
        return (
            <div className="py-16 text-center text-neutral-500">
                Failed to load reviews. Please try again later.
            </div>
        );
    }

    return (
        <section className="bg-white py-16">
            <div className="mx-auto w-full max-w-[1440px] px-4 md:px-8">
                {/* ── Header & Main Actions ── */}
                <div className="mb-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
                    <div>
                        <h2 className="font-sans text-[2rem] font-semibold leading-tight text-neutral-900 md:text-[2.5rem]">
                            Customer Reviews
                        </h2>
                        
                        {isLoading ? (
                            <div className="mt-4 flex items-center gap-2 text-sm text-neutral-500">
                                <Loader2 className="size-4 animate-spin" />
                                Loading reviews...
                            </div>
                        ) : (
                            <div className="mt-4 flex items-center gap-4">
                                <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={cn(
                                                "size-5",
                                                star <= Math.round(averageRating) ? "fill-neutral-900 text-neutral-900" : "fill-transparent text-neutral-300"
                                            )}
                                        />
                                    ))}
                                </div>
                                <p className="text-sm font-medium text-neutral-900">
                                    {reviews && reviews.length > 0 ? `${averageRating} out of 5` : "No ratings yet"}
                                </p>
                                <span className="text-sm text-neutral-500">
                                    ({reviews?.length || 0} Reviews)
                                </span>
                            </div>
                        )}
                    </div>
                    
                    <WriteReviewModal productId={productId} />
                </div>

                {/* ── Filters Toolbar ── */}
                <div className="mb-12 flex flex-col gap-4 border-y border-neutral-200 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <button className="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-xs font-semibold text-neutral-900 transition-colors hover:bg-neutral-100">
                            <SlidersHorizontal className="size-3.5" />
                            Filters
                        </button>
                        <button 
                            onClick={() => setActiveFilter("All")}
                            className={cn(
                                "rounded-full px-4 py-2 text-xs font-semibold transition-colors",
                                activeFilter === "All" ? "bg-neutral-900 text-white" : "border border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50"
                            )}
                        >
                            All Reviews
                        </button>
                        <button 
                            onClick={() => setActiveFilter("Photos")}
                            className={cn(
                                "flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors",
                                activeFilter === "Photos" ? "bg-neutral-900 text-white" : "border border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50"
                            )}
                        >
                            <ImageIcon className="size-3.5" />
                            With Photos
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Sort By</span>
                        <button className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-900 transition-colors hover:bg-neutral-50">
                            Newest First
                            <ChevronDown className="size-3.5" />
                        </button>
                    </div>
                </div>

                {/* ── Reviews Grid ── */}
                {isLoading ? (
                    <div className="grid gap-x-12 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((skeleton) => (
                            <div key={skeleton} className="flex flex-col animate-pulse">
                                <div className="h-4 w-24 bg-neutral-200 rounded mb-4" />
                                <div className="h-5 w-48 bg-neutral-200 rounded mb-4" />
                                <div className="h-16 w-full bg-neutral-100 rounded mb-6" />
                                <div className="mt-auto h-12 w-full bg-neutral-100 rounded-t" />
                            </div>
                        ))}
                    </div>
                ) : filteredReviews.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Star className="size-12 text-neutral-200 mb-4" />
                        <h3 className="text-lg font-semibold text-neutral-900">No reviews yet</h3>
                        <p className="text-sm text-neutral-500 max-w-md mt-2">
                            {activeFilter === "Photos" 
                                ? "There are currently no reviews with photos for this product." 
                                : "Be the first to share your thoughts about this product!"}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-x-12 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
                        {filteredReviews.map((review) => (
                            <article key={review.id} className="flex flex-col">
                                {/* Images (If any) */}
                                {review.images && review.images.length > 0 && (
                                    <div className="mb-6 flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                        {review.images.map((img, idx) => (
                                            <div key={idx} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
                                                <Image
                                                    src={img}
                                                    alt={`Review image ${idx + 1}`}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                className={cn(
                                                    "size-3.5",
                                                    star <= review.rating
                                                        ? "fill-neutral-900 text-neutral-900"
                                                        : "fill-transparent text-neutral-300"
                                                )}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-400">
                                        {format(new Date(review.createdAt), "MMMM d, yyyy")}
                                    </span>
                                </div>

                                <h4 className="mb-2 text-base font-semibold text-neutral-900">
                                    {review.title}
                                </h4>

                                <p className="mb-6 flex-1 text-[15px] leading-relaxed text-neutral-600">
                                    {review.content}
                                </p>

                                <div className="mt-auto space-y-4 border-t border-neutral-100 pt-5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[13px] font-semibold text-neutral-900">
                                            {review.authorName}
                                        </span>
                                        {review.verified && (
                                            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-500">
                                                <CheckCircle2 className="size-3 text-neutral-400" />
                                                Verified Buyer
                                            </span>
                                        )}
                                    </div>

                                    {review.attributes && review.attributes.length > 0 && (
                                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-neutral-500">
                                            {review.attributes.map((attr, i) => (
                                                <span key={i} className="flex gap-1.5">
                                                    <span className="font-semibold text-neutral-700">{attr.label}:</span>
                                                    {attr.value}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                {/* ── Pagination / Load More ── */}
                {!isLoading && filteredReviews.length > 0 && (
                    <div className="mt-16 flex justify-center border-t border-neutral-200 pt-10">
                        <button className="rounded-full border border-neutral-200 px-8 py-3 text-sm font-semibold text-neutral-900 transition-colors hover:border-neutral-900 hover:bg-neutral-50">
                            Load More Reviews
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
