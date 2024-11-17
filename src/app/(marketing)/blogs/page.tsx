import { BlogsPage } from "@/components/blogs";
import { Spinner } from "@/components/ui/spinner";
import { db } from "@/lib/db";
import { blogQueries } from "@/lib/db/queries";
import { blogs } from "@/lib/db/schema";
import { tagCache } from "@/lib/redis/methods";
import { desc, eq } from "drizzle-orm";
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
        <Suspense
            fallback={
                <section className="flex flex-1 items-center justify-center p-20">
                    <Spinner />
                </section>
            }
        >
            <BlogsFetch searchParams={searchParams} />
        </Suspense>
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

    const [bannerBlog, initialBlogs, recentBlogs, tags] = await Promise.all([
        db.query.blogs.findFirst({
            where: eq(blogs.isPublished, true),
            orderBy: [desc(blogs.publishedAt)],
        }),
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
        }),
        tagCache.getAll(),
    ]);

    return (
        <BlogsPage
            bannerBlog={bannerBlog}
            initialData={initialBlogs}
            recentBlogs={recentBlogs}
            tags={tags}
        />
    );
}
