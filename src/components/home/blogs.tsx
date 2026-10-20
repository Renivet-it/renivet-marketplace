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
            className={cn(
                "w-full bg-[#faf7f0] pb-5 pt-1 md:bg-[#FAF7F2] md:py-6",
                className
            )}
            {...props}
        >
            <div className="max-w-screen-3xl mx-auto w-full px-[18px] sm:px-6 md:px-4 lg:px-8">
                {/* Header */}
                <div className="mb-4 flex items-start justify-between gap-4 md:mb-5 md:items-baseline md:justify-start">
                    <h2 className="font-serif text-[21px] font-normal leading-[1.08] tracking-[-0.02em] text-[#3E2127] md:text-[32px] md:font-normal md:leading-tight md:tracking-[-0.02em]">
                        <span className="block md:hidden">
                            Stories from our
                        </span>
                        <span className="block md:hidden">community</span>
                        <span className="hidden md:inline">Latest Stories</span>
                    </h2>
                    <Link
                        href="/blogs"
                        className="mt-1 shrink-0 text-[11px] font-normal tracking-wide text-[#61333d] hover:underline md:mt-0 md:text-[10px] md:font-semibold md:uppercase md:tracking-[0.14em] md:text-[#61333d]"
                    >
                        <span className="md:hidden">See all&nbsp; →</span>
                        <span className="hidden md:inline">View All</span>
                    </Link>
                </div>

                <div className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-2 pr-4 pt-2 sm:gap-5 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:pr-0">
                    {blogs.map((blog) => (
                        <Link
                            key={blog.id}
                            href={`/blogs/${blog.slug}`}
                            className="group flex h-full w-[250px] shrink-0 snap-start flex-col overflow-visible rounded-none bg-transparent transition-all hover:-translate-y-1 hover:shadow-lg md:w-[min(84vw,360px)] md:overflow-hidden md:rounded-[14px] md:border md:border-[#e9d7d3] md:bg-[#FAF7F2] md:hover:shadow-[0_14px_30px_rgba(62,33,39,0.08)] lg:w-full lg:shrink"
                        >
                            <div className="relative aspect-square w-full overflow-hidden rounded-[16px] md:aspect-[1.45/1] md:rounded-none">
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

                            <div className="flex flex-1 flex-col justify-between bg-transparent pt-3 md:bg-[#FAF7F2] md:p-5 lg:p-6">
                                <div>
                                    <h3 className="line-clamp-3 font-serif text-[18px] font-normal leading-[1.35] text-[#25252a] group-hover:underline md:text-[20px] md:leading-[1.22] md:text-[#3E2127]">
                                        {blog.title}
                                    </h3>
                                    <p className="mt-4 hidden text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8f686d] md:block">
                                        Renivet Editorial
                                    </p>
                                </div>
                                <div className="mt-3 md:mt-8">
                                    <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#25252a] md:hidden">
                                        READ&nbsp; →
                                    </span>
                                    <span className="hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-[#61333d] md:inline-block">
                                        5 min read <span aria-hidden="true">&nbsp;→</span>
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
