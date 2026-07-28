"use client";

import {
    ArrowRight,
    Check,
    CircleDot,
    Flower2,
    Gift,
    Leaf,
    Sprout,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const completedJourney = [
    { label: "Seed", icon: CircleDot },
    { label: "Sprout", icon: Sprout },
    { label: "Leaf", icon: Leaf },
    { label: "Bloom", icon: Flower2 },
    { label: "Swap", icon: Gift },
] as const;

const rewardConfetti = [
    { left: "7%", color: "#f3c742" },
    { left: "14%", color: "#2f73cc" },
    { left: "22%", color: "#80a98a" },
    { left: "30%", color: "#f09b56" },
    { left: "39%", color: "#f3c742" },
    { left: "47%", color: "#2f73cc" },
    { left: "55%", color: "#80a98a" },
    { left: "63%", color: "#f09b56" },
    { left: "71%", color: "#f3c742" },
    { left: "79%", color: "#2f73cc" },
    { left: "87%", color: "#80a98a" },
    { left: "94%", color: "#f09b56" },
] as const;

interface RewardUnlockedCardProps {
    stampCount: number;
}

export function RewardUnlockedCard({ stampCount }: RewardUnlockedCardProps) {
    return (
        <section
            aria-labelledby="reward-unlocked-title"
            className="swap-campaign-font mx-auto w-full max-w-[1360px] overflow-hidden rounded-[28px] border border-[#d7e4ec] bg-transparent"
        >
            <div className="relative overflow-hidden bg-[linear-gradient(145deg,#fafdff_0%,#edf7ff_52%,#e1f0fb_100%)] px-4 pb-7 pt-8 sm:px-8 sm:pb-10 sm:pt-12 lg:px-14">
                <div className="pointer-events-none absolute -left-24 -top-24 size-64 rounded-full bg-[#f9d75f]/25 blur-3xl" />
                <div className="pointer-events-none absolute -right-20 top-24 size-72 rounded-full bg-[#a9d1f0]/30 blur-3xl" />
                <div
                    aria-hidden
                    className="reward-unlocked-confetti-layer pointer-events-none absolute inset-x-0 top-0 z-20 h-[390px] overflow-hidden"
                >
                    {rewardConfetti.map((piece, index) => (
                        <span
                            key={`${piece.left}-${piece.color}`}
                            className="reward-unlocked-confetti-piece absolute -top-4 h-3 w-1.5 rounded-full opacity-0"
                            style={{
                                left: piece.left,
                                backgroundColor: piece.color,
                                animationDelay: `${180 + (index % 6) * 90}ms`,
                            }}
                        />
                    ))}
                </div>

                <header className="reward-unlocked-header-enter relative z-30 mx-auto max-w-3xl text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#245d45] sm:text-sm">
                        Conscious journey complete
                    </p>
                    <h2
                        id="reward-unlocked-title"
                        className="mt-3 text-[38px] font-semibold leading-none tracking-[-0.04em] text-[#173f31] sm:text-[58px]"
                    >
                        You Made It.
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-[#587268] sm:text-[22px]">
                        Five thoughtful purchases later, you&apos;ve earned your{" "}
                        <span className="font-semibold text-[#1c5faf] underline decoration-[#a9c9e7] underline-offset-8">
                            Swap Reward.
                        </span>
                    </p>
                </header>

                <div
                    className="reward-unlocked-ticket reward-unlocked-ticket-enter relative z-30 mx-auto mt-8 grid aspect-[16/9] min-h-0 max-w-[960px] grid-cols-[72%_28%] overflow-hidden shadow-[0_20px_45px_-30px_rgba(21,58,83,0.5)] sm:mt-10 sm:aspect-auto sm:min-h-[320px] sm:grid-cols-[minmax(0,1fr)_220px]"
                    style={{ clipPath: "url(#reward-unlocked-ticket-shape)" }}
                >
                    <svg aria-hidden className="absolute size-0">
                        <defs>
                            <clipPath
                                id="reward-unlocked-ticket-shape"
                                clipPathUnits="objectBoundingBox"
                            >
                                <path d="M .025 0 H .975 Q 1 0 1 .025 V .12 C .976 .13 .976 .17 1 .18 V .28 C .976 .29 .976 .33 1 .34 V .66 C .976 .67 .976 .71 1 .72 V .82 C .976 .83 .976 .87 1 .88 V .975 Q 1 1 .975 1 H .025 Q 0 1 0 .975 V .88 C .024 .87 .024 .83 0 .82 V .72 C .024 .71 .024 .67 0 .66 V .34 C .024 .33 .024 .29 0 .28 V .18 C .024 .17 .024 .13 0 .12 V .025 Q 0 0 .025 0 Z" />
                            </clipPath>
                            <clipPath
                                id="reward-unlocked-mobile-ticket-shape"
                                clipPathUnits="objectBoundingBox"
                            >
                                <path d="M .04 0 H .96 Q 1 0 1 .04 V .08 C .982 .085 .982 .115 1 .12 V .16 C .982 .165 .982 .195 1 .20 V .24 C .982 .245 .982 .275 1 .28 V .34 C .94 .38 .94 .62 1 .66 V .72 C .982 .725 .982 .755 1 .76 V .80 C .982 .805 .982 .835 1 .84 V .88 C .982 .885 .982 .915 1 .92 V .96 Q 1 1 .96 1 H .04 Q 0 1 0 .96 V .92 C .018 .915 .018 .885 0 .88 V .84 C .018 .835 .018 .805 0 .80 V .76 C .018 .755 .018 .725 0 .72 V .66 C .06 .62 .06 .38 0 .34 V .28 C .018 .275 .018 .245 0 .24 V .20 C .018 .195 .018 .165 0 .16 V .12 C .018 .115 .018 .085 0 .08 V .04 Q 0 0 .04 0 Z" />
                            </clipPath>
                        </defs>
                    </svg>

                    <div className="relative grid place-items-center border border-[#d7d0ba] bg-[#fffdf8] px-4 py-3 text-center sm:px-10 sm:py-8">
                        <div className="pointer-events-none absolute inset-3 border border-dashed border-[#849a87]/65 sm:inset-6 sm:border-[#849a87]/55" />
                        <div className="relative">
                            <p className="text-[clamp(9px,2.4vw,15px)] normal-case tracking-[0.04em] text-[#27352d] sm:text-sm sm:uppercase sm:tracking-[0.12em] sm:text-[#627469]">
                                Conscious journey
                            </p>
                            <h3 className="mt-1 text-[clamp(24px,6.8vw,40px)] font-bold leading-[0.95] text-[#1653a5] sm:mt-2 sm:text-[48px]">
                                YOUR REWARD
                            </h3>
                            <p className="mt-1 text-[clamp(16px,4.4vw,27px)] font-medium text-[#294a37] sm:mt-3 sm:text-[28px]">
                                IS READY!
                            </p>
                            <p className="mx-auto mt-2 max-w-md text-[clamp(10px,2.7vw,16px)] leading-[1.08] text-[#295040] sm:mt-4 sm:text-[18px] sm:leading-snug">
                                You can now choose any product
                                <br className="sm:hidden" /> worth up to
                            </p>
                            <p className="mt-2 text-[clamp(33px,8.8vw,52px)] font-bold leading-none text-[#244229] sm:text-[56px]">
                                ₹1,499
                            </p>
                            <p className="reward-unlocked-ribbon mx-auto mt-3 w-[72%] bg-[#f8cf4f] px-4 py-1 text-[clamp(9px,2.5vw,15px)] font-semibold text-black sm:mt-5 sm:w-fit sm:px-10 sm:text-base sm:text-[#1d3c2b]">
                                Completely On Us
                            </p>
                        </div>
                    </div>

                    <div className="relative flex flex-col items-center justify-center border-y border-r border-[#dab53b] bg-[linear-gradient(155deg,#ffdc61,#f5c735)] px-2 text-center sm:px-5">
                        <div className="pointer-events-none absolute inset-3 border border-dashed border-[#59694f]/55 sm:hidden" />

                        <div className="relative mb-2 grid size-[clamp(56px,15vw,88px)] place-items-center rounded-full border border-[#244b39] sm:hidden">
                            <span className="absolute -top-1 -rotate-[18deg] whitespace-nowrap text-[clamp(7px,1.8vw,11px)] font-semibold text-[#174fb9]">
                                Conscious Choices
                            </span>
                            <Image
                                src="/assets/swap-rewards/leaf 2.png"
                                alt=""
                                width={60}
                                height={60}
                                className="w-[46%] object-contain"
                            />
                        </div>

                        <div className="relative grid size-[clamp(32px,8vw,48px)] place-items-center rounded-full border border-[#244b39] bg-[#f0c84b] shadow-[inset_0_0_0_3px_rgba(36,75,57,0.12)] sm:size-[105px] sm:bg-white/25 sm:shadow-none">
                            <Image
                                src="/favicon-96x96.png"
                                alt="Renivet reward stamp"
                                width={96}
                                height={96}
                                className="size-[72%] rounded-[20%] object-cover sm:size-[74px] sm:rounded-[20px]"
                            />
                        </div>
                        <div className="relative my-2 w-[82%] border-t border-dashed border-[#294d3a]/70 sm:my-6 sm:w-full" />
                        <p className="relative text-[clamp(8px,2.2vw,13px)] font-bold uppercase leading-[1.18] text-[#173f31] sm:text-[15px] sm:leading-tight">
                            Thank you for
                            <br />
                            shopping
                            <br />
                            consciously
                        </p>
                    </div>
                    <div
                        aria-hidden
                        className="reward-unlocked-perforation pointer-events-none absolute inset-y-0 left-[72%] z-10 w-3 -translate-x-1/2 sm:hidden"
                    />
                </div>

                <div className="relative mx-auto mt-7 max-w-[1060px] rounded-[24px] border border-[#dfe8ee] bg-white/90 px-3 py-6 shadow-[0_12px_28px_-24px_rgba(14,58,88,0.45)] sm:mt-10 sm:px-8 sm:py-8">
                    <div className="relative grid grid-cols-5">
                        <div className="absolute left-[10%] right-[10%] top-[27px] h-px bg-[#bfd0dc] sm:top-[34px]" />
                        {completedJourney.map(({ label, icon: Icon }) => (
                            <div
                                key={label}
                                className="relative flex min-w-0 flex-col items-center text-center"
                            >
                                <div className="relative z-10 grid size-[54px] place-items-center rounded-full border-2 border-[#f1cf4e] bg-white text-[#245d45] sm:size-[68px]">
                                    <Icon
                                        aria-hidden
                                        className="size-6 sm:size-8"
                                        strokeWidth={1.8}
                                    />
                                </div>
                                <p className="mt-2 text-[10px] font-semibold text-[#52645b] sm:text-sm">
                                    {label}
                                </p>
                                <span className="mt-2 grid size-5 place-items-center rounded-full bg-[#285a46] text-white sm:size-6">
                                    <Check
                                        aria-hidden
                                        className="size-3.5 sm:size-4"
                                        strokeWidth={3}
                                    />
                                </span>
                            </div>
                        ))}
                    </div>
                    <p className="mx-auto mt-6 max-w-[650px] rounded-full border border-[#efca3d] px-4 py-3 text-center text-[11px] font-bold uppercase tracking-[0.06em] text-[#315747] sm:text-base">
                        {stampCount} of 5 thoughtful purchases completed
                    </p>
                </div>

                <div className="relative mx-auto mt-7 grid max-w-[1060px] grid-cols-[42%_58%] overflow-hidden rounded-[24px] border-2 border-dashed border-[#9caab3] bg-white/75 p-3 sm:mt-10 sm:grid-cols-[310px_minmax(0,1fr)] sm:gap-8 sm:p-6">
                    <div className="overflow-hidden rounded-[18px] bg-[#d7e9f8]">
                        <Image
                            src="/assets/swap-rewards/unlocked/swap-campaign-poster.png"
                            alt="Swap campaign reward poster"
                            width={2376}
                            height={5008}
                            className="h-full w-full object-cover object-top"
                            priority
                        />
                    </div>
                    <div className="flex min-w-0 flex-col justify-center px-3 py-3 sm:px-0 sm:py-6">
                        <p className="text-[20px] font-semibold leading-tight text-[#315747] sm:text-[38px]">
                            Your Reward is Ready!
                        </p>
                        <p className="mt-3 text-[12px] leading-relaxed text-[#746f6b] sm:text-[21px]">
                            You can now choose any product worth up to
                        </p>
                        <p className="mt-2 text-[35px] font-bold leading-none text-[#2468b5] sm:text-[58px]">
                            ₹1,499
                        </p>
                        <p className="mt-2 text-[11px] font-bold uppercase text-[#4b4946] sm:text-[17px]">
                            Completely on us.
                        </p>
                        <p className="mt-4 hidden text-[16px] leading-relaxed text-[#77706b] sm:block">
                            Browse the collection and pick your favourite!
                        </p>
                    </div>
                </div>

                <div className="relative mx-auto mt-7 max-w-[920px] space-y-3 sm:mt-10 sm:space-y-4">
                    <Link
                        href="/profile/rewards"
                        className="flex min-h-14 items-center justify-center gap-3 rounded-full bg-[#315c4b] px-6 text-[17px] font-semibold text-white shadow-[0_12px_24px_-15px_rgba(27,68,52,0.8)] transition hover:bg-[#274d3f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#315c4b]/25 sm:min-h-16 sm:text-[22px]"
                    >
                        Choose My Reward
                        <ArrowRight aria-hidden className="size-5 sm:size-6" />
                    </Link>
                    <Link
                        href="/shop"
                        className="flex min-h-14 items-center justify-center rounded-full border-2 border-[#aaa5a0] bg-white/60 px-6 text-[17px] font-medium text-[#315c4b] transition hover:border-[#315c4b] hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#315c4b]/20 sm:min-h-16 sm:text-[21px]"
                    >
                        Continue Shopping
                    </Link>
                </div>

                <footer className="relative mt-10 text-center sm:mt-14">
                    <p className="text-[24px] font-medium text-[#315c4b] sm:text-[36px]">
                        This is only the beginning.
                    </p>
                    <p className="mt-2 text-[13px] text-[#77716c] sm:text-[17px]">
                        Every choice you make creates a better tomorrow.
                    </p>
                </footer>

                <style jsx global>{`
                    .reward-unlocked-header-enter {
                        animation: reward-unlocked-header-enter 700ms
                            cubic-bezier(0.16, 1, 0.3, 1) 100ms both;
                    }

                    .reward-unlocked-ticket-enter {
                        animation: reward-unlocked-ticket-enter 850ms
                            cubic-bezier(0.16, 1, 0.3, 1) 260ms both;
                        transform-origin: 50% 55%;
                    }

                    .reward-unlocked-confetti-piece {
                        animation: reward-unlocked-confetti-fall 1900ms
                            cubic-bezier(0.2, 0.7, 0.3, 1) both;
                        will-change: transform, opacity;
                    }

                    .reward-unlocked-confetti-piece:nth-child(3n + 1) {
                        --reward-confetti-drift: 34px;
                    }

                    .reward-unlocked-confetti-piece:nth-child(3n + 2) {
                        --reward-confetti-drift: -28px;
                        width: 10px;
                        border-radius: 50%;
                    }

                    .reward-unlocked-confetti-piece:nth-child(3n) {
                        --reward-confetti-drift: 18px;
                    }

                    .reward-unlocked-perforation {
                        background-image: radial-gradient(
                            circle,
                            #f7f4ef 0 4px,
                            transparent 4.5px
                        );
                        background-position: center 1px;
                        background-repeat: repeat-y;
                        background-size: 12px 18px;
                    }

                    .reward-unlocked-ribbon {
                        clip-path: polygon(
                            0 0,
                            10% 50%,
                            0 100%,
                            100% 100%,
                            90% 50%,
                            100% 0
                        );
                    }

                    @media (max-width: 639px) {
                        .reward-unlocked-ticket {
                            clip-path: url(#reward-unlocked-mobile-ticket-shape) !important;
                        }
                    }

                    @media (min-width: 640px) {
                        .reward-unlocked-ribbon {
                            clip-path: none;
                        }
                    }

                    @keyframes reward-unlocked-header-enter {
                        0% {
                            opacity: 0;
                            transform: translate3d(0, 14px, 0);
                        }
                        100% {
                            opacity: 1;
                            transform: translate3d(0, 0, 0);
                        }
                    }

                    @keyframes reward-unlocked-ticket-enter {
                        0% {
                            opacity: 0;
                            transform: translate3d(0, 22px, 0) scale(0.975);
                        }
                        72% {
                            opacity: 1;
                            transform: translate3d(0, -2px, 0) scale(1.006);
                        }
                        100% {
                            opacity: 1;
                            transform: translate3d(0, 0, 0) scale(1);
                        }
                    }

                    @keyframes reward-unlocked-confetti-fall {
                        0% {
                            opacity: 0;
                            transform: translate3d(0, -14px, 0) rotate(0deg)
                                scale(0.65);
                        }
                        16% {
                            opacity: 0.95;
                        }
                        78% {
                            opacity: 0.8;
                        }
                        100% {
                            opacity: 0;
                            transform: translate3d(
                                    var(--reward-confetti-drift, 20px),
                                    330px,
                                    0
                                )
                                rotate(420deg) scale(1);
                        }
                    }

                    @media (prefers-reduced-motion: reduce) {
                        .reward-unlocked-header-enter,
                        .reward-unlocked-ticket-enter,
                        .reward-unlocked-confetti-piece {
                            animation: none;
                        }

                        .reward-unlocked-confetti-layer {
                            display: none;
                        }
                    }
                `}</style>
            </div>
        </section>
    );
}
