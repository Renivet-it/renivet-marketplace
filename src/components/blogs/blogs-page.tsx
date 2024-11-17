"use client";

import { GeneralShell } from "@/components/globals/layouts";
import {
    EmptyPlaceholder,
    EmptyPlaceholderContent,
    EmptyPlaceholderDescription,
    EmptyPlaceholderIcon,
    EmptyPlaceholderTitle,
} from "@/components/ui/empty-placeholder-general";
import { DEFAULT_BLOG_THUMBNAIL_URL } from "@/config/const";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { Blog, BlogWithAuthorAndTagCount, Tag } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";
import { parseAsInteger, useQueryState } from "nuqs";
import { RecentBlogCard } from "../globals/cards";
import { Icons } from "../icons";
import { SearchInput } from "../ui/search-input";
import { Separator } from "../ui/separator";
import { Skeleton } from "../ui/skeleton";
import { BlogsList } from "./blogs-list";

interface PageProps extends GenericProps {
    bannerBlog?: Blog;
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
    bannerBlog,
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
        isPending,
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
        <div className={cn("w-full space-y-10", className)} {...props}>
            {bannerBlog && (
                <section className="flex w-full flex-col items-center justify-between overflow-hidden bg-muted md:max-h-[calc(40vh)] md:flex-row">
                    <div className="size-full overflow-hidden">
                        <Image
                            src={
                                bannerBlog.thumbnailUrl ??
                                DEFAULT_BLOG_THUMBNAIL_URL
                            }
                            alt={bannerBlog.title}
                            width={1000}
                            height={1000}
                            className="size-full object-cover"
                        />
                    </div>

                    <div className="flex w-full flex-col items-center gap-5 p-6 text-center md:gap-10 md:p-10">
                        <h2 className="max-w-lg text-balance text-2xl font-semibold md:text-4xl">
                            {bannerBlog.title}
                        </h2>

                        <p className="max-w-lg text-balance text-sm text-muted-foreground md:text-base">
                            {bannerBlog.description}
                        </p>
                    </div>
                </section>
            )}

            <GeneralShell>
                <div className="flex flex-col gap-10 lg:flex-row">
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
                        {isPending ? (
                            <BlogListSkeleton />
                        ) : !!blogs?.length ? (
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
                                        No blogs found with the specified
                                        criteria
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
                            {isPending ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <RecentBlogsSkeleton key={i} />
                                ))
                            ) : !!recentBlogs?.data.length ? (
                                recentBlogs.data.map((blog, i) => (
                                    <RecentBlogCard
                                        blog={blog}
                                        key={i}
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
                                        if (tagId === tag.id)
                                            return setTagId(null);
                                        setTagId(tag.id);
                                    }}
                                >
                                    {tag.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </GeneralShell>
        </div>
    );
}

function BlogListSkeleton() {
    return (
        <div className="space-y-10">
            <div className="grid w-full grid-cols-1 gap-10 md:grid-cols-2">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div className="flex flex-col gap-5" key={i}>
                        <Skeleton className="aspect-video size-full" />

                        <div className="space-y-2">
                            <div className="flex items-center gap-5">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="size-6 rounded-full" />

                                    <Skeleton className="h-6 w-20" />
                                </div>

                                <Separator className="h-[2px] max-w-16 bg-foreground/20" />

                                <Skeleton className="h-6 w-20" />
                            </div>

                            <div className="space-y-2">
                                <Skeleton className="h-6 w-full" />
                                {Array.from({ length: 2 }).map((_, i) => (
                                    <Skeleton
                                        key={i}
                                        className={cn(
                                            "h-4 w-full",
                                            i === 1 && "w-3/4"
                                        )}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex w-full items-center justify-center gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton
                        key={i}
                        className={cn("size-10", {
                            "w-20": i === 0 || i === 3,
                            "hidden md:inline-block": i === 1 || i === 2,
                        })}
                    />
                ))}
            </div>
        </div>
    );
}

function RecentBlogsSkeleton() {
    return (
        <div className="flex gap-5">
            <Skeleton className="aspect-[3/2] size-full basis-2/5" />

            <div className="basis-3/5 space-y-2">
                <Skeleton className="h-6 w-full" />
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton
                        key={i}
                        className={cn("h-4 w-full", i === 2 && "w-3/4")}
                    />
                ))}
            </div>
        </div>
    );
}
