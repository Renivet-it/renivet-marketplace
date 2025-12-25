"use client";

import Link from "next/link";
import Image from "next/image";
import { Icons } from "@/components/icons";

export function WelcomeRenivet() {
  return (
   <section className="w-full bg-[#FCFBF4] py-6 px-0 md:px-4">

      {/* ⬇️ BORDER ONLY ON DESKTOP */}
      <div className="max-w-[1600px] mx-auto bg-[#fbfaf4] px-6 md:px-16 py-6 md:border md:border-[#D8D2C7] ">

        {/* ---------------- DESKTOP ---------------- */}
        <div className="hidden md:flex items-start gap-12">

          {/* LEFT IMAGE */}
          <div className="relative w-[480px] h-[430px] rounded-md overflow-hidden">
            <Image
              src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNkKIY1exYt1TxMBy6jes3QdWaELUvNIiXHwRO"
              alt="Renivet Circle"
              fill
              className="object-cover"
            />
          </div>

          {/* RIGHT CONTENT */}
          <div className="flex-1 flex flex-col items-center text-center">

            <h2 className="text-[26px] font-light text-[#3B3B3B] mb-5 tracking-wide">
              Welcome to the Renivet Circle
            </h2>

            <div className="flex gap-5 mb-6 text-[#3B3B3B]">
              <Icons.Leaf size={28} strokeWidth={1.25} />
              <Icons.Recycle size={28} strokeWidth={1.25} />
              <Icons.Footprints size={28} strokeWidth={1.25} />
              <Icons.Heart size={28} strokeWidth={1.25} />
              <Icons.Globe size={28} strokeWidth={1.25} />
            </div>

            <div className="text-[#474747] text-[16px] leading-relaxed max-w-[620px] space-y-4">
              <p>Renivet isn’t just a marketplace — it’s a curated space of discovery.</p>
              <p>
                We connect you with brands that are sustainable, homegrown, and crafted
                with intention. Every piece here tells a story — of craft, culture,
                and conscious creation.
              </p>
              <p>
                We believe in the stories behind products, the meaning behind
                making, and the people behind brands.
              </p>
              <p>Renivet is where thoughtful creation meets thoughtful living.</p>
            </div>

            <Link
              href="/about"
              className="mt-8 px-6 py-2 border border-gray-500 text-gray-700 text-sm  hover:bg-gray-100 transition"
            >
              → Discover Our Story
            </Link>
          </div>
        </div>

        {/* ---------------- MOBILE ---------------- */}
{/* ---------------- MOBILE ---------------- */}
<div className="md:hidden flex justify-center">
  <div
    className="bg-[#fbfaf4] border border-[#D8D2C7]
               w-full max-w-[420px] h-[417px]
               px-8 py-5
               flex flex-col items-center text-center"
  >

    <h2 className="text-[15.5px] font-light text-[#3B3B3B] tracking-wide mb-2">
      Welcome to the Renivet Circle
    </h2>

    <div className="flex gap-2.5 mb-3 text-[#3B3B3B]">
      <Icons.Leaf size={15} strokeWidth={1.2} />
      <Icons.Recycle size={15} strokeWidth={1.2} />
      <Icons.Footprints size={15} strokeWidth={1.2} />
      <Icons.Heart size={15} strokeWidth={1.2} />
      <Icons.Globe size={15} strokeWidth={1.2} />
    </div>

    <div className="w-full text-[#4A4A4A] text-[11px] leading-[1.5] space-y-2.5 mb-3">
      <p>Renivet isn’t just a marketplace — it’s a curated space of discovery.</p>
      <p>
        We connect you with brands that are sustainable, homegrown, and crafted
        with intention. Every piece here tells a story — of craft, culture,
        and conscious creation.
      </p>
      <p>
        We believe in the stories behind products, the meaning behind making,
        and the people behind brands.
      </p>
      <p>
        Renivet is where thoughtful creation meets thoughtful living.
      </p>
    </div>

    <div className="relative w-[110px] h-[96px]  overflow-hidden mb-3">
      <Image
        src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNkKIY1exYt1TxMBy6jes3QdWaELUvNIiXHwRO"
        alt="Renivet Circle"
        fill
        className="object-cover"
      />
    </div>

    <Link
      href="/about"
      className="mt-auto px-4 py-1.5 border border-[#8C8C8C]
                 text-[#3B3B3B] text-[12px]
                  hover:bg-gray-100 transition"
    >
      → Discover Our Story
    </Link>
  </div>
</div>


      </div>
    </section>
  );
}
