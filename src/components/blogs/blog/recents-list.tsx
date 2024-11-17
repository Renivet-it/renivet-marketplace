"use client";

import { RecentBlogCard } from "@/components/globals/cards";
import { cn } from "@/lib/utils";
import { BlogWithAuthorAndTagCount } from "@/lib/validations";

interface PageProps extends GenericProps {
    blogs: {
        data: BlogWithAuthorAndTagCount[];
        count: number;
    };
}

export function RecentsList({ className, blogs, ...props }: PageProps) {
    return (
        <div className={cn("space-y-5", className)} {...props}>
            <h2 className="text-2xl font-semibold">Recent Blogs</h2>

            <div className="space-y-5">
                {blogs.data.map((blog, i) => (
                    <RecentBlogCard
                        blog={blog}
                        key={i}
                        href={`/blogs/${blog.slug}`}
                        title={blog.title}
                    />
                ))}
            </div>
        </div>
    );
}
