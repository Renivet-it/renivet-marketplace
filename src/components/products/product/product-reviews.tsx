"use client";

import { CheckCircle2, ChevronDown, Image as ImageIcon, Loader2, SlidersHorizontal, Star } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";
import { WriteReviewModal } from "./write-review-modal";

type ActiveFilter = "all" | "photos" | "verified";
type SortBy = "newest" | "highest" | "lowest";

interface ProductReviewsProps {
    productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
    const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
    const [sortBy, setSortBy] = useState<SortBy>("newest");
    const [visibleCount, setVisibleCount] = useState(3);

    const { data: reviews = [], isLoading, error } =
        trpc.general.customerReviews.getReviewsByProduct.useQuery({
            productId,
        });

    const averageRating = useMemo(() => {
        if (reviews.length === 0) return 0;
        const total = reviews.reduce((acc, review) => acc + review.rating, 0);
        return Number((total / reviews.length).toFixed(1));
    }, [reviews]);

    const filteredReviews = useMemo(() => {
        const filtered = reviews.filter((review) => {
            if (activeFilter === "photos") return review.images.length > 0;
            if (activeFilter === "verified") return review.verified;
            return true;
        });

        return [...filtered].sort((a, b) => {
            if (sortBy === "highest") return b.rating - a.rating;
            if (sortBy === "lowest") return a.rating - b.rating;
            return (
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );
        });
    }, [activeFilter, reviews, sortBy]);

    const visibleReviews = filteredReviews.slice(0, visibleCount);
    const hasMore = visibleCount < filteredReviews.length;

    if (error) {
        return (
            <div className="py-16 text-center text-neutral-500">
                Failed to load reviews. Please try again later.
            </div>
        );
    }

    return (
        <section className="bg-white py-12 md:py-16">
            <div className="mx-auto w-full max-w-[1440px] px-4 md:px-8">
                <div className="mb-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#817560]">
                            Product Experience
                        </p>
                        <h2 className="mt-2 text-[2rem] font-semibold leading-tight text-neutral-900 md:text-[2.5rem]">
                            Customer Reviews
                        </h2>

                        {isLoading ? (
                            <div className="mt-4 flex items-center gap-2 text-sm text-neutral-500">
                                <Loader2 className="size-4 animate-spin" />
                                Loading reviews...
                            </div>
                        ) : reviews.length > 0 ? (
                            <div className="mt-4 flex flex-wrap items-center gap-4">
                                <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={cn(
                                                "size-5",
                                                star <= Math.round(averageRating)
                                                    ? "fill-neutral-900 text-neutral-900"
                                                    : "fill-transparent text-neutral-300"
                                            )}
                                        />
                                    ))}
                                </div>
                                <p className="text-sm font-medium text-neutral-900">
                                    {averageRating} out of 5
                                </p>
                                <span className="text-sm text-neutral-500">
                                    ({reviews.length} {reviews.length === 1 ? "Review" : "Reviews"})
                                </span>
                            </div>
                        ) : (
                            <p className="mt-4 text-sm text-neutral-500">
                                No reviews available.
                            </p>
                        )}
                    </div>

                    <WriteReviewModal productId={productId} />
                </div>

                <div className="mb-10 flex flex-col gap-4 border-y border-neutral-200 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-xs font-semibold text-neutral-900">
                            <SlidersHorizontal className="size-3.5" />
                            Filters
                        </span>
                        {[
                            ["all", "All Reviews"],
                            ["photos", "With Photos"],
                            ["verified", "Verified Buyers"],
                        ].map(([value, label]) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => {
                                    setActiveFilter(value as ActiveFilter);
                                    setVisibleCount(3);
                                }}
                                className={cn(
                                    "flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors",
                                    activeFilter === value
                                        ? "bg-neutral-900 text-white"
                                        : "border border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50"
                                )}
                            >
                                {value === "photos" && <ImageIcon className="size-3.5" />}
                                {label}
                            </button>
                        ))}
                    </div>

                    <label className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
                            Sort By
                        </span>
                        <span className="relative">
                            <select
                                value={sortBy}
                                onChange={(event) => {
                                    setSortBy(event.target.value as SortBy);
                                    setVisibleCount(3);
                                }}
                                className="h-10 appearance-none rounded-full border border-neutral-200 bg-white pl-4 pr-9 text-xs font-semibold text-neutral-900 outline-none transition-colors hover:bg-neutral-50"
                            >
                                <option value="newest">Newest First</option>
                                <option value="highest">Highest Rated</option>
                                <option value="lowest">Lowest Rated</option>
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-neutral-500" />
                        </span>
                    </label>
                </div>

                {isLoading ? (
                    <div className="grid gap-x-12 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((skeleton) => (
                            <div key={skeleton} className="animate-pulse">
                                <div className="mb-4 h-4 w-24 rounded bg-neutral-200" />
                                <div className="mb-4 h-5 w-48 rounded bg-neutral-200" />
                                <div className="mb-6 h-16 w-full rounded bg-neutral-100" />
                                <div className="h-12 w-full rounded bg-neutral-100" />
                            </div>
                        ))}
                    </div>
                ) : filteredReviews.length === 0 ? (
                    <div className="rounded-2xl border border-neutral-200 bg-[#fcfbf7] px-6 py-14 text-center">
                        <h3 className="text-lg font-semibold text-neutral-900">
                            No reviews available.
                        </h3>
                        <p className="mt-2 text-sm text-neutral-500">
                            Reviews from verified buyers will appear here after approval.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-x-12 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
                        {visibleReviews.map((review) => (
                            <article key={review.id} className="flex flex-col">
                                {review.images.length > 0 && (
                                    <div className="mb-6 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                        {review.images.map((img, idx) => (
                                            <div
                                                key={`${review.id}-${idx}`}
                                                className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100"
                                            >
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

                                <div className="mb-4 flex items-center justify-between gap-4">
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
                                        {format(new Date(review.createdAt), "MMM d, yyyy")}
                                    </span>
                                </div>

                                <h4 className="mb-2 text-base font-semibold text-neutral-900">
                                    {review.title}
                                </h4>
                                <p className="mb-6 flex-1 text-[15px] leading-relaxed text-neutral-600">
                                    {review.content}
                                </p>

                                <div className="mt-auto space-y-4 border-t border-neutral-100 pt-5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-[13px] font-semibold text-neutral-900">
                                            {review.authorName}
                                        </span>
                                        {review.verified && (
                                            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-500">
                                                <CheckCircle2 className="size-3 text-[#4a6b32]" />
                                                Verified Buyer
                                            </span>
                                        )}
                                    </div>

                                    {review.attributes.length > 0 && (
                                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-neutral-500">
                                            {review.attributes.map((attr, i) => (
                                                <span key={`${review.id}-${i}`} className="flex gap-1.5">
                                                    <span className="font-semibold text-neutral-700">
                                                        {attr.label}:
                                                    </span>
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

                {!isLoading && hasMore && (
                    <div className="mt-10 flex justify-center border-t border-neutral-200 pt-10">
                        <button
                            type="button"
                            onClick={() => setVisibleCount((count) => count + 3)}
                            className="rounded-full border border-neutral-200 px-8 py-3 text-sm font-semibold text-neutral-900 transition-colors hover:border-neutral-900 hover:bg-neutral-50"
                        >
                            View More Reviews
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
