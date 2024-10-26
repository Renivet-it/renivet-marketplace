import { db } from "@/lib/db";
import {
    BlogWithAuthorAndTag,
    blogWithAuthorAndTagSchema,
} from "@/lib/validations";
import { BlogsPage } from "./blogs-page";

export async function BlogsFetch(props: GenericProps) {
    // const blogs = await db.query.blogs.findMany({
    //     with: {
    //         author: true,
    //         blogToTags: {
    //             with: {
    //                 tag: true,
    //             },
    //         },
    //     },
    // });

    // const parsed = blogWithAuthorAndTagSchema.array().parse(blogs);
    const parsed: BlogWithAuthorAndTag[] = [];

    return <BlogsPage blogs={parsed} {...props} />;
}
