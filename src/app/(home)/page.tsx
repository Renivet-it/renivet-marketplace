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
import { banners, blogs } from "@/lib/db/schema";
import { bannerCache } from "@/lib/redis/methods";
import { desc, eq } from "drizzle-orm";
import { Suspense } from "react";

export default function Page() {
    return (
        <>
            <Suspense fallback={null}>
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
    let cachedBanners = await bannerCache.getAll();
    if (cachedBanners.length === 0) {
        const existingBanners = await db.query.banners.findMany({
            where: eq(banners.isActive, true),
            orderBy: [desc(banners.createdAt)],
        });
        if (existingBanners.length === 0) return null;

        await bannerCache.addBulk(existingBanners);
        cachedBanners = existingBanners;
    }

    return <Landing banners={cachedBanners} />;
}
