"use client";

import { Icons } from "@/components/icons";
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

// eslint-disable-next-line quotes
const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;

export function GuestAddToCartPopup() {
    const { isOpen, closePopup, mode } = useGuestPopupStore();
    const { isSignedIn } = useAuth();

    if (isSignedIn) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && closePopup()}>
            <DialogContent className="overflow-hidden border-none bg-transparent p-0 shadow-[0_0_80px_-15px_rgba(0,0,0,0.5)] sm:max-w-[800px] md:max-w-[700px] lg:max-w-[800px] [&>button:last-child]:text-white hover:[&>button:last-child]:bg-white/10 sm:[&>button:last-child]:text-muted-foreground sm:hover:[&>button:last-child]:bg-accent">
                <div className="flex max-h-[90vh] w-full flex-col overflow-y-auto bg-background sm:min-h-[480px] sm:flex-row sm:overflow-visible">
                    {/* Top/Left Half: Brand & Offer Image Section */}
                    <div className="relative flex flex-col justify-between bg-[#8AA4C8] px-6 py-8 text-white sm:w-[45%] sm:p-10 md:w-1/2 lg:w-[45%]">
                        {/* Subtle Background Elements */}
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/15 to-transparent mix-blend-overlay"></div>
                        <div
                            className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-plus-lighter"
                            style={{ backgroundImage: NOISE_SVG }}
                        ></div>

                        <div className="relative z-10 flex items-center justify-between duration-700 animate-in fade-in slide-in-from-top-4">
                            <div className="flex items-center gap-2.5">
                                <div className="flex size-8 items-center justify-center rounded-lg bg-white/20 shadow-sm backdrop-blur-md transition-transform hover:scale-110">
                                    <Icons.Sparkles className="size-4.5 text-white" />
                                </div>
                                <span className="font-outfit text-xl font-medium tracking-tight text-white drop-shadow-sm">
                                    Renivet
                                </span>
                            </div>
                        </div>

                        <div className="relative z-10 mt-12 delay-200 duration-700 animate-in fade-in slide-in-from-bottom-8 fill-mode-both sm:mt-auto">
                            <div className="font-outfit mb-5 inline-flex items-center gap-1.5 rounded-[12px] border border-white/50 bg-transparent px-3 py-1.5 text-xs font-semibold tracking-wider text-white shadow-sm backdrop-blur-md transition-transform hover:scale-105">
                                <Icons.Tag className="size-3.5" />
                                EXCLUSIVE WELCOME
                            </div>
                            <h2 className="font-playfair text-[32px] font-medium leading-[1.1] tracking-tight text-white drop-shadow-sm sm:text-[42px] md:text-5xl">
                                Fashion that
                                <br />
                                feels good &<br />
                                does good.
                            </h2>
                            <p className="font-outfit mt-4 text-[15px] font-light leading-relaxed text-white/95 sm:mt-6 sm:text-[17px]">
                                India&apos;s sustainable marketplace.
                            </p>
                        </div>
                    </div>

                    {/* Bottom/Right Half: Actions & Details */}
                    <div className="relative flex flex-col justify-center overflow-hidden bg-background px-6 py-8 sm:w-[55%] sm:px-12 sm:py-10 md:w-1/2 lg:w-[55%]">
                        {/* Decorative subtle blurred shapes on the right panel */}
                        <div className="absolute right-0 top-0 -mr-20 -mt-20 size-64 animate-pulse rounded-full bg-[#8AA4C8]/5 blur-[80px]"></div>
                        <div
                            className="absolute bottom-0 left-0 -mb-20 -ml-20 size-64 animate-pulse rounded-full bg-[#8AA4C8]/5 blur-[80px]"
                            style={{ animationDelay: "1s" }}
                        ></div>

                        <DialogHeader className="sr-only">
                            <DialogTitle>Welcome to Renivet</DialogTitle>
                            <DialogDescription>
                                Login or sign up to claim your exclusive
                                discount.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="relative z-10 mx-auto w-full max-w-[340px]">
                            <div className="mb-8 text-center delay-300 duration-700 animate-in fade-in slide-in-from-right-8 fill-mode-both sm:text-left">
                                <h3 className="font-playfair text-3xl font-semibold text-[#1a1a1a] md:text-[34px]">
                                    Claim your{" "}
                                    <span className="italic text-[#8AA4C8]">
                                        10% off
                                    </span>
                                </h3>
                                <p className="font-outfit mt-3 text-13 leading-[1.6] text-[#555555] sm:mt-4 sm:text-sm">
                                    Create a free account or login to apply the
                                    code{" "}
                                    <span className="font-mono font-bold text-[#1a1a1a]">
                                        RENIVET10
                                    </span>{" "}
                                    to your first order.
                                </p>
                            </div>

                            <div className="flex flex-col gap-1 delay-500 duration-700 animate-in fade-in slide-in-from-bottom-4 fill-mode-both sm:gap-2">
                                <SignInButton
                                    mode="modal"
                                    signUpFallbackRedirectUrl="/mycart"
                                    forceRedirectUrl="/mycart"
                                >
                                    <div className="rounded-[16px] border border-[#a8a8a8] p-[3px] transition-transform duration-300 hover:scale-[1.02]">
                                        <Button
                                            size="lg"
                                            className="font-outfit group relative h-[50px] w-full overflow-hidden rounded-[12px] border border-[#8AA4C8]/20 bg-[#8AA4C8] text-[15px] font-semibold tracking-wide text-white shadow-sm transition-all duration-300 hover:bg-[#7896be]"
                                        >
                                            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-full"></div>
                                            <span className="relative">
                                                Log in to Claim Offer
                                            </span>
                                        </Button>
                                    </div>
                                </SignInButton>

                                <SignUpButton
                                    mode="modal"
                                    signInFallbackRedirectUrl="/mycart"
                                    forceRedirectUrl="/mycart"
                                >
                                    <Button
                                        variant="ghost"
                                        size="lg"
                                        className="font-outfit mt-1 h-[52px] w-full rounded-[14px] text-[15px] font-semibold text-[#1a1a1a] transition-all duration-300 hover:bg-black/5 hover:text-[#1a1a1a]"
                                    >
                                        Create Free Account
                                    </Button>
                                </SignUpButton>
                            </div>

                            <div className="relative mt-4 flex items-center py-4 delay-700 duration-700 animate-in fade-in fill-mode-both sm:mt-6 sm:py-5">
                                <div className="grow border-t border-[#e2e2e2]"></div>
                                <span className="font-outfit mx-4 shrink-0 text-11 uppercase tracking-[0.15em] text-[#8e8e8e]">
                                    or
                                </span>
                                <div className="grow border-t border-[#e2e2e2]"></div>
                            </div>

                            <div className="delay-[800ms] flex flex-col items-center gap-2.5 text-center duration-700 animate-in fade-in slide-in-from-bottom-2 fill-mode-both">
                                {mode === "cart" && (
                                    <p className="font-outfit text-13 font-semibold text-[#1a1a1a]">
                                        Item was successfully added to cart.
                                    </p>
                                )}
                                <button
                                    onClick={closePopup}
                                    className="font-outfit group inline-flex items-center gap-2 text-14 leading-none text-[#555555] transition-colors hover:text-[#1a1a1a]"
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
