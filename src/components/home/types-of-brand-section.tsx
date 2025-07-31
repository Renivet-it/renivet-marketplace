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
    <section className="w-full bg-[#F4F0EC]">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
        {/* Section Title */}
        <div className="text-center mb-10">
          <h2 className="text-2xl font-normal text-gray-800 tracking-tight">
            Brands We Collaborate With
          </h2>
        </div>

        {/* Brands Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {brands.map((brand, index) => (
            <div key={index} className="text-center group px-4">
              {/* Icon */}
              <div className="flex justify-center mb-5">
                <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-300">
                  <brand.icon 
                    className="w-6 h-6 text-gray-600 group-hover:text-gray-800 transition-colors duration-300" 
                    strokeWidth={1.5}
                  />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-lg font-medium text-gray-800 mb-2 tracking-tight">
                {brand.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-600 leading-snug">
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