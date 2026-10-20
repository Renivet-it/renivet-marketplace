"use client";

import { trpc } from "@/lib/trpc/client";
import { ArrowRight, Check } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

export function RenivetCircleSignup() {
    const [email, setEmail] = useState("");
    const [isAgreed, setIsAgreed] = useState(true);
    const subscribe = trpc.general.newsletterSubscribers.createNewsletterSubscriber.useMutation({
        onSuccess: () => {
            setEmail("");
            toast.success("You’ve joined the Renivet circle!");
        },
        onError: (error) => toast.error(error.message),
    });

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!isAgreed) {
            toast.error("Please agree to receive updates from Renivet.");
            return;
        }

        subscribe.mutate({
            email,
            name: "Renivet Circle Member",
            source: "home_circle",
            segments: ["renivet-circle"],
        });
    };

    return (
        <section className="w-full bg-[#FAF7F2] px-4 py-2 md:px-8 md:pb-14 md:pt-4 lg:px-16">
            <div className="relative mx-auto overflow-hidden rounded-[20px] bg-[#3E2127] px-6 py-7 text-[#FAF7F2] shadow-[0_18px_45px_rgba(62,33,39,0.16)] md:max-w-[1180px] md:px-12 md:py-11 lg:px-16 lg:py-12">
                <div className="pointer-events-none absolute -right-3 -top-4 rotate-12 text-[#8f686d]/60 md:-right-2 md:-top-10">
                    <svg width="105" height="140" viewBox="0 0 105 140" fill="none" aria-hidden="true">
                        <path d="M74 3C99 31 85 55 67 70C48 86 37 109 14 137" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M74 3C70 32 56 54 37 65C19 75 16 92 24 111" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M83 25C101 42 95 61 80 70" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                </div>

                <div className="relative md:grid md:grid-cols-[0.85fr_1.15fr] md:items-center md:gap-14 lg:gap-20">
                    <div>
                        <p className="mb-3 hidden text-[9px] font-medium uppercase tracking-[0.25em] text-[#cdaeb1] md:block">
                            The Renivet circle
                        </p>
                        <div
                            role="heading"
                            aria-level={2}
                            className="relative font-serif text-[24px] leading-tight text-[#FAF7F2] md:text-[32px] md:leading-[1.08]"
                        >
                            Join the Renivet circle
                        </div>
                        <p className="relative mt-3 max-w-[300px] text-[13px] leading-relaxed text-[#e9d7d3] md:mt-4 md:max-w-[330px] md:text-[14px] md:leading-[1.55]">
                            Get early access to new launches, stories and conscious living tips.
                        </p>
                    </div>

                    <div className="md:border-l md:border-[#8f686d]/50 md:pl-10 lg:pl-12">
                        <p className="mb-3 hidden text-[10px] uppercase tracking-[0.16em] text-[#cdaeb1] md:block">
                            Sign up for thoughtful updates
                        </p>
                        <form onSubmit={handleSubmit} className="relative mt-5 md:mt-0">
                            <div className="flex h-11 items-center rounded-full bg-[#FAF7F2] pl-4 pr-1 md:h-12 md:pl-5">
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    placeholder="Enter your email"
                                    disabled={subscribe.isPending}
                                    className="min-w-0 flex-1 bg-transparent text-[13px] text-[#3E2127] outline-none placeholder:text-[#8b8380] md:text-[14px]"
                                    aria-label="Email address"
                                />
                                <button
                                    type="submit"
                                    aria-label="Join the Renivet circle"
                                    disabled={subscribe.isPending}
                                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#61333d] text-white transition-colors hover:bg-[#4d2931] disabled:opacity-60 md:size-10"
                                >
                                    <ArrowRight className="size-4" />
                                </button>
                            </div>
                        </form>

                        <label className="relative mt-4 flex cursor-pointer items-center gap-2 text-[10px] text-[#e9d7d3] md:mt-4 md:text-[11px]">
                            <input
                                type="checkbox"
                                checked={isAgreed}
                                onChange={(event) => setIsAgreed(event.target.checked)}
                                className="sr-only"
                            />
                            <span className="flex size-3.5 items-center justify-center">
                                {isAgreed ? <Check className="size-3.5" strokeWidth={3} /> : null}
                            </span>
                            I agree to receive updates from Renivet.
                        </label>
                    </div>
                </div>
            </div>
        </section>
    );
}
