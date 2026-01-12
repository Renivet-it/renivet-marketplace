"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

interface AboutMissionVisionProps {
    className?: string;
}

export function AboutMissionVision({ className }: AboutMissionVisionProps) {
    return (
        <section
            className={cn(
                "relative overflow-hidden bg-[#F9F6F1] py-12 md:py-24",
                className
            )}
        >
            {/* ===================== */}
            {/* DECORATIVE ELEMENTS */}
            {/* ===================== */}

            {/* Mission – Leaf (Top Left) - Hidden on mobile */}
            <div className="pointer-events-none absolute left-8 top-24 hidden lg:block">
                <Image
                    src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNdFtqD9b4imNMJ6l9SbIRxWLcDyX3vTqk2UVG"
                    alt=""
                    width={160}
                    height={125}
                    className="opacity-80"
                />
            </div>

            {/* ===================== */}
            {/* MISSION SECTION */}
            {/* ===================== */}
            <div className="relative flex flex-col lg:flex-row lg:items-center">
                {/* Text content */}
                <div className="relative flex w-full flex-1 items-center justify-center lg:min-h-[495px]">
                    <div className="flex flex-col items-center p-6 text-center md:items-start md:p-8 md:text-left xl:pl-12">
                        <div className="lg:max-w-[420px]">
                            <h2 className="mb-4 font-playfair text-xl font-semibold uppercase tracking-[0.1em] text-[#3d3d3d] sm:text-2xl md:mb-6 md:text-4xl">
                                OUR MISSION
                            </h2>
                            <p className="font-worksans text-sm leading-relaxed text-[#5c5c5c] sm:text-base md:text-xl">
                                To Declutter The Market And Build A Trusted
                                Growth Platform Where Homegrown, Artisan-Led,
                                And Sustainable Brands Can Scale Without
                                Compromising Their Values—While Making Conscious
                                Choices Simple, Credible, And Accessible For
                                Consumers.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Image */}
                <div className="relative mt-6 aspect-[4/3] w-full md:mt-12 lg:mt-0 lg:aspect-[720/495] lg:h-[495px] lg:w-[720px] lg:shrink-0">
                    <Image
                        src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNj4BjwFmPpnZoHc5f2E4rFNLugdK3ty9ObjYx"
                        alt="Our Mission"
                        fill
                        priority
                        className="object-cover lg:rounded-l-[2.5rem]"
                    />
                </div>
            </div>

            {/* ================================================= */}
            {/* TRANSITION SPACER — NEEDLE LIVES HERE */}
            {/* ================================================= */}
            <div className="relative hidden h-40 lg:block">
                <div className="pointer-events-none absolute left-[-28px] top-1/2 -translate-y-1/2">
                    <Image
                        src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNXIPEGo3We049OUSYNxCLnRIka3FhcqBZlbsP"
                        alt=""
                        width={260}
                        height={52}
                        className="opacity-70"
                    />
                </div>
            </div>

            {/* Mobile spacer */}
            <div className="h-8 md:h-12 lg:hidden" />

            {/* ===================== */}
            {/* VISION SECTION */}
            {/* ===================== */}
            <div className="relative flex flex-col lg:flex-row-reverse lg:items-center">
                {/* Vision – Leaf near heading - Hidden on mobile */}
                <div className="pointer-events-none absolute right-8 top-[-48px] hidden lg:block">
                    <Image
                        src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNuMb9SOhnjfTvXWe4YdlSzoaZPyC7xGVghIDL"
                        alt=""
                        width={150}
                        height={120}
                        className="opacity-80"
                    />
                </div>

                {/* Text content */}
                <div className="relative flex w-full flex-1 items-center justify-center lg:min-h-[495px]">
                    <div className="flex flex-col items-center p-6 text-center md:items-end md:p-8 md:text-right xl:pr-12">
                        <div className="lg:max-w-[420px]">
                            <h2 className="mb-4 font-playfair text-xl font-semibold uppercase tracking-[0.1em] text-[#3d3d3d] sm:text-2xl md:mb-6 md:text-4xl">
                                OUR VISION
                            </h2>

                            <p className="mb-4 font-worksans text-sm text-[#5c5c5c] sm:text-base md:mb-6 md:text-xl">
                                We Envision A Market Where:
                            </p>

                            <ul className="space-y-2 font-worksans text-sm text-[#5c5c5c] sm:text-base md:space-y-4 md:text-xl">
                                {[
                                    "Quality Is Visible, Not Buried",
                                    "Small Creators Rise Instead Of Getting Drowned Out",
                                    "Conscious Consumption Feels Intuitive, Not Inconvenient",
                                    "Trust Replaces Greenwashing",
                                    "Meaningful Products Replace Mass-Produced Sameness",
                                ].map((item) => (
                                    <li
                                        key={item}
                                        className="flex items-start justify-center gap-2 md:justify-end md:gap-3"
                                    >
                                        <span className="mt-2 size-1 shrink-0 rounded-full bg-stone-400 md:mt-2.5 md:size-1.5" />
                                        <span className="text-left md:text-right">
                                            {item}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Image */}
                <div className="relative mt-6 aspect-[4/3] w-full md:mt-12 lg:mt-0 lg:aspect-[720/495] lg:h-[495px] lg:w-[720px] lg:shrink-0">
                    <Image
                        src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNVzRb6KBbpNcg6ZSKi0IGkAsjuLwQox3znmlt"
                        alt="Our Vision"
                        fill
                        className="object-cover lg:rounded-r-[2.5rem]"
                    />
                </div>
            </div>

            {/* ===================== */}
            {/* CLOSING QUOTE */}
            {/* ===================== */}
            <div className="mt-12 px-6 text-center md:mt-32 md:px-8">
                <p className="mx-auto max-w-4xl font-playfair text-base italic leading-relaxed text-[#5c5c5c] sm:text-lg md:text-3xl">
                    Renivet Exists To Shape A Future Where Better Choices Are
                    The Default— For Brands That Create With Intention And For
                    Consumers Who Value What They Own.
                </p>
            </div>
        </section>
    );
}
