"use client";

import { Star, CheckCircle2, ChevronDown, SlidersHorizontal, Image as ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc/client";
import { WriteReviewModal } from "./write-review-modal";
import { format } from "date-fns";

const STATIC_REVIEWS = [
    {
        id: "1",
        authorName: "Alex M.",
        createdAt: new Date("2023-10-12").toISOString(),
        rating: 5,
        title: "Perfect fit and incredible quality",
        content: "I've been wearing this almost every day since I got it. The fabric feels incredibly premium and it breathes perfectly during active use. You can really feel the difference in the craftsmanship compared to fast fashion alternatives.",
        verified: true,
        attributes: [
            { label: "Size Purchased", value: "Medium" },
            { label: "Fit", value: "True to size" }
        ],
        images: [
            "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1"
        ]
    },
    {
        id: "2",
        authorName: "Sarah J.",
        createdAt: new Date("2023-09-28").toISOString(),
        rating: 4,
        title: "Great everyday staple",
        content: "Love the transparency behind the product. The piece itself is very well made with solid stitching. Dropped one star because the color is slightly darker in person than on my monitor, but still a beautiful piece.",
        verified: true,
        attributes: [
            { label: "Size Purchased", value: "Small" },
            { label: "Fit", value: "Slightly large" }
        ],
        images: []
    },
    {
        id: "3",
        authorName: "David R.",
        createdAt: new Date("2023-09-15").toISOString(),
        rating: 5,
        title: "Worth the investment",
        content: "You really get what you pay for here. The transparency in the supply chain and knowing exactly what went into the price makes me feel great about this purchase. The quality is immediately apparent.",
        verified: true,
        attributes: [
            { label: "Size Purchased", value: "Large" },
            { label: "Fit", value: "True to size" }
        ],
        images: [
            "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1",
            "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1"
        ]
    }
];

interface ProductReviewsProps {
    productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
    const [activeFilter, setActiveFilter] = useState<"All" | "Photos">("All");

    const { data: reviews, isLoading, error } = trpc.general.customerReviews.getReviewsByProduct.useQuery({
        productId,
    });

    const filteredReviews = useMemo(() => {
        const sourceReviews = (reviews && reviews.length > 0) ? reviews : STATIC_REVIEWS;
        if (activeFilter === "Photos") {
            return sourceReviews.filter(r => r.images && r.images.length > 0);
        }
        return sourceReviews;
    }, [reviews, activeFilter]);

    const averageRating = useMemo(() => {
        const sourceReviews = (reviews && reviews.length > 0) ? reviews : STATIC_REVIEWS;
        const total = sourceReviews.reduce((acc, r) => acc + r.rating, 0);
        return Number((total / sourceReviews.length).toFixed(1));
    }, [reviews]);

    if (error) {
        return (
            <div className="py-16 text-center text-neutral-500">
                Failed to load reviews. Please try again later.
            </div>
        );
    }

    return (
        <section className="bg-white pt-16 pb-4">
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
                                    {averageRating} out of 5
                                </p>
                                <span className="text-sm text-neutral-500">
                                    ({(reviews && reviews.length > 0) ? reviews.length : STATIC_REVIEWS.length} Reviews)
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
                    <div className="mt-8 flex justify-center border-t border-neutral-200 pt-10">
                        <button className="rounded-full border border-neutral-200 px-8 py-3 text-sm font-semibold text-neutral-900 transition-colors hover:border-neutral-900 hover:bg-neutral-50">
                            Load More Reviews
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
