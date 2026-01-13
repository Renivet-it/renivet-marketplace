"use client";

import { cn } from "@/lib/utils";

interface AboutFrustrationProps {
    className?: string;
}

export function AboutFrustration({ className }: AboutFrustrationProps) {
    return (
        <section className={cn("relative z-20 w-full", className)}>
            <div className="container mx-auto px-4">
                <div
                    className={cn(
                        // Base
                        "mx-auto flex flex-col items-center justify-center",
                        "rounded-2xl border border-white/15",
                        "bg-black/45 backdrop-blur-2xl shadow-2xl text-white",

                        // ✅ MOBILE: more height + overlap

"-mt-12 w-[92%] px-6 pt-2 pb-12 min-h-[520px]",

                        // Tablet
                        "sm:-mt-48 sm:px-8 sm:py-14 sm:min-h-[560px]",

                        // Desktop (UNCHANGED)
                        "md:-mt-40 md:min-h-[531px] md:w-[1112px] md:max-w-full md:p-16",
                        "lg:-mt-52"
                        
                    )}
                >
                    <div className="mx-auto max-w-4xl space-y-12 md:space-y-16 text-center">
                        {/* THE FRUSTRATION */}
<div className="space-y-10 md:space-y-16 text-center pt-4">

<h2 className="font-playfair text-[24px] font-bold uppercase tracking-widest md:text-3xl">
    THE FRUSTRATION
</h2>

<p className="font-playfair text-[16px] leading-relaxed text-stone-100 sm:text-base md:text-lg lg:text-xl">
                                Renivet Was Born Out Of <i>Frustration</i> —
                                With Cluttered Marketplaces, Greenwashing, And
                                Endless Scrolling Through{" "}
                                <i>Mass-Produced Products</i> Pretending To Be
                                Meaningful. Somewhere Between Fast-Fashion
                                Giants And Algorithm-Driven Platforms,
                                Homegrown And Artisan-Led Brands Were Pushed To
                                The Margins. At The Same Time, Consumers Who
                                Genuinely Wanted To Buy Better Were Left
                                Confused, Overwhelmed, And Unsure Of Who To
                                Trust.
                            </p>
                        </div>

                        {/* THE TURN */}
                        <div className="space-y-4 md:space-y-6">
                            <h2 className="font-playfair text-lg font-bold uppercase tracking-widest sm:text-xl md:text-4xl">
                                THE TURN
                            </h2>
                            <p className="font-playfair text-base font-medium sm:text-lg md:text-2xl">
                                We Built Renivet To Change That.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
