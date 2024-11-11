import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { DEFAULT_AVATAR_URL, DEFAULT_BLOG_THUMBNAIL_URL } from "@/config/const";
import { cn } from "@/lib/utils";
import { BlogWithAuthorAndTag } from "@/lib/validations";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";

interface PageProps extends GenericProps {
    blog: BlogWithAuthorAndTag & {
        blogCount: number;
    };
}

export function BlogCard({ className, blog, ...props }: PageProps) {
    return (
        <div className={cn("", className)} {...props}>
            <Link href={`/blogs/${blog.slug}`} className="flex flex-col gap-5">
                <div className="aspect-video size-full">
                    <Image
                        src={blog.thumbnailUrl ?? DEFAULT_BLOG_THUMBNAIL_URL}
                        alt={blog.title}
                        width={1000}
                        height={1000}
                        className="size-full object-cover"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-5">
                        <div className="flex items-center gap-2">
                            <Avatar className="size-6">
                                <AvatarImage
                                    src={
                                        blog.author.avatarUrl ??
                                        DEFAULT_AVATAR_URL
                                    }
                                    alt={blog.author.firstName}
                                />
                                <AvatarFallback>
                                    {blog.author.firstName[0]}
                                </AvatarFallback>
                            </Avatar>

                            <p className="text-sm font-semibold">
                                {blog.author.firstName} {blog.author.lastName}
                            </p>
                        </div>

                        <Separator className="h-[2px] max-w-16 bg-foreground/20" />

                        <p className="text-sm font-semibold">
                            {format(
                                new Date(blog.publishedAt!),
                                "MMM dd, yyyy"
                            )}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold">{blog.title}</h3>
                        <p className="text-sm text-muted-foreground">
                            {blog.description.length > 100
                                ? `${blog.description.slice(0, 100)}...`
                                : blog.description}
                        </p>
                    </div>
                </div>
            </Link>
        </div>
    );
}
