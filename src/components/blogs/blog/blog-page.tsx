"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BlogViewer } from "@/components/ui/blog-viewer";
import { DEFAULT_AVATAR_URL, DEFAULT_BLOG_THUMBNAIL_URL } from "@/config/const";
import { cn, getReadTime } from "@/lib/utils";
import { BlogWithAuthorAndTag } from "@/lib/validations";
import { format } from "date-fns";
import Image from "next/image";

interface PageProps extends GenericProps {
    blog: BlogWithAuthorAndTag;
}

export function BlogPage({ className, blog, ...props }: PageProps) {
    return (
        <div className={cn("space-y-10", className)} {...props}>
            <h1 className="text-4xl font-bold">{blog.title}</h1>

            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-4">
                    <Avatar>
                        <AvatarImage
                            src={blog.author.avatarUrl ?? DEFAULT_AVATAR_URL}
                            alt={blog.author.firstName}
                        />
                        <AvatarFallback>
                            {blog.author.firstName[0]}
                        </AvatarFallback>
                    </Avatar>

                    <div>
                        <p className="font-semibold">
                            {blog.author.firstName} {blog.author.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {format(
                                new Date(blog.publishedAt!),
                                "MMM dd, yyyy"
                            )}
                        </p>
                    </div>
                </div>

                <p className="text-sm">{getReadTime(blog.content)} min read</p>
            </div>

            <div className="aspect-video w-full">
                <Image
                    src={blog.thumbnailUrl ?? DEFAULT_BLOG_THUMBNAIL_URL}
                    alt={blog.title}
                    width={1000}
                    height={1000}
                    className="size-full object-cover"
                />
            </div>

            <BlogViewer content={blog.content} />
        </div>
    );
}
