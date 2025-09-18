"use client";

import { Button } from "@/components/ui/button-general";
import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem } from "../../ui/carousel";
import { Icons } from "@/components/icons";

interface PageProps extends GenericProps {
    banners: Banner[];
}

export function Landing({ className, banners, ...props }: PageProps) {
    return (
        <section className={cn("", className)} {...props}>
            {/* Mobile Navigation */}
            <nav className="flex justify-around items-center p-4 bg-gray-100 md:hidden">
                <Link href="/women" className="flex flex-col items-center text-gray-700 hover:text-green-600" onClick={(e) => {
      e.preventDefault();
      window.location.href = "/women"; // ✅ full page reload
    }}>
                    <Icons.Venus className="w-6 h-6" />
                    <span className="text-xs">Women</span>
                </Link>
                <Link href="/men" className="flex flex-col items-center text-gray-700 hover:text-green-600" onClick={(e) => {
      e.preventDefault();
      window.location.href = "/men"; // ✅ full page reload
    }}>
                    <Icons.Mars className="w-6 h-6" />
                    <span className="text-xs">Men</span>
                </Link>
                <Link href="kids" className="flex flex-col items-center text-gray-700 hover:text-green-600" onClick={(e) => {
      e.preventDefault();
      window.location.href = "/kids"; // ✅ full page reload
    }}>
                    <Icons.Users className="w-6 h-6" />
                    <span className="text-xs">Kids</span>
                </Link>
                <Link href="/home-living" className="flex flex-col items-center text-gray-700 hover:text-green-600" onClick={(e) => {
      e.preventDefault();
      window.location.href = "/home-living"; // ✅ full page reload
    }}>
                    <Icons.House className="w-6 h-6" />
                    <span className="text-xs">Home & Living</span>
                </Link>
                <Link href="/beauty-personal" className="flex flex-col items-center text-gray-700 hover:text-green-600" onClick={(e) => {
      e.preventDefault();
      window.location.href = "/beauty-personal"; // ✅ full page reload
    }}>
                    <Icons.Droplet className="w-6 h-6" />
                    <span className="text-xs">Beauty</span>
                </Link>
            </nav>

            {/* Banner Carousel */}
            <Carousel
                opts={{
                    align: "start",
                    loop: true,
                }}
                plugins={[
                    Autoplay({
                        delay: 5000,
                    }),
                ]}
                className="w-full bg-[#F4F0EC]"
            >
                <CarouselContent className="h-full">
                    {banners.map((item, index) => (
                        <CarouselItem key={index} className="h-full pl-0">
                            <div className="relative w-full h-full">
                                <Image
                                    src={item.imageUrl}
                                    alt={item.title}
                                    width={1440}
                                    height={500}
                                    className="w-full h-full object-cover"
                                    priority={index === 0}
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Button
                                        size="lg"
                                        className="bg-black text-white font-semibold uppercase rounded-full hover:bg-gray-800 py-3 px-8"
                                        asChild
                                    >
                                        <Link href={item.url || "/shop"}>Shop Now</Link>
                                    </Button>
                                </div>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        </section>
    );
}