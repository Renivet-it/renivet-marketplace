"use client";

import { Hourglass, Leaf, Clock, Recycle } from "lucide-react";

export function BrandsCollaboration() {
  const brands = [
    {
      icon: Hourglass,
      title: "Homegrown",
      description: "Locally crafted, authentic."
    },
    {
      icon: Leaf,
      title: "Sustainable",
      description: "Eco-friendly, conscious."
    },
    {
      icon: Clock,
      title: "Artisans-led",
      description: "Crafted by artisans."
    },
    {
      icon: Recycle,
      title: "Sustainable Drops",
      description: "Limited, eco-focused releases"
    }
  ];

  return (
    <section className="w-full bg-[#F4F0EC] py-8 mb-10">
      <div className="max-w-screen-2xl mx-auto px-2 sm:px-6">
        {/* Section Title */}
        <div className="text-center mb-6 sm:mb-10">
          <h2 className="text-base sm:text-2xl font-normal text-gray-800 tracking-tight">
            Brands We Collaborate With
          </h2>
        </div>

        {/* Always 4 in one row */}
        <div className="grid grid-cols-4 gap-2 sm:gap-6">
          {brands.map((brand, index) => (
            <div
              key={index}
              className="bg-white rounded-md shadow-sm p-2 sm:p-4 text-center hover:shadow-md transition-shadow duration-300"
            >
              {/* Icon */}
              <div className="flex justify-center mb-2 sm:mb-4">
                <brand.icon
                  className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800"
                  strokeWidth={1.5}
                />
              </div>

              {/* Title */}
              <h3 className="text-[10px] sm:text-base font-semibold text-gray-800 mb-1 sm:mb-2">
                {brand.title}
              </h3>

              {/* Description */}
              <p className="text-[9px] sm:text-sm text-gray-600 leading-snug">
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
    <div className="bg-[#F4F0EC]">
      <BrandsCollaboration />
    </div>
  );
}
