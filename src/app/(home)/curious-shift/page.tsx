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
const icons = [
    {
        src: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNw3U5csrQTkEsKW16AOLVjr8DhmeCypgUGfJz",
        alt: "Eco Friendly",
    },
    {
        src: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzN4iJMgcKTrA2wJk4WKdFytgsaQSNjmBo8I5CG",
        alt: "Ethical Sourcing",
    },
    {
        src: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNjgOYT4fmPpnZoHc5f2E4rFNLugdK3ty9ObjY",
        alt: "Circular Economy",
    },
    {
        src: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNyax3gRp5TEHko4KfX8CDn1z7Q2migSIjw0ds",
        alt: "Artisan Support",
    },
    {
        src: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNoOEp2o0WvnGEidmOVIP6xXt4S7befYUykMJq",
        alt: "Global Impact",
    },
];

export default function CuriousShiftPage() {
    return (
        <GeneralShell
            classNames={{
                mainWrapper: "p-0",
                innerWrapper: "!p-0 !max-w-none",
            }}
        >
            <main className="min-h-screen bg-[#fcfbf4] py-24 font-sans">
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
    <div className="relative flex items-end justify-center gap-[140px]">

        {/* THEN */}
        <div className="relative flex w-[360px] flex-col items-center">
              <div className="absolute inset-[-90px] -z-10 rounded-full bg-[radial-gradient(circle,rgba(170,225,170,0.55)_0%,rgba(170,225,170,0.32)_35%,rgba(170,225,170,0.15)_55%,rgba(170,225,170,0.06)_70%,transparent_80%)]" />
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
{/* ICONS CENTER */}
<div className="relative mb-32 flex flex-col items-center gap-14 opacity-80">
    {/* Top row (3 icons) */}
    <div className="flex gap-12">
        {icons.slice(0, 3).map((icon, i) => (
            <div key={i} className="relative h-12 w-12">
                <Image
                    src={icon.src}
                    alt={icon.alt}
                    fill
                    className="object-contain"
                />
            </div>
        ))}
    </div>

    {/* Bottom row (2 icons) */}
    <div className="flex gap-12">
        {icons.slice(3).map((icon, i) => (
            <div key={i} className="relative h-12 w-12">
                <Image
                    src={icon.src}
                    alt={icon.alt}
                    fill
                    className="object-contain"
                />
            </div>
        ))}
    </div>
</div>


        {/* NOW */}
        <div className="relative flex w-[360px] flex-col items-center">
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
{/* FACT TAGS SECTION */}
<section className="mt-32 w-full flex justify-center">
    <div className="flex">
        {[
            "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNk3zT61xYt1TxMBy6jes3QdWaELUvNIiXHwRO",
            "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNRrC2RWkzxCX9qouDwr5d6fTcizLeZ0I4snJv",
            "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNseeY93bn3bApvy2W4lj8UTcEV5GdMa0thXR6",
        ].map((src, i) => (
            <div
                key={i}
                className={`
                    relative
                    h-[838px]
                    w-[542px]
                    flex-shrink-0
                    ${i !== 0 ? "-ml-[48px]" : ""}
                `}
            >
                <Image
                    src={src}
                    alt={`Fact ${i + 1}`}
                    fill
                    className="object-contain"
                />
            </div>
        ))}
    </div>
</section>

<section className="mt-10 w-full flex justify-center">
    <div className="flex">
        {[
            "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzN95LvTBkHuXil56hen8kSx4MtRwUbOEyZdapz",
            "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNBzfhQg0rgXZuWwadPABUqnljV5RbJMFsx1v",
            "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNHAjek9pctzNSTlLa4Po2KvFZm05urDqnVswb",
        ].map((src, i) => (
            <div
                key={i}
                className={`
                    relative
                    h-[838px]
                    w-[542px]
                    flex-shrink-0
                    ${i !== 0 ? "-ml-[48px]" : ""}
                `}
            >
                <Image
                    src={src}
                    alt={`Fact ${i + 1}`}
                    fill
                    className="object-contain"
                />
            </div>
        ))}
    </div>
</section>

            </main>
        </GeneralShell>
    );
}
