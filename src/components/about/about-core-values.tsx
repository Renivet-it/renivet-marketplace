"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

interface AboutCoreValuesProps {
    className?: string;
}

export function AboutCoreValues({ className }: AboutCoreValuesProps) {
    return (
        <section
            className={cn(
                "relative overflow-hidden bg-[#F9F6F1] px-4 py-24 md:py-32",
                className
            )}
        >
            {/* Background Glow */}
            <div className="pointer-events-none absolute inset-0">
                <Image
                    src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNZ7keRPI6Gw03SBYgknrdpcjuJ8IvhPb5W9zy"
                    alt="Background Glow"
                    fill
                    className="object-cover opacity-60"
                    priority
                />
            </div>

            {/* Left Illustration */}
            <div className="pointer-events-none absolute left-0 top-[12%] hidden md:block">
                <Image
                    src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNvD0uVndPZsh5fuDbkAelMyqICmp3NU7X4nHY"
                    alt="Decorative Pin"
                    width={82}
                    height={112}
                    className="rotate-[-10deg] opacity-90"
                />
            </div>

            {/* Right Illustration */}
            <div className="pointer-events-none absolute bottom-[12%] right-0 hidden md:block">
                <Image
                    src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNV4NdgTmBbpNcg6ZSKi0IGkAsjuLwQox3znml"
                    alt="Decorative Yarn"
                    width={222}
                    height={154}
                    className="rotate-[-15deg] opacity-90"
                />
            </div>

            {/* Content */}
            <div className="container relative mx-auto max-w-7xl space-y-16 text-center md:space-y-24">
                {/* WHAT RENIVET IS */}
                <div className="mx-auto max-w-5xl">
                    <h2 className="font-worksans mb-6 text-2xl font-bold uppercase tracking-[0.15em] text-[#3d3d3d] md:text-3xl">
                        WHAT RENIVET IS
                    </h2>

                    <p className="font-worksans text-16 font-normal leading-relaxed text-[#5c5c5c] md:text-[18px] md:leading-[1.7]">
                        <span className="block">
                            Renivet Is Not Just Another Marketplace.
                        </span>
                        <span className="block">
                            It Is A Curated Discovery Platform Built To
                            Spotlight Homegrown, Artisan-Led, And Thoughtfully
                            Made Brands
                        </span>
                        <span className="block">
                            That Deserve Visibility And Growth.
                        </span>
                    </p>
                </div>

                {/* HOW WE OPERATE */}
                <div className="mx-auto max-w-6xl">
                    <h2 className="font-worksans mb-6 text-2xl font-bold uppercase tracking-[0.15em] text-[#3d3d3d] md:text-3xl">
                        HOW WE OPERATE
                    </h2>

                    <p className="font-worksans text-16 font-normal leading-relaxed text-[#5c5c5c] md:text-[18px] md:leading-[1.7]">
                        <span className="block">
                            Every Product On Renivet Is Intentionally
                            Chosen—Based On Quality, Craftsmanship, Values, And
                            The
                        </span>
                        <span className="block">
                            Story Behind It. We Don’t Chase Trends Or Quantity.
                            We Focus On Credibility, Clarity, And Conscious
                        </span>
                        <span className="block">Creation.</span>
                    </p>
                </div>

                {/* VALUE CREATED */}
                <div className="mx-auto max-w-6xl">
                    <h2 className="font-worksans mb-6 text-2xl font-bold uppercase tracking-[0.15em] text-[#3d3d3d] md:text-3xl">
                        VALUE CREATED
                    </h2>

                    <p className="font-worksans text-16 font-normal leading-relaxed text-[#5c5c5c] md:text-[18px] md:leading-[1.7]">
                        <span className="block">
                            By Removing Noise And Prioritising Trust, Renivet
                            Makes It Easier For Brands To Scale Without
                            Compromise—
                        </span>
                        <span className="block">
                            And For Customers To Shop With Confidence, Pride,
                            And Purpose.
                        </span>
                    </p>
                </div>
            </div>
        </section>
    );
}
