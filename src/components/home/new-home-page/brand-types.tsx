"use client";

import Image from "next/image";
import Link from "next/link";

export function BrandTypes() {
    const categories = [
        {
            title: "Homegrown",
            subtitle: "Locally crafted, authentic.",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNmxSQIcNpGL6AgslOfF3vz5Wa1NUerQXMBIPZ",
        },
        {
            title: "Sustainable",
            subtitle: "Eco-friendly, conscious.",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNcV44IPLeO4H8MeNYoyJQSarWCqgVpRxP5lDB",
        },
        {
            title: "Sustainable Drops",
            subtitle: "Limited, eco-focused releases.",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzN2RP7nQOYTpvrXwqtZHon4P85jVxyMmDkf3sz",
        },
        {
            title: "Artisan-led",
            subtitle: "Crafted by artisans.",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzN81PIEujj1qpSPZJEOTHVgaenl2yArM78zCkm",
        },
    ];

    return (
        <section className="w-full bg-[#FCFBF4] px-4 py-2">
            {/* Heading */}
            <h2 className="mb-6 text-center font-playfair text-[18px] font-[400] leading-[1.3] tracking-[0.5px] text-[#7A6338] md:text-[26px]">
                Type of Brands we collaborate with
            </h2>

            {/* DESKTOP — Single row, 4 images horizontally */}
            <div className="mx-auto hidden max-w-[1550px] justify-center gap-8 md:flex">
                {categories.map((item, index) => (
                    <Link
                        key={index}
                        href="/shop"
                        className="group relative h-[380px] w-[350px] overflow-hidden"
                    >
                        <Image
                            src={item.imageUrl}
                            alt={item.title}
                            fill
                            sizes="350px"
                            className="object-cover transition-all duration-300 group-hover:scale-105"
                        />
                    </Link>
                ))}
            </div>

            {/* MOBILE — 2×2 Grid */}
            <div className="mx-auto grid max-w-lg grid-cols-2 gap-4 md:hidden">
                {categories.map((item, index) => (
                    <Link
                        key={index}
                        href="/shop"
                        className="group relative h-[220px] w-full overflow-hidden"
                    >
                        <Image
                            src={item.imageUrl}
                            alt={item.title}
                            fill
                            sizes="50vw"
                            className="object-cover"
                        />
                    </Link>
                ))}
            </div>
        </section>
    );
}
