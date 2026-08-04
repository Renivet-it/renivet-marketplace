"use client";

import { trpc } from "@/lib/trpc/client";
import { useAuth, useClerk } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const STAMP_TARGET = 5;

export function SwapProgressFloat() {
    const pathname = usePathname();
    const { isLoaded, isSignedIn } = useAuth();
    const { openSignIn } = useClerk();
    const { data } = trpc.general.swapRewards.getSwapRewardStatus.useQuery(
        undefined,
        {
            enabled: isLoaded && isSignedIn,
            staleTime: 60_000,
        }
    );

    const isAuthPage =
        pathname.startsWith("/auth") ||
        pathname.startsWith("/sign-in") ||
        pathname.startsWith("/sign-up");

    const isCatalogPage =
        pathname === "/shop" ||
        pathname.startsWith("/shop/") ||
        pathname === "/new-arrivals" ||
        pathname.startsWith("/new-arrivals/");

    if (!isLoaded || isAuthPage || (!isSignedIn && !isCatalogPage)) {
        return null;
    }

    if (!isSignedIn) {
        return (
            <button
                type="button"
                onClick={() => openSignIn()}
                aria-label="Sign in or create an account to start Swap"
                className="group fixed bottom-[calc(86px+max(env(safe-area-inset-bottom),0px))] right-4 z-50 flex h-[62px] w-[178px] items-center gap-2 rounded-[22px] border border-white/15 bg-[linear-gradient(145deg,#3d4930_0%,#28331f_100%)] px-2.5 text-left text-white shadow-[0_10px_26px_rgba(25,35,18,0.32)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(25,35,18,0.38)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8a43b] focus-visible:ring-offset-2 md:bottom-7 md:right-7"
            >
                <span className="grid size-9 shrink-0 place-items-center rounded-full border border-white/15 bg-white/10 shadow-inner">
                    <Sparkles
                        aria-hidden="true"
                        className="size-[18px] stroke-[1.8] text-[#f3f0e7]"
                    />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block whitespace-nowrap text-xs font-medium leading-none tracking-[0.08em] text-[#f8f6ef]">
                        Swap &amp; Earn
                    </span>
                    <span className="mt-1.5 block text-11 leading-tight text-white/80">
                        Sign in to start
                    </span>
                </span>
            </button>
        );
    }

    const stampCount = Math.min(
        STAMP_TARGET,
        Math.max(0, data?.currentCycleStampCount ?? 0)
    );
    const progress = (stampCount / STAMP_TARGET) * 100;
    const isUnlocked = data?.rewardStatus === "unlocked";

    return (
        <Link
            href="/profile"
            aria-label={`Swap Progress: ${stampCount} of ${STAMP_TARGET} stamps${
                isUnlocked ? ", reward unlocked" : ""
            }`}
            className="group fixed bottom-[calc(86px+max(env(safe-area-inset-bottom),0px))] right-4 z-50 flex h-[62px] w-[178px] items-center gap-2 rounded-[22px] border border-white/15 bg-[linear-gradient(145deg,#3d4930_0%,#28331f_100%)] px-2.5 text-white shadow-[0_10px_26px_rgba(25,35,18,0.32)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(25,35,18,0.38)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8a43b] focus-visible:ring-offset-2 md:bottom-7 md:right-7"
        >
            <span className="grid size-9 shrink-0 place-items-center rounded-full border border-white/15 bg-white/10 shadow-inner">
                <Sparkles
                    aria-hidden="true"
                    className="size-[18px] stroke-[1.8] text-[#f3f0e7]"
                />
            </span>

            <span className="min-w-0 flex-1">
                <span className="block whitespace-nowrap text-xs font-medium leading-none tracking-[0.08em] text-[#f8f6ef]">
                    Swap Progress
                </span>
                <span className="mt-1 block text-sm font-semibold leading-none tracking-[0.04em] text-white">
                    {stampCount}/{STAMP_TARGET}
                </span>
                <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-[#aeb3a3] shadow-inner">
                    <span
                        className="block h-full rounded-full bg-[#f3f0e7] transition-[width] duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </span>
            </span>
        </Link>
    );
}
