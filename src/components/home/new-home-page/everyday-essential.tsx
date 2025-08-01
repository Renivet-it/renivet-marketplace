import React from 'react';
import Image from 'next/image';

const EveryDayEssential = () => {
  return (
    <div className="bg-[#F4F0EC]">
      {/* Header Section */}
      <div className="text-center py-6 md:py-8 bg-[#F4F0EC]">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-gray-800 mb-3 md:mb-4 tracking-tight">
          Conscious. Effortless. Everyday.
        </h1>
        <div className="text-sm md:text-base text-gray-600 max-w-sm mx-auto leading-relaxed">
          <p>explore fashion and living essentials</p>
          <p>that feel as good as they look</p>
        </div>
      </div>

      {/* Main Layout Container */}
      <div className="max-w-[1300px] mx-auto px-4 pb-6 md:pb-8">
        {/* Mobile Horizontal Scroll */}
        <div className="lg:hidden overflow-x-auto pb-4 -mx-4 px-4">
          <div className="flex space-x-4 w-max">
            {/* Woman in beige dress */}
            <div className="relative min-w-[280px] h-[350px] rounded-lg border">
              <Image
                src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNt3tzng0rgXZuWwadPABUqnljV5RbJMFsx1v"
                alt="Woman in beige dress"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-30"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-lg font-light mb-1 tracking-wide">Chic Comfort</h3>
                <div className="flex items-center text-sm">
                  <span className="text-lg mr-2">→</span>
                </div>
              </div>
            </div>

            {/* Bag */}
            <div className="relative min-w-[200px] h-[350px] rounded-lg border">
              <Image
                src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNRSZG5OzxCX9qouDwr5d6fTcizLeZ0I4snJvS"
                alt="Sustainable bag"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-30"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <p className="text-sm font-light tracking-wide">Carry Light</p>
                <div className="flex items-center mt-1 text-xs">
                  <span className="text-sm mr-2">→</span>
                </div>
              </div>
            </div>

            {/* Green bowls */}
            <div className="relative min-w-[200px] h-[350px] rounded-lg border">
              <Image
                src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNtw77nUbRj63QywZkxrW40qSphaIEcmUdXDAV"
                alt="Green sustainable bowls"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-30"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <p className="text-xs font-light tracking-wide">Earth Homeware</p>
                <div className="flex items-center mt-1 text-xs">
                  <span className="text-xs mr-1">→</span>
                </div>
              </div>
            </div>

            {/* Man in blue shirt */}
            <div className="relative min-w-[280px] h-[350px] rounded-lg border">
              <Image
                src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNQbOXb5cvbyYEoZ78eJzNIKWdcxq1Of9wlHtA"
                alt="Man in blue shirt"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-30"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-lg font-light mb-1 tracking-wide">Cool & Confident</h3>
                <div className="flex items-center text-sm">
                  <span className="text-lg mr-2">→</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Grid Layout */}
        <div className="hidden lg:grid grid-cols-12 gap-4">
          {/* Left Large Image - Woman in beige dress */}
          <div className="col-span-5 relative h-[600px] rounded-lg border">
            <Image
              src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNt3tzng0rgXZuWwadPABUqnljV5RbJMFsx1v"
              alt="Woman in beige dress"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-30"></div>
            <div className="absolute bottom-6 left-6 text-white">
              <h3 className="text-xl font-light mb-2 tracking-wide">Chic Comfort in Every Stitch.</h3>
              <div className="flex items-center text-sm">
                <span className="text-lg mr-2">→</span>
              </div>
            </div>
          </div>

          {/* Middle Column - Two stacked images */}
          <div className="col-span-3 flex flex-col gap-4">
            {/* Top Middle Image - Bag */}
            <div className="relative h-[289px] rounded-lg border">
              <Image
                src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNRSZG5OzxCX9qouDwr5d6fTcizLeZ0I4snJvS"
                alt="Sustainable bag"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-30"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <p className="text-sm font-light tracking-wide">Carry Light. Tread Lighter.</p>
                <div className="flex items-center mt-1 text-xs">
                  <span className="text-sm mr-2">→</span>
                </div>
              </div>
            </div>
            {/* Bottom Middle Image - Green bowls */}
            <div className="relative h-[289px] rounded-lg border">
              <Image
                src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNtw77nUbRj63QywZkxrW40qSphaIEcmUdXDAV"
                alt="Green sustainable bowls"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-30"></div>
              <div className="absolute bottom-3 left-3 text-white">
                <p className="text-xs font-light tracking-wide">Homeware that Speaks Earth</p>
                <div className="flex items-center mt-1 text-xs">
                  <span className="text-xs mr-1">→</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Large Image - Man in blue shirt */}
          <div className="col-span-4 relative h-[600px] rounded-lg border">
            <Image
              src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNQbOXb5cvbyYEoZ78eJzNIKWdcxq1Of9wlHtA"
              alt="Man in blue shirt"
              fill
              className="object-cover"
            />
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
  );
};

export function Page() {
  return (
    <div>
      <EveryDayEssential />
    </div>
  );
}