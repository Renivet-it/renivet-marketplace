import { BadgeCheck, Leaf, Sprout, Palette } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const SustainableBadges = () => {
  return (
    <div className="bg-[#F4F0EC]">
      {/* Header Section */}
      <div className="text-center py-6 md:py-8 bg-[#F4F0EC]">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-gray-800 mb-3 md:mb-4 tracking-tight">
          Everyday Essential Ethically made.
        </h1>
        <div className="text-sm md:text-base text-gray-600 max-w-sm mx-auto leading-relaxed">
          <p>From clean Skincare to thoughtful homeware - discover the cool stuff</p>
        </div>
      </div>

      {/* Mobile Layout - Grid */}
      <div className="lg:hidden max-w-[1300px] mx-auto px-4 pb-8">
        <div className="grid grid-cols-2 gap-3">
          {/* Woman in beige dress - Top left */}
          <div className="col-span-2 relative aspect-[16/9] rounded-lg border-4 border-white overflow-hidden">
            <Image
              src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNSx4iy4Vko7HapsZqM8bNKQ6yVL5jDhwcr1AF"
              alt="Woman in beige dress"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-30"></div>
            <div className="absolute bottom-3 left-3 text-white">
              <h3 className="text-sm font-light tracking-wide">Chic Comfort</h3>
              <Link href="/shop" className="flex items-center">
                <span className="text-sm">→</span>
              </Link>
            </div>
          </div>

          {/* Sustainable bag - Bottom left */}
          <div className="relative aspect-square rounded-lg border-4 border-white overflow-hidden">
            <Image
              src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNg8OTqX2ENPRLZdGUpA0elOxytCDfJibYIko7"
              alt="Sustainable bag"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-30"></div>
            <div className="absolute bottom-2 left-2 text-white">
              <p className="text-xs font-light tracking-wide">Carry Light</p>
              <Link href="/shop" className="flex items-center">
                <span className="text-xs">→</span>
              </Link>
            </div>
          </div>

          {/* Green bowls - Bottom middle */}
          <div className="relative aspect-square rounded-lg border-4 border-white overflow-hidden">
            <Image
              src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzN379xwG5l64McafQHoWsZUzihAkJ3DF5EGgPp"
              alt="Green sustainable bowls"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-30"></div>
            <div className="absolute bottom-2 left-2 text-white">
              <p className="text-xs font-light tracking-wide">Earth Homeware</p>
              <Link href="/shop" className="flex items-center">
                <span className="text-xs">→</span>
              </Link>
            </div>
          </div>

          {/* Man in blue shirt - Top right */}
          <div className="col-span-2 relative aspect-[16/9] rounded-lg border-4 border-white overflow-hidden mt-3">
            <Image
              src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNpRrGXftYoKFqlYMSWzhgNZG6Cm5OtIUjre39"
              alt="Man in blue shirt"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-30"></div>
            <div className="absolute bottom-3 left-3 text-white">
              <h3 className="text-sm font-light tracking-wide">Cool & Confident</h3>
              <Link href="/shop" className="flex items-center">
                <span className="text-sm">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block max-w-[1300px] mx-auto px-4 pb-8">
        <div className="grid grid-cols-12 gap-4">
          {/* Left Large Image */}
          <div className="col-span-5 relative">
            <div className="relative overflow-hidden rounded-lg border-4" style={{ height: "720px" }}>
              <Image
                src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNSx4iy4Vko7HapsZqM8bNKQ6yVL5jDhwcr1AF"
                alt="Woman in beige dress"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-30"></div>
              <div className="absolute bottom-6 left-6 text-white">
                <h3 className="text-xl font-light mb-2 tracking-wide">Chic Comfort in Every Stitch.</h3>
                <Link href="/shop" className="flex items-center">
                  <span className="text-lg mr-2">→</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Middle Column */}
          <div className="col-span-3 space-y-4">
            {/* Top Middle Image */}
            <div className="relative" style={{ height: "419px" }}>
              <div className="relative overflow-hidden rounded-lg h-full">
                <Image
                  src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNg8OTqX2ENPRLZdGUpA0elOxytCDfJibYIko7"
                  alt="Sustainable bag"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-30"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="text-sm font-light tracking-wide">Carry Light. Tread Lighter.</p>
                  <Link href="/shop" className="flex items-center">
                    <span className="text-sm mr-2">→</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom Middle Image */}
            <div className="relative" style={{ height: "282px" }}>
              <div className="relative overflow-hidden rounded-lg h-full">
                <Image
                  src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzN379xwG5l64McafQHoWsZUzihAkJ3DF5EGgPp"
                  alt="Green sustainable bowls"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-30"></div>
                <div className="absolute bottom-3 left-3 text-white">
                  <p className="text-xs font-light tracking-wide">Homeware that Speaks Earth</p>
                  <Link href="/shop" className="flex items-center">
                    <span className="text-xs mr-1">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Right Large Image */}
          <div className="col-span-4 relative">
            <div className="relative overflow-hidden rounded-lg" style={{ height: "720px" }}>
              <Image
                src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNpRrGXftYoKFqlYMSWzhgNZG6Cm5OtIUjre39"
                alt="Man in blue shirt"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-30"></div>
              <div className="absolute bottom-6 left-6 text-white">
                <h3 className="text-xl font-light mb-2 tracking-wide">Cool. Conscious. Confident.</h3>
                <Link href="/shop" className="flex items-center">
                  <span className="text-lg mr-2">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export function Page() {
  return (
    <div>
      <SustainableBadges />
    </div>
  );
}