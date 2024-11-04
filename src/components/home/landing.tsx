"use client";

import { Button } from "@/components/ui/button-general";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export function Landing({ className, ...props }: GenericProps) {
    return (
        <section className={cn("", className)} {...props}>
            <div className="relative flex h-[calc(100vh-70px)] w-full items-center justify-center overflow-hidden">
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
                    <h1 className="text-balance text-3xl font-bold md:text-5xl lg:text-7xl">
                        SEASONAL BRIGHTS
                    </h1>

                    <p className="max-w-xl text-balance text-background/80 md:text-lg lg:max-w-3xl lg:text-2xl">
                        Find your golf look, designed especially for golf fans.
                        Featuring a range of high-performance patterns to choose
                        from.
                    </p>

                    <Button
                        size="lg"
                        className="mt-1 bg-background font-semibold uppercase text-foreground hover:bg-background/90 md:mt-0 md:py-7 md:text-lg"
                        asChild
                    >
                        <Link href="/soon">Discover More</Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
