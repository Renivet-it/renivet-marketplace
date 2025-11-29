"use client";

import Link from "next/link";
import Image from "next/image";
import { Icons } from "@/components/icons";

export function WelcomeRenivet() {
  return (
    <section className="w-full bg-[#fbfaf4] py-6 px-4">
      <div className="max-w-[1600px] mx-auto border border-[#D8D2C7] bg-[#fbfaf4] rounded-md px-6 md:px-16 py-6">

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

            {/* TITLE */}
            <h2 className="text-[26px] font-light text-[#3B3B3B] mb-5 tracking-wide">
              Welcome to the Renivet Circle
            </h2>

            {/* ICON ROW – LUCIDE ICONS */}
            <div className="flex gap-5 mb-6 text-[#3B3B3B]">
              <Icons.Leaf size={28} strokeWidth={1.25} />
              <Icons.Recycle size={28} strokeWidth={1.25} />
              <Icons.Footprints size={28} strokeWidth={1.25} />
              <Icons.Heart size={28} strokeWidth={1.25} />
              <Icons.Globe size={28} strokeWidth={1.25} />
            </div>

            {/* DESCRIPTION */}
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

            {/* BUTTON */}
            <Link
              href="/about"
              className="mt-8 px-6 py-2 border border-gray-500 text-gray-700 text-sm rounded-sm hover:bg-gray-100 transition"
            >
              → Discover Our Story
            </Link>

          </div>
        </div>

        {/* ---------------- MOBILE ---------------- */}
{/* ---------------- MOBILE ---------------- */}
<div className="md:hidden flex flex-col items-center text-center px-3">

  {/* TITLE */}
  <h2 className="text-[18px] font-light text-[#3B3B3B] mb-3 tracking-wide">
    Welcome to the Renivet Circle
  </h2>

  {/* ICON ROW MOBILE */}
  <div className="flex gap-3 mb-4 text-[#3B3B3B]">
    <Icons.Leaf size={20} strokeWidth={1.25} />
    <Icons.Recycle size={20} strokeWidth={1.25} />
    <Icons.Footprints size={20} strokeWidth={1.25} />
    <Icons.Heart size={20} strokeWidth={1.25} />
    <Icons.Globe size={20} strokeWidth={1.25} />
  </div>

  {/* TEXT */}
  <div className="text-[#474747] text-[13px] leading-relaxed max-w-[85%] space-y-2 mb-5">
    <p>Renivet isn’t just a marketplace — it’s a curated space of discovery.</p>

    <p>
      We connect you with brands that are sustainable, homegrown, and crafted
      with intention. Every piece here tells a story — of craft, culture, and
      conscious creation.
    </p>

    <p>
      We believe in the stories behind products, the meaning behind making,
      and the people behind brands.
    </p>

    <p>Renivet is where thoughtful creation meets thoughtful living.</p>
  </div>

  {/* MOBILE IMAGE */}
  <div className="relative w-[220px] h-[200px] rounded-md overflow-hidden mb-6">
    <Image
      src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNkKIY1exYt1TxMBy6jes3QdWaELUvNIiXHwRO"
      alt="Renivet Circle"
      fill
      className="object-cover"
    />
  </div>

  {/* BUTTON */}
  <Link
    href="/about"
    className="px-5 py-2 border border-gray-500 text-gray-700 text-[13px] rounded-sm hover:bg-gray-100 transition"
  >
    → Discover Our Story
  </Link>
</div>

      </div>
    </section>
  );
}
