"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

interface AboutMissionVisionProps {
    className?: string;
}

export function AboutMissionVision({ className }: AboutMissionVisionProps) {
    return (
        <section className={cn("bg-[#F9F6F1] px-4 pb-20 pt-10", className)}>
            <div className="container mx-auto space-y-32">
                {/* Mission Section */}
                <div className="flex flex-col items-center gap-8 md:flex-row md:gap-16 lg:gap-24">
                    <div className="w-full space-y-6 md:w-1/2">
                        <h2 className="font-playfair text-3xl font-bold uppercase text-stone-800 md:text-4xl">
                            OUR MISSION
                        </h2>
                        <p className="font-playfair text-lg leading-relaxed text-stone-600 md:text-xl">
                            To Declutter The Market And Build A Trusted Growth
                            Platform Where Homegrown, Artisan-Led, And
                            Sustainable Brands Can Scale Without Compromising
                            Their Values — While Making Conscious Choices
                            Simple, Credible, And Accessible For Consumers.
                        </p>
                    </div>
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm md:w-1/2">
                        <Image
                            src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNj4BjwFmPpnZoHc5f2E4rFNLugdK3ty9ObjYx"
                            alt="Mission"
                            fill
                            className="object-cover"
                        />
                    </div>
                </div>

                {/* Vision Section */}
                <div className="flex flex-col items-center gap-8 md:flex-row-reverse md:gap-16 lg:gap-24">
                    <div className="w-full space-y-6 md:w-1/2">
                        <h2 className="font-playfair text-3xl font-bold uppercase text-stone-800 md:text-4xl">
                            OUR VISION
                        </h2>
                        <div className="space-y-4">
                            <p className="font-playfair text-xl italic text-stone-700">
                                We Envision A Market Where:
                            </p>
                            <ul className="font-playfair space-y-4 text-lg text-stone-600">
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
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm md:w-1/2">
                        <Image
                            src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNVzRb6KBbpNcg6ZSKi0IGkAsjuLwQox3znmlt"
                            alt="Vision"
                            fill
                            className="object-cover"
                        />
                    </div>
                </div>
            </div>

            <div className="mt-32 text-center">
                <p className="font-playfair text-xl italic text-stone-500">
                    For Brands That Create With Intention And For Consumers Who
                    Value What They Own.
                </p>
            </div>
        </section>
    );
}
