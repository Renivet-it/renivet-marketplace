import { BlogsPage } from "@/components/blogs";
import { GeneralShell } from "@/components/globals/layouts";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_BLOG_THUMBNAIL_URL } from "@/config/const";
import { blogQueries } from "@/lib/db/queries";
import { blogCache, tagCache } from "@/lib/redis/methods";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Suspense } from "react";

interface PageProps {
    searchParams: Promise<{
        page?: string;
        limit?: string;
        search?: string;
        tId?: string;
    }>;
}

export default function Page({ searchParams }: PageProps) {
    return (
        <>
            <Suspense fallback={<Skeleton className="size-full h-[40vh]" />}>
                <BannerBlogFetch />
            </Suspense>

            <GeneralShell>
                <Suspense fallback={<BlogPageSkeleton />}>
                    <BlogsFetch searchParams={searchParams} />
                </Suspense>
            </GeneralShell>
        </>
    );
}

async function BannerBlogFetch() {
    const data = await blogCache.get();
    if (!data) return null;

    return (
        <section className="flex w-full flex-col items-center justify-between overflow-hidden bg-muted md:max-h-[calc(40vh)] md:flex-row">
            <div className="size-full overflow-hidden">
                <Image
                    src={data.thumbnailUrl ?? DEFAULT_BLOG_THUMBNAIL_URL}
                    alt={data.title}
                    width={1000}
                    height={1000}
                    className="size-full object-cover"
                />
            </div>

            <div className="flex w-full flex-col items-center gap-5 p-6 text-center md:gap-10 md:p-10">
                <h2 className="max-w-lg text-balance text-2xl font-semibold md:text-4xl">
                    {data.title}
                </h2>

                <p className="max-w-lg text-balance text-sm text-muted-foreground md:text-base">
                    {data.description}
                </p>
            </div>
        </section>
    );
}

async function BlogsFetch({ searchParams }: PageProps) {
    const {
        page: pageRaw,
        limit: limitRaw,
        search: searchRaw,
        tId: tagIdRaw,
    } = await searchParams;

    const limit =
        limitRaw && !isNaN(parseInt(limitRaw)) ? parseInt(limitRaw) : 10;
    const page = pageRaw && !isNaN(parseInt(pageRaw)) ? parseInt(pageRaw) : 1;
    const search = searchRaw?.length ? searchRaw : undefined;
    const tagId = tagIdRaw?.length ? tagIdRaw : undefined;

    const [initialBlogs, recentBlogs, tags] = await Promise.all([
        tagId
            ? blogQueries.getBlogsByTag({
                  tagId,
                  limit,
                  page,
                  search,
                  isPublished: true,
              })
            : blogQueries.getBlogs({
                  limit,
                  page,
                  search,
                  isPublished: true,
              }),
        blogQueries.getBlogs({
            limit: 3,
            page: 1,
            isPublished: true,
        }),
        tagCache.getAll(),
    ]);

    return (
        <BlogsPage
            initialData={initialBlogs}
            recentBlogs={recentBlogs}
            tags={tags}
        />
    );
}

function BlogPageSkeleton() {
    return (
        <div className="flex flex-col gap-10 lg:flex-row">
            <Skeleton className="h-12 w-full md:hidden" />

            <div className="w-full basis-2/3">
                <BlogListSkeleton />
            </div>

            <div className="w-full basis-1/3 space-y-5 md:space-y-10">
                <Skeleton className="hidden h-12 w-full md:flex" />

                <h2 className="text-xl font-semibold uppercase md:text-3xl">
                    Recent Blogs
                </h2>

                <div className="space-y-5">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <RecentBlogsSkeleton key={i} />
                    ))}
                </div>

                <h2 className="text-xl font-semibold uppercase md:text-3xl">
                    Tags
                </h2>

                <TagSkeleton />
            </div>
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

function TagSkeleton() {
    return (
        <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={cn("h-11 w-32", i % 2 === 0 && "w-36")}
                />
            ))}
        </div>
    );
}
