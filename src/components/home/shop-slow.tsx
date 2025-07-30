// components/sustainable-badges.tsx
import { BadgeCheck, Leaf, Sprout, Palette } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const SustainableBadges = () => {
  return (
    <div className="bg-[#F4F0EC]">
      {/* Header Section */}
      <div className="text-center py-8 bg-[#F4F0EC]">
        <h1 className="text-4xl md:text-5xl font-light text-gray-800 mb-4 tracking-tight">
          Conscious. Effortless. Everyday.
        </h1>
        <div className="text-base text-gray-600 max-w-sm mx-auto leading-relaxed">
          <p>explore fashion and living essentials</p>
          <p>that feel as good as they look</p>
        </div>
      </div>

      {/* Main Layout Container */}
      <div className="max-w-[1300px] mx-auto px-4 pb-8">
        <div className="grid grid-cols-12 gap-4">
          {/* Left Large Image - Woman in beige dress (665x470) */}
          <div className="col-span-12 lg:col-span-5 relative">
            <div
              className="relative overflow-hidden rounded-lg border-4 border-blue-400"
              style={{ width: '665px', height: '500px', maxWidth: '100%' }}
            >
              <Image
                src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNSx4iy4Vko7HapsZqM8bNKQ6yVL5jDhwcr1AF"
                alt="Woman in beige dress"
                fill
                className="object-cover"
                style={{ objectPosition: 'center' }}
              />
              {/* Overlay Content */}
              <div className="absolute inset-0 bg-black bg-opacity-30"></div>
              <div className="absolute bottom-6 left-6 text-white">
                <h3 className="text-xl font-light mb-2 tracking-wide">Chic Comfort in Every Stitch.</h3>
                <div className="flex items-center text-sm">
                  <span className="text-lg mr-2">→</span>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column - Two stacked images */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            {/* Top Middle Image - Bag (391x319) */}
            <div className="relative">
              <div 
                className="relative overflow-hidden rounded-lg"
                style={{ width: '391px', height: '319px', maxWidth: '100%' }}
              >
                <Image
                  src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNg8OTqX2ENPRLZdGUpA0elOxytCDfJibYIko7"
                  alt="Sustainable bag"
                  fill
                  className="object-cover"
                  style={{ objectPosition: 'center' }}
                />
                {/* Overlay Content */}
                <div className="absolute inset-0 bg-black bg-opacity-30"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="text-sm font-light tracking-wide">Carry Light. Tread Lighter.</p>
                  <div className="flex items-center mt-1 text-xs">
                    <span className="text-sm mr-2">→</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Middle Image - Green bowls (317x166) */}
            <div className="relative">
              <div 
                className="relative overflow-hidden rounded-lg"
                style={{ width: '317px', height: '166px', maxWidth: '100%' }}
              >
                <Image
                  src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzN379xwG5l64McafQHoWsZUzihAkJ3DF5EGgPp"
                  alt="Green sustainable bowls"
                  fill
                  className="object-cover"
                  style={{ objectPosition: 'center' }}
                />
                {/* Overlay Content */}
                <div className="absolute inset-0 bg-black bg-opacity-30"></div>
                <div className="absolute bottom-3 left-3 text-white">
                  <p className="text-xs font-light tracking-wide">Homeware that Speaks Earth</p>
                  <div className="flex items-center mt-1 text-xs">
                    <span className="text-xs mr-1">→</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Large Image - Man in blue shirt (665x470) */}
          <div className="col-span-12 lg:col-span-4 relative">
            <div 
              className="relative overflow-hidden rounded-lg"
              style={{ width: '665px', height: '500px', maxWidth: '100%' }}
            >
              <Image
                src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNpRrGXftYoKFqlYMSWzhgNZG6Cm5OtIUjre39"
                alt="Man in blue shirt"
                fill
                className="object-cover"
                style={{ objectPosition: 'center' }}
              />
              {/* Overlay Content */}
              <div className="absolute inset-0 bg-black bg-opacity-30"></div>
              <div className="absolute bottom-6 left-6 text-white">
                <h3 className="text-xl font-light mb-2 tracking-wide">Cool. Conscious. Confident.</h3>
                <div className="flex items-center text-sm">
                  <span className="text-lg mr-2">→</span>
                </div>
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
      {/* Use the component */}
      <SustainableBadges />
    </div>
  );
}