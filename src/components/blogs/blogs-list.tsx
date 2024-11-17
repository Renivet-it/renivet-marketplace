"use client";

import { cn } from "@/lib/utils";
import { BlogWithAuthorAndTagCount } from "@/lib/validations";
import { parseAsInteger, useQueryState } from "nuqs";
import { useMemo } from "react";
import { BlogCard } from "../globals/cards";
import { Pagination } from "../ui/data-table-general";

interface PageProps extends GenericProps {
    blogs: {
        data: BlogWithAuthorAndTagCount[];
        count: number;
    };
}

export function BlogsList({ className, blogs, ...props }: PageProps) {
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));

    const pages = useMemo(
        () => Math.ceil(blogs.count / limit) ?? 1,
        [blogs, limit]
    );

    return (
        <div className={cn("space-y-10", className)} {...props}>
            <div className="grid w-full grid-cols-1 gap-10 md:grid-cols-2">
                {blogs.data.map((blog) => (
                    <BlogCard key={blog.id} blog={blog} />
                ))}
            </div>

            <Pagination total={pages} />
        </div>
    );
}
