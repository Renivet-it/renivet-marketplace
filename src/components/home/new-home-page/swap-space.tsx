"use client";

import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem } from "../../ui/carousel";
import Autoplay from "embla-carousel-autoplay";

interface PageProps extends GenericProps {
  banners: Banner[];
  className?: string;
}

export function SwapSpace({ className, banners, ...props }: PageProps) {
  if (!banners || banners.length === 0) {
    return null;
  }

  // const backgroundImageUrl = "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNOYfiCWBHKYuSX87vxCz1aEsjfWTRVJZ9Qmtn";
  const backgroundImageUrl = "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzN3wy7IOl64McafQHoWsZUzihAkJ3DF5EGgPpY";

  return (
    <section
      className={cn("w-full py-10 md:py-16 bg-center bg-cover bg-no-repeat", className )} 
      style={{ backgroundImage: `url('${backgroundImageUrl}')` }}
      {...props}
    >
      <div className="max-w-screen-2xl mx-auto">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 4000,
              stopOnInteraction: true,
            }),
          ]}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {banners.map((item, index) => (
              <CarouselItem
                key={index}
                className="pl-4 basis-auto" // Use basis-auto for fixed-width items
              >
                <div 
                  className="group relative overflow-hidden"
                  style={{
                    width: "208px",
                    height: "313px",
                  }}
                >
                  <Link href={item.url || "/shop"} className="block w-full h-full">
                    <Image
                      src={item.imageUrl}
                      alt={item.title || "Product Image"}
                      fill
                      className="object-cover rounded-2xl" // Apply rounded corners to the image itself
                      sizes="208px"
                    />
                    {/* The "Shop Now" button is hidden as it's not in the new design */}
                  </Link>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}
