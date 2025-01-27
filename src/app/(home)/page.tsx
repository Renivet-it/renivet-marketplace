import {
    Arrivals,
    Blogs,
    Expectations,
    Landing,
    MarketingStrip,
    Offer,
    Popular,
    Theme,
} from "@/components/home";
import {
    bannerCache,
    blogCache,
    marketingStripCache,
} from "@/lib/redis/methods";
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
            <Suspense>
                <MarketingStripFetch />
            </Suspense>
            <Offer />
            <Expectations />
            <Popular title="Best Sellers" />
            <Theme />
            <Arrivals title="New Arrivals" />
            <Suspense>
                <BlogsFetch />
            </Suspense>
        </>
    );
}

async function BlogsFetch() {
    const blog = await blogCache.get();
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

async function MarketingStripFetch() {
    const cachedMarktingStrip = await marketingStripCache.getAll();
    if (!cachedMarktingStrip.length) return null;

    const sorted = cachedMarktingStrip.sort(
        (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return <MarketingStrip marketingStrip={sorted} />;
}
