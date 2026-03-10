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

export function GuestAddToCartPopup() {
    const { isOpen, closePopup } = useGuestPopupStore();
    const { isSignedIn } = useAuth();

    if (isSignedIn) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && closePopup()}>
            <DialogContent className="overflow-hidden border-none p-0 shadow-2xl sm:max-w-md [&>button:last-child]:text-white hover:[&>button:last-child]:bg-white/10">
                <div className="flex flex-col bg-background">
                    {/* Top Half: Brand & Offer */}
                    <div className="relative bg-[#8ba6cf] px-6 pb-12 pt-8 text-white sm:px-10 sm:pt-10">
                        {/* Subtle Background Pattern / Gradient */}
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>

                        <div className="relative flex items-center gap-2">
                            <div className="flex size-7 items-center justify-center rounded bg-white">
                                <Icons.Sparkles className="size-4 text-[#8ba6cf]" />
                            </div>
                            <span className="font-outfit text-lg font-medium tracking-tight text-white">
                                Renivet
                            </span>
                        </div>

                        <div className="relative mt-8">
                            <div className="font-outfit mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold tracking-wider text-white backdrop-blur-md">
                                <Icons.Tag className="size-3" />
                                WELCOME
                            </div>
                            <h2 className="font-playfair text-[32px] font-medium leading-[1.15] text-white sm:text-4xl">
                                Fashion that feels good & does good.
                            </h2>
                            <p className="font-outfit mt-4 text-[15px] font-light text-white/90">
                                India's sustainable marketplace. Get{" "}
                                <span className="font-semibold text-white">
                                    10% OFF
                                </span>{" "}
                                your first order.
                            </p>
                        </div>
                    </div>

                    {/* Bottom Half: Actions */}
                    <div className="bg-background px-6 py-8 sm:px-10">
                        <DialogHeader className="sr-only">
                            <DialogTitle>Welcome to Renivet</DialogTitle>
                            <DialogDescription>
                                Login or sign up to claim your 10% discount.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mx-auto flex w-full flex-col gap-3">
                            <SignInButton
                                mode="modal"
                                signUpFallbackRedirectUrl="/mycart"
                                forceRedirectUrl="/mycart"
                            >
                                <Button
                                    size="lg"
                                    className="font-outfit h-[46px] w-full bg-[#8ba6cf] text-[15px] font-semibold text-white transition-colors hover:bg-[#7b94b8]"
                                >
                                    Login to Claim: RENIVET10
                                </Button>
                            </SignInButton>

                            <SignUpButton
                                mode="modal"
                                signInFallbackRedirectUrl="/mycart"
                                forceRedirectUrl="/mycart"
                            >
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="font-outfit h-[46px] w-full border-[#8ba6cf]/30 text-[15px] font-semibold text-[#8ba6cf] transition-colors hover:bg-[#8ba6cf]/5 hover:text-[#7b94b8]"
                                >
                                    Create Free Account
                                </Button>
                            </SignUpButton>
                        </div>

                        <div className="mt-6 flex items-center justify-between text-sm md:mt-8">
                            <p className="font-outfit text-[13px] text-muted-foreground">
                                Item added to guest cart.
                            </p>
                            <button
                                onClick={closePopup}
                                className="font-outfit group inline-flex items-center gap-1.5 text-[13px] font-medium text-[#8ba6cf] transition-colors hover:text-[#7b94b8]"
                            >
                                Skip for now
                                <Icons.ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                            </button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
