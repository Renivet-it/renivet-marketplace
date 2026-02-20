"use client";

import { Button } from "@/components/ui/button-general";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface PageProps extends GenericProps {
    banners: Banner[];
}

export function Landing({ className, banners, ...props }: PageProps) {
    const pathname = usePathname(); // ✅ route aware

    const desktopAspectRatio = 1440 / 500;
    const mobileAspectRatio = 375 / 487;

    /* ----------------------------------
     🧭 CATEGORIES
  ---------------------------------- */
    const categories = [
        {
            name: "Men",
            href: "/men",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzN2BY4DgQOYTpvrXwqtZHon4P85jVxyMmDkf3s",
        },
        {
            name: "Women",
            href: "/women",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNXsTugR3We049OUSYNxCLnRIka3FhcqBZlbsP",
        },
        {
            name: "Kids",
            href: "/kids",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNSLbuHrVko7HapsZqM8bNKQ6yVL5jDhwcr1AF",
        },
        {
            name: "Living",
            href: "/home-living",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNScHcA6Vko7HapsZqM8bNKQ6yVL5jDhwcr1AF",
        },
        {
            name: "Beauty",
            href: "/beauty-personal",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNdBqjKmb4imNMJ6l9SbIRxWLcDyX3vTqk2UVG",
        },
    ];

    return (
        <section className={cn("bg-[#FCFBF4]", className)} {...props}>
            {/* ======================================================
         🖥 DESKTOP — CAROUSEL
      ====================================================== */}
            <div className="hidden md:block">
                <Carousel
                    opts={{ align: "start", loop: true }}
                    plugins={[Autoplay({ delay: 5000 })]}
                >
                    <CarouselContent>
                        {banners.map((item, index) => (
                            <CarouselItem key={index}>
                                <div className="relative w-full overflow-hidden">
                                    <div
                                        style={{
                                            paddingBottom: `${(1 / desktopAspectRatio) * 100}%`,
                                        }}
                                    />
                                    <Image
                                        src={item.imageUrl}
                                        alt={item.title}
                                        fill
                                        className="absolute inset-0 object-cover"
                                        priority={index === 0}
                                        fetchPriority={
                                            index === 0 ? "high" : "auto"
                                        }
                                        unoptimized={index === 0}
                                    />

                                    <div className="absolute bottom-16 flex w-full justify-center">
                                        <Button
                                            size="lg"
                                            className="border-2 border-black bg-transparent px-8 py-3 text-sm uppercase tracking-wide text-black hover:bg-black hover:text-white"
                                            asChild
                                        >
                                            <Link href={item.url || pathname}>
                                                Shop With Purpose
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
            </div>

            {/* ======================================================
         📱 MOBILE — STATIC LAYOUT
      ====================================================== */}
            <div key={pathname} className="block md:hidden">
                {/* 🧭 CATEGORIES */}
                <div
                    className="grid grid-cols-5 gap-2 bg-cover bg-center px-3 py-4"
                    style={{
                        backgroundImage:
                            "url('https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNdhtEAhhb4imNMJ6l9SbIRxWLcDyX3vTqk2UV')",
                    }}
                >
                    {categories.map((cat) => {
                        const isActive = window.location.pathname === cat.href;

                        return (
                            <Link
                                key={cat.name}
                                href={cat.href}
                                className="flex flex-col items-center text-center"
                                onClick={(e) => {
                                    e.preventDefault();
                                    window.location.href = cat.href; // ✅ HARD RELOAD (FIX)
                                }}
                            >
                                <div
                                    className={cn(
                                        "relative h-14 w-14 overflow-hidden rounded-full bg-[#FCFBF4] transition",
                                        isActive &&
                                            "scale-105 ring-2 ring-black"
                                    )}
                                >
                                    <Image
                                        src={cat.imageUrl}
                                        alt={cat.name}
                                        fill
                                        className="object-cover"
                                        sizes="56px"
                                    />
                                </div>

                                <p
                                    className={cn(
                                        "mt-1 text-[11px] leading-tight",
                                        isActive
                                            ? "font-semibold text-black"
                                            : "font-medium"
                                    )}
                                >
                                    {cat.name}
                                </p>

                                {isActive && (
                                    <span className="mt-0.5 h-1 w-1 rounded-full bg-black" />
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* 🖼 MOBILE BANNER CAROUSEL */}
                <Carousel
                    opts={{ align: "start", loop: true }}
                    plugins={[Autoplay({ delay: 5000 })]}
                    className="relative w-full overflow-hidden"
                >
                    <CarouselContent>
                        {[
                            "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzN3WAYa2l64McafQHoWsZUzihAkJ3DF5EGgPpY",
                            "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNpTj0JOYoKFqlYMSWzhgNZG6Cm5OtIUjre39T",
                        ].map((imgUrl, index) => (
                            <CarouselItem key={index} className="pl-0">
                                <div className="relative w-full">
                                    <div
                                        style={{
                                            paddingBottom: `${(1 / mobileAspectRatio) * 100}%`,
                                        }}
                                    />
                                    <Image
                                        src={imgUrl}
                                        alt={`Mobile Banner ${index + 1}`}
                                        fill
                                        className="absolute inset-0 object-cover"
                                        priority={index === 0}
                                        fetchPriority={
                                            index === 0 ? "high" : "auto"
                                        }
                                        unoptimized={index === 0}
                                    />

                                    {/* CTA */}
                                    <div className="absolute bottom-16 flex w-full justify-center">
                                        <Link
                                            href="https://renivet.com/shop?categoryId=16d40bb3-3061-4790-b9b7-253cb078dfe1&brandIds=4f6efe94-0f57-4d9e-b61d-2da7aa9743e3,56b9f87d-fbbb-4ae7-8a43-fe19686968cf,cb6b330e-131c-4fd8-9d8a-ae997a02676b"
                                            className="group relative inline-flex items-center justify-center overflow-hidden border border-black bg-white px-8 py-3 text-sm font-medium text-black"
                                        >
                                            <span className="relative z-10 transition group-hover:text-white">
                                                Shop With Purpose
                                            </span>
                                            <span className="absolute inset-0 translate-y-full bg-black transition-transform duration-300 group-hover:translate-y-0" />
                                        </Link>
                                    </div>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
            </div>
        </section>
    );
}
