"use client";

import { Star, CheckCircle2, ChevronDown, SlidersHorizontal, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";

const STATIC_REVIEWS = [
    {
        id: "1",
        author: "Alex M.",
        date: "October 12, 2023",
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
        author: "Sarah J.",
        date: "September 28, 2023",
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
        author: "David R.",
        date: "September 15, 2023",
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

export function ProductReviews() {
    const [activeFilter, setActiveFilter] = useState("All");

    return (
        <section className="bg-white py-16">
            <div className="mx-auto w-full max-w-[1440px] px-4 md:px-8">
                {/* ── Header & Main Actions ── */}
                <div className="mb-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
                    <div>
                        <h2 className="font-sans text-[2rem] font-semibold leading-tight text-neutral-900 md:text-[2.5rem]">
                            Customer Reviews
                        </h2>
                        <div className="mt-4 flex items-center gap-4">
                            <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={cn(
                                            "size-5",
                                            star <= 4 ? "fill-neutral-900 text-neutral-900" : "fill-transparent text-neutral-300"
                                        )}
                                    />
                                ))}
                            </div>
                            <p className="text-sm font-medium text-neutral-900">
                                4.8 out of 5
                            </p>
                            <span className="text-sm text-neutral-500">
                                (24 Reviews)
                            </span>
                        </div>
                    </div>
                    <button className="rounded-full bg-neutral-900 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-neutral-800">
                        Write a Review
                    </button>
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
                            Top Reviews
                            <ChevronDown className="size-3.5" />
                        </button>
                    </div>
                </div>

                {/* ── Reviews Grid ── */}
                <div className="grid gap-x-12 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
                    {STATIC_REVIEWS.filter(r => activeFilter === "All" || (activeFilter === "Photos" && r.images.length > 0)).map((review) => (
                        <article key={review.id} className="flex flex-col">
                            {/* Images (If any) */}
                            {review.images.length > 0 && (
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
                                    {review.date}
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
                                        {review.author}
                                    </span>
                                    {review.verified && (
                                        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-500">
                                            <CheckCircle2 className="size-3 text-neutral-400" />
                                            Verified Buyer
                                        </span>
                                    )}
                                </div>

                                {review.attributes.length > 0 && (
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

                {/* ── Pagination / Load More ── */}
                <div className="mt-16 flex justify-center border-t border-neutral-200 pt-10">
                    <button className="rounded-full border border-neutral-200 px-8 py-3 text-sm font-semibold text-neutral-900 transition-colors hover:border-neutral-900 hover:bg-neutral-50">
                        Load More Reviews
                    </button>
                </div>
            </div>
        </section>
    );
}
