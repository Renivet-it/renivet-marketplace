"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import type { CSSProperties } from "react";

const TOTAL_STAMPS = 5;

const confetti = [
    ["8%", "20%", "#f5c84c", "80ms", "18deg"],
    ["16%", "38%", "#3979d5", "160ms", "72deg"],
    ["25%", "14%", "#75ad83", "230ms", "34deg"],
    ["34%", "28%", "#ef9d55", "120ms", "120deg"],
    ["65%", "17%", "#3979d5", "190ms", "48deg"],
    ["75%", "31%", "#f5c84c", "290ms", "105deg"],
    ["84%", "15%", "#75ad83", "140ms", "145deg"],
    ["91%", "38%", "#ef9d55", "250ms", "15deg"],
    ["11%", "65%", "#ef9d55", "310ms", "55deg"],
    ["22%", "76%", "#3979d5", "210ms", "95deg"],
    ["79%", "65%", "#75ad83", "270ms", "30deg"],
    ["89%", "77%", "#f5c84c", "180ms", "135deg"],
] as const;

interface SwapStampCelebrationProps {
    isOpen: boolean;
    customerName?: string | null;
    targetStampCount?: number;
}

export function SwapStampCelebration({
    isOpen,
    customerName,
    targetStampCount = 1,
}: SwapStampCelebrationProps) {
    if (!isOpen) return null;

    const firstName = customerName?.trim().split(/\s+/)[0];
    const completedStampCount = Math.min(
        TOTAL_STAMPS,
        Math.max(1, targetStampCount)
    );
    const previousStampCount = Math.max(0, completedStampCount - 1);
    const targetIndex = completedStampCount - 1;
    const remainingStampCount = TOTAL_STAMPS - completedStampCount;
    const progressStartScale =
        completedStampCount === 0
            ? 0
            : previousStampCount / completedStampCount;
    const animationStyle = {
        "--target-left": `${10 + targetIndex * 20}%`,
        "--progress-start": progressStartScale,
    } as CSSProperties;

    return (
        <div
            className="swap-campaign-font fixed inset-0 z-[200] grid place-items-center bg-[#071624]/60 p-2 backdrop-blur-[8px] sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="swap-stamp-title"
            aria-describedby="swap-stamp-description"
        >
            <section
                className="swap-celebration-card relative flex w-[calc(100vw-16px)] max-w-[430px] flex-col overflow-hidden rounded-[28px] border border-white/85 bg-[linear-gradient(145deg,#fafdff_0%,#eaf5ff_48%,#d9ebfa_100%)] px-4 pb-5 pt-5 text-center shadow-[0_30px_90px_rgba(4,23,39,0.42)] sm:max-w-[650px] sm:rounded-[38px] sm:px-10 sm:pb-7 sm:pt-8"
                style={{
                    ...animationStyle,
                    height: "min(590px, calc(100dvh - 16px))",
                }}
            >
                <div className="absolute -left-16 -top-20 size-52 rounded-full bg-[#bcd8ef]/50 blur-2xl" />
                <div className="absolute -bottom-24 -right-14 size-64 rounded-full bg-[#f3d995]/35 blur-2xl" />
                <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

                {confetti.map(([left, top, color, delay, rotate], index) => (
                    <span
                        key={`${left}-${top}`}
                        aria-hidden
                        className={cn(
                            "swap-confetti absolute z-10 h-3 w-1.5 rounded-full opacity-0",
                            index % 3 === 0 && "w-3 rounded-[50%]"
                        )}
                        style={{
                            left,
                            top,
                            backgroundColor: color,
                            animationDelay: `calc(1.74s + ${delay})`,
                            transform: `rotate(${rotate})`,
                        }}
                    />
                ))}

                <header className="relative z-20 shrink-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#2c628c] sm:text-xs">
                        Swap campaign
                    </p>
                    <h2
                        id="swap-stamp-title"
                        className="mt-1.5 text-[27px] font-semibold leading-tight tracking-[-0.025em] text-[#102d43] sm:mt-2 sm:text-[38px]"
                    >
                        Congratulations{firstName ? `, ${firstName}` : ""}!
                    </h2>
                    <p
                        id="swap-stamp-description"
                        className="mx-auto mt-1.5 max-w-md text-[12px] leading-relaxed text-[#4a6578] sm:text-[15px]"
                    >
                        Your conscious purchase is confirmed.
                    </p>
                </header>

                <div className="swap-ticket-flip-scene relative z-20 mx-auto mt-4 w-full max-w-[386px] shrink-0 sm:mt-5 sm:max-w-[500px]">
                    <div
                        className={cn(
                            "swap-ticket-flip-card relative w-full",
                            completedStampCount === TOTAL_STAMPS &&
                                "swap-ticket-flip-card-complete"
                        )}
                    >
                        <div className="swap-mini-ticket swap-ticket-face swap-ticket-front relative w-full overflow-hidden rounded-[19px] bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.42),transparent_42%),linear-gradient(145deg,#d9ecfb_0%,#cfe5f7_100%)] px-4 pb-4 pt-4 shadow-[0_18px_34px_-22px_rgba(20,69,111,0.58)] sm:px-7 sm:pb-5 sm:pt-5">
                            <div className="from-white/22 pointer-events-none absolute inset-x-8 top-0 h-20 rounded-b-full bg-gradient-to-b to-transparent opacity-70" />

                            <div className="relative z-10 flex min-h-[46px] items-start justify-between px-3 pb-2">
                                <div className="text-left">
                                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#46708f] sm:text-[10px]">
                                        Your swap ticket
                                    </p>
                                    <p className="mt-0.5 text-[14px] font-semibold text-[#123b58] sm:text-[16px]">
                                        Renivet stamp secured
                                    </p>
                                </div>
                                <div
                                    className="swap-count-reveal min-w-[74px] text-right"
                                    aria-live="polite"
                                >
                                    <strong className="text-[24px] leading-none text-[#0d4fb7] sm:text-[28px]">
                                        {completedStampCount}/5
                                    </strong>
                                    <span className="block text-[8px] font-bold uppercase tracking-[0.12em] text-[#47647b] sm:text-[9px]">
                                        stamps collected
                                    </span>
                                </div>
                            </div>

                            <div className="relative z-10 h-[150px] overflow-hidden sm:h-[164px]">
                                <div className="swap-milestone-reveal absolute inset-x-6 top-4 z-20 flex items-center justify-center gap-2 text-center sm:top-5">
                                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#1557c4] text-[11px] font-bold text-white shadow-[0_4px_10px_rgba(21,87,196,0.28)]">
                                        ✓
                                    </span>
                                    <p className="text-[10px] font-semibold tracking-[0.01em] text-[#254b66] sm:text-[12px]">
                                        {remainingStampCount === 0
                                            ? "Reward unlocked—your conscious choice paid off!"
                                            : `Great choice—only ${remainingStampCount} more ${remainingStampCount === 1 ? "stamp" : "stamps"} to your reward`}
                                    </p>
                                </div>

                                <div
                                    aria-hidden
                                    className="swap-ticket-stamp-tool absolute top-0 z-30 flex -translate-x-1/2 flex-col items-center"
                                >
                                    <div className="swap-stamp-handle relative h-[31px] w-[39px] overflow-hidden rounded-[18px_18px_9px_9px] border border-[#315d78] bg-[linear-gradient(90deg,#32627e_0%,#183e57_48%,#102e43_70%,#315f7b_100%)] shadow-[0_5px_9px_rgba(18,52,73,0.2),inset_4px_2px_6px_rgba(255,255,255,0.2)] sm:h-[34px] sm:w-[43px]">
                                        <span className="absolute left-[7px] top-[4px] h-[18px] w-[5px] rounded-full bg-white/20 blur-[0.5px]" />
                                    </div>
                                    <div className="swap-stamp-neck -mt-px h-[15px] w-[15px] border-x border-[#163b54] bg-[linear-gradient(90deg,#2e5f7b,#173c54_58%,#2b5974)] shadow-[inset_3px_0_3px_rgba(255,255,255,0.12)] sm:h-4 sm:w-4" />
                                    <div className="swap-stamp-collar -mb-[2px] h-[8px] w-[38px] rounded-[5px] border border-[#173a51] bg-[linear-gradient(180deg,#3c6d88,#15374e)] shadow-[0_3px_5px_rgba(18,48,68,0.2)] sm:w-[42px]" />
                                    <div className="swap-stamp-base relative grid h-[54px] w-[59px] place-items-center rounded-[17px] border-[4px] border-[#153a52] bg-[linear-gradient(145deg,#87b4d0,#376b89_45%,#163e58)] shadow-[0_12px_18px_rgba(20,53,75,0.3),inset_0_0_0_1px_rgba(255,255,255,0.3)] sm:h-[59px] sm:w-[65px] sm:rounded-[19px]">
                                        <span className="absolute inset-[3px] rounded-[11px] border border-white/25" />
                                        <span className="swap-stamp-face relative grid size-[40px] place-items-center overflow-hidden rounded-[11px] border border-[#b7d1e3] bg-[#fbfdff] shadow-[inset_0_1px_4px_rgba(25,67,94,0.18)] sm:size-[45px] sm:rounded-[12px]">
                                            <Image
                                                src="/favicon-96x96.png"
                                                alt=""
                                                width={96}
                                                height={96}
                                                priority
                                                className="size-[37px] rounded-[9px] object-cover sm:size-[42px] sm:rounded-[10px]"
                                            />
                                            <span className="pointer-events-none absolute inset-x-1 top-1 h-1/3 rounded-full bg-gradient-to-b from-white/45 to-transparent" />
                                        </span>
                                        <span className="absolute -bottom-[5px] h-[7px] w-[46px] rounded-b-[9px] border-x border-b border-[#0b293c] bg-[#102f45] sm:w-[51px]" />
                                    </div>
                                </div>

                                <div className="absolute inset-x-0 bottom-1 grid grid-cols-5 gap-2 sm:gap-3">
                                    {Array.from({ length: TOTAL_STAMPS }).map(
                                        (_, index) => {
                                            const isPrevious =
                                                index < previousStampCount;
                                            const isNewStamp =
                                                index === targetIndex;
                                            const isFilled =
                                                index < completedStampCount;
                                            return (
                                                <div
                                                    key={index}
                                                    className={cn(
                                                        "swap-ticket-slot relative grid aspect-square place-items-center rounded-full border-[1.5px]",
                                                        isFilled
                                                            ? "border-[#1557c4] bg-white/65 shadow-[0_5px_14px_rgba(21,87,196,0.12)]"
                                                            : "border-dashed border-[#38536a] bg-white/25",
                                                        isNewStamp &&
                                                            "swap-ticket-slot-target"
                                                    )}
                                                >
                                                    {isNewStamp && (
                                                        <span
                                                            aria-hidden
                                                            className="swap-stamp-contact-shadow pointer-events-none absolute inset-[5px] rounded-full bg-[radial-gradient(circle,rgba(12,45,69,0.32)_0%,rgba(30,88,128,0.13)_42%,transparent_72%)] opacity-0 blur-[1px]"
                                                        />
                                                    )}
                                                    {isPrevious ||
                                                    isNewStamp ? (
                                                        <div
                                                            className={cn(
                                                                "relative z-10 grid size-[70%] place-items-center rounded-[22%] bg-white shadow-[0_3px_9px_rgba(12,48,75,0.18)]",
                                                                isNewStamp &&
                                                                    "swap-new-stamp-impression"
                                                            )}
                                                        >
                                                            <Image
                                                                src="/favicon-96x96.png"
                                                                alt={
                                                                    isNewStamp
                                                                        ? "New Renivet stamp"
                                                                        : "Renivet stamp"
                                                                }
                                                                width={96}
                                                                height={96}
                                                                className="size-[88%] rounded-[18%] object-cover"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <span className="text-[22px] font-light leading-none text-[#314658] sm:text-[27px]">
                                                            +
                                                        </span>
                                                    )}
                                                    {isFilled && (
                                                        <span
                                                            className={cn(
                                                                "absolute -right-0.5 -top-0.5 z-20 grid size-4 place-items-center rounded-full border border-white bg-[#1557c4] text-[9px] font-bold leading-none text-white shadow-[0_2px_6px_rgba(21,87,196,0.3)]",
                                                                isNewStamp &&
                                                                    "swap-new-stamp-check"
                                                            )}
                                                        >
                                                            ✓
                                                        </span>
                                                    )}
                                                    {isNewStamp && (
                                                        <>
                                                            <span className="swap-stamp-ring absolute inset-[-7px] rounded-full border-2 border-[#2d6eca]/45 opacity-0" />
                                                            <span className="swap-stamp-ring-secondary absolute inset-[-3px] rounded-full border border-white/80 opacity-0" />
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            </div>

                            <div className="relative z-10 mx-3 mb-1 flex items-center justify-between text-[8px] font-bold uppercase tracking-[0.12em] text-[#56758c] sm:text-[9px]">
                                <span>Reward progress</span>
                                <span className="text-[#1557c4]">
                                    {remainingStampCount === 0
                                        ? "Ready to redeem"
                                        : `${remainingStampCount} to go`}
                                </span>
                            </div>
                            <div className="relative z-10 mx-3 mt-0.5 h-2 overflow-hidden rounded-full bg-[#b1cde3] shadow-[inset_0_1px_2px_rgba(28,75,107,0.15)]">
                                <span
                                    className="swap-celebration-progress block h-full origin-left rounded-full bg-[linear-gradient(90deg,#174fb9,#68a7df)]"
                                    style={{
                                        width: `${(completedStampCount / TOTAL_STAMPS) * 100}%`,
                                    }}
                                />
                            </div>
                        </div>

                        {completedStampCount === TOTAL_STAMPS && (
                            <div
                                className="swap-reward-ticket-face swap-ticket-face absolute inset-0 grid overflow-hidden rounded-[19px] bg-[#fffdf7] shadow-[0_22px_42px_-24px_rgba(58,55,34,0.5)]"
                                aria-label="Your reward is ready"
                            >
                                <div className="grid h-full grid-cols-[72%_28%]">
                                    <div className="relative grid place-items-center bg-[radial-gradient(circle_at_25%_15%,rgba(248,210,80,0.09),transparent_36%),linear-gradient(145deg,#fffdf7,#f8f3e8)] px-5 py-4 text-center sm:px-9 sm:py-5">
                                        <div className="pointer-events-none absolute inset-3 rounded-[11px] border border-dashed border-[#718575]/55 sm:inset-4" />
                                        <div className="relative z-10">
                                            <p className="text-[9px] font-medium normal-case tracking-[0.06em] text-[#35453a] sm:text-[11px]">
                                                conscious journey
                                            </p>
                                            <p className="mt-1 text-[28px] font-bold leading-[0.95] tracking-[-0.03em] text-[#1350a5] sm:text-[36px]">
                                                YOUR REWARD
                                            </p>
                                            <p className="mt-1 text-[19px] font-medium leading-none text-[#29452f] sm:mt-2 sm:text-[24px]">
                                                IS READY!
                                            </p>
                                            <p className="mx-auto mt-3 max-w-[260px] text-[10px] leading-[1.18] text-[#315740] sm:text-[13px]">
                                                You can now choose any product
                                                <br />
                                                worth up to
                                            </p>
                                            <p className="mt-1 text-[40px] font-bold leading-none tracking-[-0.04em] text-[#264127] sm:text-[48px]">
                                                ₹1,499
                                            </p>
                                            <p className="swap-reward-ribbon mx-auto mt-3 w-[82%] bg-[#f8ce4e] px-3 py-1.5 text-[10px] font-semibold text-[#173b2b] sm:w-[78%] sm:text-[13px]">
                                                Completely On Us
                                            </p>
                                        </div>
                                    </div>

                                    <div className="relative flex h-full flex-col items-center justify-center bg-[radial-gradient(circle_at_35%_18%,rgba(255,255,255,0.28),transparent_34%),linear-gradient(155deg,#ffda58,#f4c437)] px-2 text-center sm:px-3">
                                        <div className="pointer-events-none absolute inset-3 rounded-[9px] border border-dashed border-[#5d6f4d]/55 sm:inset-4" />

                                        <div className="relative z-10 grid size-[58px] place-items-center rounded-full border border-[#244a39] sm:size-[70px]">
                                            <span className="absolute -top-1 -rotate-[16deg] whitespace-nowrap text-[7px] font-semibold text-[#174fb9] sm:text-[8px]">
                                                Conscious Choices
                                            </span>
                                            <Image
                                                src="/assets/swap-rewards/leaf 2.png"
                                                alt=""
                                                width={60}
                                                height={60}
                                                className="w-[45%] object-contain"
                                            />
                                        </div>

                                        <div className="relative z-10 my-2 grid size-9 place-items-center rounded-full border border-[#31533e] bg-white/55 shadow-[inset_0_0_0_2px_rgba(49,83,62,0.1)] sm:my-3 sm:size-11">
                                            <Image
                                                src="/favicon-96x96.png"
                                                alt="Renivet reward stamp"
                                                width={96}
                                                height={96}
                                                className="size-[78%] rounded-[20%] object-cover"
                                            />
                                        </div>

                                        <div className="relative z-10 mb-3 w-[72%] border-t border-dashed border-[#294d3a]/65" />
                                        <p className="relative z-10 text-[8px] font-bold uppercase leading-[1.35] text-[#173f31] sm:text-[10px]">
                                            Thank you for
                                            <br />
                                            shopping
                                            <br />
                                            consciously
                                        </p>
                                    </div>
                                </div>

                                <div
                                    aria-hidden
                                    className="swap-reward-perforation pointer-events-none absolute inset-y-0 left-[72%] z-20 w-3 -translate-x-1/2"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="relative z-20 mt-4 flex min-h-0 flex-1 flex-col justify-center sm:mt-5">
                    <p className="text-[18px] font-semibold leading-tight text-[#123b58] sm:text-[21px]">
                        {completedStampCount === TOTAL_STAMPS
                            ? "Five stamps complete—your reward is ready!"
                            : `Stamp ${completedStampCount} of ${TOTAL_STAMPS} is now secured`}
                    </p>
                    <p className="mx-auto mt-1.5 max-w-md text-[11px] leading-relaxed text-[#587084] sm:text-[13px]">
                        It will be confirmed on your ticket when this order is
                        delivered.
                    </p>
                    <p className="mt-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#678092] sm:mt-4 sm:text-[10px]">
                        Taking you to your orders
                    </p>
                </div>
            </section>

            <style jsx>{`
                .swap-celebration-card {
                    animation: celebration-card-enter 620ms
                        cubic-bezier(0.2, 0.82, 0.2, 1) both;
                }

                .swap-ticket-flip-scene {
                    isolation: isolate;
                }

                .swap-ticket-flip-card {
                    transform: translate3d(0, 0, 0);
                }

                .swap-ticket-face {
                    contain: paint;
                    transform-origin: 50% 50%;
                    will-change: transform, opacity;
                }

                .swap-ticket-front {
                    opacity: 1;
                    transform: translate3d(0, 0, 0) scaleX(1);
                }

                .swap-reward-ticket-face {
                    opacity: 0;
                    transform: translate3d(0, 0, 0) scaleX(0);
                }

                .swap-ticket-flip-card-complete .swap-ticket-front {
                    animation: reward-ticket-front-fold 660ms
                        cubic-bezier(0.5, 0, 0.72, 0.3) 3.72s forwards;
                }

                .swap-ticket-flip-card-complete .swap-reward-ticket-face {
                    animation: reward-ticket-back-unfold 720ms
                        cubic-bezier(0.18, 0.7, 0.2, 1) 4.3s forwards;
                }

                .swap-mini-ticket,
                .swap-reward-ticket-face {
                    -webkit-mask-image: radial-gradient(
                            circle at 0 16px,
                            transparent 0 7px,
                            #000 7.5px
                        ),
                        radial-gradient(
                            circle at 100% 16px,
                            transparent 0 7px,
                            #000 7.5px
                        );
                    -webkit-mask-position:
                        left top,
                        right top;
                    -webkit-mask-size:
                        51% 32px,
                        51% 32px;
                    -webkit-mask-repeat: repeat-y;
                    mask-image: radial-gradient(
                            circle at 0 16px,
                            transparent 0 7px,
                            #000 7.5px
                        ),
                        radial-gradient(
                            circle at 100% 16px,
                            transparent 0 7px,
                            #000 7.5px
                        );
                    mask-position:
                        left top,
                        right top;
                    mask-size:
                        51% 32px,
                        51% 32px;
                    mask-repeat: repeat-y;
                }

                .swap-reward-perforation {
                    background-image: radial-gradient(
                        circle,
                        #eef6fc 0 3.5px,
                        transparent 4px
                    );
                    background-position: center 3px;
                    background-repeat: repeat-y;
                    background-size: 12px 15px;
                }

                .swap-reward-ribbon {
                    clip-path: polygon(
                        0 0,
                        9% 50%,
                        0 100%,
                        100% 100%,
                        91% 50%,
                        100% 0
                    );
                }

                .swap-ticket-stamp-tool {
                    left: var(--target-left);
                    animation: ticket-stamp-press 2.7s linear 420ms both;
                    will-change: transform, opacity;
                }

                .swap-stamp-handle,
                .swap-stamp-neck,
                .swap-stamp-collar,
                .swap-stamp-base {
                    will-change: transform;
                }

                .swap-stamp-base {
                    animation: stamp-base-compress 2.7s linear 420ms both;
                    transform-origin: 50% 100%;
                }

                .swap-stamp-contact-shadow {
                    animation: stamp-contact-shadow 820ms
                        cubic-bezier(0.2, 0.78, 0.25, 1) 1.54s forwards;
                }

                .swap-new-stamp-impression {
                    opacity: 0;
                    animation: new-stamp-appear 680ms
                        cubic-bezier(0.16, 0.9, 0.25, 1.15) 1.82s forwards;
                }

                .swap-new-stamp-check {
                    opacity: 0;
                    animation: stamp-check-pop 480ms
                        cubic-bezier(0.18, 0.9, 0.25, 1.25) 2.08s forwards;
                }

                .swap-stamp-ring {
                    animation: stamp-ring-release 920ms ease-out 1.84s forwards;
                }

                .swap-stamp-ring-secondary {
                    animation: stamp-ring-secondary 720ms ease-out 1.92s
                        forwards;
                }

                .swap-count-reveal {
                    animation: count-reveal 620ms
                        cubic-bezier(0.2, 0.85, 0.2, 1) 2.12s both;
                }

                .swap-milestone-reveal {
                    opacity: 0;
                    animation: milestone-reveal 620ms
                        cubic-bezier(0.2, 0.82, 0.2, 1) 2.72s forwards;
                }

                .swap-celebration-progress {
                    transform: scaleX(var(--progress-start));
                    animation: progress-fill 760ms
                        cubic-bezier(0.2, 0.78, 0.2, 1) 2.16s forwards;
                }

                .swap-confetti {
                    animation: confetti-pop 1.45s
                        cubic-bezier(0.2, 0.75, 0.25, 1) both;
                }

                @keyframes celebration-card-enter {
                    from {
                        opacity: 0;
                        transform: translate3d(0, 22px, 0) scale(0.97);
                    }
                    to {
                        opacity: 1;
                        transform: translate3d(0, 0, 0) scale(1);
                    }
                }

                @keyframes reward-ticket-front-fold {
                    0% {
                        opacity: 1;
                        transform: translate3d(0, 0, 0) scaleX(1);
                    }
                    78% {
                        opacity: 1;
                        transform: translate3d(0, 0, 0) scaleX(0.08);
                    }
                    100% {
                        opacity: 0;
                        transform: translate3d(0, 0, 0) scaleX(0);
                    }
                }

                @keyframes reward-ticket-back-unfold {
                    0% {
                        opacity: 0;
                        transform: translate3d(0, 0, 0) scaleX(0);
                    }
                    10% {
                        opacity: 1;
                        transform: translate3d(0, 0, 0) scaleX(0.06);
                    }
                    78% {
                        opacity: 1;
                        transform: translate3d(0, 0, 0) scaleX(1.012);
                    }
                    100% {
                        opacity: 1;
                        transform: translate3d(0, 0, 0) scaleX(1);
                    }
                }

                @keyframes ticket-stamp-press {
                    0% {
                        opacity: 0;
                        transform: translate3d(-50%, -98px, 0) rotate(-7deg)
                            scale(0.98);
                    }
                    9% {
                        opacity: 1;
                    }
                    28% {
                        opacity: 1;
                        transform: translate3d(-50%, -48px, 0) rotate(-2deg)
                            scale(1);
                    }
                    47% {
                        transform: translate3d(-50%, 17px, 0) rotate(-0.4deg)
                            scale(1);
                    }
                    54% {
                        transform: translate3d(-50%, 29px, 0) rotate(0)
                            scale3d(1.018, 0.972, 1);
                    }
                    60% {
                        transform: translate3d(-50%, 27px, 0) rotate(0.25deg)
                            scale3d(0.995, 1.005, 1);
                    }
                    69% {
                        transform: translate3d(-50%, 14px, 0) rotate(-0.8deg)
                            scale(1);
                    }
                    84% {
                        opacity: 1;
                        transform: translate3d(-50%, -31px, 0) rotate(1.5deg)
                            scale(1);
                    }
                    100% {
                        opacity: 0;
                        transform: translate3d(-50%, -88px, 0) rotate(3deg)
                            scale(0.98);
                    }
                }

                @keyframes stamp-base-compress {
                    0%,
                    47% {
                        transform: scale3d(1, 1, 1);
                    }
                    54% {
                        transform: scale3d(1.04, 0.93, 1);
                    }
                    60% {
                        transform: scale3d(0.99, 1.015, 1);
                    }
                    69%,
                    100% {
                        transform: scale3d(1, 1, 1);
                    }
                }

                @keyframes stamp-contact-shadow {
                    0% {
                        opacity: 0;
                        transform: scale(0.64);
                    }
                    38% {
                        opacity: 0.12;
                        transform: scale(0.82);
                    }
                    55% {
                        opacity: 0.82;
                        transform: scaleX(1.16) scaleY(0.82);
                    }
                    72% {
                        opacity: 0.28;
                        transform: scale(1.02);
                    }
                    100% {
                        opacity: 0;
                        transform: scale(1.18);
                    }
                }

                @keyframes new-stamp-appear {
                    0% {
                        opacity: 0;
                        transform: scale(1.22) rotate(-3deg);
                        filter: blur(1.8px) saturate(0.8);
                    }
                    42% {
                        opacity: 1;
                        transform: scale(0.95) rotate(0.8deg);
                        filter: blur(0) saturate(1.08);
                    }
                    72% {
                        opacity: 1;
                        transform: scale(1.025) rotate(-0.25deg);
                        filter: blur(0) saturate(1);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1) rotate(0);
                        filter: blur(0) saturate(1);
                    }
                }

                @keyframes stamp-check-pop {
                    0% {
                        opacity: 0;
                        transform: scale(0.45) rotate(-12deg);
                    }
                    65% {
                        opacity: 1;
                        transform: scale(1.14) rotate(2deg);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1) rotate(0);
                    }
                }

                @keyframes stamp-ring-release {
                    0% {
                        opacity: 0;
                        transform: scale(0.72);
                    }
                    25% {
                        opacity: 0.85;
                    }
                    100% {
                        opacity: 0;
                        transform: scale(1.35);
                    }
                }

                @keyframes stamp-ring-secondary {
                    0% {
                        opacity: 0;
                        transform: scale(0.82);
                    }
                    22% {
                        opacity: 0.72;
                    }
                    100% {
                        opacity: 0;
                        transform: scale(1.58);
                    }
                }

                @keyframes count-reveal {
                    0% {
                        opacity: 1;
                        transform: translate3d(0, 0, 0) scale(1);
                    }
                    45% {
                        opacity: 1;
                        transform: translate3d(0, -2px, 0) scale(1.08);
                    }
                    100% {
                        opacity: 1;
                        transform: translate3d(0, 0, 0) scale(1);
                    }
                }

                @keyframes milestone-reveal {
                    from {
                        opacity: 0;
                        transform: translate3d(0, 7px, 0);
                    }
                    to {
                        opacity: 1;
                        transform: translate3d(0, 0, 0);
                    }
                }

                @keyframes progress-fill {
                    to {
                        transform: scaleX(1);
                    }
                }

                @keyframes confetti-pop {
                    0% {
                        opacity: 0;
                        transform: translate3d(0, -8px, 0) rotate(0);
                    }
                    24% {
                        opacity: 1;
                    }
                    100% {
                        opacity: 0;
                        transform: translate3d(0, 85px, 0) rotate(260deg);
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .swap-celebration-card,
                    .swap-ticket-flip-card-complete .swap-ticket-front,
                    .swap-ticket-flip-card-complete .swap-reward-ticket-face,
                    .swap-ticket-stamp-tool,
                    .swap-stamp-base,
                    .swap-stamp-contact-shadow,
                    .swap-new-stamp-impression,
                    .swap-new-stamp-check,
                    .swap-stamp-ring,
                    .swap-stamp-ring-secondary,
                    .swap-count-reveal,
                    .swap-milestone-reveal,
                    .swap-celebration-progress,
                    .swap-confetti {
                        animation: none !important;
                    }

                    .swap-ticket-stamp-tool {
                        display: none;
                    }

                    .swap-ticket-flip-card-complete .swap-ticket-front {
                        opacity: 0;
                        transform: scaleX(0);
                    }

                    .swap-ticket-flip-card-complete .swap-reward-ticket-face {
                        opacity: 1;
                        transform: scaleX(1);
                    }

                    .swap-new-stamp-impression,
                    .swap-new-stamp-check,
                    .swap-milestone-reveal,
                    .swap-count-reveal {
                        opacity: 1;
                    }

                    .swap-celebration-progress {
                        transform: scaleX(1);
                    }
                }
            `}</style>
        </div>
    );
}
