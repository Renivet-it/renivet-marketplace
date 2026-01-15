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
                        md:pl-24
                        lg:pl-32
                        xl:pl-40
                        max-w-[820px]
                    "
                >
                    {/* TITLE */}
                    <h1 className="mb-14 text-[44px] font-normal tracking-[-0.02em] md:text-[56px]">
                        A Curious Shift
                    </h1>

                    {/* BODY */}
                    <div className="space-y-12 text-[26px] leading-[1.65] tracking-[-0.01em] md:text-[32px]">
                        <p>
                            there was a time — not very long ago — <br />
                            when fashion colleges proudly taught the supply
                            chains of fast fashion brands.
                        </p>

                        <p>
                            how fast designs moved. <br />
                            how efficiently factories produced. <br />
                            how brilliantly inventory was turned over.
                        </p>

                        <p>
                            speed was the flex. <br />
                            scale was the success metric.
                        </p>

                        <p>
                            students were trained to admire systems built for
                            maximum output, minimum pause. today, those same
                            colleges teach sustainability. ethics. lifecycle
                            thinking. impact beyond margins.
                        </p>

                        <p>
                            not because trends changed — <br />
                            but because the old system cracked under its own
                            weight.
                        </p>

                        {/* EMPHASIS */}
                        <p className="pt-6 text-[28px] italic md:text-[34px]">
                            the irony?
                        </p>

                        <p>
                            the industry already knows something is broken.{" "}
                            <br />
                            the institutions have adapted. <br />
                            the curriculum has evolved.
                        </p>

                        {/* QUESTION */}
                        <p className="pt-4 text-[28px] md:text-[34px]">
                            but consumer behaviour?
                        </p>
                    </div>
                </section>

                {/* VISUAL COMPARISON */}
                <section className="relative mx-auto mt-40 max-w-6xl">
                    <div className="relative flex flex-col items-center justify-between gap-24 md:flex-row">
                        {/* THEN */}
                        <div className="relative flex flex-col items-center">
                            <div className="mb-4 text-[18px] font-medium tracking-[0.25em] text-[#555]">
                                THEN
                            </div>
                            <div className="relative h-[380px] w-[300px] overflow-hidden rounded-sm shadow-lg">
                                <Image
                                    src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzN5TVhQ6CWDjbFJxNetTcSvR3ghpVaAzdGolkH"
                                    alt="Then"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="absolute -bottom-20 left-1/2 h-28 w-56 -translate-x-1/2 bg-gradient-to-t from-gray-300 to-transparent opacity-60 blur-2xl" />
                        </div>

                        {/* ICONS */}
                        <div className="flex flex-col items-center gap-12 opacity-60">
                            <div className="flex gap-10">
                                <Leaf />
                                <Handshake />
                                <RefreshCw />
                            </div>
                            <div className="flex gap-10">
                                <Scissors />
                                <Globe />
                            </div>
                        </div>

                        {/* NOW */}
                        <div className="relative flex flex-col items-center">
                            <div className="mb-4 text-[18px] font-medium tracking-[0.25em] text-[#555]">
                                NOW
                            </div>
                            <div className="relative h-[380px] w-[300px] overflow-hidden rounded-sm shadow-lg">
                                <Image
                                    src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzN5TVhQ6CWDjbFJxNetTcSvR3ghpVaAzdGolkH"
                                    alt="Now"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="absolute -bottom-20 left-1/2 h-28 w-64 -translate-x-1/2 bg-gradient-to-t from-green-200 to-transparent opacity-70 blur-2xl" />
                        </div>
                    </div>
                </section>
            </main>
        </GeneralShell>
    );
}
