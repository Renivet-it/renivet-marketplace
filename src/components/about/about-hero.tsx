"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

interface AboutHeroProps {
    className?: string;
}

export function AboutHero({ className }: AboutHeroProps) {
    return (
        <section
            className={cn(
                "relative h-[85vh] min-h-[500px] w-full overflow-hidden md:h-[90vh]",
                className
            )}
        >
            {/* Desktop Hero Image */}
            <Image
                src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNda9wjnb4imNMJ6l9SbIRxWLcDyX3vTqk2UVG"
                alt="About Hero"
                fill
                priority
                className="hidden object-cover md:block"
            />

            {/* Mobile Hero Image */}
            <Image
                src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNxE4ERY1IezOinSmtdvjDw08UlbRkW2MQqNBX"
                alt="About Hero"
                fill
                priority
                className="object-cover md:hidden"
            />

            {/* Mobile Text Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 px-6 text-center md:hidden">
                <h1 className="font-playfair text-2xl font-semibold leading-tight tracking-wide text-white sm:text-3xl">
                    The World Doesn't Need More Products.
                    <br />
                    It Needs Better Choices.
                </h1>
            </div>
        </section>
    );
}
