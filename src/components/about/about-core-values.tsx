"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

interface AboutCoreValuesProps {
  className?: string;
}

const sections = [
  {
    title: "WHAT RENIVET IS",
    content:
      "Renivet is not just another marketplace. It is a curated discovery platform built to spotlight homegrown, artisan-led, and thoughtfully made brands that deserve visibility and growth.",
  },
  {
    title: "HOW WE OPERATE",
    content:
      "Every product on Renivet is intentionally chosen—based on quality, craftsmanship, values, and the story behind it. We don’t chase trends or quantity. We focus on credibility, clarity, and conscious creation.",
  },
  {
    title: "VALUE CREATED",
    content:
      "By removing noise and prioritising trust, Renivet makes it easier for brands to scale without compromise—and for customers to shop with confidence, pride, and purpose.",
  },
];

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
      <div className="container relative mx-auto max-w-6xl space-y-20 md:space-y-28">
        {sections.map((section, idx) => (
          <div key={idx} className="mx-auto max-w-4xl text-center">
            <h2 className="font-playfair mb-6 text-2xl font-semibold uppercase tracking-[0.22em] text-stone-800 md:text-3xl">
              {section.title}
            </h2>

            <p className="font-playfair text-[17px] leading-relaxed text-stone-600 md:text-xl lg:text-[22px]">
              {section.content}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
