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
                "relative overflow-hidden bg-[#F9F6F1] px-4 py-20 pb-32",
                className
            )}
        >
            {/* Decorative Elements */}
            <div className="pointer-events-none absolute -left-10 top-10 hidden lg:block">
                <Image
                    src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNdFtqD9b4imNMJ6l9SbIRxWLcDyX3vTqk2UVG" // Using pin placeholder for now, user can update
                    alt="Decorative Leaves"
                    width={120}
                    height={120}
                    className="rotate-45 opacity-60"
                />
            </div>
            <div className="pointer-events-none absolute left-10 top-[45%] hidden lg:block">
                <Image
                    src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNXIPEGo3We049OUSYNxCLnRIka3FhcqBZlbsP" // Pin
                    alt="Decorative Needle"
                    width={150}
                    height={150}
                    className="-rotate-12 opacity-80"
                />
            </div>
            <div className="pointer-events-none absolute -right-0 top-[55%] hidden lg:block">
                <Image
                    src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNuMb9SOhnjfTvXWe4YdlSzoaZPyC7xGVghIDL" // Using pin placeholder for now
                    alt="Decorative Plant"
                    width={140}
                    height={140}
                    className="-rotate-12 opacity-60"
                />
            </div>

            <div className="container mx-auto max-w-7xl space-y-32">
                {/* Mission Section */}
                <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-24">
                    <div className="w-full space-y-8 lg:w-1/2">
                        <h2 className="font-playfair text-3xl font-bold uppercase text-[#3d3d3d] md:text-4xl">
                            OUR MISSION
                        </h2>
                        <p className="font-worksans text-[18px] leading-relaxed text-[#5c5c5c] md:text-[20px]">
                            To Declutter The Market And Build A Trusted Growth
                            Platform Where Homegrown, Artisan-Led, And
                            Sustainable Brands Can Scale Without Compromising
                            Their Values—While Making Conscious Choices Simple,
                            Credible, And Accessible For Consumers.
                        </p>
                    </div>
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2rem] lg:w-1/2">
                        <Image
                            src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNj4BjwFmPpnZoHc5f2E4rFNLugdK3ty9ObjYx"
                            alt="Our Mission - Team working together"
                            fill
                            className="object-cover"
                        />
                    </div>
                </div>

                {/* Vision Section */}
                <div className="flex flex-col items-center gap-12 lg:flex-row-reverse lg:gap-24">
                    <div className="w-full space-y-8 lg:w-1/2">
                        <h2 className="font-playfair text-3xl font-bold uppercase text-[#3d3d3d] md:text-4xl">
                            OUR VISION
                        </h2>
                        <div className="space-y-6">
                            <p className="font-worksans text-[18px] text-[#5c5c5c] md:text-[20px]">
                                We Envision A Market Where:
                            </p>
                            <ul className="font-worksans space-y-4 text-[18px] text-[#5c5c5c] md:text-[20px]">
                                <li className="flex items-start gap-3">
                                    <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-stone-400" />
                                    <span>Quality Is Visible, Not Buried</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-stone-400" />
                                    <span>
                                        Small Creators Rise Instead Of Getting
                                        Drowned Out
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-stone-400" />
                                    <span>
                                        Conscious Consumption Feels Intuitive,
                                        Not Inconvenient
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-stone-400" />
                                    <span>Trust Replaces Greenwashing</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-stone-400" />
                                    <span>
                                        Meaningful Products Replace
                                        Mass-Produced Sameness
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2rem] lg:w-1/2">
                        <Image
                            src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNVzRb6KBbpNcg6ZSKi0IGkAsjuLwQox3znmlt"
                            alt="Our Vision - Models walking"
                            fill
                            className="object-cover"
                        />
                    </div>
                </div>
            </div>

            <div className="mt-32 px-4 text-center">
                <p className="font-playfair mx-auto max-w-4xl text-2xl italic leading-relaxed text-[#5c5c5c] md:text-3xl">
                    Renivet Exists To Shape A Future Where Better Choices Are
                    The Default— For Brands That Create With Intention And For
                    Consumers Who Value What They Own.
                </p>
            </div>
        </section>
    );
}
