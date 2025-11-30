"use client";

import { Button } from "@/components/ui/button-general";
import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { ProductSearch } from "@/components/ui/product-search";

interface PageProps extends GenericProps {
  banners: Banner[];
}

export function Landing({ className, banners, ...props }: PageProps) {
  const desktopAspectRatio = 1440 / 500;
  const mobileAspectRatio = 375 / 487;
  const mobileImageUrl =
    "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNL8xWHSUt5ndSiE7wT2jaklrZXQ6vYpAbfHyW";

  const categories = [
    { name: "Men", imageUrl: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNcdSN8FeO4H8MeNYoyJQSarWCqgVpRxP5lDBu", href: "/men" },
    { name: "Women", imageUrl: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNPKE1D2O9kwm36pdODjHU0ryYqC2xJehFZ5Q7", href: "/women" },
    { name: "Kids", imageUrl: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNSLbuHrVko7HapsZqM8bNKQ6yVL5jDhwcr1AF", href: "/kids" },
    { name: "Living", imageUrl: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNScHcA6Vko7HapsZqM8bNKQ6yVL5jDhwcr1AF", href: "/home-living" },
    { name: "Beauty", imageUrl: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNdBqjKmb4imNMJ6l9SbIRxWLcDyX3vTqk2UVG", href: "/beauty-personal" },
  ];

  return (
    <section className={cn("bg-[#fbfaf4]", className)} {...props}>

      {/* ✅ DESKTOP CAROUSEL */}
      <div className="hidden md:block">
        <Carousel opts={{ align: "start", loop: true }} plugins={[Autoplay({ delay: 5000 })]}>
          <CarouselContent>
            {banners.map((item, index) => (
              <CarouselItem key={index}>
                <div className="relative w-full overflow-hidden bg-gray-100">
                  <div style={{ paddingBottom: `${(1 / desktopAspectRatio) * 100}%` }} />
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="absolute inset-0 h-full w-full object-cover"
                    priority={index === 0}
                  />
                  <div className="absolute bottom-16 flex justify-center w-full">
                    <Button
                      size="lg"
                      className="border-2 border-black bg-transparent px-8 py-3 text-sm font-medium uppercase tracking-wider text-black hover:bg-black hover:text-white"
                      asChild
                    >
                      <Link href={item.url || "/shop"}>{">"} EXPLORE NOW</Link>
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
<div className="block md:hidden relative w-full bg-[#fbfaf4]">

  {/* 🔵 DISCOUNT STRIP */}
  <div className="w-full bg-[#E4EDF7] text-center text-[13px] font-medium py-2 text-black">
    Flat 10% Off For Your First Conscious Choice – RENIVET10
  </div>

  {/* 🔵 SEARCH BAR — NOW SQUARE */}
  <div className="w-full px-4 pt-4">
    <div className="rounded-none overflow-hidden">
      <ProductSearch placeholder="Search For Products And Brands" className="rounded-none" />
    </div>
  </div>

  {/* 🔵 CATEGORY ICONS — ROUNDED + COLORED BACKGROUND */}
  <div className="w-full flex justify-between px-3 py-4 overflow-x-auto scrollbar-none gap-3">
    {categories.map((category) => (
      <Link
        key={category.name}
        href={category.href}
        className="flex flex-col items-center min-w-[60px]"
      >
        <div className="relative h-16 w-16 overflow-hidden rounded-full bg-[#F4F0EC] shadow-sm">
          <Image
            src={category.imageUrl}
            alt={category.name}
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>
        <span className="text-xs font-medium text-black">{category.name}</span>
      </Link>
    ))}
  </div>

  {/* 🔵 BANNER IMAGE */}
  <div className="relative w-full overflow-hidden">
    <div style={{ paddingBottom: `${(1 / mobileAspectRatio) * 100}%` }} />
    <Image
      src={mobileImageUrl}
      alt="Mobile Banner"
      fill
      className="absolute inset-0 h-full w-full object-cover"
      priority
    />
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
