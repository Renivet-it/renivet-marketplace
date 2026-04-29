"use client";

import { cn } from "@/lib/utils";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

const REDIRECT_DELAY_MS = 220;

interface StripLoaderLinkProps {
    href: string;
    children: ReactNode;
    className?: string;
}

function StripLoaderLink({ href, children, className }: StripLoaderLinkProps) {
    const router = useRouter();
    const [isRedirecting, setIsRedirecting] = useState(false);
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current !== null) {
                window.clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
        if (
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
        ) {
            return;
        }

        event.preventDefault();

        if (isRedirecting) {
            return;
        }

        setIsRedirecting(true);
        timeoutRef.current = window.setTimeout(() => {
            try {
                const nextUrl = new URL(href, window.location.href);
                if (nextUrl.origin === window.location.origin) {
                    router.push(
                        `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`
                    );
                    return;
                }
            } catch {
                // fallback to full navigation below
            }

            window.location.assign(href);
        }, REDIRECT_DELAY_MS);
    };

    return (
        <Link
            href={href}
            data-no-route-loader="true"
            aria-busy={isRedirecting}
            onClick={handleClick}
            className={cn("relative", className)}
        >
            {children}

            <span
                aria-hidden="true"
                className={cn(
                    "pointer-events-none absolute inset-0 z-[2] rounded-[inherit] bg-white/55 opacity-0 transition duration-200",
                    isRedirecting && "opacity-100"
                )}
            />

            <span
                aria-hidden="true"
                className={cn(
                    "bg-white/92 pointer-events-none absolute left-1/2 top-1/2 z-[3] flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/75 shadow-sm transition duration-200",
                    isRedirecting
                        ? "scale-100 opacity-100"
                        : "scale-90 opacity-0"
                )}
            >
                <span className="relative block size-4">
                    <span className="absolute inset-0 rounded-full border-2 border-[#d7c49c]" />
                    <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-r-[#8E6C2E] border-t-[#8E6C2E]" />
                </span>
            </span>
        </Link>
    );
}

