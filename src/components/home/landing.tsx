"use client";

import { Button } from "@/components/ui/button-general";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icons } from "../icons";

interface PageProps extends GenericProps {
    banners: Banner[];
    mobileBanners: Banner[];
}

export function Landing({
    className,
    banners,
    mobileBanners,
    ...props
}: PageProps) {
    const [mobileCarouselApi, setMobileCarouselApi] =
        useState<CarouselApi | null>(null);
    const [mobileImageIndex, setMobileImageIndex] = useState(0);
    const desktopAspectRatio = 1440 / 500;
    const mobileAspectRatio = 375 / 487;
    useEffect(() => {
        if (!mobileCarouselApi) return;

        const handleSelect = () =>
            setMobileImageIndex(mobileCarouselApi.selectedScrollSnap());

        handleSelect();
        mobileCarouselApi.on("select", handleSelect);
        return () => {
            mobileCarouselApi.off("select", handleSelect);
        };
    }, [mobileCarouselApi]);

    return (
        <section className={cn("bg-white", className)} {...props}>
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
                                            className="btn-liquid btn-liquid-secondary group gap-3 px-8 py-6 text-sm font-bold uppercase tracking-widest shadow-xl backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl"
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
            <div className="relative block w-full bg-[#f5eee5] px-2 pb-6 pt-4 md:hidden">
                {/* 🔵 BANNER IMAGE WITH CENTER CTA */}
                <div className="relative w-full overflow-visible">
                    <button
                        type="button"
                        onClick={() =>
                            window.dispatchEvent(
                                new Event("renivet:open-product-search")
                            )
                        }
                        aria-label="Search products"
                        className="absolute right-4 top-4 z-30 flex size-10 items-center justify-center rounded-full border border-white/70 bg-white/90 text-[#61333d] shadow-lg backdrop-blur-sm transition-colors hover:bg-white"
                    >
                        <Icons.Search className="size-5" />
                    </button>
                    <div className="min-h-10">
                        {mobileBanners.length > 0 && (
                            <Carousel
                                opts={{ align: "start", loop: true }}
                                plugins={[Autoplay({ delay: 5000 })]}
                                setApi={setMobileCarouselApi}
                            >
                                <CarouselContent>
                                    {mobileBanners.map((item, idx) => (
                                <CarouselItem key={idx}>
                                    <div className="relative w-full overflow-visible pb-2">
                                        <div
                                            style={{
                                                paddingBottom: `${(1 / mobileAspectRatio) * 100}%`,
                                            }}
                                        />
                                        <Link
                                            href={item.url || "/shop"}
                                            aria-label={item.title}
                                            className="absolute inset-0"
                                        >
                                            <Image
                                                src={item.imageUrl}
                                                alt={item.title}
                                                fill
                                                sizes="100vw"
                                                className="absolute inset-0 h-full w-full object-cover"
                                                priority={idx === 0}
                                                fetchPriority={
                                                    idx === 0 ? "high" : "auto"
                                                }
                                            />
                                        </Link>

                                        {/* 🔵 CENTER BUTTON - NOW INSIDE SLIDE TO HAVE UNIQUE LINKS */}
                                        {false && (
                                            <div className="absolute inset-x-5 bottom-10 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]">
                                                <p className="font-serif text-[30px] leading-[1.08]">
                                                    A more thoughtful
                                                    <br />
                                                    way to shop.
                                                </p>
                                                <p className="mt-2 text-[12px] tracking-wide text-white/90">
                                                    Conscious fashion, beauty
                                                    &amp; living — curated with
                                                    intention
                                                </p>
                                            </div>
                                        )}

                                        {false && (
                                            <div className="relative z-20 mx-1 -mt-8 rounded-[18px] bg-white px-6 py-6 shadow-[0_3px_12px_rgba(65,48,37,0.1)]">
                                                <p className="flex items-center gap-2 text-[12px] text-[#45404a]">
                                                    <span className="tracking-[0.16em] text-[#713746]">
                                                        ★★★★★
                                                    </span>
                                                    <span>
                                                        2,400+ thoughtful
                                                        households
                                                    </span>
                                                </p>
                                                <h2 className="mt-5 font-serif text-[31px] leading-[1.08] text-[#27313a]">
                                                    A more thoughtful
                                                    <br />
                                                    way to shop.
                                                </h2>
                                                <p className="mt-4 text-[15px] leading-6 text-[#5f6670]">
                                                    Curated home goods, chosen
                                                    for their beauty and
                                                    purpose.
                                                </p>
                                                <div className="mt-5 flex">
                                                    <Link
                                                        href="/shop"
                                                        className="flex w-full items-center justify-center rounded-full bg-[#713746] px-3 py-3 text-[13px] font-medium text-white"
                                                    >
                                                        Shop the Edit
                                                    </Link>
                                                </div>
                                                <p className="mt-5 text-center text-[11px] text-[#7e8389]">
                                                    Free returns · Ships in 4–7
                                                    days
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </CarouselItem>
                                    ))}
                                </CarouselContent>
                            </Carousel>
                        )}
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
                <div className="relative z-20 mx-1 -mt-8 rounded-[18px] bg-white px-6 py-6 shadow-[0_3px_12px_rgba(65,48,37,0.1)]">
                    <p className="flex items-center gap-2 text-[12px] text-[#45404a]">
                        <span
                            aria-label="5 out of 5 stars"
                            className="tracking-[0.16em] text-[#713746]"
                        >
                            &#9733;&#9733;&#9733;&#9733;&#9733;
                        </span>
                        <span className="hidden tracking-[0.16em] text-[#713746]">
                            â˜…â˜…â˜…â˜…â˜…
                        </span>
                        <span>2,400+ thoughtful households</span>
                    </p>
                    <h2 className="mt-5 font-serif text-[31px] leading-[1.08] text-[#27313a]">
                        A more thoughtful
                        <br />
                        way to shop.
                    </h2>
                    <p className="mt-4 text-[15px] leading-6 text-[#5f6670]">
                        Curated home goods, chosen for their beauty and purpose.
                    </p>
                    <div className="mt-5 flex">
                        <Link
                            href="/shop"
                            className="flex w-full items-center justify-center rounded-full bg-[#713746] px-3 py-3 text-[13px] font-medium text-white"
                        >
                            Shop the Edit
                        </Link>
                    </div>
                    <p className="mt-5 text-center text-[11px] text-[#7e8389]">
                        Free returns · Ships in 4–7 days
                    </p>
                </div>
            </div>
        </section>
    );
}
