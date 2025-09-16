import React from "react";
import Image from "next/image";
import Link from "next/link";

const EveryDayEssential = () => {
  return (
    <div className="bg-[#F4F0EC] relative overflow-hidden">
      <div className="w-full px-4 md:px-8 py-4 md:py-16">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-lg sm:text-2xl md:text-4xl lg:text-5xl font-normal sm:font-bold text-gray-800 mb-4">
            Everyday Essentials, Ethically Made
          </h1>
          <p className="text-gray-700 text-sm md:text-lg px-4">
            From clean skincare to thoughtful homeware — discover the good stuff.
          </p>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden">
        <div className="flex space-x-3 overflow-x-auto p-2 scrollbar-hide snap-x snap-mandatory">
            <MobileCard
              src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNt3tzng0rgXZuWwadPABUqnljV5RbJMFsx1v"
              title="Coconut Oil"
            />
            <MobileCard
              src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNRSZG5OzxCX9qouDwr5d6fTcizLeZ0I4snJvS"
              title="Face & Body Scrub"
            />
            <MobileCard
              src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNtw77nUbRj63QywZkxrW40qSphaIEcmUdXDAV"
              title="Eco Candles"
            />
            <MobileCard
              src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNQbOXb5cvbyYEoZ78eJzNIKWdcxq1Of9wlHtA"
              title="Handmade Mat"
            />
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex md:flex-row md:gap-8 items-center md:items-end justify-center">
          <Card
            src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNt3tzng0rgXZuWwadPABUqnljV5RbJMFsx1v"
            title="Coconut Oil"
            bigOnDesktop
          />
          <Card
            src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNRSZG5OzxCX9qouDwr5d6fTcizLeZ0I4snJvS"
            title="Face & Body Scrub"
          />
          <Card
            src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNtw77nUbRj63QywZkxrW40qSphaIEcmUdXDAV"
            title="Eco Candles"
          />
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

const MobileCard = ({
  src,
  title,
}: {
  src: string;
  title: string;
 }) => {
  return (
    <div className="relative flex-shrink-0 w-[45%] h-40 rounded-lg overflow-hidden shadow-sm snap-start">
            <Image src={src} alt={title} fill className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
      <div className="absolute bottom-2 left-2 text-gray-800 font-medium text-xs">
        {title}
      </div>
      <div className="absolute bottom-2 right-2">
        <Link
          href="/shop"
          className="bg-gray-200 text-gray-800 px-2 py-1 text-xs rounded hover:bg-gray-300 transition"
        >
          → EXPLORE NOW
        </Link>
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
        h-40
        rounded-2xl overflow-hidden shadow-lg
        ${bigOnDesktop ? "md:w-96 md:h-[480px]" : "md:w-80 md:h-96"}
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
  return <EveryDayEssential />;
}