export function MobileCategories() {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({
                left: direction === "left" ? -350 : 350,
                behavior: "smooth",
            });
        }
    };

    const categories = [
        {
            title: "Indian Wear",
            subtitle: "Elegant ethnic styles for every occasion.",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNzQ7NO8wvAfHxUCD4uo0de9jTMakKRhw8ctYL",
            link: "https://renivet.com/shop?categoryId=16d40bb3-3061-4790-b9b7-253cb078dfe1&subcategoryId=0cb0f01f-4c17-47ff-8251-4ea5a7a65a09&productTypeId=0f13d48d-50de-43ec-8bab-a7bfbbcf8773",
        },
        {
            title: "Western Wear",
            subtitle: "Modern and comfortable everyday fashion.",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNdhPFJaWb4imNMJ6l9SbIRxWLcDyX3vTqk2UV",
            link: "https://renivet.com/shop?categoryId=16d40bb3-3061-4790-b9b7-253cb078dfe1&subcategoryId=f050d1bc-f435-45fc-ac22-47942a4d4a74",
        },
        {
            title: "Foot Wear",
            subtitle: "Step out in style with premium quality.",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzN8g1QARjj1qpSPZJEOTHVgaenl2yArM78zCkm",
            link: "https://renivet.com/shop?categoryId=16d40bb3-3061-4790-b9b7-253cb078dfe1&subcategoryId=4489ecbd-cb3e-47f0-aced-defcf134629b",
        },

        {
            title: "Shirts",
            subtitle: "Classic cuts and contemporary designs.",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNvWCA90dPZsh5fuDbkAelMyqICmp3NU7X4nHY",
            link: "https://renivet.com/shop?categoryId=0b7046fc-6962-4469-81c2-412ed6949c02&subcategoryId=7f1e41e3-e7a9-46ef-aaf6-f0e0a37a971d&productTypeId=e027b0df-5287-4114-849d-1f3bfc05e594",
        },
        {
            title: "Accessories",
            subtitle: "Buy Any 2, Get 15% Off. The perfect finish.",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNawKqqt9B8YEoL1wGJl0ZibnpvNAMuVzCFqKc",
            link: "https://renivet.com/shop?categoryId=16d40bb3-3061-4790-b9b7-253cb078dfe1&subcategoryId=32674fe3-d167-4b48-914b-0819b17a2292",
        },
        {
            title: "Home Decor",
            subtitle: "Beautiful pieces for your personal space.",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNeqhEsg0rgXZuWwadPABUqnljV5RbJMFsx1v",
            link: "https://renivet.com/shop?categoryId=173e1e71-e298-4301-b542-caa29d3950bf",
        },
        {
            title: "Kids",
            subtitle: "Comfortable and cute outfits.",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNjgHih7umPpnZoHc5f2E4rFNLugdK3ty9ObjY",
            link: "https://renivet.com/shop?categoryId=22816fa3-d57e-4e3b-bc0e-72edf4635124",
        },
        {
            title: "Sale",
            subtitle: "The best deals of the season.",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNmKiAnjNpGL6AgslOfF3vz5Wa1NUerQXMBIPZ",
            link: "https://renivet.com/shop?sortBy=best-sellers",
        },
    ];

    return (
        <section className="w-full bg-white pb-0 pt-8 md:pb-0 md:pt-10">
            <div className="max-w-screen-3xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="mb-5 flex flex-col items-start md:mb-6">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 md:text-[11px]">
                        Discover products you can trust
                    </span>
                    <div className="mt-2 flex w-full items-center justify-between">
                        <h2 className="font-playfair text-[28px] font-normal uppercase leading-[1.3] text-gray-900 md:text-[36px]">
                            SHOP BY{" "}
                            <span className="text-[#a46e5b]">CATEGORY</span>
                        </h2>

                        {/* Desktop Navigation Arrows */}
                        <div className="hidden gap-2 md:flex">
                            <button
                                onClick={() => scroll("left")}
                                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-95"
                            >
                                <ChevronLeft className="h-5 w-5 text-gray-600" />
                            </button>
                            <button
                                onClick={() => scroll("right")}
                                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-95"
                            >
                                <ChevronRight className="h-5 w-5 text-gray-600" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Cards Carousel */}
                <div className="relative -mx-4 px-4 md:mx-0 md:px-0">
                    <div
                        ref={scrollRef}
                        className="scrollbar-hide flex snap-x snap-mandatory gap-2 overflow-x-auto pb-4 md:gap-3 md:pb-6"
                        style={{
                            scrollbarWidth: "none",
                            msOverflowStyle: "none",
                        }}
                    >
                        {categories.map((item, index) => (
                            <StripLoaderLink
                                key={index}
                                href={item.link}
                                className="group relative flex aspect-[4/5] w-[140px] shrink-0 snap-center flex-col justify-end overflow-hidden rounded-md md:w-[220px] md:snap-start lg:w-[240px]"
                            >
                                {/* Background Image */}
                                <Image
                                    src={item.imageUrl}
                                    alt={item.title}
                                    fill
                                    sizes="(max-width: 768px) 140px, (max-width: 1024px) 220px, 240px"
                                    className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                                />

                                {/* Dark Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100" />

                                {/* Content */}
                                <div className="relative z-10 flex w-full flex-col p-3 md:p-5">
                                    <div className="flex items-end justify-between">
                                        <div className="flex flex-col text-white">
                                            <h3 className="mb-0.5 font-playfair text-[15px] font-medium tracking-wide md:text-[22px]">
                                                {item.title}
                                            </h3>
                                            <p className="max-w-[100px] text-[9px] italic leading-snug text-white/80 transition-opacity duration-300 md:max-w-[140px] md:text-[12px]">
                                                {item.subtitle}
                                            </p>
                                        </div>
                                        <div className="flex h-6 w-6 shrink-0 -translate-x-2 items-center justify-center rounded-full bg-white/20 opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 md:h-8 md:w-8">
                                            <ArrowRight className="h-3 w-3 text-white md:h-4 md:w-4" />
                                        </div>
                                    </div>
                                </div>
                            </StripLoaderLink>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
