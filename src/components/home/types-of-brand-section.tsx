"use client";

import { Clock, Hourglass, Leaf, Recycle } from "lucide-react";

export function BrandsCollaboration() {
    const brands = [
        {
            icon: Hourglass,
            title: "Homegrown",
            description: "Locally crafted, authentic.",
        },
        {
            icon: Leaf,
            title: "Sustainable",
            description: "Eco-friendly, conscious.",
        },
        {
            icon: Clock,
            title: "Artisans-led",
            description: "Crafted by artisans.",
        },
        {
            icon: Recycle,
            title: "Sustainable Drops",
            description: "Limited, eco-focused releases",
        },
    ];

    return (
        <section className="mb-10 w-full bg-[#FCFBF4]">
            <div className="mx-auto max-w-screen-2xl px-4 sm:px-6">
                {/* Section Title */}
                <div className="mb-10 text-center">
                    <h2 className="text-2xl font-normal tracking-tight text-gray-800">
                        Brands We Collaborate With
                    </h2>
                </div>

                {/* Brands Grid */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-4">
                    {brands.map((brand, index) => (
                        <div key={index} className="group px-4 text-center">
                            {/* Icon */}
                            <div className="mb-5 flex justify-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm transition-shadow duration-300 group-hover:shadow-md">
                                    <brand.icon
                                        className="h-6 w-6 text-gray-600 transition-colors duration-300 group-hover:text-gray-800"
                                        strokeWidth={1.5}
                                    />
                                </div>
                            </div>

                            {/* Title */}
                            <h3 className="mb-2 text-lg font-medium tracking-tight text-gray-800">
                                {brand.title}
                            </h3>

                            {/* Description */}
                            <p className="text-sm leading-snug text-gray-600">
                                {brand.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export function Page() {
    return (
        <div className="bg-[#FCFBF4]">
            <BrandsCollaboration />
        </div>
    );
}
