import { readFile } from "node:fs/promises";
import { expect, test } from "bun:test";

test("public blog rendering and metadata use a published-only lookup without changing admin lookup", async () => {
    const [blogPage, blogQuery] = await Promise.all([
        readFile("src/app/(marketing)/blogs/[slug]/page.tsx", "utf8"),
        readFile("src/lib/db/queries/blog.ts", "utf8"),
    ]);

    expect(blogPage.match(/getPublishedBlog\(\{ slug \}\)/g)).toHaveLength(2);
    expect(blogQuery).toContain("async getPublishedBlog({ slug }: { slug: string })");
    expect(blogQuery).toContain(
        "and(eq(blogs.slug, slug), eq(blogs.isPublished, true))"
    );
    expect(blogQuery).toContain("async getBlog({ id, slug }");
});
