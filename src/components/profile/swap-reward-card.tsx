"use client";

import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import {
    CalendarDays,
    ChartNoAxesColumnIncreasing,
    Gift,
    Leaf,
    Users,
} from "lucide-react";
import Image from "next/image";
import type { KeyboardEvent } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { RewardUnlockedCard } from "./reward-unlocked-card";

const TOTAL_STAMPS = 5;
const TICKET_WIDTH = 1360;
const TICKET_HEIGHT = 590;
const MOBILE_TICKET_WIDTH = 760;
const MOBILE_TICKET_HEIGHT = 540;
const NARROW_SCREEN_TICKET_HEIGHT = 640;

const milestones = [
    {
        image: "/assets/swap-rewards/Frame 427319851.png",
        label: "Choose\nmindfully",
    },
    { image: "/assets/swap-rewards/women.png", label: "Support\nartisans" },
    { image: "/assets/swap-rewards/pot.png", label: "Ethnical\nmarketplace" },
    { image: "/assets/swap-rewards/leaf 2.png", label: "Lower\nimpact" },
    { image: "/assets/swap-rewards/reward.png", label: "Earn\nrewards" },
];

const howItWorksSteps = [
    {
        image: "/assets/swap-rewards/how-it-works/bag.png",
        title: "1.\u2009Shop",
        description: "Buy any product from our sustainable marketplace.",
        mobileDescription: "Shop any sustainable product.",
    },
    {
        image: "/assets/swap-rewards/how-it-works/stamp.png",
        title: "2.\u2009Collect",
        description:
            "Every eligible purchase adds 1 swap stamp to your ticket.",
        mobileDescription: "Each eligible purchase adds 1 stamp.",
    },
    {
        image: "/assets/swap-rewards/how-it-works/rewards.png",
        title: "3.\u2009Unlock",
        description: "Collect 5 stamps to choose any reward below \u20B91,499.",
        mobileDescription: "Get 5 stamps to unlock a reward.",
    },
];

function ThankYouTicket({
    animate,
    compact,
    narrowScreen,
}: {
    animate: boolean;
    compact: boolean;
    narrowScreen: boolean;
}) {
    return (
        <aside
            className={cn(
                "swap-thankyou-ticket relative overflow-hidden bg-[#c8e0f3] text-center",
                compact
                    ? "h-[540px] px-4 pb-4 pt-7"
                    : "h-[590px] px-8 pb-5 pt-9",
                animate ? "swap-ticket-stub-enter" : "swap-ticket-stub-waiting"
            )}
            style={{
                height: narrowScreen ? NARROW_SCREEN_TICKET_HEIGHT : undefined,
            }}
        >
            <h3
                className={cn(
                    "relative font-bold text-[#0d48b5]",
                    compact
                        ? "text-[29px] tracking-[0.035em]"
                        : "text-[42px] tracking-[0.06em]"
                )}
            >
                THANK YOU
            </h3>
            <p
                className={cn(
                    "relative mt-1 font-serif italic text-[#455044]",
                    compact
                        ? "text-[25px] leading-[1.02]"
                        : "text-[34px] leading-[1.05]"
                )}
            >
                for being a part of
                <br />
                the swap movement
            </p>
            <Image
                src="/assets/swap-rewards/lady-illustration.png"
                alt="Woman supporting conscious shopping"
                width={620}
                height={500}
                className={cn(
                    "relative mx-auto h-auto object-contain",
                    compact
                        ? "mt-5 w-[94%] max-w-[190px]"
                        : "mt-2 w-[86%] max-w-[280px]"
                )}
            />
            <div className={cn("relative", compact ? "mt-1" : "-mt-2")}>
                <p
                    className={cn(
                        "swap-ticket-thankyou-copy font-medium uppercase text-[#0d48b5]",
                        compact
                            ? "text-[15px] leading-[1.15]"
                            : "text-[20px] leading-tight"
                    )}
                >
                    Thoughtful today,
                    <br />
                    sustainable tomorrow
                </p>
                <Image
                    src="/assets/swap-rewards/leaf 2.png"
                    alt=""
                    width={30}
                    height={30}
                    className={cn(
                        "mx-auto my-2 object-contain",
                        compact ? "size-5" : "size-6"
                    )}
                />
                <p
                    className={cn(
                        "swap-ticket-thankyou-date font-medium uppercase text-[#455044]",
                        compact
                            ? "text-[14px] tracking-[0.02em]"
                            : "text-[16px] tracking-[0.08em]"
                    )}
                >
                    31st July &ndash; 30th September
                </p>
            </div>
            <style jsx>{`
                .swap-thankyou-ticket {
                    clip-path: polygon(
                        2.6% 0,
                        100% 0,
                        100% 100%,
                        2.6% 100%,
                        0 98%,
                        2.6% 96%,
                        0 94%,
                        2.6% 92%,
                        0 90%,
                        2.6% 88%,
                        0 86%,
                        2.6% 84%,
                        0 82%,
                        2.6% 80%,
                        0 78%,
                        2.6% 76%,
                        0 74%,
                        2.6% 72%,
                        0 70%,
                        2.6% 68%,
                        0 66%,
                        2.6% 64%,
                        0 62%,
                        2.6% 60%,
                        0 58%,
                        2.6% 56%,
                        0 54%,
                        2.6% 52%,
                        0 50%,
                        2.6% 48%,
                        0 46%,
                        2.6% 44%,
                        0 42%,
                        2.6% 40%,
                        0 38%,
                        2.6% 36%,
                        0 34%,
                        2.6% 32%,
                        0 30%,
                        2.6% 28%,
                        0 26%,
                        2.6% 24%,
                        0 22%,
                        2.6% 20%,
                        0 18%,
                        2.6% 16%,
                        0 14%,
                        2.6% 12%,
                        0 10%,
                        2.6% 8%,
                        0 6%,
                        2.6% 4%,
                        0 2%
                    );
                }
            `}</style>
        </aside>
    );
}

