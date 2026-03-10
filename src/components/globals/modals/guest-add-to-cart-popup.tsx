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
            <DialogContent className="overflow-hidden border-none p-0 shadow-2xl sm:max-w-md">
                <div className="relative overflow-hidden bg-primary/5 p-6 text-center sm:p-10">
                    {/* Decorative elements */}
                    <div className="absolute right-0 top-0 -mr-10 -mt-10 size-40 rounded-full bg-primary/10 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-10 -ml-10 size-40 rounded-full bg-primary/10 blur-3xl"></div>

                    <div className="relative z-10 mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-primary/10">
                        <Icons.Sparkles className="size-8 text-primary" />
                    </div>

                    <DialogHeader className="relative z-10 space-y-3">
                        <DialogTitle className="text-center font-playfair text-2xl font-bold sm:text-3xl">
                            Get{" "}
                            <span className="font-playfair italic text-primary">
                                10% Off
                            </span>{" "}
                            Your First Order!
                        </DialogTitle>
                        <DialogDescription className="text-center text-base">
                            Use code{" "}
                            <span className="rounded bg-primary/10 px-2 py-0.5 font-mono font-bold text-foreground">
                                RENIVET10
                            </span>{" "}
                            at checkout. Join our sustainable community today!
                        </DialogDescription>
                    </DialogHeader>

                    <div className="relative z-10 mt-8 flex flex-col gap-3">
                        <SignInButton
                            mode="modal"
                            signUpFallbackRedirectUrl="/mycart"
                            forceRedirectUrl="/mycart"
                        >
                            <Button
                                size="lg"
                                className="font-outfit h-12 w-full text-base font-semibold"
                            >
                                Login to Claim
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
                                className="font-outfit h-12 w-full text-base font-semibold"
                            >
                                Create an Account
                            </Button>
                        </SignUpButton>
                    </div>

                    <div className="mt-4 flex justify-center">
                        <button
                            onClick={closePopup}
                            className="text-sm text-muted-foreground hover:underline"
                        >
                            Continue as Guest
                        </button>
                    </div>

                    <p className="relative z-10 mt-6 text-xs text-muted-foreground">
                        Item has been added to your guest cart. By continuing,
                        you agree to our Terms of Service.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
