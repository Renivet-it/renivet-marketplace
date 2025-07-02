"use client";

import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem } from "../../ui/carousel";

interface PageProps extends GenericProps {
  banners: Banner[];
}

export function SuggestedLook({ className, banners, ...props }: PageProps) {
  return (
    <section className={cn("w-full pt-10 md:pt-16 lg:pt-20 pb-12 md:pb-16 px-4 sm:px-6 lg:px-8", className)} {...props}>
      {/* Centered Title Section */}
      <div className="w-full flex justify-center mb-6 md:mb-8">
        <div className="max-w-screen-2xl w-full text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Suggested Looks
          </h2>
        </div>
      </div>

      {/* Full-width Carousel with outer padding */}
      <div className="w-full overflow-hidden">
        <div className="w-screen ml-[calc(-50vw+50%)]">
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
            className="w-full h-[300px]"
          >
            <CarouselContent className="ml-0">
              {banners.map((item, index) => (
                <CarouselItem key={index} className="h-full p-0">
                  <div className="relative w-full h-full">
                    <Link href="/shop" className="block size-full">
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        width={1440}
                        height={300}
                        className="object-cover w-full h-full"
                        priority={index === 0}
                        sizes="100vw"
                      />
                    </Link>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </section>
  );
}