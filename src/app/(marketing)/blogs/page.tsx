import { BlogsPage } from "@/components/blogs";
import { Spinner } from "@/components/ui/spinner";
import { db } from "@/lib/db";
import { blogs } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default function Page() {
    return (
        <Suspense
            fallback={
                <section className="flex flex-1 items-center justify-center p-20">
                    <Spinner />
                </section>
            }
        >
            <BlogsFetch />
        </Suspense>
    );
}

async function BlogsFetch() {
    const { userId } = await auth();
    if (!userId) redirect("/auth/signin");

    const [bannerBlog, tagsData] = await Promise.all([
        db.query.blogs.findFirst({
            where: eq(blogs.isPublished, true),
            orderBy: [desc(blogs.publishedAt)],
        }),
        db.query.tags.findMany(),
    ]);

    return <BlogsPage bannerBlog={bannerBlog} tags={tagsData} />;
}
