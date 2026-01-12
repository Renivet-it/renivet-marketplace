"use client";

import { cn } from "@/lib/utils";

interface AboutFrustrationProps {
    className?: string;
}

export function AboutFrustration({ className }: AboutFrustrationProps) {
    return (
        <section className={cn("relative z-10 w-full", className)}>
            <div className="container mx-auto px-4">
                {/* Overlapping Card */}
                <div className="mx-auto flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/40 p-10 shadow-2xl backdrop-blur-2xl md:-mt-40 md:min-h-[531px] md:w-[1112px] md:max-w-full md:p-16 lg:-mt-52">
                    <div className="mx-auto max-w-4xl space-y-16 text-center text-white">
                        {/* THE FRUSTRATION Section */}
                        <div className="space-y-6">
                            <h2 className="font-playfair text-xl font-bold uppercase tracking-widest md:text-3xl">
                                THE FRUSTRATION
                            </h2>
                            <p className="font-playfair text-base leading-relaxed text-stone-100 md:text-lg lg:text-xl">
                                Renivet Was Born Out Of <i>Frustration</i> —
                                With Cluttered Marketplaces, Greenwashing, And
                                Endless Scrolling Through{" "}
                                <i>Mass-Produced Products</i> Pretending To Be
                                Meaningful. Somewhere Between Fast-Fashion
                                Giants And Algorithm-Driven Platforms, Homegrown
                                And Artisan-Led Brands Were Pushed To The
                                Margins. At The Same Time, Consumers Who
                                Genuinely Wanted To Buy Better Were Left
                                Confused, Overwhelmed, And Unsure Of Who To
                                Trust.
                            </p>
                        </div>

                        {/* THE TURN Section */}
                        <div className="space-y-6">
                            <h2 className="font-playfair text-2xl font-bold uppercase tracking-widest md:text-4xl">
                                THE TURN
                            </h2>
                            <p className="font-playfair text-xl font-medium md:text-2xl">
                                We Built Renivet To Change That.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
