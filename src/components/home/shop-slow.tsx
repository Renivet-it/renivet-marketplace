import { BadgeCheck, Leaf, Sprout, Palette } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const SustainableBadges = () => {
  return (
    <div className="bg-[#F4F0EC]">
      {/* Header Section */}
      <div className="text-center py-4 md:py-12 bg-[#F4F0EC]">
  <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-5xl font-light text-gray-800 mb-2 md:mb-6 tracking-tight">
    Conscious. Effortless. Everyday.
  </h1>
  <div className="text-xs sm:text-sm md:text-base text-gray-600 max-w-sm mx-auto leading-relaxed">
    <p>explore fashion and living essentials that feel as good as they look</p>
  </div>
</div>


      {/* Mobile Layout - Compact Grid */}
      <div className="lg:hidden max-w-[1400px] mx-auto px-3 pb-6">
        <div className="bg-white rounded-xl shadow-sm p-2">
          <div className="grid grid-cols-2 gap-2">
            {/* Woman in beige dress */}
            <div className="col-span-2 relative h-40 rounded-lg overflow-hidden">
              <Image
                src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNSx4iy4Vko7HapsZqM8bNKQ6yVL5jDhwcr1AF"
                alt="Woman in beige dress"
                fill
                className="object-cover brightness-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
              <div className="absolute bottom-2 left-2 text-white">
                <h3 className="text-xs font-light">Chic Comfort</h3>
                <Link href="/shop">
                  <span className="text-sm">→</span>
                </Link>
              </div>
            </div>

            {/* Sustainable bag */}
            <div className="relative h-32 rounded-lg overflow-hidden">
              <Image
                src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNg8OTqX2ENPRLZdGUpA0elOxytCDfJibYIko7"
                alt="Sustainable bag"
                fill
                className="object-cover brightness-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
              <div className="absolute bottom-2 left-2 text-white">
                <p className="text-xs font-light">Carry Light</p>
              </div>
            </div>

            {/* Green bowls */}
            <div className="relative h-32 rounded-lg overflow-hidden">
              <Image
                src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzN379xwG5l64McafQHoWsZUzihAkJ3DF5EGgPp"
                alt="Green sustainable bowls"
                fill
                className="object-cover brightness-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
              <div className="absolute bottom-2 left-2 text-white">
                <p className="text-xs font-light">Earth Homeware</p>
              </div>
            </div>

            {/* Man in blue shirt */}
            <div className="col-span-2 relative h-40 rounded-lg overflow-hidden">
              <Image
                src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNpRrGXftYoKFqlYMSWzhgNZG6Cm5OtIUjre39"
                alt="Man in blue shirt"
                fill
                className="object-cover brightness-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
              <div className="absolute bottom-2 left-2 text-white">
                <h3 className="text-xs font-light">Cool & Confident</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block max-w-[1550px] mx-auto px-6 pb-12">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Large Image */}
          <div className="col-span-5 relative">
            <div className="relative overflow-hidden rounded-2xl" style={{ height: "720px" }}>
              <Image
                src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNSx4iy4Vko7HapsZqM8bNKQ6yVL5jDhwcr1AF"
                alt="Woman in beige dress"
                fill
                className="object-cover brightness-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent"></div>
              <div className="absolute bottom-8 left-8 text-white">
                <h3 className="text-2xl font-light mb-2 tracking-wide">Chic Comfort in Every Stitch.</h3>
                <Link href="/shop" className="flex items-center">
                  <span className="text-xl mr-2">→</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Middle Column */}
          <div className="col-span-3 space-y-6">
            {/* Top Middle Image */}
            <div className="relative" style={{ height: "345px" }}>
              <div className="relative overflow-hidden rounded-2xl h-full">
                <Image
                  src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNg8OTqX2ENPRLZdGUpA0elOxytCDfJibYIko7"
                  alt="Sustainable bag"
                  fill
                  className="object-cover brightness-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent"></div>
                <div className="absolute bottom-6 left-6 text-white">
                  <p className="text-base font-light tracking-wide">Carry Light. Tread Lighter.</p>
                  <Link href="/shop" className="flex items-center">
                    <span className="text-lg mr-2">→</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom Middle Image */}
            <div className="relative" style={{ height: "345px" }}>
              <div className="relative overflow-hidden rounded-2xl h-full">
                <Image
                  src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzN379xwG5l64McafQHoWsZUzihAkJ3DF5EGgPp"
                  alt="Green sustainable bowls"
                  fill
                  className="object-cover brightness-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent"></div>
                <div className="absolute bottom-6 left-6 text-white">
                  <p className="text-base font-light tracking-wide">Homeware that Speaks Earth</p>
                  <Link href="/shop" className="flex items-center">
                    <span className="text-lg mr-2">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Right Large Image */}
          <div className="col-span-4 relative">
            <div className="relative overflow-hidden rounded-2xl" style={{ height: "720px" }}>
              <Image
                src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNpRrGXftYoKFqlYMSWzhgNZG6Cm5OtIUjre39"
                alt="Man in blue shirt"
                fill
                className="object-cover brightness-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent"></div>
              <div className="absolute bottom-8 left-8 text-white">
                <h3 className="text-2xl font-light mb-2 tracking-wide">Cool. Conscious. Confident.</h3>
                <Link href="/shop" className="flex items-center">
                  <span className="text-xl mr-2">→</span>
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
