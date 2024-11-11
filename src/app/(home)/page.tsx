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
import { desc, eq } from "drizzle-orm";
import { Suspense } from "react";

export default function Page() {
    return (
        <>
            <Landing />
            <Collection />
            <Offer />
            <Expectations />
            <Popular title="Best Sellers" />
            <Theme />
            <Arrivals title="New Arrivals" />
            <Suspense>
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
