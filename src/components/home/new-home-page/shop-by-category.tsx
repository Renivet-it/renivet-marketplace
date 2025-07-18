"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button-general";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function ShopCategories() {
  const categories = [
    {
      name: "Women",
      imageUrl: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzN2opW8fQOYTpvrXwqtZHon4P85jVxyMmDkf3s",
      href: "/women"
    },
    {
      name: "Men",
      imageUrl: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNcrArNTeO4H8MeNYoyJQSarWCqgVpRxP5lDBu",
      href: "/men"
    },
    {
      name: "Kids",
      imageUrl: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzN37iwsJl64McafQHoWsZUzihAkJ3DF5EGgPpY",
      href: "/kids"
    },
    {
      name: "Home & Living",
      imageUrl: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNJn6u9AyxafbXy0opEDB8VMuLNYvt9OQnIkzd",
      href: "/home-living"
    },
    {
      name: "Beauty",
      imageUrl: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNRKSk5izxCX9qouDwr5d6fTcizLeZ0I4snJvS",
      href: "/beauty-personal"
    }
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [imagesPerSlide, setImagesPerSlide] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setImagesPerSlide(1);
      } else if (window.innerWidth < 768) {
        setImagesPerSlide(2);
      } else {
        setImagesPerSlide(3);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.ceil(categories.length / imagesPerSlide));
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, categories.length, imagesPerSlide]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.ceil(categories.length / imagesPerSlide));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) =>
      prev === 0 ? Math.ceil(categories.length / imagesPerSlide) - 1 : prev - 1
    );
  };

  const getCurrentImages = () => {
    const startIndex = currentSlide * imagesPerSlide;
    const images = [];
    for (let i = 0; i < imagesPerSlide; i++) {
      const index = (startIndex + i) % categories.length;
      images.push(categories[index]);
    }
    return images;
  };

  const currentImages = getCurrentImages();

  return (
    <section className="bg-[#F4F0EC]w-full bg-[#F4F0EC] py-12 md:py-16">
      <div className="max-w-screen-xl mx-auto px-6">
        <div className="flex flex-col md:flex-row gap-12">
          {/* Left Side - Text Content */}
          <div className="md:w-2/5 flex flex-col justify-center text-center md:text-left">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-light tracking-wide">SHOP BY CATEGORY</h2>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                Shop the latest fashion trends from the top luxury designers.
              </p>
              <div className="pt-2">
                <Button
                  asChild
                  variant="outline"
                  className="border-black text-black hover:bg-gray-100 text-base px-8 py-3 rounded-none"
                >
                  <Link href="/shop">
                    SHOP NEW IN
                  </Link>
                </Button>
              </div>
            </div>

            {/* Category Links - Hidden on mobile, shown on desktop */}
            <div className="hidden md:flex flex-col space-y-3 pt-8">
              {categories.slice(0, 5).map((category, index) => (
                <Link
                  key={index}
                  href={category.href}
                  className="text-lg font-medium hover:text-gray-600 transition-colors py-1"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Right Side - Category Carousel */}
          <div className="md:w-3/5 relative">
            <div className="relative w-full">
              {/* Carousel Images */}
              <div className={`grid ${imagesPerSlide === 1 ? "grid-cols-1" : imagesPerSlide === 2 ? "grid-cols-2" : "grid-cols-3"} gap-4`}>
                {currentImages.map((category, index) => (
                  <Link
                    key={index}
                    href={category.href}
                    className="group relative overflow-hidden hover:shadow-md transition-all duration-300 mx-auto"
                    style={{
                      width: imagesPerSlide === 1 ? "100%" : "240px",
                      height: imagesPerSlide === 1 ? "320px" : "360px"
                    }}
                    onMouseEnter={() => setIsAutoPlaying(false)}
                    onMouseLeave={() => setIsAutoPlaying(true)}
                  >
                    <Image
                      src={category.imageUrl}
                      alt={category.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 flex items-end p-4 bg-gradient-to-t from-black/40 to-transparent">
                      <h3 className="text-white font-medium text-lg">
                        {category.name}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Carousel Navigation */}
            <div className="flex justify-center mt-6 gap-4">
              <button
                onClick={prevSlide}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Dots indicator */}
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.ceil(categories.length / imagesPerSlide) }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${currentSlide === index ? "bg-black" : "bg-gray-300"}`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={nextSlide}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Next slide"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile Category Links */}
          <div className="md:hidden flex flex-wrap justify-center gap-3 mt-8">
            {categories.slice(0, 5).map((category, index) => (
              <Link
                key={index}
                href={category.href}
                className="text-sm font-medium hover:text-gray-600 transition-colors px-4 py-2 bg-white rounded-none border border-gray-200"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}