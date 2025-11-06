"use client";

import { Button } from "@/components/ui/button-general";
import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Search, Mic } from "lucide-react";
import { ProductSearch } from "@/components/ui/product-search";

interface PageProps extends GenericProps {
  banners: Banner[];
}

export function Landing({ className, banners, ...props }: PageProps) {
  const desktopAspectRatio = 1440 / 500;
  const mobileAspectRatio = 375 / 487;
  const mobileImageUrl =
    "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNuJOrQshnjfTvXWe4YdlSzoaZPyC7xGVghIDL";

  const categories = [
    { name: "Men", imageUrl: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNcdSN8FeO4H8MeNYoyJQSarWCqgVpRxP5lDBu", href: "/men" },
    { name: "Women", imageUrl: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNPKE1D2O9kwm36pdODjHU0ryYqC2xJehFZ5Q7", href: "/women" },
    { name: "Kids", imageUrl: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNSLbuHrVko7HapsZqM8bNKQ6yVL5jDhwcr1AF", href: "/kids" },
    { name: "Living", imageUrl: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNScHcA6Vko7HapsZqM8bNKQ6yVL5jDhwcr1AF", href: "/home-living" },
    { name: "Beauty", imageUrl: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNdBqjKmb4imNMJ6l9SbIRxWLcDyX3vTqk2UVG", href: "/beauty-personal" },
  ];

  return (
    <section className={cn("bg-[#F4F0EC]", className)} {...props}>
      <Carousel
        opts={{ align: "start", loop: true }}
        plugins={[Autoplay({ delay: 5000 })]}
        className="w-full bg-[#F4F0EC]"
      >
        <CarouselContent classNames={{ wrapper: "size-full", inner: "size-full ml-0" }}>
          {banners.map((item, index) => (
            <CarouselItem key={index} className="pl-0">
              <div className="relative w-full overflow-hidden bg-gray-100">
                {/* Desktop aspect ratio container */}
                <div
                  className="hidden md:block"
                  style={{ paddingBottom: `${(1 / desktopAspectRatio) * 100}%` }}
                />
                {/* Mobile aspect ratio container */}
                <div
                  className="block md:hidden"
                  style={{ paddingBottom: `${(1 / mobileAspectRatio) * 100}%` }}
                />

                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  className="absolute inset-0 hidden h-full w-full object-cover md:block"
                  priority={index === 0}
                />
                <Image
                  src={mobileImageUrl}
                  alt={item.title}
                  fill
                  className="absolute inset-0 block h-full w-full object-cover md:hidden"
                  priority={index === 0}
                />

                {/* --- OVERLAY CONTENT CONTAINER --- */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {/* --- MOBILE-ONLY CONTENT --- */}
                  {/* <div className="flex h-full w-full flex-col items-center justify-start pt-4 text-center text-black md:hidden"> */}
                    <div className="flex h-screen w-full flex-col items-center justify-start pt-4 text-center text-black md:hidden overflow-hidden">

                    {/* Category Circles */}
                    <div className="flex w-full justify-around px-2 py-4">
                      {categories.map((category) => (
                        <Link
                          key={category.name}
                          href={category.href}
                          className="flex flex-col items-center space-y-1"
                        >
                          <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-white/50">
                            <Image
                              src={category.imageUrl}
                              alt={category.name}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          </div>
                          <span className="text-xs font-medium text-white">{category.name}</span>
                        </Link>
                      ))}
                    </div>

                    {/* 🆕 MOBILE SEARCH BAR ADDED HERE */}
                    <div className="relative w-11/12 mt-1 mb-4">
                      {/* <input
                        type="text"
                        placeholder="Search for products"
                        className="w-full rounded-full bg-white/80 py-3 pl-10 pr-12 text-sm placeholder-gray-500 focus:outline-none"
                      /> */}
                           <ProductSearch
                                              placeholder="Search for products..."
                                              classNames={{ wrapper: "min-w-80 xl:flex" }}
                                          />
                    </div>

                    {/* Main Content */}
                    <div className="flex flex-grow flex-col items-center justify-center space-y-6">
                      <div className="space-y-2 text-white">
                        <h1 className="text-4xl font-serif">Style That Lasts.</h1>
                        <h2 className="text-4xl font-serif">Fashion That Cares.</h2>
                        <p className="pt-2 text-sm">
                          Discover slow fashion that looks good and feels right.
                        </p>
                      </div>
                      <Button
                        size="lg"
                        className="rounded-full border border-gray-200 bg-white/50 px-8 py-3 text-base font-medium text-black backdrop-blur-sm transition-colors duration-300 hover:bg-white"
                        asChild
                      >
                        <Link href="/shop">shop with purpose</Link>
                      </Button>
                      <div className="flex flex-col items-center space-y-2 pt-4">
                        <div className="h-12 w-12">{/* Plant Icon Here */}</div>
                        <p className="text-sm font-medium text-white">
                          Join 8,000+ conscious shoppers today
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* --- DESKTOP-ONLY BUTTON --- */}
                  <div className="absolute bottom-16 hidden md:block">
                    <Button
                      size="lg"
                      className="border-2 border-black bg-transparent px-8 py-3 text-sm font-medium uppercase tracking-wider text-black transition-colors duration-300 hover:bg-black hover:text-white"
                      asChild
                    >
                      <Link href={item.url || "/shop"}>{">"} EXPLORE NOW</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
}
