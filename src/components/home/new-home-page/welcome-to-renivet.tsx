"use client";

import { Icons } from "@/components/icons";
import Image from "next/image";
import Link from "next/link";

export function WelcomeRenivet() {
    return (
        <section className="w-full bg-[#FCFBF4] px-0 py-4 md:px-4">
            {/* ⬇️ BORDER ONLY ON DESKTOP */}
            <div className="mx-auto max-w-[1600px] bg-[#fbfaf4] px-6 py-6 md:border md:border-[#D8D2C7] md:px-16">
                {/* ---------------- DESKTOP ---------------- */}
                <div className="hidden items-start gap-12 md:flex">
                    {/* LEFT IMAGE */}
                    <div className="relative h-[430px] w-[480px] overflow-hidden rounded-md">
                        <Image
                            src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNkKIY1exYt1TxMBy6jes3QdWaELUvNIiXHwRO"
                            alt="Renivet Circle"
                            fill
                            className="object-cover"
                        />
                    </div>

                    {/* RIGHT CONTENT */}
                    <div className="flex flex-1 flex-col items-center text-center">
                        <h2 className="mb-5 text-[26px] font-light tracking-wide text-[#3B3B3B]">
                            Welcome to the Renivet Circle
                        </h2>

                        <div className="mb-6 flex gap-5 text-[#3B3B3B]">
                            <Icons.Leaf size={28} strokeWidth={1.25} />
                            <Icons.Recycle size={28} strokeWidth={1.25} />
                            <Icons.Footprints size={28} strokeWidth={1.25} />
                            <Icons.Heart size={28} strokeWidth={1.25} />
                            <Icons.Globe size={28} strokeWidth={1.25} />
                        </div>

                        <div className="max-w-[620px] space-y-4 text-[16px] leading-relaxed text-[#474747]">
                            <p>
                                Renivet isn’t just a marketplace — it’s a
                                curated space of discovery.
                            </p>
                            <p>
                                We connect you with brands that are sustainable,
                                homegrown, and crafted with intention. Every
                                piece here tells a story — of craft, culture,
                                and conscious creation.
                            </p>
                            <p>
                                We believe in the stories behind products, the
                                meaning behind making, and the people behind
                                brands.
                            </p>
                            <p>
                                Renivet is where thoughtful creation meets
                                thoughtful living.
                            </p>
                        </div>

                        <Link
                            href="/about"
                            className="mt-8 border border-gray-500 px-6 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
                        >
                            → Discover Our Story
                        </Link>
                    </div>
                </div>

                {/* ---------------- MOBILE ---------------- */}
                {/* ---------------- MOBILE ---------------- */}
                <div className="flex justify-center md:hidden">
                    <div className="flex h-[417px] w-full max-w-[420px] flex-col items-center border border-[#D8D2C7] bg-[#fbfaf4] px-8 py-5 text-center">
                        <h2 className="mb-2 text-[15.5px] font-light tracking-wide text-[#3B3B3B]">
                            Welcome to the Renivet Circle
                        </h2>

                        <div className="mb-3 flex gap-2.5 text-[#3B3B3B]">
                            <Icons.Leaf size={15} strokeWidth={1.2} />
                            <Icons.Recycle size={15} strokeWidth={1.2} />
                            <Icons.Footprints size={15} strokeWidth={1.2} />
                            <Icons.Heart size={15} strokeWidth={1.2} />
                            <Icons.Globe size={15} strokeWidth={1.2} />
                        </div>

                        <div className="mb-3 w-full space-y-2.5 text-[11px] leading-[1.5] text-[#4A4A4A]">
                            <p>
                                Renivet isn’t just a marketplace — it’s a
                                curated space of discovery.
                            </p>
                            <p>
                                We connect you with brands that are sustainable,
                                homegrown, and crafted with intention. Every
                                piece here tells a story — of craft, culture,
                                and conscious creation.
                            </p>
                            <p>
                                We believe in the stories behind products, the
                                meaning behind making, and the people behind
                                brands.
                            </p>
                            <p>
                                Renivet is where thoughtful creation meets
                                thoughtful living.
                            </p>
                        </div>

                        <div className="relative mb-3 h-[96px] w-[110px] overflow-hidden">
                            <Image
                                src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNkKIY1exYt1TxMBy6jes3QdWaELUvNIiXHwRO"
                                alt="Renivet Circle"
                                fill
                                sizes="(max-width: 768px) 120px, 480px"
                                className="object-cover"
                            />
                        </div>

                        <Link
                            href="/about"
                            className="mt-auto border border-[#8C8C8C] px-4 py-1.5 text-[12px] text-[#3B3B3B] transition hover:bg-gray-100"
                        >
                            → Discover Our Story
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
