"use client";

import {
    EmptyPlaceholder,
    EmptyPlaceholderContent,
    EmptyPlaceholderDescription,
    EmptyPlaceholderIcon,
    EmptyPlaceholderTitle,
} from "@/components/ui/empty-placeholder-general";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { BlogWithAuthorAndTagCount, Tag } from "@/lib/validations";
import Link from "next/link";
import { parseAsInteger, useQueryState } from "nuqs";
import { RecentBlogCard } from "../globals/cards";
import { Icons } from "../icons";
import { SearchInput } from "../ui/search-input";
import { BlogsList } from "./blogs-list";

interface PageProps extends GenericProps {
    recentBlogs?: {
        data: BlogWithAuthorAndTagCount[];
        count: number;
    };
    initialData: {
        data: BlogWithAuthorAndTagCount[];
        count: number;
    };
    tags: Tag[];
}

export function BlogsPage({
    className,
    initialData,
    recentBlogs,
    tags,
    ...props
}: PageProps) {
    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
    const [tagId, setTagId] = useQueryState("tId");
    const [search, setSearch] = useQueryState("search", {
        defaultValue: "",
    });

    const {
        data: { data: blogs, count },
    } = trpc.blogs.getBlogs.useQuery(
        {
            page,
            limit,
            tagId: tagId?.length ? tagId : undefined,
            isPublished: true,
            search,
        },
        { initialData }
    );

    return (
        <div
            className={cn("flex flex-col gap-10 lg:flex-row", className)}
            {...props}
        >
            <SearchInput
                type="search"
                placeholder="Search for a blog..."
                className="h-12 text-base"
                classNames={{
                    wrapper: "md:hidden",
                }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            <div className="w-full basis-2/3">
                {!!blogs?.length ? (
                    <BlogsList
                        blogs={{
                            data: blogs,
                            count,
                        }}
                    />
                ) : (
                    <EmptyPlaceholder
                        fullWidth
                        className="border-none shadow-none"
                    >
                        <EmptyPlaceholderIcon>
                            <Icons.AlertTriangle className="size-10" />
                        </EmptyPlaceholderIcon>

                        <EmptyPlaceholderContent>
                            <EmptyPlaceholderTitle>
                                No blogs found
                            </EmptyPlaceholderTitle>
                            <EmptyPlaceholderDescription>
                                No blogs found with the specified criteria
                            </EmptyPlaceholderDescription>
                        </EmptyPlaceholderContent>
                    </EmptyPlaceholder>
                )}
            </div>

            <div className="w-full basis-1/3 space-y-5 md:space-y-10">
                <SearchInput
                    type="search"
                    placeholder="Search for a blog..."
                    className="h-12 text-base"
                    classNames={{
                        wrapper: "hidden md:flex",
                    }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <h2 className="text-xl font-semibold uppercase md:text-3xl">
                    Recent Blogs
                </h2>

                <div className="space-y-5">
                    {!!recentBlogs?.data.length ? (
                        recentBlogs.data.map((blog, i) => (
                            <RecentBlogCard
                                blog={blog}
                                key={i}
                                prefetch
                                href={`/blogs/${blog.slug}`}
                                title={blog.title}
                            />
                        ))
                    ) : (
                        <p>No recent blogs found</p>
                    )}
                </div>

                <h2 className="text-xl font-semibold uppercase md:text-3xl">
                    Tags
                </h2>

                <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                        <Link
                            key={tag.id}
                            href="#"
                            className={cn(
                                "border border-accent p-2 px-3 text-sm text-muted-foreground transition-all ease-in-out hover:bg-accent hover:text-accent-foreground md:text-base",
                                tagId === tag.id &&
                                    "bg-accent text-accent-foreground"
                            )}
                            onClick={(e) => {
                                e.preventDefault();
                                if (tagId === tag.id) return setTagId(null);
                                setTagId(tag.id);
                            }}
                        >
                            {tag.name}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
