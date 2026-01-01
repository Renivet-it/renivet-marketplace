"use client";

import Image from "next/image";

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
    <section className="w-full bg-[#FCFBF4] py-2 px-4">
      {/* Heading */}
<h2 className="text-center font-[400] text-[18px] md:text-[26px] leading-[1.3] tracking-[0.5px] text-[#7A6338] font-playfair mb-6">
  Type of Brands we collaborate with
</h2>





      {/* DESKTOP — Single row, 4 images horizontally */}
      <div className="hidden md:flex justify-center gap-8 max-w-[1550px] mx-auto">
        {categories.map((item, index) => (
          <div
            key={index}
            className="relative group w-[350px] h-[380px] overflow-hidden"
          >
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              className="object-cover group-hover:scale-105 transition-all duration-300"
            />

          </div>
        ))}
      </div>

      {/* MOBILE — 2×2 Grid */}
      <div className="md:hidden grid grid-cols-2 gap-4 max-w-lg mx-auto">
        {categories.map((item, index) => (
          <div key={index} className="relative group w-full h-[220px] overflow-hidden">
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              className="object-cover"
            />

          </div>
        ))}
      </div>
    </section>
  );
}
