"use client";

import { Button } from "@/components/ui/button-general";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel";
import { ProductSearch } from "@/components/ui/product-search";
import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icons } from "../icons";

interface PageProps extends GenericProps {
    banners: Banner[];
}

export function Landing({ className, banners, ...props }: PageProps) {
    const desktopAspectRatio = 1440 / 500;
    const mobileAspectRatio = 375 / 487;
    const mobileImages = [
        "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNJo8goeyxafbXy0opEDB8VMuLNYvt9OQnIkzd",
        "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzN4qyZgtKTrA2wJk4WKdFytgsaQSNjmBo8I5CG",
        "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNV4dRD8BbpNcg6ZSKi0IGkAsjuLwQox3znmlt",
    ];
    const placeholders = ["Search For Products"];

    const [displayText, setDisplayText] = useState("");
    const [runCount, setRunCount] = useState(0); // how many times finished typing
    const maxRuns = 4; // number of times animation should repeat

    useEffect(() => {
        if (runCount >= maxRuns) {
            // After finishing animation 4 times → keep full text permanently
            setDisplayText(placeholders[0]);
            return;
        }

        const sentence = placeholders[0];
        let charIndex = 0;

        const typeInterval = setInterval(() => {
            setDisplayText(sentence.slice(0, charIndex + 1));
            charIndex++;

            if (charIndex === sentence.length) {
                clearInterval(typeInterval);

                // Wait before restarting typing
                setTimeout(() => {
                    setRunCount((prev) => prev + 1); // count completed animation
                    setDisplayText(""); // restart typing
                }, 1000);
            }
        }, 70);

        return () => clearInterval(typeInterval);
    }, [runCount]);

    const categories = [
        {
            name: "Men",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzN2BY4DgQOYTpvrXwqtZHon4P85jVxyMmDkf3s",
            href: "/men",
        },
        {
            name: "Women",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNXsTugR3We049OUSYNxCLnRIka3FhcqBZlbsP",
            href: "/women",
        },
        {
            name: "Kids",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNSLbuHrVko7HapsZqM8bNKQ6yVL5jDhwcr1AF",
            href: "/kids",
        },
        {
            name: "Living",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNScHcA6Vko7HapsZqM8bNKQ6yVL5jDhwcr1AF",
            href: "/home-living",
        },
        {
            name: "Beauty",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNdBqjKmb4imNMJ6l9SbIRxWLcDyX3vTqk2UVG",
            href: "/beauty-personal",
        },
    ];

    return (
        <section className={cn("bg-[#FCFBF4]", className)} {...props}>
            {/* ✅ DESKTOP CAROUSEL */}
            <div className="hidden md:block">
                <Carousel
                    opts={{ align: "start", loop: true }}
                    plugins={[Autoplay({ delay: 5000 })]}
                >
                    <CarouselContent>
                        {banners.map((item, index) => (
                            <CarouselItem key={index}>
                                <div className="relative w-full overflow-hidden bg-gray-100">
                                    <div
                                        style={{
                                            paddingBottom: `${(1 / desktopAspectRatio) * 100}%`,
                                        }}
                                    />
                                    <Image
                                        src={item.imageUrl}
                                        alt={item.title}
                                        fill
                                        sizes="(max-width: 768px) 100vw, 100vw"
                                        className="absolute inset-0 h-full w-full object-cover"
                                        priority={index === 0}
                                        fetchPriority={
                                            index === 0 ? "high" : "auto"
                                        }
                                        unoptimized={index === 0}
                                    />
                                    <div className="absolute bottom-16 flex w-full justify-center">
                                        <Button
                                            size="lg"
                                            className="group gap-3 bg-white/95 px-8 py-6 text-sm font-bold uppercase tracking-widest text-black shadow-xl backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white hover:shadow-2xl"
                                            asChild
                                        >
                                            <Link href={item.url || "/shop"}>
                                                <span>Shop With Purpose</span>
                                                <Icons.ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
            </div>

            {/* ✅ MOBILE STATIC BANNER (NO CAROUSEL) */}
            {/* ✅ MOBILE STATIC BANNER (SQUARE SEARCH BAR + ROUNDED CATEGORY IMAGES WITH BG COLOR) */}
            <div className="relative block w-full bg-[#fbfaf4] md:hidden">
                {/* 🔵 DISCOUNT STRIP */}
                {/* 🔵 DISCOUNT STRIP — MOVING LOOP */}
                {/* 🔵 DISCOUNT STRIP — INLINE ANIMATION */}
                <div
                    style={{
                        width: "100%",
                        backgroundColor: "#E4EDF7",
                        overflow: "hidden",
                    }}
                >
                    {/* Inject keyframes inline */}
                    <style>
                        {`
      @keyframes discountMarquee {
        0% { transform: translateX(0%); }
        100% { transform: translateX(-50%); }
      }
    `}
                    </style>

                    <div
                        style={{
                            display: "inline-flex",
                            whiteSpace: "nowrap",
                            gap: "40px",
                            padding: "6px 0",
                            fontSize: "11px",
                            fontWeight: 500,
                            color: "#000",
                            animation: "discountMarquee 25s linear infinite", // 🔥 FAST
                        }}
                    >
                        {Array.from({ length: 12 }).map((_, i) => (
                            <span key={i}>
                                Flat 10% Off For Your First Conscious Choice –{" "}
                                <strong>RENIVET10</strong>
                            </span>
                        ))}
                    </div>
                </div>

                {/* 🔵 SEARCH BAR — NOW SQUARE */}
                <div className="w-full px-4 pt-4">
                    <div className="relative border border-black">
                        <ProductSearch
                            placeholder={displayText}
                            className="rounded-none"
                            style={{
                                transition: "opacity .3s ease",
                                opacity: displayText ? 1 : 0.6,
                            }}
                        />
                    </div>
                </div>

                <div className="relative mt-3 w-full overflow-hidden">
                    <Image
                        src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNdhtEAhhb4imNMJ6l9SbIRxWLcDyX3vTqk2UV"
                        alt="Category background"
                        fill
                        sizes="100vw"
                        className="object-cover"
                    />
                    <div className="scrollbar-none relative z-10 flex w-full justify-between gap-3 overflow-x-auto px-3 py-4">
                        {categories.map((category) => (
                            <Link
                                key={category.name}
                                href={category.href}
                                className="flex min-w-[60px] flex-col items-center"
                            >
                                <div className="relative h-16 w-16 overflow-hidden rounded-full bg-[#FCFBF4] shadow-sm">
                                    <Image
                                        src={category.imageUrl}
                                        alt={category.name}
                                        fill
                                        className="object-cover"
                                        sizes="64px"
                                    />
                                </div>
                                <span className="pt-1 text-xs font-medium text-black">
                                    {category.name}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* 🔵 BANNER IMAGE */}
                {/* 🔵 BANNER IMAGE WITH CENTER CTA */}
                <div className="relative w-full overflow-hidden">
                    <Carousel
                        opts={{ align: "start", loop: true }}
                        plugins={[Autoplay({ delay: 5000 })]}
                    >
                        <CarouselContent>
                            {mobileImages.map((src, idx) => (
                                <CarouselItem key={idx}>
                                    <div className="relative w-full overflow-hidden">
                                        <div
                                            style={{
                                                paddingBottom: `${(1 / mobileAspectRatio) * 100}%`,
                                            }}
                                        />
                                        <Image
                                            src={src}
                                            alt={`Mobile Banner ${idx + 1}`}
                                            fill
                                            sizes="100vw"
                                            className="absolute inset-0 h-full w-full object-cover"
                                            priority={idx === 0}
                                            fetchPriority={
                                                idx === 0 ? "high" : "auto"
                                            }
                                        />
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>

                    {/* 🔵 CENTER BUTTON — MOBILE ONLY */}
                    <div className="pointer-events-none absolute inset-0 z-10 flex justify-center md:hidden">
                        <div className="pointer-events-auto absolute bottom-16">
                            <Link
                                href="https://renivet.com/shop?brandIds=56b9f87d-fbbb-4ae7-8a43-fe19686968cf,cb6b330e-131c-4fd8-9d8a-ae997a02676b"
                                className="group relative inline-flex items-center gap-2 overflow-hidden bg-white/95 px-8 py-3 text-sm font-bold uppercase tracking-widest text-black shadow-xl backdrop-blur-sm transition-all duration-300 hover:bg-black hover:text-white hover:shadow-2xl"
                            >
                                <span>Shop With Purpose</span>
                                <Icons.ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* 🔵 CTA BUTTON */}
                {/* <div className="w-full flex justify-center py-6">
    <Button
      size="lg"
      className="rounded-full border border-gray-300 bg-white px-8 py-3 text-base font-medium text-black backdrop-blur-sm hover:bg-white"
      asChild
    >
      <Link href="/shop">Shop With Purpose</Link>
    </Button>
  </div> */}
            </div>
        </section>
    );
}
