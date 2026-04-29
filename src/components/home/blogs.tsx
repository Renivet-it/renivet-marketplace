"use client";

import { DEFAULT_BLOG_THUMBNAIL_URL } from "@/config/const";
import { cn } from "@/lib/utils";
import { Blog } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

interface PageProps extends React.HTMLAttributes<HTMLElement> {
    blogs: Blog[];
}

export function Blogs({ className, blogs, ...props }: PageProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollAmount = clientWidth * 0.8;
            scrollRef.current.scrollTo({
                left:
                    direction === "left"
                        ? scrollLeft - scrollAmount
                        : scrollLeft + scrollAmount,
                behavior: "smooth",
            });
        }
    };

    if (!blogs || blogs.length === 0) return null;

    return (
        <section
            className={cn("w-full bg-white py-12 md:py-16", className)}
            {...props}
        >
            <div className="mx-auto w-full max-w-screen-3xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6 flex items-baseline gap-4">
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
                        Latest Stories
                    </h2>
                    <Link
                        href="/blogs"
                        className="text-[11px] font-semibold text-gray-600 hover:text-gray-900 hover:underline"
                    >
                        View All
                    </Link>
                </div>

                {/* Carousel Container */}
                <div className="group/carousel relative">
                    {/* Prev Button */}
                    <button
                        onClick={() => scroll("left")}
                        className="absolute -left-6 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-all hover:scale-105 hover:border-gray-900 group-hover/carousel:opacity-100 md:flex md:opacity-0 btn-liquid btn-liquid-secondary"
                        aria-label="Previous"
                    >
                        <ChevronLeft className="h-6 w-6 text-gray-900" />
                    </button>

                    {/* Scroll Area */}
                    <div
                        ref={scrollRef}
                        className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-8 pt-2 scroll-smooth md:mx-0 md:px-0"
                    >
                        {blogs.map((blog) => (
                            <Link
                                key={blog.id}
                                href={`/blogs/${blog.slug}`}
                                className="group relative flex h-[420px] w-[280px] shrink-0 snap-center flex-col overflow-hidden rounded-[10px] bg-[#f5f5f5] transition-all hover:-translate-y-1 hover:shadow-lg md:w-[320px]"
                            >
                                {/* Top Half Image Card */}
                                <div className="relative h-1/2 w-full overflow-hidden">
                                    <Image
                                        src={
                                            blog.thumbnailUrl ??
                                            DEFAULT_BLOG_THUMBNAIL_URL
                                        }
                                        alt={blog.title}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                </div>

                                {/* Bottom Half Content */}
                                <div className="flex h-1/2 flex-col justify-between bg-[#f5f5f5] p-6">
                                    <div>
                                        <h3 className="font-serif text-xl font-normal leading-[1.2] text-gray-900 line-clamp-3 group-hover:underline">
                                            {blog.title}
                                        </h3>
                                        <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-gray-900">
                                            Renivet Editorial
                                        </p>
                                    </div>
                                    <div>
                                        <span className="inline-block rounded-full bg-white px-4 py-1.5 text-[10px] font-bold text-gray-900 shadow-sm">
                                            5 min Read
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Next Button */}
                    <button
                        onClick={() => scroll("right")}
                        className="absolute -right-6 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-all hover:scale-105 hover:border-gray-900 group-hover/carousel:opacity-100 md:flex md:opacity-0 btn-liquid btn-liquid-secondary"
                        aria-label="Next"
                    >
                        <ChevronRight className="h-6 w-6 text-gray-900" />
                    </button>
                </div>
            </div>
        </section>
    );
}
