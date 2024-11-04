"use client";

import { cn } from "@/lib/utils";
import { BlogWithAuthorAndTag } from "@/lib/validations";
import { parseAsInteger, useQueryState } from "nuqs";
import { useMemo } from "react";
import { BlogCard } from "../globals/cards";
import { Pagination } from "../ui/data-table-general";

interface PageProps extends GenericProps {
    blogs: (BlogWithAuthorAndTag & {
        blogCount: number;
    })[];
}

export function BlogsList({ className, blogs, ...props }: PageProps) {
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));

    const pages = useMemo(
        () => Math.ceil(blogs[0].blogCount / limit) ?? 1,
        [blogs, limit]
    );

    return (
        <div className={cn("space-y-10", className)} {...props}>
            <div className="grid w-full grid-cols-1 gap-10 md:grid-cols-2">
                {blogs.map((blog) => (
                    <BlogCard key={blog.id} blog={blog} />
                ))}
            </div>

            <Pagination total={pages} />
        </div>
    );
}
