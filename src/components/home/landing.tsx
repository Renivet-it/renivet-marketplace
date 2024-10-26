"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

export function Landing({ className, ...props }: GenericProps) {
    return (
        <section className={cn("", className)} {...props}>
            <div className="relative flex min-h-[10vh] w-full items-center justify-center overflow-hidden sm:min-h-[60vh] md:min-h-[70vh] lg:min-h-[80vh]">
                {/* Background Image */}
                <Image
                    src="/images/landing1.jpg" // Ensure this image path is correct
                    alt="Landing"
                    height={1000}
                    width={1000}
                    priority
                    className="h-full w-full object-cover" // Full width and height to cover the screen
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-black opacity-30"></div>

                {/* Centered Text */}
                <div className="absolute z-10 px-4 text-center text-white md:px-6 lg:px-10">
                    <h1 className="mb-4 text-2xl font-bold sm:text-3xl md:text-5xl lg:text-6xl">
                        SEASONAL BRIGHTS
                    </h1>
                    <p className="mb-8 text-sm sm:mb-10 sm:text-base md:text-lg lg:text-xl">
                        Find your golf look, designed especially for golf fans.
                        Featuring a range of high-performance patterns to choose
                        from.
                    </p>
                    <button className="bg-white bg-opacity-20 px-4 py-2 font-semibold text-black sm:px-6 sm:py-3 md:text-lg">
                        DISCOVER MORE
                    </button>
                </div>
            </div>
        </section>
    );
}
