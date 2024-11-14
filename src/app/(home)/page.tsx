import { IntroModal } from "@/components/globals/modals";
import {
    Arrivals,
    Blogs,
    Collection,
    Expectations,
    Landing,
    Offer,
    Popular,
    Theme,
} from "@/components/home";
import { db } from "@/lib/db";
import { blogs } from "@/lib/db/schema";
import { bannerCache } from "@/lib/redis/methods";
import { desc, eq } from "drizzle-orm";
import { Suspense } from "react";

export default function Page() {
    return (
        <>
            <Suspense
                fallback={
                    <div className="h-[calc(100vh-20vh)] w-full bg-background" />
                }
            >
                <BannersFetch />
            </Suspense>
            <Collection />
            <Offer />
            <Expectations />
            <Popular title="Best Sellers" />
            <Theme />
            <Arrivals title="New Arrivals" />
            <Suspense fallback={null}>
                <BlogsFetch />
            </Suspense>
            <IntroModal />
        </>
    );
}

async function BlogsFetch() {
    const blog = await db.query.blogs.findFirst({
        where: eq(blogs.isPublished, true),
        orderBy: [desc(blogs.publishedAt)],
    });
    if (!blog) return null;

    return <Blogs blog={blog} />;
}

async function BannersFetch() {
    const cachedBanners = await bannerCache.getAll();
    if (!cachedBanners.length) return null;

    const sorted = cachedBanners.sort(
        (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return <Landing banners={sorted} />;
}
