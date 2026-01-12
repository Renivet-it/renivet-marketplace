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
                "relative overflow-hidden bg-[#F9F6F1] py-24",
                className
            )}
        >
            {/* ===================== */}
            {/* DECORATIVE ELEMENTS */}
            {/* ===================== */}

            {/* Mission – Leaf (Top Left) */}
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
                <div className="relative flex w-full flex-1 items-center justify-center lg:min-h-[495px]">
                    <div className="flex flex-col items-start p-8 xl:pl-12">
                        <div className="lg:max-w-[420px]">
                            <h2 className="mb-6 font-playfair text-3xl font-semibold uppercase tracking-[0.1em] text-[#3d3d3d] md:text-4xl">
                                OUR MISSION
                            </h2>
                            <p className="font-worksans text-lg leading-relaxed text-[#5c5c5c] md:text-xl">
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

                <div className="relative mt-12 aspect-[720/495] w-full lg:mt-0 lg:h-[495px] lg:w-[720px] lg:shrink-0">
                    <Image
                        src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNj4BjwFmPpnZoHc5f2E4rFNLugdK3ty9ObjYx"
                        alt="Our Mission"
                        fill
                        priority
                        className="rounded-l-3xl object-cover lg:rounded-l-[2.5rem]"
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

            {/* ===================== */}
            {/* VISION SECTION */}
            {/* ===================== */}
            <div className="relative flex flex-col lg:flex-row-reverse lg:items-center">
                {/* Vision – Leaf near heading */}
                <div className="pointer-events-none absolute right-8 top-[-48px] hidden lg:block">
                    <Image
                        src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNuMb9SOhnjfTvXWe4YdlSzoaZPyC7xGVghIDL"
                        alt=""
                        width={150}
                        height={120}
                        className="opacity-80"
                    />
                </div>

                <div className="relative flex w-full flex-1 items-center justify-center lg:min-h-[495px]">
                    <div className="flex flex-col items-end p-8 xl:pr-12">
                        <div className="lg:max-w-[420px]">
                            <h2 className="mb-6 font-playfair text-3xl font-semibold uppercase tracking-[0.1em] text-[#3d3d3d] md:text-4xl">
                                OUR VISION
                            </h2>

                            <p className="mb-6 font-worksans text-lg text-[#5c5c5c] md:text-xl">
                                We Envision A Market Where:
                            </p>

                            <ul className="space-y-4 font-worksans text-lg text-[#5c5c5c] md:text-xl">
                                {[
                                    "Quality Is Visible, Not Buried",
                                    "Small Creators Rise Instead Of Getting Drowned Out",
                                    "Conscious Consumption Feels Intuitive, Not Inconvenient",
                                    "Trust Replaces Greenwashing",
                                    "Meaningful Products Replace Mass-Produced Sameness",
                                ].map((item) => (
                                    <li
                                        key={item}
                                        className="flex items-start gap-3"
                                    >
                                        <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-stone-400" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="relative mt-12 aspect-[720/495] w-full lg:mt-0 lg:h-[495px] lg:w-[720px] lg:shrink-0">
                    <Image
                        src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNVzRb6KBbpNcg6ZSKi0IGkAsjuLwQox3znmlt"
                        alt="Our Vision"
                        fill
                        className="rounded-r-3xl object-cover lg:rounded-r-[2.5rem]"
                    />
                </div>
            </div>

            {/* ===================== */}
            {/* CLOSING QUOTE */}
            {/* ===================== */}
            <div className="mt-32 px-8 text-center">
                <p className="mx-auto max-w-4xl font-playfair text-2xl italic leading-relaxed text-[#5c5c5c] md:text-3xl">
                    Renivet Exists To Shape A Future Where Better Choices Are
                    The Default— For Brands That Create With Intention And For
                    Consumers Who Value What They Own.
                </p>
            </div>
        </section>
    );
}
