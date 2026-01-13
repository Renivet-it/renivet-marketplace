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
                // 👇 FULL BLEED on mobile
                "relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] h-[477px] w-screen overflow-hidden md:left-auto md:right-auto md:ml-0 md:mr-0 md:h-[90vh] md:w-full",
                className
            )}
        >
            {/* Desktop Image */}
            <Image
                src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNda9wjnb4imNMJ6l9SbIRxWLcDyX3vTqk2UVG"
                alt="About Hero"
                fill
                priority
                className="hidden object-cover md:block"
            />

            {/* Mobile Image */}
            <Image
                src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNxE4ERY1IezOinSmtdvjDw08UlbRkW2MQqNBX"
                alt="About Hero"
                fill
                priority
                className="object-cover md:hidden"
            />

            {/* Mobile Text */}
            <div className="absolute inset-0  md:hidden">
                <div className="flex h-full flex-col items-center justify-end px-4 pb-24 text-center">
                    <h1 className="font-playfair text-[20px] font-semibold leading-[1.35] text-white">
                        The World Doesn't Need More Products.
                        <br />
                        It Needs Better Choices.
                    </h1>

                    <p className="mt-3 max-w-[260px] text-[13px] leading-relaxed text-white/90">
                        A Curated Space For Conscious Brands And Thoughtful
                        Living
                    </p>
                </div>
            </div>
        </section>
    );
}
