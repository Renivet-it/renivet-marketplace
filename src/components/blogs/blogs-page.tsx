"use client";

import { GeneralShell } from "@/components/globals/layouts";
import { cn, convertValueToLabel } from "@/lib/utils";
import { BlogWithAuthorAndTag } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SearchInput } from "../ui/search-input";
import BlogListWithPagination from "./blogs-pagination";

interface PageProps extends GenericProps {
    blogs: BlogWithAuthorAndTag[];
}

const dummyBlogs = Array.from({ length: 50 }, (_, i) => ({
    title: `Blog Post ${i + 1}`,
    slug: `blog-post-${i + 1}`,
    description: `This is the description for blog post ${i + 1}`,
    thumbnailUrl: "https://picsum.photos/seed/picsum/1920/1080",
    publishedAt: new Date(),
    author: {
        firstName: "John",
        lastName: "Doe",
        avatarUrl: null,
    },
}));

const tags = [
    "gardening",
    "plants",
    "flowers",
    "landscaping",
    "garden design",
    "garden maintenance",
];

export function BlogsPage({ className, ...props }: PageProps) {
    const [blogs, setBlogs] = useState(dummyBlogs);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (search.length > 0) {
            const filteredBlogs = dummyBlogs.filter((blog) =>
                blog.title.toLowerCase().includes(search.toLowerCase())
            );
            setBlogs(filteredBlogs);
        } else {
            setBlogs(dummyBlogs);
        }
    }, [search]);

    return (
        <div className={cn("w-full space-y-10", className)} {...props}>
            <section className="flex w-full flex-col items-center justify-between overflow-hidden bg-muted md:max-h-[calc(40vh)] md:flex-row">
                <div className="size-full overflow-hidden">
                    <Image
                        src="https://picsum.photos/seed/picsum/1500/1000"
                        alt="Blog1"
                        width={1000}
                        height={1000}
                        className="size-full object-cover"
                    />
                </div>

                <div className="flex w-full flex-col items-center gap-5 p-6 text-center md:gap-10 md:p-10">
                    <h2 className="max-w-lg text-balance text-2xl font-semibold md:text-4xl">
                        What&apos;s in a Garden set?
                    </h2>

                    <p className="max-w-lg text-balance text-sm text-muted-foreground md:text-base">
                        Maecenas sem eros, rutrum vitae risus eget, vulputate
                        aliquam nisi. dolor sit amet consectetur adipiscing eli
                        mattis sit phasellus mollis sit aliquam sit
                    </p>
                </div>
            </section>

            <GeneralShell>
                <div className="flex flex-col gap-10 lg:flex-row">
                    <SearchInput
                        type="search"
                        placeholder="Search for blog..."
                        className="h-12 text-base"
                        classNames={{
                            wrapper: "md:hidden",
                        }}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <div className="w-full basis-2/3">
                        {blogs.length > 0 ? (
                            <BlogListWithPagination blogs={blogs} />
                        ) : (
                            <p className="text-center text-2xl font-semibold">
                                No blogs found
                            </p>
                        )}
                    </div>

                    <div className="w-full basis-1/3 space-y-10">
                        <SearchInput
                            type="search"
                            placeholder="Search for blog..."
                            className="h-12 text-base"
                            classNames={{
                                wrapper: "hidden md:flex",
                            }}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        <h2 className="text-3xl font-semibold uppercase">
                            Related Blogs
                        </h2>

                        <div className="space-y-5">
                            {dummyBlogs.slice(0, 3).map((blog, i) => (
                                <div key={i}>
                                    <Link
                                        href="#"
                                        className="flex items-center gap-5"
                                    >
                                        <div className="aspect-[3/2] size-full basis-1/4">
                                            <Image
                                                src={blog.thumbnailUrl}
                                                alt={blog.title}
                                                width={1000}
                                                height={1000}
                                                className="size-full object-cover"
                                            />
                                        </div>

                                        <div>
                                            <h3 className="text-xl font-semibold">
                                                {blog.title}
                                            </h3>
                                            <p className="text-muted-foreground">
                                                {blog.description.length > 50
                                                    ? `${blog.description.slice(
                                                          0,
                                                          50
                                                      )}...`
                                                    : blog.description}
                                            </p>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>

                        <h2 className="text-3xl font-semibold uppercase">
                            Tags
                        </h2>

                        <div className="flex flex-wrap gap-2">
                            {tags.map((tag, i) => (
                                <Link
                                    key={i}
                                    href="#"
                                    className="border border-accent p-2 px-3 text-muted-foreground transition-all ease-in-out hover:bg-accent hover:text-accent-foreground"
                                >
                                    {convertValueToLabel(tag)}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </GeneralShell>
        </div>
    );
}
