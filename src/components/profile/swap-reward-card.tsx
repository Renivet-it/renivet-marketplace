"use client";

import { Renivet } from "@/components/svgs";
import { Button } from "@/components/ui/button-general";
import { trpc } from "@/lib/trpc/client";
import { cn, formatPriceTag } from "@/lib/utils";
import { ArrowRight, Gift, Sparkles, Stamp } from "lucide-react";
import Link from "next/link";

const TOTAL_STAMPS = 5;

export function SwapRewardCard() {
    const { data, isLoading } =
        trpc.general.swapRewards.getSwapRewardStatus.useQuery();

    const stampCount = data?.currentCycleStampCount ?? 0;
    const remainingStamps = Math.max(0, TOTAL_STAMPS - stampCount);
    const isUnlocked = data?.rewardStatus === "unlocked";
    const totalRewardsEarned = data?.totalRewardsEarned ?? 0;
    const activeCycle = data?.activeRewardCycle ?? 1;

    return (
        <section className="relative overflow-hidden rounded-[26px] border border-[#dfcfb4] bg-[#f8f1e4] shadow-[0_24px_60px_-46px_rgba(92,61,22,0.52)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.86),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.58),rgba(245,233,206,0.9))]" />
            <div className="absolute inset-y-0 right-0 hidden w-[34%] bg-[linear-gradient(180deg,rgba(255,252,246,0.95),rgba(244,230,202,0.92))] lg:block" />
            <div className="absolute bottom-0 left-0 size-32 rounded-full bg-[#e0bf7b]/10 blur-3xl" />
            <div className="absolute right-16 top-12 hidden size-36 rounded-full bg-[#cda15f]/10 blur-3xl lg:block" />

            <div className="relative grid gap-0 lg:grid-cols-[minmax(0,1.78fr)_300px]">
                <div className="p-4 sm:p-5 lg:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-2 rounded-full border border-[#dbc79f] bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#8a6935]">
                                <Stamp className="size-3.5" />
                                Swap Rewards
                            </div>

                            <h2 className="mt-3 font-serif text-[1.65rem] font-semibold leading-[1.02] text-[#422c17] sm:text-[1.95rem] lg:max-w-[11ch] lg:text-[2.8rem]">
                                Your Renivet Swap Card
                            </h2>

                            <p className="leading-5.5 mt-2.5 max-w-xl text-13 text-[#705938] sm:text-sm sm:leading-6 lg:text-[15px] lg:leading-6">
                                Every delivered order earns one seal. Complete
                                five verified swaps to unlock a curated reward
                                worth up to {formatPriceTag(1499)}.
                            </p>
                        </div>

                        <div className="bg-white/72 rounded-[18px] border border-[#e2d4ba] px-3.5 py-2.5 lg:hidden">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#977744]">
                                Cycle {activeCycle.toString().padStart(2, "0")}
                            </p>
                            <div className="mt-1.5 flex items-end gap-1.5">
                                <span className="text-[1.75rem] font-semibold leading-none text-[#3c2814]">
                                    {isLoading ? "--" : stampCount}
                                </span>
                                <span className="pb-0.5 text-xs text-[#8d7245]">
                                    / {TOTAL_STAMPS}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 rounded-[22px] border border-[#e4d5b8] bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(252,246,235,0.92))] p-3.5 sm:p-4 lg:mt-6 lg:p-5">
                        <div className="flex flex-wrap items-center justify-between gap-2.5">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9a7946]">
                                    Stamp Board
                                </p>
                                <p className="mt-1 text-13 leading-5 text-[#7a633c] sm:text-sm">
                                    Returned, refunded, or cancelled orders do not count.
                                </p>
                            </div>

                            <div className="rounded-full bg-[#f5ebdb] px-3 py-1 text-xs font-medium text-[#86693c]">
                                {isLoading ? "Loading..." : `${remainingStamps} to go`}
                            </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2.5 sm:gap-3 lg:mt-5">
                            {Array.from({ length: TOTAL_STAMPS }).map((_, index) => {
                                const filled = index < stampCount;

                                return (
                                    <div
                                        key={index}
                                        className={cn(
                                            "relative flex size-[54px] items-center justify-center rounded-full border sm:size-[58px] lg:size-[68px]",
                                            filled
                                                ? "-rotate-6 border-[#8b311f] bg-[radial-gradient(circle_at_30%_30%,#bf5a43,#9F3A26_60%,#712417_100%)] text-[#fff8ed] shadow-[inset_0_0_0_2px_rgba(255,246,228,0.16),0_18px_24px_-20px_rgba(91,32,21,0.9)]"
                                                : "border-dashed border-[#ddc79e] bg-[#fffaf2] text-[#ad9060]"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "absolute inset-[4px] rounded-full border",
                                                filled
                                                    ? "border-white/18"
                                                    : "border-[#eddfc5]"
                                            )}
                                        />
                                        <span className="relative flex flex-col items-center leading-none">
                                            {filled ? (
                                                <Renivet
                                                    width={18}
                                                    height={18}
                                                    className="block sm:!h-5 sm:!w-5 lg:!h-6 lg:!w-6"
                                                    isNegative
                                                />
                                            ) : (
                                                <span className="text-sm font-semibold sm:text-base lg:text-lg">
                                                    {index + 1}
                                                </span>
                                            )}
                                            <span className="mt-1 text-[7px] uppercase tracking-[0.18em] opacity-80 lg:text-[8px]">
                                                {filled ? "sealed" : "open"}
                                            </span>
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="bg-white/72 mt-4 rounded-[18px] border border-[#e8dcc4] p-3.5 lg:mt-5 lg:flex lg:items-center lg:justify-between lg:gap-4">
                            <div className="flex items-start gap-3">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#f2e4cb] text-[#77532b]">
                                    <Gift className="size-3.5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-[#402d18] lg:text-[15px]">
                                        {isUnlocked
                                            ? "Your reward is unlocked and ready"
                                            : `Unlock your reward with ${TOTAL_STAMPS} completed stamps`}
                                    </p>
                                    <p className="sm:leading-5.5 mt-1 text-13 leading-5 text-[#7a623d] sm:text-sm">
                                        {isLoading
                                            ? "Checking your progress now."
                                            : isUnlocked
                                              ? "Choose one eligible product and complete your zero-pay redemption."
                                              : `${remainingStamps} more stamp${remainingStamps === 1 ? "" : "s"} before this card becomes a reward pass.`}
                                    </p>
                                </div>
                            </div>

                            {isUnlocked && (
                                <Button
                                    asChild
                                    className="mt-3 h-10 w-full rounded-xl bg-[#8d5b2f] text-sm text-white transition hover:bg-[#764825] lg:mt-0 lg:w-auto lg:min-w-[168px]"
                                >
                                    <Link
                                        href="/profile/rewards"
                                        className="inline-flex items-center justify-center gap-2"
                                    >
                                        Redeem Reward
                                        <ArrowRight className="size-4" />
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <aside className="border-t border-[#e5d7bc] bg-[linear-gradient(180deg,rgba(255,251,244,0.88),rgba(245,231,203,0.95))] p-4 sm:p-5 lg:border-l lg:border-t-0 lg:p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#977644]">
                                Reward Pass
                            </p>
                            <h3 className="mt-1.5 font-serif text-[1.55rem] font-semibold leading-tight text-[#3d2914] lg:text-[1.95rem]">
                                {isUnlocked ? "Ready to redeem" : "Awaiting completion"}
                            </h3>
                        </div>
                        <div
                            className={cn(
                                "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
                                isUnlocked
                                    ? "bg-[#245c36] text-white"
                                    : "bg-[#f1e5cf] text-[#8b6735]"
                            )}
                        >
                            {isUnlocked ? "Open" : "Locked"}
                        </div>
                    </div>

                    <div className="mt-4 grid gap-2.5">
                        <div className="bg-white/76 rounded-[18px] border border-[#e7dac2] p-3.5">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#997945]">
                                Cycle {activeCycle.toString().padStart(2, "0")}
                            </p>
                            <div className="mt-1.5 flex items-end gap-1.5">
                                <span className="text-[2rem] font-semibold leading-none text-[#3d2915] lg:text-[2.15rem]">
                                    {isLoading ? "--" : stampCount}
                                </span>
                                <span className="pb-0.5 text-xs text-[#8f7344] lg:text-sm">
                                    / {TOTAL_STAMPS} stamps
                                </span>
                            </div>
                            <p className="mt-2 text-13 text-[#6f5935] sm:text-sm">
                                {totalRewardsEarned} reward
                                {totalRewardsEarned === 1 ? "" : "s"} earned so far.
                            </p>
                        </div>

                        <div className="bg-white/68 rounded-[18px] border border-[#e7dac2] p-3.5">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#997945]">
                                Reward value
                            </p>
                            <p className="mt-1.5 text-[2rem] font-semibold text-[#8d5b2f] lg:text-[2.15rem]">
                                Up to {formatPriceTag(1499)}
                            </p>
                        </div>

                        <div className="rounded-[18px] border border-[#e7dac2] bg-white/55 p-3.5 text-13 leading-6 text-[#735d38] sm:text-sm">
                            One reward product per cycle. Once redeemed, your
                            next card begins from zero and starts collecting again.
                        </div>
                    </div>

                    {!isUnlocked && (
                        <div className="mt-4 flex items-start gap-2 rounded-[18px] border border-dashed border-[#dcc9a3] bg-white/50 p-3.5 text-13 leading-6 text-[#725d39] sm:text-sm">
                            <Sparkles className="mt-0.5 size-4 shrink-0 text-[#a06f33]" />
                            Keep collecting delivered orders to complete the card.
                        </div>
                    )}
                </aside>
            </div>
        </section>
    );
}