function MobileBackSideTicket({
    stampCount,
    isLoading,
    hiddenFromAssistiveTechnology,
}: {
    stampCount: number;
    isLoading: boolean;
    hiddenFromAssistiveTechnology: boolean;
}) {
    const remainingStamps = Math.max(0, TOTAL_STAMPS - stampCount);
    const remainingLabel = remainingStamps === 1 ? "swap" : "swaps";
    const purchaseLabel = stampCount === 1 ? "purchase" : "purchases";
    const journeyItems = [
        {
            icon: CalendarDays,
            title: "Campaign period",
            content: "31 Jul – 30 Sep",
        },
        {
            icon: ChartNoAxesColumnIncreasing,
            title: "Your progress",
            content: isLoading
                ? "Loading progress"
                : `${stampCount} / ${TOTAL_STAMPS} swaps collected`,
            accent: true,
        },
        {
            icon: Gift,
            title: "Next milestone",
            content:
                remainingStamps === 0
                    ? "Your reward is ready"
                    : `${remainingStamps} more ${remainingLabel} to unlock`,
        },
        {
            icon: Leaf,
            title: "Your reward",
            content: "Choose a product below \u20B91,499",
        },
    ];

    return (
        <section
            aria-label="How the swap passport works"
            aria-hidden={hiddenFromAssistiveTechnology}
            className="swap-ticket-face swap-ticket-back absolute left-0 top-0 h-[540px] w-[760px] overflow-hidden bg-[#d7e9f8]"
            style={{ clipPath: "url(#swap-combined-ticket-shape)" }}
        >
            <div className="relative h-[340px] border-b border-[#c7b98d]">
                <Image
                    src="/assets/swap-rewards/how-it-works/yellow-top.png"
                    alt=""
                    width={883}
                    height={729}
                    className="pointer-events-none absolute left-0 top-0 w-[112px] object-contain object-left-top"
                />
                <h2 className="absolute left-[108px] top-4 whitespace-nowrap text-[34px] font-bold tracking-[0.035em] text-[#0d48b5]">
                    HOW IT WORKS
                </h2>

                <div className="absolute left-[108px] right-5 top-[70px] grid grid-cols-3 gap-5">
                    {howItWorksSteps.map((step) => (
                        <div
                            key={step.title}
                            className="flex min-w-0 flex-col items-center text-center"
                        >
                            <div className="grid size-[66px] place-items-center rounded-full bg-white">
                                <Image
                                    src={step.image}
                                    alt=""
                                    width={70}
                                    height={78}
                                    className="max-h-[49px] max-w-[46px] object-contain"
                                />
                            </div>
                            <h3 className="mt-2 whitespace-nowrap font-serif text-[17px] uppercase leading-none text-[#344032]">
                                {step.title}
                            </h3>
                            <p className="mt-2 max-w-[170px] text-[14px] leading-[1.18] text-[#405044]">
                                {step.mobileDescription}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="absolute bottom-4 left-[105px] right-5 grid grid-cols-4 border-t border-[#d3ad61] pt-4">
                    {[
                        ["Support artisans", "Local craftspeople"],
                        ["Ethical choices", "Responsible products"],
                        ["Lower impact", "Lighter planet"],
                        ["Better future", "Small swaps, big change"],
                    ].map(([title, description], index) => (
                        <div
                            key={title}
                            className={cn(
                                "min-w-0 px-3",
                                index > 0 && "border-l border-[#405044]"
                            )}
                        >
                            <p className="text-[13px] font-bold uppercase leading-[1.08] text-[#3b493c]">
                                {title}
                            </p>
                            <p className="mt-2 text-[11px] leading-[1.15] text-[#536056]">
                                {description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="absolute bottom-0 left-0 h-[200px] w-[470px] bg-[#d7e9f8] pb-3 pl-[92px] pr-4 pt-3">
                <Image
                    src="/assets/swap-rewards/how-it-works/yellow-bottom.png"
                    alt=""
                    width={576}
                    height={786}
                    className="pointer-events-none absolute bottom-0 left-0 w-[105px] object-contain object-left-bottom"
                />
                <h3 className="relative whitespace-nowrap text-[19px] uppercase tracking-[0.1em] text-[#344032]">
                    Your journey
                </h3>
                <div className="relative mt-2 grid grid-cols-2 overflow-hidden rounded-[20px] border border-[#c7b98d] bg-[#dcebf8]/80">
                    {journeyItems.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <div
                                key={item.title}
                                className={cn(
                                    "flex min-h-[70px] items-start gap-2 px-3 py-2",
                                    index % 2 === 1 &&
                                        "border-l border-[#c7b98d]",
                                    index > 1 && "border-t border-[#c7b98d]"
                                )}
                            >
                                <Icon
                                    aria-hidden
                                    className="mt-0.5 size-[23px] shrink-0 text-[#3c4b3d]"
                                    strokeWidth={1.8}
                                />
                                <div className="min-w-0">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.035em] text-[#536056]">
                                        {item.title}
                                    </p>
                                    <p className="mt-1 text-[13px] leading-[1.08] text-[#334136]">
                                        {item.accent && !isLoading ? (
                                            <>
                                                <strong className="text-[#9c5d29]">
                                                    {stampCount} /{" "}
                                                    {TOTAL_STAMPS}
                                                </strong>{" "}
                                                swaps collected
                                            </>
                                        ) : (
                                            item.content
                                        )}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div
                    aria-hidden
                    className="absolute bottom-4 left-7 grid grid-cols-6 gap-[3px] opacity-65"
                >
                    {Array.from({ length: 30 }).map((_, index) => (
                        <span
                            key={index}
                            className="size-[3px] rounded-full bg-[#8e895d]"
                        />
                    ))}
                </div>
            </div>

            <aside className="swap-back-impact absolute bottom-0 right-0 h-[200px] w-[290px] bg-[#c8e0f3] p-3">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.7)_0.6px,transparent_0.8px)] bg-[length:4px_4px] opacity-45" />
                <div className="relative h-full overflow-hidden rounded-[24px] bg-white/85 px-5 py-3 shadow-[0_12px_24px_-16px_rgba(45,76,111,0.35)]">
                    <h3 className="font-serif text-[19px] uppercase tracking-[0.07em] text-[#174fb9]">
                        Your impact
                    </h3>
                    <div className="mt-2 grid gap-2">
                        <div className="flex items-center gap-3">
                            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#dceeff] text-[#3567cd]">
                                <ChartNoAxesColumnIncreasing className="size-5" />
                            </div>
                            <div>
                                <p className="font-serif text-[23px] leading-none text-[#174fb9]">
                                    {isLoading ? "–" : stampCount}
                                </p>
                                <p className="text-[11px] font-bold uppercase leading-tight text-[#2354bd]">
                                    Conscious {purchaseLabel}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#dceeff] text-[#3567cd]">
                                <Users className="size-5" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold uppercase leading-tight text-[#2354bd]">
                                    Supporting artisans
                                </p>
                                <p className="text-[10px] text-[#4b74d0]">
                                    Real people, real impact
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#dceeff] text-[#3567cd]">
                                <Leaf className="size-5" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold uppercase leading-tight text-[#2354bd]">
                                    Lower environmental footprint
                                </p>
                                <p className="text-[10px] text-[#4b74d0]">
                                    Better for our planet
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="absolute -bottom-24 right-[-6%] size-44 rounded-[50%] border border-[#6d8fdb]/50" />
                </div>
            </aside>
        </section>
    );
}

function BackSideTicket({
    compact,
    useSafeMobileEdge,
    stampCount,
    isLoading,
    hiddenFromAssistiveTechnology,
}: {
    compact: boolean;
    useSafeMobileEdge: boolean;
    stampCount: number;
    isLoading: boolean;
    hiddenFromAssistiveTechnology: boolean;
}) {
    const remainingStamps = Math.max(0, TOTAL_STAMPS - stampCount);
    const purchaseLabel = stampCount === 1 ? "purchase" : "purchases";
    const remainingLabel = remainingStamps === 1 ? "swap" : "swaps";

    return (
        <section
            aria-label="How the swap passport works"
            aria-hidden={hiddenFromAssistiveTechnology}
            className={cn(
                "swap-ticket-face swap-ticket-back absolute left-0 top-0 grid overflow-hidden bg-[#d7e9f8]",
                compact
                    ? "h-[540px] w-[760px] grid-cols-[555px_205px]"
                    : "h-[590px] w-[1360px] grid-cols-[minmax(0,3.05fr)_minmax(310px,0.95fr)]"
            )}
            style={{
                height: useSafeMobileEdge
                    ? NARROW_SCREEN_TICKET_HEIGHT
                    : undefined,
                clipPath: useSafeMobileEdge
                    ? "url(#swap-combined-ticket-shape-mobile-back)"
                    : "url(#swap-combined-ticket-shape)",
            }}
        >
            <div
                className={cn(
                    "grid bg-[#d7e9f8]",
                    compact
                        ? "grid-cols-[350px_205px]"
                        : "grid-cols-[minmax(0,2.08fr)_minmax(300px,0.92fr)]"
                )}
            >
                <div className="swap-back-how-panel relative overflow-hidden">
                    <Image
                        src="/assets/swap-rewards/how-it-works/yellow-top.png"
                        alt=""
                        width={883}
                        height={729}
                        className={cn(
                            "pointer-events-none absolute left-0 top-0 object-contain object-left-top",
                            compact ? "w-[94px]" : "w-[145px]"
                        )}
                    />
                    <Image
                        src="/assets/swap-rewards/how-it-works/yellow-bottom.png"
                        alt=""
                        width={576}
                        height={786}
                        className={cn(
                            "pointer-events-none absolute bottom-0 left-0 object-contain object-left-bottom",
                            compact ? "w-[104px]" : "w-[165px]"
                        )}
                    />

                    <div
                        className={cn(
                            "swap-back-how-content relative h-full",
                            compact
                                ? "pb-5 pl-[72px] pr-4 pt-5"
                                : "pb-8 pl-[165px] pr-8 pt-7"
                        )}
                    >
                        <h2
                            className={cn(
                                "swap-back-heading font-bold tracking-[0.035em] text-[#0d48b5]",
                                compact
                                    ? "whitespace-nowrap text-[31px]"
                                    : "text-[48px]"
                            )}
                        >
                            HOW IT WORKS
                        </h2>

                        <div
                            className={cn(
                                "swap-back-steps grid grid-cols-3",
                                compact ? "mt-3 gap-3" : "mt-5 gap-7"
                            )}
                        >
                            {howItWorksSteps.map((step) => (
                                <div
                                    key={step.title}
                                    className={cn(
                                        "swap-back-step flex min-w-0 flex-col items-center text-center",
                                        compact && "px-1"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "swap-back-step-icon grid place-items-center rounded-full bg-white/95",
                                            compact
                                                ? "size-[64px]"
                                                : "size-[92px]"
                                        )}
                                    >
                                        <Image
                                            src={step.image}
                                            alt=""
                                            width={70}
                                            height={78}
                                            className={cn(
                                                "object-contain",
                                                compact
                                                    ? "max-h-[47px] max-w-[44px]"
                                                    : "max-h-[66px] max-w-[60px]"
                                            )}
                                        />
                                    </div>
                                    <h3
                                        className={cn(
                                            "swap-back-step-title font-serif uppercase leading-none text-[#344032]",
                                            compact
                                                ? "mt-2 min-h-[18px] whitespace-nowrap text-[14px]"
                                                : "mt-3 text-[25px]"
                                        )}
                                    >
                                        {step.title}
                                    </h3>
                                    <p
                                        className={cn(
                                            "swap-back-step-copy text-[#405044]",
                                            compact
                                                ? "mt-2 min-h-[43px] max-w-[72px] text-[12px] leading-[1.18]"
                                                : "mt-2 max-w-[180px] text-[13px] leading-[1.1]"
                                        )}
                                    >
                                        {compact
                                            ? step.mobileDescription
                                            : step.description}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div
                            className={cn(
                                "swap-back-benefits border-t border-[#d3ad61]",
                                compact ? "mt-4 pt-4" : "mt-7 pt-7"
                            )}
                        >
                            <div
                                className={cn(
                                    "swap-back-benefits-grid grid",
                                    compact ? "grid-cols-2" : "grid-cols-4"
                                )}
                            >
                                {[
                                    [
                                        "Support artisans",
                                        "Empowering local craftspeople",
                                        "Local craftspeople",
                                    ],
                                    [
                                        "Ethical choices",
                                        "Thoughtful product, responsible living",
                                        "Responsible products",
                                    ],
                                    [
                                        "Lower impact",
                                        "Conscious choices for a lighter planet",
                                        "Lighter planet",
                                    ],
                                    [
                                        "Better future",
                                        "Small swaps, big change",
                                        "Small swaps, big change",
                                    ],
                                ].map(
                                    (
                                        [title, description, mobileDescription],
                                        index
                                    ) => (
                                        <div
                                            key={title}
                                            className={cn(
                                                "swap-back-benefit-item min-w-0",
                                                compact
                                                    ? "min-h-[72px] px-3 py-3"
                                                    : "px-3",
                                                compact &&
                                                    index % 2 === 1 &&
                                                    "border-l border-[#405044]",
                                                compact &&
                                                    index > 1 &&
                                                    "border-t border-[#405044]",
                                                !compact &&
                                                    index > 0 &&
                                                    "border-l border-[#405044]"
                                            )}
                                        >
                                            <p
                                                className={cn(
                                                    "swap-back-benefit-title font-semibold uppercase leading-[1.05] text-[#3b493c]",
                                                    compact
                                                        ? "text-[13px]"
                                                        : "text-[15px]"
                                                )}
                                            >
                                                {title}
                                            </p>
                                            <p
                                                className={cn(
                                                    "swap-back-benefit-copy leading-[1.15] text-[#536056]",
                                                    compact
                                                        ? "mt-2 text-[11px]"
                                                        : "mt-3 text-[11px]"
                                                )}
                                            >
                                                {compact
                                                    ? mobileDescription
                                                    : description}
                                            </p>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>

                        <div
                            aria-hidden
                            className={cn(
                                "absolute bottom-5 left-7 grid grid-cols-7 opacity-65",
                                compact ? "gap-[3px]" : "gap-[5px]"
                            )}
                        >
                            {Array.from({ length: 42 }).map((_, index) => (
                                <span
                                    key={index}
                                    className={cn(
                                        "rounded-full bg-[#8e895d]",
                                        compact ? "size-[3px]" : "size-[5px]"
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div
                    className={cn(
                        "swap-back-journey-panel relative border-l border-[#8b8b73] bg-[#d7e9f8]",
                        compact ? "px-3 py-5" : "px-5 py-8"
                    )}
                >
                    <Image
                        src="/assets/swap-rewards/leaf 2.png"
                        alt=""
                        width={150}
                        height={220}
                        className={cn(
                            "pointer-events-none absolute right-3 opacity-75",
                            compact ? "hidden" : "top-8 w-[105px]"
                        )}
                    />
                    <h3
                        className={cn(
                            "relative uppercase text-[#344032]",
                            compact
                                ? "whitespace-nowrap text-[18px] tracking-[0.08em]"
                                : "text-[24px] tracking-[0.14em]"
                        )}
                    >
                        Your journey
                    </h3>

                    <div
                        className={cn(
                            "swap-back-journey-card relative overflow-hidden rounded-[30px] border border-[#c7b98d] bg-[#dcebf8]/75",
                            compact ? "mt-5" : "mt-8"
                        )}
                    >
                        {[
                            {
                                icon: CalendarDays,
                                title: "Campaign period",
                                content: "31 Jul – 30 Sep",
                            },
                            {
                                icon: ChartNoAxesColumnIncreasing,
                                title: "Your progress",
                                content: isLoading
                                    ? "Loading progress"
                                    : `${stampCount} / ${TOTAL_STAMPS} swaps collected`,
                                accent: true,
                            },
                            {
                                icon: Gift,
                                title: "Next milestone",
                                content:
                                    remainingStamps === 0
                                        ? "Your reward is ready to unlock"
                                        : `${remainingStamps} more ${remainingLabel} to unlock your reward`,
                            },
                            {
                                icon: Leaf,
                                title: "Your reward",
                                content: "Choose any product below ₹1,499",
                            },
                        ].map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <div
                                    key={item.title}
                                    className={cn(
                                        "swap-back-journey-row flex items-start",
                                        compact
                                            ? "min-h-[91px] gap-2 px-3 py-3"
                                            : "min-h-[105px] gap-4 px-6 py-5",
                                        index > 0 && "border-t border-[#c7b98d]"
                                    )}
                                >
                                    <Icon
                                        aria-hidden
                                        strokeWidth={1.8}
                                        className={cn(
                                            "shrink-0 text-[#3c4b3d]",
                                            compact
                                                ? "size-[27px]"
                                                : "size-[30px]"
                                        )}
                                    />
                                    <div className="min-w-0">
                                        <p
                                            className={cn(
                                                "swap-back-journey-title font-bold uppercase tracking-[0.04em] text-[#536056]",
                                                compact
                                                    ? "text-[12px]"
                                                    : "text-[13px]"
                                            )}
                                        >
                                            {item.title}
                                        </p>
                                        <p
                                            className={cn(
                                                "swap-back-journey-copy mt-1 leading-[1.08] text-[#334136]",
                                                compact
                                                    ? "text-[14px]"
                                                    : "text-[16px]"
                                            )}
                                        >
                                            {item.accent && !isLoading ? (
                                                <>
                                                    <strong className="text-[#9c5d29]">
                                                        {stampCount} /{" "}
                                                        {TOTAL_STAMPS}
                                                    </strong>{" "}
                                                    swaps collected
                                                </>
                                            ) : (
                                                item.content
                                            )}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <aside
                className={cn(
                    "swap-back-impact relative bg-[#c8e0f3]",
                    compact ? "p-3" : "p-7"
                )}
            >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.7)_0.6px,transparent_0.8px)] bg-[length:4px_4px] opacity-45" />
                <div
                    className={cn(
                        "relative h-full overflow-hidden rounded-[34px] bg-white/80 shadow-[0_18px_30px_-18px_rgba(45,76,111,0.35)]",
                        compact ? "py-5 pl-3 pr-10" : "px-8 py-8"
                    )}
                >
                    <h3
                        className={cn(
                            "font-serif uppercase text-[#174fb9]",
                            compact
                                ? "whitespace-nowrap text-center text-[16px] tracking-[0.04em]"
                                : "text-[25px] tracking-[0.08em]"
                        )}
                    >
                        Your impact
                    </h3>

                    <div
                        className={cn(
                            "flex flex-col",
                            useSafeMobileEdge
                                ? "mt-6 gap-6"
                                : compact
                                  ? "mt-5 gap-9"
                                  : "mt-10 gap-12"
                        )}
                    >
                        <div
                            className={cn(
                                "flex items-center",
                                compact ? "min-h-[70px] gap-2" : "gap-4"
                            )}
                        >
                            <div
                                className={cn(
                                    "grid shrink-0 place-items-center rounded-full bg-[#dceeff] text-[#3567cd]",
                                    compact ? "size-9" : "size-14"
                                )}
                            >
                                <ChartNoAxesColumnIncreasing
                                    className={compact ? "size-5" : "size-7"}
                                />
                            </div>
                            <div className="min-w-0">
                                <p
                                    className={cn(
                                        "font-serif leading-none text-[#174fb9]",
                                        compact ? "text-[24px]" : "text-[36px]"
                                    )}
                                >
                                    {isLoading ? "–" : stampCount}
                                </p>
                                <p
                                    className={cn(
                                        "swap-back-impact-title mt-1 font-bold uppercase leading-tight text-[#2354bd]",
                                        compact ? "text-[12px]" : "text-[11px]"
                                    )}
                                >
                                    Conscious {purchaseLabel}
                                </p>
                                <p
                                    className={cn(
                                        "swap-back-impact-copy mt-1 text-[#4b74d0]",
                                        compact
                                            ? "text-[10px] leading-[1.2]"
                                            : "text-[10px]"
                                    )}
                                >
                                    Thank you!
                                </p>
                            </div>
                        </div>

                        <div
                            className={cn(
                                "flex items-center",
                                compact ? "min-h-[70px] gap-2" : "gap-4"
                            )}
                        >
                            <div
                                className={cn(
                                    "grid shrink-0 place-items-center rounded-full bg-[#dceeff] text-[#3567cd]",
                                    compact ? "size-9" : "size-14"
                                )}
                            >
                                <Users
                                    className={compact ? "size-5" : "size-7"}
                                />
                            </div>
                            <div className="min-w-0">
                                <p
                                    className={cn(
                                        "swap-back-impact-title font-bold uppercase leading-tight text-[#2354bd]",
                                        compact ? "text-[11px]" : "text-[11px]"
                                    )}
                                >
                                    <span className="block">Supporting</span>
                                    <span className="block">artisans</span>
                                </p>
                                <p
                                    className={cn(
                                        "swap-back-impact-copy mt-1 text-[#4b74d0]",
                                        compact
                                            ? "text-[10px] leading-[1.2]"
                                            : "text-[10px]"
                                    )}
                                >
                                    Real people, real impact
                                </p>
                            </div>
                        </div>

                        <div
                            className={cn(
                                "flex items-center",
                                compact ? "min-h-[70px] gap-2" : "gap-4"
                            )}
                        >
                            <div
                                className={cn(
                                    "grid shrink-0 place-items-center rounded-full bg-[#dceeff] text-[#3567cd]",
                                    compact ? "size-9" : "size-14"
                                )}
                            >
                                <Leaf
                                    className={compact ? "size-5" : "size-7"}
                                />
                            </div>
                            <div className="min-w-0">
                                <p
                                    className={cn(
                                        "swap-back-impact-title font-bold uppercase leading-tight text-[#2354bd]",
                                        compact ? "text-[12px]" : "text-[11px]"
                                    )}
                                >
                                    {compact
                                        ? "Lower footprint"
                                        : "Lower environmental footprint"}
                                </p>
                                <p
                                    className={cn(
                                        "swap-back-impact-copy mt-1 text-[#4b74d0]",
                                        compact
                                            ? "text-[10px] leading-[1.2]"
                                            : "text-[10px]"
                                    )}
                                >
                                    Better for our planet
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="absolute -bottom-20 right-[-18%] size-52 rounded-[50%] border border-[#6d8fdb]/55" />
                    <div className="absolute -bottom-24 right-[-2%] size-52 rounded-[50%] border border-[#6d8fdb]/45" />
                </div>
            </aside>
        </section>
    );
}

export function SwapRewardCard() {
    const { data, isLoading } =
        trpc.general.swapRewards.getSwapRewardStatus.useQuery();
    const stampCount = Math.min(
        TOTAL_STAMPS,
        data?.currentCycleStampCount ?? 0
    );
    const showRewardUnlocked =
        !isLoading &&
        stampCount === TOTAL_STAMPS &&
        data?.rewardStatus === "unlocked";
    const ticketHostRef = useRef<HTMLDivElement>(null);
    const [ticketScale, setTicketScale] = useState(0);
    const [compact, setCompact] = useState(false);
    const [useSafeMobileEdge, setUseSafeMobileEdge] = useState(false);
    const [entranceStarted, setEntranceStarted] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isFlipAnimating, setIsFlipAnimating] = useState(false);
    const flipReleaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
        null
    );
    const scaleReady = ticketScale > 0;
    const ticketWidth = compact ? MOBILE_TICKET_WIDTH : TICKET_WIDTH;
    const ticketHeight = useSafeMobileEdge
        ? NARROW_SCREEN_TICKET_HEIGHT
        : compact
          ? MOBILE_TICKET_HEIGHT
          : TICKET_HEIGHT;

    const toggleTicketSide = () => {
        if (isFlipAnimating) return;
        setIsFlipAnimating(true);
        setIsFlipped((current) => !current);

        if (flipReleaseTimerRef.current) {
            clearTimeout(flipReleaseTimerRef.current);
        }
        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;
        flipReleaseTimerRef.current = setTimeout(
            () => setIsFlipAnimating(false),
            prefersReducedMotion ? 80 : 1050
        );
    };

    const handleTicketKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        toggleTicketSide();
    };

    useLayoutEffect(() => {
        if (showRewardUnlocked) return;

        const host = ticketHostRef.current;
        if (!host) return;

        const updateScale = () => {
            const canvasWidth = TICKET_WIDTH;
            const nextScale = Math.min(
                1,
                Math.round((host.clientWidth / canvasWidth) * 10000) / 10000
            );

            setCompact(false);
            setUseSafeMobileEdge(host.clientWidth < 700);
            setTicketScale((currentScale) =>
                Math.abs(currentScale - nextScale) < 0.0005
                    ? currentScale
                    : nextScale
            );
        };

        updateScale();
        const resizeObserver = new ResizeObserver(updateScale);
        resizeObserver.observe(host);

        return () => resizeObserver.disconnect();
    }, [showRewardUnlocked]);

    useEffect(
        () => () => {
            if (flipReleaseTimerRef.current) {
                clearTimeout(flipReleaseTimerRef.current);
            }
        },
        []
    );

    useEffect(() => {
        if (!scaleReady || showRewardUnlocked) return;

        const host = ticketHostRef.current;
        if (!host) return;

        let cancelled = false;
        let entranceTimer: ReturnType<typeof setTimeout> | undefined;
        let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

        const waitForArtwork = async () => {
            const images = Array.from(host.querySelectorAll("img"));
            const decodeArtwork = Promise.allSettled(
                images.map((image) =>
                    image.decode ? image.decode() : Promise.resolve()
                )
            );
            const decodeTimeout = new Promise<void>((resolve) => {
                fallbackTimer = setTimeout(resolve, 1400);
            });

            await Promise.race([decodeArtwork, decodeTimeout]);
            if (cancelled) return;

            entranceTimer = setTimeout(() => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        if (!cancelled) setEntranceStarted(true);
                    });
                });
            }, 320);
        };

        const beginAfterPageLoad = () => void waitForArtwork();

        if (document.readyState === "complete") {
            beginAfterPageLoad();
        } else {
            window.addEventListener("load", beginAfterPageLoad, {
                once: true,
            });
        }

        return () => {
            cancelled = true;
            window.removeEventListener("load", beginAfterPageLoad);
            if (entranceTimer) clearTimeout(entranceTimer);
            if (fallbackTimer) clearTimeout(fallbackTimer);
        };
    }, [scaleReady, showRewardUnlocked]);

    if (showRewardUnlocked) {
        return <RewardUnlockedCard stampCount={stampCount} />;
    }

    return (
        <div
            ref={ticketHostRef}
            className="swap-campaign-font swap-ticket-stage relative -ml-3 mr-auto w-[calc(100%+1.5rem)] max-w-[1360px] overflow-hidden sm:ml-0 sm:w-full"
            style={{ aspectRatio: `${ticketWidth} / ${ticketHeight}` }}
        >
            <svg aria-hidden className="absolute size-0">
                <defs>
                    <clipPath
                        id="swap-combined-ticket-shape"
                        clipPathUnits="objectBoundingBox"
                    >
                        <path d="M .025 0 H .975 Q 1 0 1 .025 V .07 C .985 .075 .985 .105 1 .11 V .16 C .985 .165 .985 .195 1 .20 V .25 C .985 .255 .985 .285 1 .29 V .36 C .925 .40 .925 .60 1 .64 V .71 C .985 .715 .985 .745 1 .75 V .80 C .985 .805 .985 .835 1 .84 V .89 C .985 .895 .985 .925 1 .93 V .975 Q 1 1 .975 1 H .025 Q 0 1 0 .975 V .93 C .015 .925 .015 .895 0 .89 V .84 C .015 .835 .015 .805 0 .80 V .75 C .015 .745 .015 .715 0 .71 V .64 C .075 .60 .075 .40 0 .36 V .29 C .015 .285 .015 .255 0 .25 V .20 C .015 .195 .015 .165 0 .16 V .11 C .015 .105 .015 .075 0 .07 V .025 Q 0 0 .025 0 Z" />
                    </clipPath>
                    <clipPath
                        id="swap-combined-ticket-shape-mobile-back"
                        clipPathUnits="objectBoundingBox"
                    >
                        <path d="M .025 0 H .975 Q 1 0 1 .025 V .07 C .985 .075 .985 .105 1 .11 V .16 C .985 .165 .985 .195 1 .20 V .25 C .985 .255 .985 .285 1 .29 V .36 C .985 .40 .985 .60 1 .64 V .71 C .985 .715 .985 .745 1 .75 V .80 C .985 .805 .985 .835 1 .84 V .89 C .985 .895 .985 .925 1 .93 V .975 Q 1 1 .975 1 H .025 Q 0 1 0 .975 V .93 C .015 .925 .015 .895 0 .89 V .84 C .015 .835 .015 .805 0 .80 V .75 C .015 .745 .015 .715 0 .71 V .64 C .075 .60 .075 .40 0 .36 V .29 C .015 .285 .015 .255 0 .25 V .20 C .015 .195 .015 .165 0 .16 V .11 C .015 .105 .015 .075 0 .07 V .025 Q 0 0 .025 0 Z" />
                    </clipPath>
                </defs>
            </svg>
            <div
                role="button"
                tabIndex={0}
                aria-pressed={isFlipped}
                aria-busy={isFlipAnimating}
                aria-label={
                    isFlipped
                        ? "Show the front of the swap passport ticket"
                        : "Show how the swap passport works"
                }
                onClick={toggleTicketSide}
                onKeyDown={handleTicketKeyDown}
                className={cn(
                    "absolute left-0 top-0 origin-top-left cursor-pointer touch-manipulation select-none outline-none focus-visible:ring-4 focus-visible:ring-[#0d48b5]/35",
                    compact ? "h-[540px] w-[760px]" : "h-[590px] w-[1360px]"
                )}
                style={{
                    height: ticketHeight,
                    transform: `scale(${ticketScale})`,
                    WebkitTransform: `scale(${ticketScale})`,
                    visibility: scaleReady ? "visible" : "hidden",
                }}
            >
                <div
                    onTransitionEnd={(event) => {
                        if (
                            event.currentTarget === event.target &&
                            event.propertyName === "transform"
                        ) {
                            if (flipReleaseTimerRef.current) {
                                clearTimeout(flipReleaseTimerRef.current);
                                flipReleaseTimerRef.current = null;
                            }
                            setIsFlipAnimating(false);
                        }
                    }}
                    className={cn(
                        "swap-ticket-flipper relative h-full w-full",
                        isFlipped && "swap-ticket-is-flipped",
                        isFlipAnimating && "swap-ticket-flip-running"
                    )}
                >
                    <section
                        aria-label="Swap passport rewards"
                        aria-hidden={isFlipped}
                        className={cn(
                            "swap-ticket-face swap-ticket-front absolute left-0 top-0 grid overflow-hidden shadow-[0_18px_42px_-30px_rgba(14,58,119,0.45)]",
                            compact
                                ? "h-[540px] w-[760px] grid-cols-[555px_205px]"
                                : "h-[590px] w-[1360px] grid-cols-[minmax(0,2.45fr)_minmax(310px,0.9fr)]"
                        )}
                        style={{
                            height: ticketHeight,
                            clipPath: "url(#swap-combined-ticket-shape)",
                        }}
                    >
                        <div
                            className={cn(
                                "relative bg-[#d7e9f8] after:absolute after:inset-y-0 after:-right-5 after:w-6 after:bg-[#d7e9f8] after:content-['']",
                                compact ? "h-[540px]" : "h-[590px]",
                                entranceStarted
                                    ? "swap-ticket-card-enter"
                                    : "swap-ticket-card-waiting"
                            )}
                            style={{ height: ticketHeight }}
                        >
                            <div
                                className={cn(
                                    "absolute",
                                    compact
                                        ? "left-[8%] top-[7%]"
                                        : "left-[19%] top-[5%]"
                                )}
                            >
                                <h2
                                    className={cn(
                                        "font-bold leading-[0.92] text-[#0d48b5]",
                                        compact
                                            ? "text-[48px] tracking-[0.06em]"
                                            : "text-[66px] tracking-[0.08em]"
                                    )}
                                    style={compact ? undefined : { margin: 0 }}
                                >
                                    SWAP
                                </h2>
                                <p
                                    className={cn(
                                        "swap-ticket-primary-heading mt-1 font-bold leading-[0.92] text-black",
                                        compact
                                            ? "text-[42px] tracking-[0.035em]"
                                            : "text-[66px] tracking-[0.055em]"
                                    )}
                                    style={
                                        compact
                                            ? undefined
                                            : { margin: 0, marginTop: -28 }
                                    }
                                >
                                    PASSPORT
                                </p>
                                <p
                                    className={cn(
                                        "swap-ticket-small-copy whitespace-nowrap font-medium uppercase text-[#11151b]",
                                        compact
                                            ? "mt-2 text-[12px] tracking-[0.035em]"
                                            : "mt-3 text-[16px] tracking-[0.08em]"
                                    )}
                                    style={
                                        compact
                                            ? undefined
                                            : { margin: 0, marginTop: -8 }
                                    }
                                >
                                    Shop consciously, support artisans. Earn
                                    rewards
                                </p>
                            </div>

                            <div
                                className={cn(
                                    "absolute flex items-center border-l border-[#28313b]",
                                    compact
                                        ? "left-[61%] top-[7%] h-[25%] w-[35%] pl-[2.5%]"
                                        : "left-[63%] top-[10%] h-[22%] w-[30%] pl-[2.8%]"
                                )}
                            >
                                <div
                                    className={cn(
                                        "leading-[1.1] text-black",
                                        compact
                                            ? "text-[18px] tracking-[0.04em]"
                                            : "text-[27px] tracking-[0.08em]"
                                    )}
                                >
                                    <p>5 Purchase</p>
                                    <p className="mt-2 text-[#0d48b5]">
                                        1 Rewards
                                    </p>
                                </div>
                                <div
                                    className={cn(
                                        "relative ml-auto grid aspect-square place-items-center rounded-full border border-[#1956c2]",
                                        compact
                                            ? "mr-[2%] w-[40%]"
                                            : "mr-[5%] w-[35%]"
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "absolute -top-[4%] -rotate-[31deg] whitespace-nowrap text-[#1652bb]",
                                            compact
                                                ? "text-[8px]"
                                                : "text-[12px]"
                                        )}
                                    >
                                        Conscious Choices
                                    </span>
                                    <Image
                                        src="/assets/swap-rewards/leaf 2.png"
                                        alt=""
                                        width={60}
                                        height={60}
                                        className="w-[52%] object-contain"
                                    />
                                </div>
                            </div>

                            <div
                                className={cn(
                                    "absolute grid grid-cols-5",
                                    compact
                                        ? "left-[8%] right-[6%] top-[41%]"
                                        : "left-[19%] right-[13%] top-[49%]"
                                )}
                            >
                                {milestones.map((milestone, index) => {
                                    const complete = index < stampCount;

                                    return (
                                        <div
                                            key={milestone.label}
                                            className="flex justify-center"
                                        >
                                            <div
                                                className={cn(
                                                    "grid place-items-center rounded-full border-[1.5px]",
                                                    "swap-ticket-stamp-circle",
                                                    compact
                                                        ? "size-[66px]"
                                                        : "size-[90px]",
                                                    complete
                                                        ? "border-[#1557c4]"
                                                        : "border-dashed border-black/85"
                                                )}
                                            >
                                                {complete ? (
                                                    <Image
                                                        src="/favicon-96x96.png"
                                                        alt="Renivet completed stamp"
                                                        width={96}
                                                        height={96}
                                                        className="w-[55%] rounded-[18%] object-cover shadow-[0_3px_8px_rgba(12,48,75,0.16)]"
                                                    />
                                                ) : (
                                                    <span
                                                        className={cn(
                                                            "font-extralight leading-none text-[#28313b]",
                                                            compact
                                                                ? "text-[31px]"
                                                                : "text-[43px]"
                                                        )}
                                                    >
                                                        +
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div
                                aria-hidden
                                className={cn(
                                    "absolute border-dashed",
                                    compact
                                        ? "left-[12%] right-[8%] top-[68.2%] border-t-2 border-[#263540]"
                                        : "left-[25%] right-[18%] top-[74.2%] border-t border-[#20282f]"
                                )}
                            />
                            <div
                                className={cn(
                                    "absolute grid grid-cols-5",
                                    compact
                                        ? "left-[8%] right-[6%] top-[58.5%]"
                                        : "left-[19%] right-[13%] top-[67.5%]"
                                )}
                            >
                                {milestones.map((milestone) => (
                                    <div
                                        key={milestone.label}
                                        className="flex flex-col items-center"
                                    >
                                        <div
                                            className={cn(
                                                "swap-ticket-milestone-icon flex items-end justify-center",
                                                compact
                                                    ? "h-[56px]"
                                                    : "h-[63px]"
                                            )}
                                        >
                                            <Image
                                                src={milestone.image}
                                                alt=""
                                                width={84}
                                                height={64}
                                                className="max-h-full w-auto max-w-[80%] object-contain"
                                            />
                                        </div>
                                        <p
                                            className={cn(
                                                "swap-ticket-milestone-copy mt-1 whitespace-pre-line text-center font-medium uppercase leading-[1.02] text-[#24583a]",
                                                compact
                                                    ? "text-[13px]"
                                                    : "text-[14px]"
                                            )}
                                        >
                                            {milestone.label}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div
                                className={cn(
                                    "absolute grid grid-cols-7 opacity-65",
                                    compact
                                        ? "bottom-[5%] left-[3%] gap-[4px]"
                                        : "bottom-[6%] left-[4%] gap-[5px]"
                                )}
                            >
                                {Array.from({ length: 49 }).map((_, index) => (
                                    <span
                                        key={index}
                                        className={cn(
                                            "rounded-full bg-[#998c58]",
                                            compact
                                                ? "size-[5px]"
                                                : "size-[6px]"
                                        )}
                                    />
                                ))}
                            </div>
                            <div
                                className={cn(
                                    "absolute",
                                    compact
                                        ? "bottom-[6%] left-[18%] w-[32%]"
                                        : "bottom-[6.3%] left-[21%] w-[21%]"
                                )}
                            >
                                <p
                                    className={cn(
                                        "swap-ticket-progress-copy font-medium uppercase text-[#17202b]",
                                        compact ? "text-[13px]" : "text-[14px]"
                                    )}
                                >
                                    {isLoading
                                        ? "Loading stamps"
                                        : `${stampCount}/5 stamps collected`}
                                </p>
                                <div
                                    className={cn(
                                        "mt-1 overflow-hidden rounded-full",
                                        compact
                                            ? "h-3 bg-[#aac8e1] ring-1 ring-[#7fa8cd]/60"
                                            : "h-2 bg-[#c7d9e8]"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "h-full rounded-full bg-[#1d58bd]",
                                            compact &&
                                                "shadow-[0_0_5px_#1d58bd]"
                                        )}
                                        style={{
                                            width: `${(stampCount / TOTAL_STAMPS) * 100}%`,
                                        }}
                                    />
                                </div>
                            </div>
                            <div
                                className={cn(
                                    "swap-ticket-slogan absolute flex items-center font-medium tracking-[0.02em] text-[#0e4ab5]",
                                    compact
                                        ? "bottom-[7%] right-[4%] gap-1 text-[14px]"
                                        : "bottom-[7%] right-[13%] gap-2 text-[17px]"
                                )}
                            >
                                <Image
                                    src="/assets/swap-rewards/leaf 2.png"
                                    alt=""
                                    width={30}
                                    height={30}
                                    className={cn(
                                        "object-contain",
                                        compact ? "size-[22px]" : "size-[30px]"
                                    )}
                                />
                                <span>Earn . Shop . Impact . Repeat</span>
                                <Image
                                    src="/assets/swap-rewards/leaf 2.png"
                                    alt=""
                                    width={30}
                                    height={30}
                                    className={cn(
                                        "scale-x-[-1] object-contain",
                                        compact ? "size-[22px]" : "size-[30px]"
                                    )}
                                />
                            </div>
                        </div>

                        <ThankYouTicket
                            animate={entranceStarted}
                            compact={compact}
                            narrowScreen={useSafeMobileEdge}
                        />
                    </section>
                    <BackSideTicket
                        compact={compact}
                        useSafeMobileEdge={useSafeMobileEdge}
                        stampCount={stampCount}
                        isLoading={isLoading}
                        hiddenFromAssistiveTechnology={!isFlipped}
                    />
                </div>
            </div>
            <style jsx global>{`
                .swap-ticket-stage {
                    perspective: 2200px;
                    text-rendering: geometricPrecision;
                    -webkit-font-smoothing: antialiased;
                }

                .swap-ticket-flipper {
                    -webkit-transform-style: preserve-3d;
                    transform-style: preserve-3d;
                    transition: transform 920ms cubic-bezier(0.2, 0.72, 0.2, 1);
                }

                .swap-ticket-flip-running {
                    will-change: transform;
                }

                .swap-ticket-is-flipped {
                    transform: rotateY(180deg);
                }

                .swap-ticket-face {
                    -webkit-backface-visibility: hidden;
                    backface-visibility: hidden;
                }

                .swap-ticket-back {
                    transform: rotateY(180deg);
                }

                .swap-back-impact {
                    clip-path: polygon(
                        3% 0,
                        100% 0,
                        100% 100%,
                        3% 100%,
                        0 98%,
                        3% 96%,
                        0 94%,
                        3% 92%,
                        0 90%,
                        3% 88%,
                        0 86%,
                        3% 84%,
                        0 82%,
                        3% 80%,
                        0 78%,
                        3% 76%,
                        0 74%,
                        3% 72%,
                        0 70%,
                        3% 68%,
                        0 66%,
                        3% 64%,
                        0 62%,
                        3% 60%,
                        0 58%,
                        3% 56%,
                        0 54%,
                        3% 52%,
                        0 50%,
                        3% 48%,
                        0 46%,
                        3% 44%,
                        0 42%,
                        3% 40%,
                        0 38%,
                        3% 36%,
                        0 34%,
                        3% 32%,
                        0 30%,
                        3% 28%,
                        0 26%,
                        3% 24%,
                        0 22%,
                        3% 20%,
                        0 18%,
                        3% 16%,
                        0 14%,
                        3% 12%,
                        0 10%,
                        3% 8%,
                        0 6%,
                        3% 4%,
                        0 2%
                    );
                }

                .swap-ticket-small-copy,
                .swap-ticket-milestone-copy,
                .swap-ticket-progress-copy,
                .swap-ticket-slogan,
                .swap-ticket-thankyou-copy,
                .swap-ticket-thankyou-date,
                .swap-back-step-copy,
                .swap-back-benefit-title,
                .swap-back-benefit-copy,
                .swap-back-journey-title,
                .swap-back-journey-copy,
                .swap-back-impact-title,
                .swap-back-impact-copy {
                    font-family: "League Spartan", sans-serif !important;
                }

                .swap-ticket-stage h2,
                .swap-ticket-stage h3,
                .swap-ticket-primary-heading {
                    font-family: "League Spartan", sans-serif !important;
                }

                @media (max-width: 700px) {
                    .swap-ticket-stage {
                        perspective: 1500px;
                        -webkit-perspective: 1500px;
                    }

                    .swap-ticket-flipper {
                        transition-duration: 700ms;
                        transition-timing-function: cubic-bezier(
                            0.22,
                            0.78,
                            0.2,
                            1
                        );
                    }

                    .swap-ticket-small-copy {
                        font-size: 21px !important;
                        font-weight: 500 !important;
                        letter-spacing: 0.03em !important;
                    }

                    .swap-ticket-milestone-copy,
                    .swap-ticket-progress-copy {
                        font-size: 19px !important;
                        font-weight: 600 !important;
                    }

                    .swap-ticket-slogan,
                    .swap-ticket-thankyou-copy {
                        font-size: 21px !important;
                        font-weight: 600 !important;
                    }

                    .swap-ticket-thankyou-date {
                        font-size: 20px !important;
                        font-weight: 500 !important;
                    }

                    .swap-back-step-copy {
                        width: 100% !important;
                        max-width: 150px !important;
                        min-height: 54px !important;
                        margin-top: 12px !important;
                        font-size: 19px !important;
                        font-weight: 500 !important;
                        line-height: 1.15 !important;
                    }

                    .swap-back-step-title {
                        display: flex;
                        width: 100%;
                        min-height: 30px;
                        align-items: center;
                        justify-content: center;
                        margin-left: auto !important;
                        margin-right: auto !important;
                        font-family: "League Spartan", sans-serif !important;
                        text-align: center;
                    }

                    .swap-back-how-content {
                        padding-top: 34px !important;
                        padding-bottom: 34px !important;
                    }

                    .swap-back-heading {
                        line-height: 1 !important;
                    }

                    .swap-back-steps {
                        align-items: start;
                        margin-top: 26px !important;
                    }

                    .swap-back-step {
                        justify-self: stretch;
                    }

                    .swap-back-benefits {
                        margin-top: 28px !important;
                        padding-top: 24px !important;
                    }

                    .swap-back-benefits-grid {
                        align-items: stretch;
                    }

                    .swap-back-benefit-item {
                        display: flex;
                        min-height: 88px;
                        flex-direction: column;
                        justify-content: flex-start;
                    }

                    .swap-back-benefit-title {
                        font-size: 18px !important;
                        font-weight: 700 !important;
                        line-height: 1.08 !important;
                    }

                    .swap-back-benefit-copy {
                        font-size: 15px !important;
                        font-weight: 500 !important;
                        line-height: 1.2 !important;
                    }

                    .swap-back-journey-panel {
                        padding-top: 36px !important;
                        padding-bottom: 36px !important;
                    }

                    .swap-back-journey-card {
                        margin-top: 24px !important;
                    }

                    .swap-back-journey-row {
                        min-height: 112px !important;
                        padding-top: 17px !important;
                        padding-bottom: 17px !important;
                    }

                    .swap-back-journey-title {
                        font-size: 17px !important;
                        line-height: 1.1 !important;
                    }

                    .swap-back-journey-copy {
                        font-size: 19px !important;
                        font-weight: 500 !important;
                        line-height: 1.15 !important;
                    }

                    .swap-back-impact-title {
                        font-size: 18px !important;
                    }

                    .swap-back-impact-copy {
                        font-size: 15px !important;
                        font-weight: 500 !important;
                    }

                    .swap-ticket-stamp-circle,
                    .swap-back-step-icon {
                        transform: scale(1.06);
                    }

                    .swap-ticket-milestone-icon {
                        transform: scale(1.08);
                        transform-origin: center bottom;
                    }
                }

                .swap-ticket-card-waiting {
                    opacity: 0;
                    transform: translate3d(-72px, 0, 0);
                }

                .swap-ticket-stub-waiting {
                    opacity: 0;
                    transform: translate3d(72px, 0, 0);
                }

                .swap-ticket-card-enter {
                    animation: swap-ticket-card-enter 1150ms
                        cubic-bezier(0.16, 1, 0.3, 1) both;
                    will-change: transform, opacity;
                    backface-visibility: hidden;
                }

                .swap-ticket-stub-enter {
                    animation: swap-ticket-stub-enter 1150ms
                        cubic-bezier(0.16, 1, 0.3, 1) 90ms both;
                    will-change: transform, opacity;
                    backface-visibility: hidden;
                }

                @keyframes swap-ticket-card-enter {
                    0% {
                        opacity: 0;
                        transform: translate3d(-72px, 0, 0);
                    }
                    28% {
                        opacity: 1;
                    }
                    82% {
                        transform: translate3d(3px, 0, 0);
                    }
                    100% {
                        opacity: 1;
                        transform: translate3d(0, 0, 0);
                    }
                }

                @keyframes swap-ticket-stub-enter {
                    0% {
                        opacity: 0;
                        transform: translate3d(72px, 0, 0);
                    }
                    28% {
                        opacity: 1;
                    }
                    82% {
                        transform: translate3d(-3px, 0, 0);
                    }
                    100% {
                        opacity: 1;
                        transform: translate3d(0, 0, 0);
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .swap-ticket-flipper {
                        transition: none;
                    }

                    .swap-ticket-card-waiting,
                    .swap-ticket-stub-waiting {
                        opacity: 1;
                        transform: none;
                    }

                    .swap-ticket-card-enter,
                    .swap-ticket-stub-enter {
                        animation: none;
                    }
                }
            `}</style>
        </div>
    );
}
