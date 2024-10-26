"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";

export function Landing({ className, ...props }: GenericProps) {
    return (
        <section className={cn("", className)} {...props}>
            <div className="relative flex h-[calc(100vh-70px)] w-full items-center justify-center overflow-hidden sm:min-h-[60vh] md:min-h-[70vh] lg:min-h-[80vh]">
                <Image
                    src="/images/landing1.jpg"
                    alt="Landing"
                    height={2000}
                    width={2000}
                    priority
                    className="size-full object-cover"
                />

                <div className="absolute inset-0 bg-foreground opacity-30"></div>

                <div className="absolute z-10 flex flex-col items-center gap-5 p-4 text-center text-background md:gap-10">
                    <h1 className="text-balance text-3xl font-bold md:text-5xl">
                        SEASONAL BRIGHTS
                    </h1>

                    <p className="max-w-xl text-balance text-background/80 md:text-lg">
                        Find your golf look, designed especially for golf fans.
                        Featuring a range of high-performance patterns to choose
                        from.
                    </p>

                    <Button
                        size="lg"
                        className="mt-1 bg-background font-semibold uppercase text-foreground hover:bg-background/90 md:mt-0 md:py-7 md:text-lg"
                    >
                        Discover More
                    </Button>
                </div>
            </div>
        </section>
    );
}
