"use client";

import { GeneralShell } from "@/components/globals/layouts";
import Image from "next/image";
import {
    Leaf,
    RefreshCw,
    Globe,
    Scissors,
    Handshake,
} from "lucide-react";

export default function CuriousShiftPage() {
    return (
        <GeneralShell
            classNames={{
                mainWrapper: "p-0",
                innerWrapper: "!p-0 !max-w-none",
            }}
        >
            <main className="min-h-screen bg-[#FBF8F1] py-24 font-sans">
                {/* TEXT SECTION */}
                <section
    className="
        text-[#1A1A1A]
        pl-6
        md:pl-20
        lg:pl-24
        xl:pl-28
        max-w-[1200px]
    "
>

                    {/* TITLE */}
                    <h1 className="mb-14 text-[44px] font-normal tracking-[-0.02em] md:text-[56px]">
                        A Curious Shift
                    </h1>

                    {/* BODY */}
<div className="space-y-10 text-[26px] leading-[1.7] tracking-[-0.01em] md:text-[32px]">

    <p>
        there was a time — not very long ago — when fashion colleges proudly
        taught the supply chains of fast fashion brands.
    </p>

    <p>
        how fast designs moved. how efficiently factories produced. how
        brilliantly inventory was turned over.
    </p>

    <p>
        speed was the flex. scale was the success metric.
    </p>

    <p>
        students were trained to admire systems built for maximum output,
        minimum pause. today, those same colleges teach sustainability.
        ethics. lifecycle thinking. impact beyond margins.
    </p>

    <p>
        not because trends changed — but because the old system cracked under
        its own weight.
    </p>

    <p className="pt-6 text-[40px] italic md:text-[40px]">
        the irony?
    </p>

    <p>
        the industry already knows something is broken. the institutions have
        adapted. the curriculum has evolved.
    </p>

    <p className="pt-4 text-[28px] md:text-[34px]">
        but consumer behaviour?
    </p>
</div>


                </section>

                {/* VISUAL COMPARISON */}
{/* VISUAL COMPARISON */}
<section className="relative mx-auto mt-40 max-w-[1400px]">
    <div className="relative flex items-end justify-between">

        {/* THEN */}
        <div className="relative flex w-[360px] flex-col items-center">
            <div className="mb-6 text-[18px] font-medium tracking-[0.25em] text-[#555]">
                THEN
            </div>

            <div className="relative h-[420px] w-[340px] overflow-hidden rounded-sm shadow-lg">
                <Image
                    src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzN5TVhQ6CWDjbFJxNetTcSvR3ghpVaAzdGolkH"
                    alt="Then"
                    fill
                    className="object-cover"
                />
            </div>

            {/* Clothes pile (LEFT) */}
                     <div className="absolute -bottom-40 left-1/2 -translate-x-1/2">
                <Image
                    src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNbd5ZtauZc50VbmLPHAdU9KwxEkCINyqDWJRr"
                    alt="Grass and flowers"
                    width={531}
                    height={288}
                    className="max-w-none"
                />
            </div>
      
        </div>

        {/* ICONS CENTER */}
        <div className="relative mb-32 flex flex-col items-center gap-14 opacity-70">
            <div className="flex gap-12">
                <Leaf />
                <Handshake />
                <RefreshCw />
            </div>
            <div className="flex gap-12">
                <Scissors />
                <Globe />
            </div>
        </div>

        {/* NOW */}
        <div className="relative flex w-[360px] flex-col items-center">
            <div className="mb-6 text-[18px] font-medium tracking-[0.25em] text-[#555]">
                NOW
            </div>

            <div className="relative h-[420px] w-[340px] overflow-hidden rounded-sm shadow-lg">
                <Image
                    src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNcsUQGDeO4H8MeNYoyJQSarWCqgVpRxP5lDBu"
                    alt="Now"
                    fill
                    className="object-cover"
                />
            </div>

            {/* Grass / flowers (RIGHT) */}
         <div className="absolute -bottom-36 left-1/2 -translate-x-1/2">
                <Image
                    src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNh983pfPAwZ71xI8cmpPRY6WBO42eGEJfosyi"
                    alt="Discarded clothes"
                    width={585}
                    height={412}
                    className="max-w-none"
                />
            </div>
        </div>

    </div>
</section>

            </main>
        </GeneralShell>
    );
}
