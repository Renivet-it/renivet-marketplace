import { BadgeCheck, Leaf, Palette, Sprout } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const SustainableBadges = () => {
    return (
        <div className="bg-white">
            {/* Header Section */}
            <div className="bg-white py-8 text-center md:py-12">
                <h2 className="mb-4 text-3xl font-light tracking-tight text-gray-800 md:mb-6 md:text-4xl lg:text-5xl">
                    Conscious. Effortless. Everyday.
                </h2>
                <div className="mx-auto max-w-sm text-sm leading-relaxed text-gray-600 md:text-base">
                    <p>
                        explore fashion and living essentials that feel as good
                        as they look
                    </p>
                </div>
            </div>

            {/* Mobile Layout - Grid */}
            <div className="mx-auto max-w-[1400px] px-6 pb-8 lg:hidden">
                <div className="grid grid-cols-2 gap-4">
                    {/* Woman in beige dress - Top left */}
                    <div className="relative col-span-2 aspect-[16/9] overflow-hidden rounded-2xl">
                        <Image
                            src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNSx4iy4Vko7HapsZqM8bNKQ6yVL5jDhwcr1AF"
                            alt="Woman in beige dress"
                            fill
                            className="object-cover brightness-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                        <div className="absolute bottom-6 left-6 text-white">
                            <h3 className="text-base font-light tracking-wide">
                                Chic Comfort
                            </h3>
                            <Link href="/shop" className="flex items-center">
                                <span className="text-lg">→</span>
                            </Link>
                        </div>
                    </div>

                    {/* Sustainable bag - Bottom left */}
                    <div className="relative aspect-square overflow-hidden rounded-2xl">
                        <Image
                            src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNg8OTqX2ENPRLZdGUpA0elOxytCDfJibYIko7"
                            alt="Sustainable bag"
                            fill
                            className="object-cover brightness-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                        <div className="absolute bottom-6 left-6 text-white">
                            <p className="text-sm font-light tracking-wide">
                                Carry Light
                            </p>
                            <Link href="/shop" className="flex items-center">
                                <span className="text-base">→</span>
                            </Link>
                        </div>
                    </div>

                    {/* Green bowls - Bottom right */}
                    <div className="relative aspect-square overflow-hidden rounded-2xl">
                        <Image
                            src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzN379xwG5l64McafQHoWsZUzihAkJ3DF5EGgPp"
                            alt="Green sustainable bowls"
                            fill
                            className="object-cover brightness-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                        <div className="absolute bottom-6 left-6 text-white">
                            <p className="text-sm font-light tracking-wide">
                                Earth Homeware
                            </p>
                            <Link href="/shop" className="flex items-center">
                                <span className="text-base">→</span>
                            </Link>
                        </div>
                    </div>

                    {/* Man in blue shirt - Bottom */}
                    <div className="relative col-span-2 aspect-[16/9] overflow-hidden rounded-2xl">
                        <Image
                            src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNpRrGXftYoKFqlYMSWzhgNZG6Cm5OtIUjre39"
                            alt="Man in blue shirt"
                            fill
                            className="object-cover brightness-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                        <div className="absolute bottom-6 left-6 text-white">
                            <h3 className="text-base font-light tracking-wide">
                                Cool & Confident
                            </h3>
                            <Link href="/shop" className="flex items-center">
                                <span className="text-lg">→</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop Layout */}
            <div className="mx-auto hidden max-w-[1550px] px-6 pb-12 lg:block">
                <div className="grid grid-cols-12 gap-6">
                    {/* Left Large Image */}
                    <div className="relative col-span-5">
                        <div
                            className="relative overflow-hidden rounded-2xl"
                            style={{ height: "720px" }}
                        >
                            <Image
                                src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNSx4iy4Vko7HapsZqM8bNKQ6yVL5jDhwcr1AF"
                                alt="Woman in beige dress"
                                fill
                                className="object-cover brightness-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent"></div>
                            <div className="absolute bottom-8 left-8 text-white">
                                <h3 className="mb-2 text-2xl font-light tracking-wide">
                                    Chic Comfort in Every Stitch.
                                </h3>
                                <Link
                                    href="/shop"
                                    className="flex items-center"
                                >
                                    <span className="mr-2 text-xl">→</span>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Middle Column */}
                    <div className="col-span-3 space-y-6">
                        {/* Top Middle Image */}
                        <div className="relative" style={{ height: "345px" }}>
                            <div className="relative h-full overflow-hidden rounded-2xl">
                                <Image
                                    src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNg8OTqX2ENPRLZdGUpA0elOxytCDfJibYIko7"
                                    alt="Sustainable bag"
                                    fill
                                    className="object-cover brightness-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent"></div>
                                <div className="absolute bottom-6 left-6 text-white">
                                    <p className="text-base font-light tracking-wide">
                                        Carry Light. Tread Lighter.
                                    </p>
                                    <Link
                                        href="/shop"
                                        className="flex items-center"
                                    >
                                        <span className="mr-2 text-lg">→</span>
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Middle Image */}
                        <div className="relative" style={{ height: "345px" }}>
                            <div className="relative h-full overflow-hidden rounded-2xl">
                                <Image
                                    src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzN379xwG5l64McafQHoWsZUzihAkJ3DF5EGgPp"
                                    alt="Green sustainable bowls"
                                    fill
                                    className="object-cover brightness-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent"></div>
                                <div className="absolute bottom-6 left-6 text-white">
                                    <p className="text-base font-light tracking-wide">
                                        Homeware that Speaks Earth
                                    </p>
                                    <Link
                                        href="/shop"
                                        className="flex items-center"
                                    >
                                        <span className="mr-2 text-lg">→</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Large Image */}
                    <div className="relative col-span-4">
                        <div
                            className="relative overflow-hidden rounded-2xl"
                            style={{ height: "720px" }}
                        >
                            <Image
                                src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNpRrGXftYoKFqlYMSWzhgNZG6Cm5OtIUjre39"
                                alt="Man in blue shirt"
                                fill
                                className="object-cover brightness-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent"></div>
                            <div className="absolute bottom-8 left-8 text-white">
                                <h3 className="mb-2 text-2xl font-light tracking-wide">
                                    Cool. Conscious. Confident.
                                </h3>
                                <Link
                                    href="/shop"
                                    className="flex items-center"
                                >
                                    <span className="mr-2 text-xl">→</span>
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
