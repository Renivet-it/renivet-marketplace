"use client";

import { DEFAULT_BLOG_THUMBNAIL_URL } from "@/config/const";
import { cn } from "@/lib/utils";
import { Blog } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";

interface PageProps extends GenericProps {
    blog: Blog;
}

export function Blogs({ className, blog, ...props }: PageProps) {
    return (
        <section
            className={cn(
                "flex justify-center px-4 py-5 md:px-8 md:py-10",
                className
            )}
            {...props}
        >
            <div className="flex w-full max-w-5xl flex-col items-center gap-5 md:gap-10 xl:max-w-[100rem]">
                <h2 className="text-balance text-center text-2xl font-semibold uppercase md:text-3xl">
                    Our Blogs
                </h2>

                <div className="flex w-full flex-col bg-muted lg:flex-row">
                    <div className="flex w-full flex-col items-center justify-center gap-5 p-6 text-center md:gap-10 md:p-10">
                        <h2 className="max-w-lg text-balance text-2xl font-semibold md:text-4xl">
                            {blog.title}
                        </h2>

                        <p className="max-w-lg text-balance text-sm text-muted-foreground md:text-base">
                            {blog.description}
                        </p>

                        <Link
                            className="font-semibold uppercase underline underline-offset-2 md:text-lg"
                            href={`/blogs/${blog.slug}`}
                        >
                            Read More
                        </Link>
                    </div>

                    <div className="h-60 w-full overflow-hidden md:h-[25rem]">
                        <Image
                            src={
                                blog.thumbnailUrl ?? DEFAULT_BLOG_THUMBNAIL_URL
                            }
                            alt={blog.title}
                            width={1000}
                            height={1000}
                            className="size-full object-cover"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
