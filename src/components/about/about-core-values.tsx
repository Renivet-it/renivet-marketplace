"use client";

import { cn } from "@/lib/utils";
import { Globe, Infinity, RefreshCw, ShoppingBag, Sprout } from "lucide-react";
import Image from "next/image";

interface AboutCoreValuesProps {
    className?: string;
}

const icons = [
    {
        src: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNw3U5csrQTkEsKW16AOLVjr8DhmeCypgUGfJz",
        alt: "Eco Friendly",
    },
    {
        src: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzN4iJMgcKTrA2wJk4WKdFytgsaQSNjmBo8I5CG",
        alt: "Ethical Sourcing",
    },
    {
        src: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNjgOYT4fmPpnZoHc5f2E4rFNLugdK3ty9ObjY",
        alt: "Circular Economy",
    },
    {
        src: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNyax3gRp5TEHko4KfX8CDn1z7Q2migSIjw0ds",
        alt: "Artisan Support",
    },
    {
        src: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNoOEp2o0WvnGEidmOVIP6xXt4S7befYUykMJq",
        alt: "Global Impact",
    },
];


export function AboutCoreValues({ className }: AboutCoreValuesProps) {
    return (
        <section
            className={cn(
                "relative overflow-hidden bg-[#fcfbf4] px-4 py-12 md:py-32",
                className
            )}
        >
            {/* Background Glow */}
            <div className="pointer-events-none absolute inset-0">
                {/* Mobile Background */}
                <div className="absolute left-0 top-0 h-full w-full md:hidden">
                    <Image
                        src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNPm9P4GO9kwm36pdODjHU0ryYqC2xJehFZ5Q7"
                        alt="Background Glow"
                        fill
                        className="object-cover object-[center_-50px] opacity-60"
                        priority
                    />
                </div>
                {/* Desktop Background */}
                <div className="hidden h-full w-full md:block">
                    <Image
                        src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNZ7keRPI6Gw03SBYgknrdpcjuJ8IvhPb5W9zy"
                        alt="Background Glow"
                        fill
                        className="object-cover opacity-60"
                        priority
                    />
                </div>
            </div>

            {/* Left Illustration - Mobile version (visible only on mobile) */}
            <div className="pointer-events-none absolute left-2 top-[6%] md:hidden">
                <Image
                    src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNvD0uVndPZsh5fuDbkAelMyqICmp3NU7X4nHY"
                    alt="Decorative Pin"
                    width={22}
                    height={58}
                    className="rotate-[-10deg] opacity-90"
                />
            </div>

            {/* Left Illustration - Desktop version (visible only on desktop) */}
            <div className="pointer-events-none absolute left-0 top-[12%] hidden md:block">
                <Image
                    src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNvD0uVndPZsh5fuDbkAelMyqICmp3NU7X4nHY"
                    alt="Decorative Pin"
                    width={82}
                    height={112}
                    className="rotate-[-10deg] opacity-90"
                />
            </div>

            {/* Right Illustration - Mobile version (visible only on mobile) */}
            <div className="pointer-events-none absolute bottom-[24%] right-4 md:hidden">
                <Image
                    src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNV4NdgTmBbpNcg6ZSKi0IGkAsjuLwQox3znml"
                    alt="Decorative Yarn"
                    width={70}
                    height={70}
                    className="rotate-[-15deg] opacity-90"
                />
            </div>

            {/* Right Illustration - Desktop version (visible only on desktop) */}
            <div className="pointer-events-none absolute bottom-[16%] right-0 hidden md:block">
                <Image
                    src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNV4NdgTmBbpNcg6ZSKi0IGkAsjuLwQox3znml"
                    alt="Decorative Yarn"
                    width={222}
                    height={154}
                    className="rotate-[-15deg] opacity-90"
                />
            </div>

            {/* Content */}
            <div className="container relative mx-auto max-w-[1100px] space-y-8 text-center md:space-y-24">
                {/* WHAT RENIVET IS */}
                <div className="mx-auto max-w-[1100px]">
                    <h2 className="mb-3 font-worksans text-lg font-bold uppercase tracking-[0.15em] text-[#1c1c1c] md:mb-6 md:text-3xl">
                        WHAT RENIVET IS
                    </h2>

                    <p className="font-worksans text-[15px] leading-relaxed tracking-normal text-[#1c1c1c] sm:text-sm md:text-[20px] md:leading-snug">
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
                <div className="mx-auto max-w-[1100px]">
                    <h2 className="mb-3 font-worksans text-lg font-bold uppercase tracking-[0.15em] text-[#1c1c1c] md:mb-6 md:text-3xl">
                        HOW WE OPERATE
                    </h2>

                    <p className="font-worksans text-[15px] leading-relaxed tracking-normal text-[#1c1c1c] sm:text-sm md:text-[20px] md:leading-snug">
                        <span className="block">
                            Every Product On Renivet Is Intentionally
                            Chosen—Based On Quality, Craftsmanship, Values, And
                            The
                        </span>
                        <span className="block">
                            Story Behind It. We Don't Chase Trends Or Quantity.
                            We Focus On Credibility, Clarity, And Conscious
                        </span>
                        <span className="block">Creation.</span>
                    </p>
                </div>

                {/* VALUE CREATED */}
                <div className="mx-auto max-w-[1100px]">
                    <h2 className="mb-3 font-worksans text-lg font-bold uppercase tracking-[0.15em] text-[#1c1c1c] md:mb-6 md:text-3xl">
                        VALUE CREATED
                    </h2>

                    <p className="font-worksans text-[15px] leading-relaxed tracking-normal text-[#1c1c1c] sm:text-sm md:text-[20px] md:leading-snug">
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

                {/* Icons Grid */}
                <div className="pt-6 md:pt-8">
                    {/* Mobile Layout - 3 icons + 2 icons in two rows */}
                    <div className="flex flex-col items-center gap-10 md:hidden">
                        {/* First Row - 3 icons */}
                        <div className="flex items-center justify-center gap-16">
                            {icons.slice(0, 3).map((item, idx) => (
                                <div
                                    key={idx}
                                    className="flex flex-col items-center gap-2"
                                >
                               <Image
    src={item.src}
    alt={item.alt}
    width={62}
    height={62}
    className="h-[62px] w-[62px] object-contain"
/>
                                </div>
                            ))}
                        </div>

                        {/* Second Row - 2 icons */}
                        <div className="flex items-center justify-center gap-16">
                            {icons.slice(3, 5).map((item, idx) => (
                                <div
                                    key={idx}
                                    className="flex flex-col items-center gap-2"
                                >
                               <Image
    src={item.src}
    alt={item.alt}
    width={62}
    height={62}
    className="h-[62px] w-[62px] object-contain"
/>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Desktop Layout - All 5 icons in one row */}
                    <div className="hidden items-center justify-center gap-24 md:flex">
                        {icons.map((item, idx) => (
                            <div
                                key={idx}
                                className="flex flex-col items-center gap-2"
                            >
                          <Image
    src={item.src}
    alt={item.alt}
    width={62}
    height={62}
    className="h-[62px] w-[62px] object-contain"
/>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}