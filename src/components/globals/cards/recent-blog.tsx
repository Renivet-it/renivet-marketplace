"use client";

import { DEFAULT_BLOG_THUMBNAIL_URL } from "@/config/const";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { ComponentProps } from "react";

interface PageProps extends ComponentProps<typeof Link> {
    blog: {
        id: string;
        slug: string;
        thumbnailUrl: string | null;
        title: string;
        description: string;
    };
}

export function RecentBlogCard({ className, blog, ...props }: PageProps) {
    return (
        <Link
            className={cn("flex flex-col gap-5 md:flex-row", className)}
            {...props}
        >
            <div className="aspect-[3/2] size-full md:basis-2/5">
                <Image
                    src={blog.thumbnailUrl ?? DEFAULT_BLOG_THUMBNAIL_URL}
                    alt={blog.title}
                    width={1000}
                    height={1000}
                    className="size-full object-cover"
                />
            </div>

            <div className="md:basis-3/5">
                <h3 className="text-xl font-semibold">
                    <span className="hidden md:block">
                        {blog.title.length > 25
                            ? `${blog.title.slice(0, 25)}...`
                            : blog.title}
                    </span>

                    <span className="md:hidden">{blog.title}</span>
                </h3>
                <p className="text-sm text-muted-foreground md:max-w-xs md:text-balance">
                    {blog.description.length > 100
                        ? `${blog.description.slice(0, 100)}...`
                        : blog.description}
                </p>
            </div>
        </Link>
    );
}
