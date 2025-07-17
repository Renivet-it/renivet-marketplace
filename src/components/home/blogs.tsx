"use client";

import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel";
import { DEFAULT_BLOG_THUMBNAIL_URL } from "@/config/const";
import { cn } from "@/lib/utils";
import { Blog } from "@/lib/validations";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";

const QUOTES = [
    "Knowledge sharing is power multiplied",
    "Learn, Share, Grow Together",
    "Community drives innovation",
    "Your success story starts here",
];

interface PageProps extends GenericProps {
    blogs: Blog[];
}

export function Blogs({ className, blogs, ...props }: PageProps) {
    return (
        <section
            className={cn(
                "bg-[#F4F0EC] flex justify-center px-4 py-5 md:px-8 md:py-10",
                className
            )}
            {...props}
        >
            <div className="flex w-full max-w-5xl flex-col items-center gap-5 md:gap-10 xl:max-w-[100rem]">
                <h2 className="text-balance text-center text-2xl font-semibold uppercase md:text-3xl">
                    Join Our Community
                </h2>

                <div className="flex w-full flex-col items-center gap-8 p-6">
                    <div className="relative w-full">
                        <Carousel
                            orientation="vertical"
                            opts={{
                                align: "start",
                                loop: true,
                            }}
                            plugins={[
                                Autoplay({
                                    delay: 5000,
                                }),
                            ]}
                        >
                            <CarouselContent className="-mt-1 h-[100px]">
                                {QUOTES.map((quote, index) => (
                                    <CarouselItem
                                        key={index}
                                        className="pt-1 md:basis-full"
                                    >
                                        <div className="flex h-full items-center justify-center p-6">
                                            <p className="text-balance text-center text-xl font-medium">
                                                &ldquo;{quote}&rdquo;
                                            </p>
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                        </Carousel>
                    </div>

                    {/* <div className="grid w-full grid-cols-2 gap-4 lg:grid-cols-6">
                        {blogs.slice(0, 6).map((blog) => (
                            <Link
                                key={blog.id}
                                href={`/blogs/${blog.slug}`}
                                className="group aspect-square overflow-hidden rounded-md"
                            >
                                <Image
                                    src={
                                        blog.thumbnailUrl ??
                                        DEFAULT_BLOG_THUMBNAIL_URL
                                    }
                                    alt={blog.title}
                                    width={400}
                                    height={225}
                                    className="size-full object-cover transition-transform duration-300 group-hover:scale-110"
                                />
                            </Link>
                        ))}
                    </div> */}
                    {/* <div className="mx-auto flex max-w-[1500px] flex-wrap justify-center gap-6 p-4">
                    {blogs.slice(0, 6).map((blog) => (
                        <Link
                        key={blog.id}
                        href={`/blogs/${blog.slug}`}
                        className="group aspect-square w-[200px] overflow-hidden rounded-md"
                        >
                        <Image
                            src={blog.thumbnailUrl ?? DEFAULT_BLOG_THUMBNAIL_URL}
                            alt={blog.title}
                            width={200}
                            height={200}
                            className="size-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        </Link>
                    ))}
                    </div> */}
                        {blogs.slice(0, 6).length === 6 ? (
                        <div className="grid w-full grid-cols-2 gap-4 lg:grid-cols-6">
                            {blogs.slice(0, 6).map((blog) => (
                            <Link
                                key={blog.id}
                                href={`/blogs/${blog.slug}`}
                                className="group aspect-square overflow-hidden rounded-md"
                            >
                                <Image
                                src={blog.thumbnailUrl ?? DEFAULT_BLOG_THUMBNAIL_URL}
                                alt={blog.title}
                                width={400}
                                height={225}
                                className="size-full object-cover transition-transform duration-300 group-hover:scale-110"
                                />
                            </Link>
                            ))}
                        </div>
                        ) : (
                        <div className="mx-auto flex flex-wrap justify-center gap-6 p-4">
                            {blogs.slice(0, 6).map((blog) => (
                            <Link
                                key={blog.id}
                                href={`/blogs/${blog.slug}`}
                                className="group aspect-square w-[240px] overflow-hidden rounded-md"
                            >
                                <Image
                                src={blog.thumbnailUrl ?? DEFAULT_BLOG_THUMBNAIL_URL}
                                alt={blog.title}
                                width={400}
                                height={225}
                                className="size-full object-cover transition-transform duration-300 group-hover:scale-110"
                                />
                            </Link>
                            ))}
                        </div>
                        )}
                </div>
            </div>
        </section>
    );
}
