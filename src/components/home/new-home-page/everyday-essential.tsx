import React from "react";
import Image from "next/image";
import Link from "next/link";

const EveryDayEssential = () => {
  return (
    <div className="bg-[#F4F0EC] relative overflow-hidden">
      <div className="w-full px-4 md:px-8 py-8 md:py-16">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
            Everyday Essentials, Ethically Made
          </h1>
          <p className="text-gray-700 text-base md:text-lg px-4">
            From clean skincare to thoughtful homeware — discover the good stuff.
          </p>
        </div>

        {/* Product Cards - Responsive Layout */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-end justify-center">
          {/* Coconut Oil Card - Large on desktop, full width on mobile */}
          <div className="relative w-full max-w-sm md:w-96 h-80 md:h-[480px] rounded-3xl overflow-hidden shadow-xl">
            <Image
              src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNt3tzng0rgXZuWwadPABUqnljV5RbJMFsx1v"
              alt="Coconut Oil with coconut and palm leaves"
              fill
              className="object-cover brightness-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent"></div>
            <div className="absolute top-6 left-6 text-white">
              <h3 className="text-lg font-medium">Coconut Oil</h3>
            </div>
            <div className="absolute bottom-6 left-6">
              <Link 
                href="/shop"
                className="border border-white/50 text-white px-4 py-2 text-sm font-medium hover:bg-white/20 transition-colors duration-300 inline-block"
              >
                → EXPLORE NOW
              </Link>
            </div>
          </div>

          {/* Face & Body Scrub Card - Small on desktop, full width on mobile */}
          <div className="relative w-full max-w-sm md:w-80 h-80 md:h-96 rounded-3xl overflow-hidden shadow-xl">
            <Image
              src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNRSZG5OzxCX9qouDwr5d6fTcizLeZ0I4snJvS"
              alt="Green tea and neem scrub jar"
              fill
              className="object-cover brightness-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent"></div>
            <div className="absolute top-6 left-6 text-white">
              <h3 className="text-lg font-medium">Face & Body Scrub</h3>
            </div>
            <div className="absolute bottom-6 left-6">
              <Link 
                href="/shop"
                className="border border-white/50 text-white px-4 py-2 text-sm font-medium hover:bg-white/20 transition-colors duration-300 inline-block"
              >
                → EXPLORE NOW
              </Link>
            </div>
          </div>

          {/* Eco Candles Card - Small on desktop, full width on mobile */}
          <div className="relative w-full max-w-sm md:w-80 h-80 md:h-96 rounded-3xl overflow-hidden shadow-xl">
            <Image
              src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNtw77nUbRj63QywZkxrW40qSphaIEcmUdXDAV"
              alt="Eco-friendly candles with natural materials"
              fill
              className="object-cover brightness-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent"></div>
            <div className="absolute top-6 left-6 text-white">
              <h3 className="text-lg font-medium">Eco Candles</h3>
            </div>
            <div className="absolute bottom-6 left-6">
              <Link 
                href="/shop"
                className="border border-white/50 text-white px-4 py-2 text-sm font-medium hover:bg-white/20 transition-colors duration-300 inline-block"
              >
                → EXPLORE NOW
              </Link>
            </div>
          </div>

          {/* Handmade Mat Card - Large on desktop, full width on mobile */}
          <div className="relative w-full max-w-sm md:w-96 h-80 md:h-[480px] rounded-3xl overflow-hidden shadow-xl">
            <Image
              src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNQbOXb5cvbyYEoZ78eJzNIKWdcxq1Of9wlHtA"
              alt="Handmade woven mat with natural materials"
              fill
              className="object-cover brightness-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent"></div>
            <div className="absolute top-6 left-6 md:right-6 md:left-auto text-white">
              <h3 className="text-lg font-medium">Handmade Mat</h3>
            </div>
            <div className="absolute bottom-6 left-6 md:right-6 md:left-auto">
              <Link 
                href="/shop"
                className="border border-white/50 text-white px-4 py-2 text-sm font-medium hover:bg-white/20 transition-colors duration-300 inline-block"
              >
                → EXPLORE NOW
              </Link>
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
      <EveryDayEssential />
    </div>
  );
}