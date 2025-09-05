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

        {/* Product Cards */}
        <div
          className="
            grid grid-cols-2 gap-4           /* Mobile: 2 per row */
            md:flex md:flex-row md:gap-8     /* Desktop: original flex row */
            items-center md:items-end justify-center
          "
        >
          {/* Coconut Oil Card */}
          <Card
            src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNt3tzng0rgXZuWwadPABUqnljV5RbJMFsx1v"
            title="Coconut Oil"
            bigOnDesktop
          />

          {/* Face & Body Scrub Card */}
          <Card
            src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNRSZG5OzxCX9qouDwr5d6fTcizLeZ0I4snJvS"
            title="Face & Body Scrub"
          />

          {/* Eco Candles Card */}
          <Card
            src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNtw77nUbRj63QywZkxrW40qSphaIEcmUdXDAV"
            title="Eco Candles"
          />

          {/* Handmade Mat Card */}
          <Card
            src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNQbOXb5cvbyYEoZ78eJzNIKWdcxq1Of9wlHtA"
            title="Handmade Mat"
            bigOnDesktop
          />
        </div>
      </div>
    </div>
  );
};

const Card = ({
  src,
  title,
  bigOnDesktop = false,
}: {
  src: string;
  title: string;
  bigOnDesktop?: boolean;
}) => {
  return (
    <div
      className={`
        relative w-full 
        h-40                       /* Mobile height only */
        rounded-2xl overflow-hidden shadow-lg
        ${bigOnDesktop ? "md:w-96 md:h-[480px]" : "md:w-80 md:h-96"}  /* Desktop sizes only */
      `}
    >
      <Image src={src} alt={title} fill className="object-cover brightness-110" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent"></div>
      <div className="absolute top-2 md:top-6 left-2 md:left-6 text-white">
        <h3 className="text-sm md:text-lg font-medium">{title}</h3>
      </div>
      <div className="absolute bottom-2 md:bottom-6 left-2 md:left-6">
        <Link
          href="/shop"
          className="border border-white/50 text-white px-2 py-1 md:px-4 md:py-2 text-xs md:text-sm font-medium hover:bg-white/20 transition-colors duration-300 inline-block"
        >
          → EXPLORE NOW
        </Link>
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
