"use client";

import { cn } from "@/lib/utils";
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
                    "pointer-events-none absolute left-1/2 top-1/2 z-[3] flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/75 bg-white/92 shadow-sm transition duration-200",
                    isRedirecting ? "scale-100 opacity-100" : "scale-90 opacity-0"
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
    const categories = [
        {
            title: "Indian Wear",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNzQ7NO8wvAfHxUCD4uo0de9jTMakKRhw8ctYL",
            link: "https://renivet.com/shop?categoryId=16d40bb3-3061-4790-b9b7-253cb078dfe1&subcategoryId=0cb0f01f-4c17-47ff-8251-4ea5a7a65a09&productTypeId=0f13d48d-50de-43ec-8bab-a7bfbbcf8773",
        },
        {
            title: "Western Wear",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNdhPFJaWb4imNMJ6l9SbIRxWLcDyX3vTqk2UV",
            link: "https://renivet.com/shop?categoryId=16d40bb3-3061-4790-b9b7-253cb078dfe1&subcategoryId=f050d1bc-f435-45fc-ac22-47942a4d4a74",
        },
        {
            title: "Foot Wear",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzN8g1QARjj1qpSPZJEOTHVgaenl2yArM78zCkm",
            link: "https://renivet.com/shop?categoryId=16d40bb3-3061-4790-b9b7-253cb078dfe1&subcategoryId=4489ecbd-cb3e-47f0-aced-defcf134629b",
        },
        {
            title: "Sale",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNmKiAnjNpGL6AgslOfF3vz5Wa1NUerQXMBIPZ",
            link: "https://renivet.com/shop?sortBy=best-sellers",
        },
        {
            title: "Shirts",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNvWCA90dPZsh5fuDbkAelMyqICmp3NU7X4nHY",
            link: "https://renivet.com/shop?categoryId=0b7046fc-6962-4469-81c2-412ed6949c02&subcategoryId=7f1e41e3-e7a9-46ef-aaf6-f0e0a37a971d&productTypeId=e027b0df-5287-4114-849d-1f3bfc05e594",
        },
        {
            title: "Accessories",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNawKqqt9B8YEoL1wGJl0ZibnpvNAMuVzCFqKc",
            link: "https://renivet.com/shop?categoryId=16d40bb3-3061-4790-b9b7-253cb078dfe1&subcategoryId=32674fe3-d167-4b48-914b-0819b17a2292",
        },
        {
            title: "Home Decor",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNeqhEsg0rgXZuWwadPABUqnljV5RbJMFsx1v",
            link: "https://renivet.com/shop?categoryId=173e1e71-e298-4301-b542-caa29d3950bf",
        },
        {
            title: "Kids",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNjgHih7umPpnZoHc5f2E4rFNLugdK3ty9ObjY",
            link: "https://renivet.com/shop?categoryId=22816fa3-d57e-4e3b-bc0e-72edf4635124",
        },
    ];

    return (
        <>
            {/* Mobile: 4-col grid */}
            <section className="block w-full bg-white px-4 py-6 md:hidden">
                <div className="grid grid-cols-4 gap-x-2 gap-y-6">
                    {categories.map((item, index) => (
                        <StripLoaderLink
                            key={`mobile-${index}`}
                            href={item.link}
                            className="flex flex-col items-center"
                        >
                            {item.title === "Accessories" ? (
                                <div className="perspective aspect-square w-full max-w-[78px]">
                                    <div className="flip-card">
                                        <div className="card-face card-front relative h-full w-full overflow-hidden">
                                            <Image
                                                src={item.imageUrl}
                                                alt={item.title}
                                                fill
                                                sizes="78px"
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="card-face card-back">
                                            <p className="text-[10px] leading-tight text-[#333]">
                                                Buy Any 2
                                            </p>
                                            <p className="text-[11px] font-semibold text-[#000]">
                                                Get 15% Off
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative aspect-square w-full max-w-[78px] overflow-hidden">
                                    <Image
                                        src={item.imageUrl}
                                        alt={item.title}
                                        fill
                                        sizes="78px"
                                        className="object-cover"
                                    />
                                </div>
                            )}
                            <p className="mt-2 text-center text-[10px] leading-tight text-[#333] sm:text-[12px]">
                                {item.title}
                            </p>
                        </StripLoaderLink>
                    ))}
                </div>
            </section>

            {/* Desktop: full-width grid, minimal padding */}
            <section className="hidden w-full bg-white px-4 py-8 md:block">
                <div className="mx-auto grid max-w-screen-2xl grid-cols-8 gap-4 lg:gap-6">
                    {categories.map((item, index) => (
                        <StripLoaderLink
                            key={index}
                            href={item.link}
                            className="group flex flex-col items-center"
                        >
                            {item.title === "Accessories" ? (
                                <div className="perspective aspect-square w-full">
                                    <div className="flip-card">
                                        <div className="card-face card-front relative h-full w-full overflow-hidden">
                                            <Image
                                                src={item.imageUrl}
                                                alt={item.title}
                                                fill
                                                sizes="(max-width: 1024px) 12.5vw, 170px"
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="card-face card-back">
                                            <p className="text-xs leading-tight text-[#333]">
                                                Buy Any 2
                                            </p>
                                            <p className="text-sm font-semibold text-black">
                                                Get 15% Off
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative aspect-square w-full overflow-hidden transition-transform duration-300 group-hover:scale-105">
                                    <Image
                                        src={item.imageUrl}
                                        alt={item.title}
                                        fill
                                        sizes="(max-width: 1024px) 12.5vw, 170px"
                                        className="object-cover"
                                    />
                                </div>
                            )}
                            <p className="mt-2.5 text-center text-sm font-medium text-[#333] transition-colors group-hover:text-[#6B7A5E]">
                                {item.title}
                            </p>
                        </StripLoaderLink>
                    ))}
                </div>
            </section>

            {/* ✅ CSS INSIDE SAME FILE */}
            <style jsx>{`
                .perspective {
                    perspective: 1000px;
                }

                .flip-card {
                    width: 100%;
                    height: 100%;
                    position: relative;
                    transform-style: preserve-3d;
                    animation: flip 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }

                @keyframes flip {
                    0% {
                        transform: rotateY(0deg);
                    }
                    25% {
                        transform: rotateY(0deg);
                    }
                    50% {
                        transform: rotateY(180deg);
                    }
                    75% {
                        transform: rotateY(180deg);
                    }
                    100% {
                        transform: rotateY(0deg);
                    }
                }

                .card-face {
                    position: absolute;
                    inset: 0;
                    backface-visibility: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                }

                .card-front {
                    background: transparent;
                }

                .card-back {
                    background: #efe7da;
                    transform: rotateY(180deg);
                    flex-direction: column;
                }
            `}</style>
        </>
    );
}
