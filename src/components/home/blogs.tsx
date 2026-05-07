"use client";

import { DEFAULT_BLOG_THUMBNAIL_URL } from "@/config/const";
import { cn } from "@/lib/utils";
import { Blog } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";

interface PageProps extends React.HTMLAttributes<HTMLElement> {
    blogs: Blog[];
}

export function Blogs({ className, blogs, ...props }: PageProps) {
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

                <div className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-2 pr-4 pt-2 sm:gap-5 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:pr-0">
                    {blogs.map((blog) => (
                        <Link
                            key={blog.id}
                            href={`/blogs/${blog.slug}`}
                            className="group flex h-full w-[min(84vw,360px)] shrink-0 snap-start flex-col overflow-hidden rounded-[10px] bg-[#f5f5f5] transition-all hover:-translate-y-1 hover:shadow-lg sm:w-[320px] lg:w-full lg:shrink"
                        >
                            <div className="relative aspect-[4/3] w-full overflow-hidden">
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

                            <div className="flex flex-1 flex-col justify-between bg-[#f5f5f5] p-6">
                                <div>
                                    <h3 className="font-serif text-xl font-normal leading-[1.2] text-gray-900 line-clamp-3 group-hover:underline">
                                        {blog.title}
                                    </h3>
                                    <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-gray-900">
                                        Renivet Editorial
                                    </p>
                                </div>
                                <div className="mt-6">
                                    <span className="inline-block rounded-full bg-white px-4 py-1.5 text-[10px] font-bold text-gray-900 shadow-sm">
                                        5 min Read
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
