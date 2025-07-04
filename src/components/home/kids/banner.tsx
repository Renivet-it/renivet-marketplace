"use client";

import { Button } from "@/components/ui/button-general";
import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem } from "../../ui/carousel";
import { Home, ChevronRight } from "lucide-react";
import { Icons } from "@/components/icons";

interface PageProps extends GenericProps {
    banners: Banner[];
}

export function Landing({ className, banners, ...props }: PageProps) {
    return (
        <section className={cn("", className)} {...props}>
            <nav className="flex justify-around items-center p-4 bg-gray-100 md:hidden">
                <Link href="/women" className="flex flex-col items-center text-gray-700 hover:text-green-600">
                    <Icons.Venus className="w-6 h-6" />
                    <span className="text-xs">Women</span>
                </Link>
                <Link href="/men" className="flex flex-col items-center text-gray-700 hover:text-green-600">
                    <Icons.Mars className="w-6 h-6" />
                    <span className="text-xs">Men</span>
                </Link>
                <Link href="/little" className="flex flex-col items-center text-gray-700 hover:text-green-600">
                    <Icons.Users className="w-6 h-6" />
                    <span className="text-xs">Little Renivet</span>
                </Link>
                <Link href="/home" className="flex flex-col items-center text-gray-700 hover:text-green-600">
                    <Icons.House className="w-6 h-6" />
                    <span className="text-xs">Home & Living</span>
                </Link>
                <Link href="/beauty" className="flex flex-col items-center text-gray-700 hover:text-green-600">
                    <Icons.Droplet className="w-6 h-6" />
                    <span className="text-xs">Beauty</span>
                </Link>
            </nav>
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
                className="w-full h-full lg:h-[50vh] xl:h-[50vh]"
            >
                <CarouselContent
                    classNames={{
                        wrapper: "size-full",
                        inner: "size-full ml-0",
                    }}
                >
                    {banners.map((item, index) => (
                        <CarouselItem key={index} className="h-full px-0 py-0">
                            <div className="relative size-full overflow-hidden bg-gray-100">
                                <Image
                                    src={item.imageUrl}
                                    alt={item.title}
                                    width={1440}
                                    height={550}
                                    className="size-full object-cover brightness-75"
                                    priority={index === 0}
                                />
                                <div className="absolute inset-0 flex items-center justify-center p-6">
                                    <Button
                                        size="lg"
                                        className="bg-black text-white font-semibold uppercase rounded-full hover:bg-gray-800 py-3 px-6"
                                        asChild
                                    >
                                        <Link href="/shop">Shop Now</Link>
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