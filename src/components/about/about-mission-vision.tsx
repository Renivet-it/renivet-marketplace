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
            {/* Decorative Leaf - Top Left */}
            <div className="pointer-events-none absolute left-4 top-8 hidden lg:block">
                <Image
                    src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNdFtqD9b4imNMJ6l9SbIRxWLcDyX3vTqk2UVG"
                    alt=""
                    width={100}
                    height={80}
                    className="opacity-70"
                />
            </div>

            {/* Mission Section */}
            <div className="flex flex-col items-center lg:flex-row">
                {/* Text Column - Left */}
                <div className="w-full px-8 lg:w-[45%] lg:pl-16 lg:pr-12 xl:pl-24">
                    <div className="mx-auto max-w-md lg:mx-0 lg:ml-auto">
                        <h2 className="font-playfair mb-6 text-3xl font-semibold uppercase tracking-[0.1em] text-[#3d3d3d] md:text-4xl">
                            OUR MISSION
                        </h2>
                        <p className="font-worksans text-lg leading-relaxed text-[#5c5c5c] md:text-xl">
                            To Declutter The Market And Build A Trusted Growth
                            Platform Where Homegrown, Artisan-Led, And
                            Sustainable Brands Can Scale Without Compromising
                            Their Values—While Making Conscious Choices Simple,
                            Credible, And Accessible For Consumers.
                        </p>
                    </div>

                    {/* Decorative Pin - Below Text */}
                    <div className="mt-12 hidden lg:block">
                        <Image
                            src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNXIPEGo3We049OUSYNxCLnRIka3FhcqBZlbsP"
                            alt=""
                            width={150}
                            height={50}
                            className="opacity-80"
                        />
                    </div>
                </div>

                {/* Image - Right (Full Bleed) */}
                <div className="relative mt-12 aspect-[4/3] w-full lg:mt-0 lg:w-[55%]">
                    <Image
                        src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNj4BjwFmPpnZoHc5f2E4rFNLugdK3ty9ObjYx"
                        alt="Our Mission - Team working together"
                        fill
                        className="rounded-l-3xl object-cover lg:rounded-l-[2.5rem]"
                        priority
                    />
                </div>
            </div>

            {/* Vision Section */}
            <div className="mt-24 flex flex-col items-center lg:mt-32 lg:flex-row-reverse">
                {/* Text Column - Right */}
                <div className="relative w-full px-8 lg:w-[45%] lg:pl-12 lg:pr-16 xl:pr-24">
                    <div className="mx-auto max-w-md lg:mx-0 lg:mr-auto">
                        <h2 className="font-playfair mb-6 text-3xl font-semibold uppercase tracking-[0.1em] text-[#3d3d3d] md:text-4xl">
                            OUR VISION
                        </h2>
                        <p className="font-worksans mb-6 text-lg text-[#5c5c5c] md:text-xl">
                            We Envision A Market Where:
                        </p>
                        <ul className="font-worksans space-y-4 text-lg text-[#5c5c5c] md:text-xl">
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
                                    Conscious Consumption Feels Intuitive, Not
                                    Inconvenient
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-stone-400" />
                                <span>Trust Replaces Greenwashing</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-stone-400" />
                                <span>
                                    Meaningful Products Replace Mass-Produced
                                    Sameness
                                </span>
                            </li>
                        </ul>
                    </div>

                    {/* Decorative Leaf - Right of Vision Text */}
                    <div className="pointer-events-none absolute -right-4 top-0 hidden lg:block xl:-right-8">
                        <Image
                            src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNuMb9SOhnjfTvXWe4YdlSzoaZPyC7xGVghIDL"
                            alt=""
                            width={100}
                            height={100}
                            className="-rotate-90 opacity-70"
                        />
                    </div>
                </div>

                {/* Image - Left (Full Bleed) */}
                <div className="relative mt-12 aspect-[4/3] w-full lg:mt-0 lg:w-[55%]">
                    <Image
                        src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNVzRb6KBbpNcg6ZSKi0IGkAsjuLwQox3znmlt"
                        alt="Our Vision - Models walking"
                        fill
                        className="rounded-r-3xl object-cover lg:rounded-r-[2.5rem]"
                    />
                </div>
            </div>

            {/* Closing Quote */}
            <div className="mt-24 px-8 text-center lg:mt-32">
                <p className="font-playfair mx-auto max-w-4xl text-2xl italic leading-relaxed text-[#5c5c5c] md:text-3xl">
                    Renivet Exists To Shape A Future Where Better Choices Are
                    The Default— For Brands That Create With Intention And For
                    Consumers Who Value What They Own.
                </p>
            </div>
        </section>
    );
}
