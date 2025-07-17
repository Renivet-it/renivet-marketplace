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
      name: "Little Renivet",
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
  const [imagesPerSlide, setImagesPerSlide] = useState(1); // Start with 1 for mobile

  useEffect(() => {
    // Responsive image count
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

  // Auto-advance carousel
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

  // Get current set of images to display
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
    <section className="w-full bg-[#F4F0EC] py-8 md:py-12">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-6 md:gap-12">
          {/* Left Side - Text Content */}
          <div className="md:w-1/2 flex flex-col justify-center text-center md:text-left">
            <h2 className="text-xl md:text-3xl font-light mb-3 md:mb-4">SHOP BY CATEGORY</h2>
            <p className="text-xs md:text-base text-gray-600 mb-4 md:mb-6">
              Shop the latest fashion trends from the top luxury designers.
            </p>

            <div className="mb-6 md:mb-8 flex justify-center md:justify-start">
              <Button
                asChild
                variant="outline"
                className="border-black text-black hover:bg-gray-100 text-xs md:text-base"
              >
                <Link href="/new-arrivals">
                  SHOP NEW IN
                </Link>
              </Button>
            </div>

            {/* Category Links - Hidden on mobile, shown on desktop */}
            <div className="hidden md:flex flex-col gap-2">
              {categories.slice(0, 5).map((category, index) => (
                <Link
                  key={index}
                  href={category.href}
                  className="text-sm md:text-base font-medium hover:text-gray-600 transition-colors py-1"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Right Side - Category Carousel */}
          <div className="md:w-1/2 relative">
            <div className="relative w-full">
              {/* Carousel Images */}
              <div className={`grid ${imagesPerSlide === 1 ? "grid-cols-1" : imagesPerSlide === 2 ? "grid-cols-2" : "grid-cols-3"} gap-3 md:gap-[10px]`}>
                {currentImages.map((category, index) => (
                  <Link
                    key={index}
                    href={category.href}
                    className="group relative overflow-hidden rounded-md hover:shadow-lg transition-all duration-300 mx-auto"
                    style={{
                      width: imagesPerSlide === 1 ? "100%" : "207px",
                      height: imagesPerSlide === 1 ? "200px" : "304px"
                    }}
                    onMouseEnter={() => setIsAutoPlaying(false)}
                    onMouseLeave={() => setIsAutoPlaying(true)}
                  >
                    <Image
                      src={category.imageUrl}
                      alt={category.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 flex items-end p-3 md:p-4 bg-gradient-to-t from-black/50 to-transparent">
                      <h3 className="text-white font-medium text-base md:text-lg">
                        {category.name}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Carousel Navigation - Mobile version */}
            <div className="flex justify-center mt-3 md:mt-4 gap-3 md:gap-4">
              <button
                onClick={prevSlide}
                className="p-1 md:p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
              </button>

              {/* Dots indicator */}
              <div className="flex items-center gap-1 md:gap-2">
                {Array.from({ length: Math.ceil(categories.length / imagesPerSlide) }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-colors ${currentSlide === index ? "bg-black" : "bg-gray-300"}`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={nextSlide}
                className="p-1 md:p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Next slide"
              >
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>

          {/* Mobile Category Links - Only shown on mobile */}
          <div className="md:hidden flex flex-wrap justify-center gap-3 mt-4">
            {categories.slice(0, 5).map((category, index) => (
              <Link
                key={index}
                href={category.href}
                className="text-xs font-medium hover:text-gray-600 transition-colors px-3 py-1 bg-white rounded-full shadow-sm"
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