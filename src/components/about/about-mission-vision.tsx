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

            {/* Mission – Leaf */}
            <div className="pointer-events-none absolute left-4 top-8 md:left-8 md:top-24">
                <Image
                    src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNdFtqD9b4imNMJ6l9SbIRxWLcDyX3vTqk2UVG"
                    alt=""
                    width={40}
                    height={32}
                    className="opacity-80 md:h-[125px] md:w-[160px]"
                />
            </div>

            {/* ===================== */}
            {/* MISSION SECTION */}
            {/* ===================== */}
            <div className="relative flex flex-col lg:flex-row lg:items-center">
                <div className="relative flex w-full flex-1 items-center justify-center lg:min-h-[495px]">
                    <div className="flex flex-col items-start p-6 md:p-8 xl:pl-12">
                        <div className="lg:max-w-[420px]">
                            <h2 className="mb-4 font-playfair text-[22px] font-semibold uppercase tracking-[0.05em] text-[#3d3d3d] md:mb-6 md:text-4xl">
                                OUR MISSION
                            </h2>
                            <p className="font-worksans text-[15px] leading-[1.7] text-[#5c5c5c] md:text-xl">
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

                <div className="relative ml-auto mr-6 mt-6 h-[220px] w-[320px] overflow-hidden rounded-[20px] md:mx-0 md:mt-12 md:h-auto md:w-full md:rounded-l-3xl lg:mt-0 lg:aspect-[720/495] lg:h-[495px] lg:w-[720px] lg:shrink-0 lg:rounded-l-[2.5rem]">
                    <Image
                        src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNj4BjwFmPpnZoHc5f2E4rFNLugdK3ty9ObjYx"
                        alt="Our Mission"
                        fill
                        priority
                        className="object-cover"
                    />
                </div>
            </div>

            {/* ===================== */}
            {/* TRANSITION NEEDLE */}
            {/* ===================== */}
            <div className="relative my-8 flex justify-center md:block md:h-40">
                {/* Desktop Needle */}
                <div className="pointer-events-none absolute left-[-28px] top-1/2 hidden -translate-y-1/2 md:block">
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
                {/* Vision – Leaf */}
                <div className="pointer-events-none absolute right-4 top-[-20px] md:right-8 md:top-[-48px]">
                    <Image
                        src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNuMb9SOhnjfTvXWe4YdlSzoaZPyC7xGVghIDL"
                        alt=""
                        width={38}
                        height={30}
                        className="opacity-80 md:h-[120px] md:w-[150px]"
                    />
                </div>

                <div className="relative flex w-full flex-1 items-center justify-left lg:min-h-[495px]">
                    <div className="flex flex-col items-start p-6 md:items-end md:p-8 xl:pr-12">
                        <div className="lg:max-w-[420px]">
                            {/* MOBILE: Pin + Title side by side */}
                            {/* MOBILE: Pin + Title */}
                            <div className="mb-2 flex items-center gap-4 md:hidden">
                                <Image
                                    src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNXIPEGo3We049OUSYNxCLnRIka3FhcqBZlbsP"
        alt=""
        width={90}
        height={44}
        className="opacity-70"
    />
    <h2 className="font-playfair text-[22px] font-semibold uppercase tracking-[0.08em] text-[#3d3d3d]">
        OUR VISION
    </h2>
</div>


                            {/* DESKTOP: Normal heading */}
                            <h2 className="mb-4 hidden font-playfair text-[22px] font-semibold uppercase tracking-[0.05em] text-[#3d3d3d] md:mb-6 md:block md:text-4xl">
                                OUR VISION
                            </h2>

                            <p className="mb-4 ml-[73px] font-worksans text-[15px] text-[#5c5c5c] md:mb-6 md:text-xl">
                                We Envision A Market Where:
                            </p>

<ul className="ml-auto mr-[-100px] w-[260px] font-worksans text-[14px] text-[#5c5c5c] md:mr-0 md:w-full md:text-xl">




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
    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-stone-400" />
    <span className="leading-[1.7]">
        {item}
    </span>
</li>


                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

<div className="relative ml-6 mr-auto mt-6 h-[220px] w-[320px] overflow-hidden rounded-[20px] md:mx-0 md:mt-12 md:h-auto md:w-full md:rounded-r-3xl lg:mt-0 lg:aspect-[720/495] lg:h-[495px] lg:w-[720px] lg:shrink-0 lg:rounded-r-[2.5rem]">
    
    {/* Mobile decorative leaf beside image */}
    <div className="pointer-events-none absolute -right-6 top-6 md:hidden">
        <Image
            src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNuMb9SOhnjfTvXWe4YdlSzoaZPyC7xGVghIDL"
            alt=""
            width={34}
            height={34}
            className="opacity-80"
        />
    </div>

    <Image
        src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNVzRb6KBbpNcg6ZSKi0IGkAsjuLwQox3znmlt"
        alt="Our Vision"
        fill
        className="object-cover"
    />
</div>


            </div>

            {/* ===================== */}
            {/* CLOSING QUOTE */}
            {/* ===================== */}
            <div className="mt-12 px-6 text-center md:mt-32 md:px-8">
                <p className="mx-auto max-w-4xl font-playfair text-[15px] italic leading-[1.7] text-[#5c5c5c] md:text-3xl">
                    Renivet Exists To Shape A Future Where Better Choices Are
                    The Default— For Brands That Create With Intention And For
                    Consumers Who Value What They Own.
                </p>
            </div>
        </section>
    );
}
