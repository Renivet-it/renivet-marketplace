"use client";

import { GeneralShell } from "@/components/globals/layouts";
import Image from "next/image";

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
            <main className="min-h-screen bg-[#fcfbf4] py-10 font-sans">
                {/* TEXT SECTION */}
                <section
                    className="
                        text-[#1A1A1A]
                        px-6
                        md:pl-20
                        lg:pl-24
                        xl:pl-28
                        max-w-[1200px]
                    "
                >
                    <h1 className="mb-4 text-[35px] md:text-[56px] font-normal tracking-[-0.02em]">
                        A Curious Shift
                    </h1>
<div className="
    space-y-4 md:space-y-10
    text-[18px] md:text-[32px]
    leading-[1.45] md:leading-[1.7]
    tracking-[-0.01em]
">

                        <p>
                            There was a time — not very long ago — when fashion colleges proudly
                            taught the supply chains of fast fashion brands.
                        </p>
                        <p>
                            How fast designs moved. How efficiently factories produced. How
                            brilliantly inventory was turned over.
                        </p>
                        <p>Speed was the flex. Scale was the success metric.</p>
                        <p>
                            Students were trained to admire systems built for maximum output,
                            minimum pause. Today, those same colleges teach sustainability.
                            ethics. lifecycle thinking. impact beyond margins.
                        </p>
                        <p>
                            Not because trends changed — but because the old system cracked under
                            its own weight.
                        </p>
                        <p className="text-[20px] md:text-[40px] italic">
                            The irony?
                        </p>
                        <p>
                            The industry already knows something is broken. The institutions have
                            adapted. The curriculum has evolved.
                        </p>
                        <p className="text-[20px] md:text-[34px]">
                            But consumer behaviour?
                        </p>
                    </div>
                </section>

                {/* VISUAL COMPARISON */}
                <section className="relative mx-auto mt-16 md:mt-40 max-w-[1400px]">

                <div className="relative flex flex-col md:flex-row items-center md:items-end justify-center gap-12 md:gap-[140px]">


                        {/* THEN */}
{/* THEN */}
<div className="relative flex w-[230px] md:w-[300px] flex-col items-center">
    <div className="relative">
        <div className="pointer-events-none absolute inset-[-60px] md:inset-[-90px] -z-10 rounded-full bg-[radial-gradient(circle,rgba(170,225,170,0.35)_0%,rgba(170,225,170,0.2)_40%,rgba(170,225,170,0.08)_60%,transparent_75%)]" />
        <div className="relative h-[280px] w-[230px] md:h-[380px] md:w-[300px] overflow-hidden rounded-sm shadow-lg">
            <Image
                src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzN5TVhQ6CWDjbFJxNetTcSvR3ghpVaAzdGolkH"
                alt="Then"
                fill
                className="object-cover"
            />
        </div>
    </div>

<div className="absolute -bottom-32 md:-bottom-40 left-1/2 -translate-x-1/2">


        <Image
            src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNbd5ZtauZc50VbmLPHAdU9KwxEkCINyqDWJRr"
            alt="Clothes pile"
            width={531}
            height={288}
            className="max-w-none scale-75 md:scale-100"
        />
    </div>
</div>


                   {/* ICONS CENTER */}
<div className="relative opacity-80 max-w-[260px] md:max-w-none">

    {/* -------- MOBILE: CLEAN CENTERED ROW -------- */}
    <div className="md:hidden mt-4 flex justify-center">
        <div className="flex items-center gap-6">
            {icons.map((icon, i) => (
                <div key={i} className="relative h-8 w-8">
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

    {/* -------- DESKTOP: ORIGINAL LAYOUT (UNCHANGED) -------- */}
    <div className="hidden md:flex flex-wrap md:flex-col items-center justify-center gap-6 md:gap-14">
        <div className="flex gap-6 md:gap-12">
            {icons.slice(0, 3).map((icon, i) => (
                <div key={i} className="relative h-10 w-10 md:h-12 md:w-12">
                    <Image src={icon.src} alt={icon.alt} fill className="object-contain" />
                </div>
            ))}
        </div>
        <div className="flex gap-6 md:gap-12">
            {icons.slice(3).map((icon, i) => (
                <div key={i} className="relative h-10 w-10 md:h-12 md:w-12">
                    <Image src={icon.src} alt={icon.alt} fill className="object-contain" />
                </div>
            ))}
        </div>
    </div>

</div>


                        {/* NOW */}
  {/* NOW */}
<div className="relative flex w-[230px] md:w-[300px] flex-col items-center">
    <div className="relative">
        <div className="pointer-events-none absolute inset-[-70px] md:inset-[-100px] -z-10 rounded-full bg-[radial-gradient(circle,rgba(170,230,170,0.45)_0%,rgba(170,230,170,0.25)_40%,rgba(170,230,170,0.12)_60%,transparent_75%)]" />
        <div className="relative h-[280px] w-[230px] md:h-[380px] md:w-[300px] overflow-hidden rounded-sm shadow-lg">
            <Image
                src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNcsUQGDeO4H8MeNYoyJQSarWCqgVpRxP5lDBu"
                alt="Now"
                fill
                className="object-cover"
            />
        </div>
    </div>

    <div className="absolute -bottom-28 md:-bottom-36 left-1/2 -translate-x-1/2">
        <Image
            src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNh983pfPAwZ71xI8cmpPRY6WBO42eGEJfosyi"
            alt="Grass"
            width={585}
            height={412}
            className="max-w-none scale-75 md:scale-100"
        />
    </div>
</div>


                    </div>
                </section>

                {/* FACT TAGS */}
<section className="mt-10 w-full flex justify-center px-4 md:hidden">
    <div className="grid grid-cols-2 gap-4">
        {[
            "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNk3zT61xYt1TxMBy6jes3QdWaELUvNIiXHwRO",
            "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNRrC2RWkzxCX9qouDwr5d6fTcizLeZ0I4snJv",
            "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNseeY93bn3bApvy2W4lj8UTcEV5GdMa0thXR6",
            "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzN95LvTBkHuXil56hen8kSx4MtRwUbOEyZdapz",
            "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNBzfhQg0rgXZuWwadPABUqnljV5RbJMFsx1v",
            "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNHAjek9pctzNSTlLa4Po2KvFZm05urDqnVswb",
        ].map((src, i) => (
            <div
                key={i}
                className="relative h-[316px] w-[204px]"
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

{/* ---------- DESKTOP: ORIGINAL SECTION 1 ---------- */}
<section className="hidden md:flex mt-32 w-full justify-center px-4">
    <div className="md:flex md:flex-nowrap md:justify-center md:gap-0">
        {[
            "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNk3zT61xYt1TxMBy6jes3QdWaELUvNIiXHwRO",
            "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNRrC2RWkzxCX9qouDwr5d6fTcizLeZ0I4snJv",
            "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNseeY93bn3bApvy2W4lj8UTcEV5GdMa0thXR6",
        ].map((src, i) => (
            <div
                key={i}
                className="
                    relative
                    md:h-[838px] md:w-[542px]
                    md:-ml-[48px]
                    first:md:ml-0
                "
            >
                <Image src={src} alt={`Fact ${i + 1}`} fill className="object-contain" />
            </div>
        ))}
    </div>
</section>

{/* ---------- DESKTOP: ORIGINAL SECTION 2 ---------- */}
<section className="hidden md:flex mt-10 w-full justify-center px-4">
    <div className="md:flex md:flex-nowrap md:justify-center md:gap-0">
        {[
            "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzN95LvTBkHuXil56hen8kSx4MtRwUbOEyZdapz",
            "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNBzfhQg0rgXZuWwadPABUqnljV5RbJMFsx1v",
            "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNHAjek9pctzNSTlLa4Po2KvFZm05urDqnVswb",
        ].map((src, i) => (
            <div
                key={i}
                className="
                    relative
                    md:h-[838px] md:w-[542px]
                    md:-ml-[48px]
                    first:md:ml-0
                "
            >
                <Image src={src} alt={`Fact ${i + 4}`} fill className="object-contain" />
            </div>
        ))}
    </div>
</section>
            </main>
        </GeneralShell>
    );
}
