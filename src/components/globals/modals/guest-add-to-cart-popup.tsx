"use client";

import { Icons } from "@/components/icons";
import { RenivetFull } from "@/components/svgs";
import { Button } from "@/components/ui/button-dash";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-general";
import { useGuestPopupStore } from "@/lib/store/use-guest-popup-store";
import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";

const NOISE_SVG =
    "url(\"data:image/svg+xml,%3Csvg viewBox=%270 0 200 200%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27noiseFilter%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.65%27 numOctaves=%273%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23noiseFilter)%27/%3E%3C/svg%3E\")";

export function GuestAddToCartPopup() {
    const { isOpen, closePopup, mode } = useGuestPopupStore();
    const { isSignedIn } = useAuth();

    if (isSignedIn) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && closePopup()}>
            <DialogContent className="max-h-[calc(100dvh-24px)] overflow-y-auto border-none bg-transparent p-0 shadow-[0_28px_90px_rgba(45,54,38,0.22)] sm:max-w-[760px] sm:overflow-hidden md:max-w-[720px] [&>button:last-child]:right-4 [&>button:last-child]:top-4 [&>button:last-child]:z-50 [&>button:last-child]:rounded-full [&>button:last-child]:bg-[#f8f6ed]/90 [&>button:last-child]:p-2 [&>button:last-child]:text-[#566149] hover:[&>button:last-child]:bg-white">
                <div className="flex w-full flex-col overflow-hidden rounded-[26px] border border-[#dcd2bf] bg-[#fffdf7] sm:min-h-[440px] sm:flex-row">
                    <div className="relative flex flex-col bg-[#87966f] px-5 pb-5 pt-6 text-white sm:w-[44%] sm:p-8 md:p-9">
                        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0.05)_36%,rgba(72,84,57,0.28)_100%)]" />
                        <div
                            className="pointer-events-none absolute inset-0 opacity-10 mix-blend-soft-light"
                            style={{ backgroundImage: NOISE_SVG }}
                        />

                        <div className="relative z-10 flex items-center duration-700 animate-in fade-in slide-in-from-top-4">
                            <RenivetFull className="h-[28px] w-[96px] text-[#26301f] drop-shadow-sm sm:h-[31px] sm:w-[108px]" />
                        </div>

                        <div className="relative z-10 mt-5 flex flex-1 flex-col justify-center delay-200 duration-700 animate-in fade-in slide-in-from-bottom-8 fill-mode-both sm:mt-0">
                            <span className="mb-3 w-fit rounded-full border border-white/45 bg-white/25 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#26301f] shadow-sm backdrop-blur-sm sm:text-[10px]">
                                Conscious cart benefit
                            </span>
                            <h2 className="font-playfair text-[28px] leading-none text-[#fffaf0] drop-shadow-sm sm:text-[40px]">
                                Your greener cart
                                <br />
                                just got lighter.
                            </h2>
                            <p className="font-outfit mt-3 max-w-[270px] text-13 leading-relaxed text-[#f8f5e8] sm:text-[15px]">
                                Save on mindful finds from homegrown brands and
                                keep your checkout beautifully simple.
                            </p>

                            <div className="mt-4 rounded-[20px] border border-white/60 bg-[#fff1bd] p-3.5 text-[#2f3a28] shadow-[0_16px_32px_rgba(72,84,57,0.18)] sm:p-4">
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#766735] sm:text-11">
                                    First order reward
                                </p>
                                <div className="mt-2 flex items-center justify-between gap-2">
                                    <span className="font-outfit text-xl font-black tracking-wide sm:text-[22px]">
                                        TRYNEW20
                                    </span>
                                    <span className="rounded-full bg-[#65734f] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                                        20% off
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative flex flex-col justify-center overflow-hidden bg-[#fffdf7] px-5 pb-6 pt-5 sm:w-[56%] sm:px-10 sm:py-9">
                        <DialogHeader className="sr-only">
                            <DialogTitle>Welcome to Renivet</DialogTitle>
                            <DialogDescription>
                                Login or sign up to claim your exclusive
                                discount.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="relative z-10 mx-auto w-full max-w-[360px]">
                            <div className="mb-4 text-center delay-300 duration-700 animate-in fade-in slide-in-from-right-8 fill-mode-both sm:mb-5 sm:text-left">
                                {mode === "cart" && (
                                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#d8d0bf] bg-[#f8f4e8] px-3 py-1.5 text-xs font-semibold text-[#5f6b4f] shadow-sm">
                                        <span className="size-2 rounded-full bg-[#8ea166]" />
                                        Cart updated
                                    </div>
                                )}
                                <h3 className="font-playfair text-2xl font-medium leading-tight text-[#252b21] sm:text-[32px]">
                                    Keep the offer
                                </h3>
                                <p className="font-outfit mt-2 text-13 leading-relaxed text-[#66705f] sm:mt-3 sm:text-[15px]">
                                    Sign in to save your cart, apply the reward,
                                    and check out faster next time.
                                </p>
                            </div>

                            <div className="flex flex-col gap-2 delay-500 duration-700 animate-in fade-in slide-in-from-bottom-4 fill-mode-both">
                                <SignInButton
                                    mode="modal"
                                    signUpFallbackRedirectUrl="/mycart"
                                    forceRedirectUrl="/mycart"
                                >
                                    <Button
                                        size="lg"
                                        className="font-outfit group relative h-11 w-full overflow-hidden rounded-xl bg-[#71815a] text-sm font-bold tracking-wide text-white shadow-[0_14px_28px_rgba(113,129,90,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#65734f] sm:h-[52px]"
                                    >
                                        <span className="relative">
                                            Login and claim 20% off
                                        </span>
                                        <Icons.ArrowRight className="relative ml-2 size-4 transition-transform group-hover:translate-x-1" />
                                    </Button>
                                </SignInButton>

                                <SignUpButton
                                    mode="modal"
                                    signInFallbackRedirectUrl="/mycart"
                                    forceRedirectUrl="/mycart"
                                >
                                    <Button
                                        size="lg"
                                        className="font-outfit h-11 w-full rounded-xl border border-[#d8d0bf] bg-white text-sm font-semibold text-[#4f5b44] shadow-sm transition-all duration-300 hover:border-[#b7aa91] hover:bg-[#f5f0e5] sm:h-[52px]"
                                    >
                                        Create free account
                                    </Button>
                                </SignUpButton>
                            </div>

                            <div className="relative mt-3 flex items-center py-2.5 delay-700 duration-700 animate-in fade-in fill-mode-both sm:mt-4 sm:py-3">
                                <div className="grow border-t border-[#ded6c8]" />
                                <span className="font-outfit mx-4 shrink-0 text-[10px] uppercase tracking-[0.15em] text-[#9a9182]">
                                    or
                                </span>
                                <div className="grow border-t border-[#ded6c8]" />
                            </div>

                            <div className="delay-[800ms] rounded-2xl border border-[#e3ddcf] bg-[#faf7ee] p-3.5 text-center duration-700 animate-in fade-in slide-in-from-bottom-2 fill-mode-both sm:p-4">
                                <p className="font-outfit text-xs leading-relaxed text-[#70685c]">
                                    Prefer not to sign in right now? You can
                                    still finish your order as a guest.
                                </p>
                                <button
                                    onClick={closePopup}
                                    className="font-outfit group mt-2.5 inline-flex items-center justify-center gap-2 text-sm font-semibold leading-none text-[#5f6b4f] transition-colors hover:text-[#7a8d58] sm:mt-3"
                                >
                                    {mode === "cart"
                                        ? "Continue to checkout as guest"
                                        : "Continue exploring"}
                                    <Icons.ArrowRight className="size-3.5 transition-transform group-hover:translate-x-[3px]" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
