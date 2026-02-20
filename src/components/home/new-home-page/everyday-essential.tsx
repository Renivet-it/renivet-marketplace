import Image from "next/image";
import Link from "next/link";
import React from "react";

const EveryDayEssential = () => {
    return (
        <div className="relative overflow-hidden bg-[#FCFBF4]">
            <div className="w-full px-4 py-8 md:px-8 md:py-16">
                {/* Header */}
                <div className="mb-8 text-center md:mb-12">
                    <h1 className="mb-4 text-3xl font-bold text-gray-800 md:text-4xl lg:text-5xl">
                        Everyday Essentials, Ethically Made
                    </h1>
                    <p className="px-4 text-base text-gray-700 md:text-lg">
                        From clean skincare to thoughtful homeware — discover
                        the good stuff.
                    </p>
                </div>

                {/* Product Cards - Responsive Layout */}
                <div className="flex flex-col items-center justify-center gap-6 md:flex-row md:items-end md:gap-8">
                    {/* Coconut Oil Card - Large on desktop, full width on mobile */}
                    <div className="relative h-80 w-full max-w-sm overflow-hidden rounded-3xl shadow-xl md:h-[480px] md:w-96">
                        <Image
                            src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNt3tzng0rgXZuWwadPABUqnljV5RbJMFsx1v"
                            alt="Coconut Oil with coconut and palm leaves"
                            fill
                            sizes="(max-width: 768px) 100vw, 384px"
                            className="object-cover brightness-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent"></div>
                        <div className="absolute left-6 top-6 text-white">
                            <h3 className="text-lg font-medium">Coconut Oil</h3>
                        </div>
                        <div className="absolute bottom-6 left-6">
                            <Link
                                href="/shop"
                                className="inline-block border border-white/50 px-4 py-2 text-sm font-medium text-white transition-colors duration-300 hover:bg-white/20"
                            >
                                → EXPLORE NOW
                            </Link>
                        </div>
                    </div>

                    {/* Face & Body Scrub Card - Small on desktop, full width on mobile */}
                    <div className="relative h-80 w-full max-w-sm overflow-hidden rounded-3xl shadow-xl md:h-96 md:w-80">
                        <Image
                            src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNRSZG5OzxCX9qouDwr5d6fTcizLeZ0I4snJvS"
                            alt="Green tea and neem scrub jar"
                            fill
                            sizes="(max-width: 768px) 100vw, 320px"
                            className="object-cover brightness-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent"></div>
                        <div className="absolute left-6 top-6 text-white">
                            <h3 className="text-lg font-medium">
                                Face & Body Scrub
                            </h3>
                        </div>
                        <div className="absolute bottom-6 left-6">
                            <Link
                                href="/shop"
                                className="inline-block border border-white/50 px-4 py-2 text-sm font-medium text-white transition-colors duration-300 hover:bg-white/20"
                            >
                                → EXPLORE NOW
                            </Link>
                        </div>
                    </div>

                    {/* Eco Candles Card - Small on desktop, full width on mobile */}
                    <div className="relative h-80 w-full max-w-sm overflow-hidden rounded-3xl shadow-xl md:h-96 md:w-80">
                        <Image
                            src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNtw77nUbRj63QywZkxrW40qSphaIEcmUdXDAV"
                            alt="Eco-friendly candles with natural materials"
                            fill
                            sizes="(max-width: 768px) 100vw, 320px"
                            className="object-cover brightness-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent"></div>
                        <div className="absolute left-6 top-6 text-white">
                            <h3 className="text-lg font-medium">Eco Candles</h3>
                        </div>
                        <div className="absolute bottom-6 left-6">
                            <Link
                                href="/shop"
                                className="inline-block border border-white/50 px-4 py-2 text-sm font-medium text-white transition-colors duration-300 hover:bg-white/20"
                            >
                                → EXPLORE NOW
                            </Link>
                        </div>
                    </div>

                    {/* Handmade Mat Card - Large on desktop, full width on mobile */}
                    <div className="relative h-80 w-full max-w-sm overflow-hidden rounded-3xl shadow-xl md:h-[480px] md:w-96">
                        <Image
                            src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNQbOXb5cvbyYEoZ78eJzNIKWdcxq1Of9wlHtA"
                            alt="Handmade woven mat with natural materials"
                            fill
                            sizes="(max-width: 768px) 100vw, 384px"
                            className="object-cover brightness-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent"></div>
                        <div className="absolute left-6 top-6 text-white md:left-auto md:right-6">
                            <h3 className="text-lg font-medium">
                                Handmade Mat
                            </h3>
                        </div>
                        <div className="absolute bottom-6 left-6 md:left-auto md:right-6">
                            <Link
                                href="/shop"
                                className="inline-block border border-white/50 px-4 py-2 text-sm font-medium text-white transition-colors duration-300 hover:bg-white/20"
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
