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
import { Input } from "@/components/ui/input-general";
import { useGuestPopupStore } from "@/lib/store/use-guest-popup-store";
import { trpc } from "@/lib/trpc/client";
import { handleClientError } from "@/lib/utils";
import { SignInButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const PENDING_PHONE_KEY = "renivet-pending-phone-lead";

const BENEFITS = [
    "Exclusive welcome offers",
    "Early access to mindful drops",
    "Faster checkout after you join",
];

function normalizePhone(value: string) {
    return value.replace(/[^0-9+]/g, "");
}

function hasRealPhone(phone?: string | null) {
    return !!phone && !phone.startsWith("pending:") && phone.length >= 10;
}

export function GuestAddToCartPopup() {
    const { isOpen, closePopup, mode } = useGuestPopupStore();
    const { isSignedIn, isLoaded } = useAuth();
    const [phone, setPhone] = useState("");
    const [leadSaved, setLeadSaved] = useState(false);
    const utils = trpc.useUtils();

    const { data: user } = trpc.general.users.currentUser.useQuery(undefined, {
        enabled: !!isSignedIn,
        retry: false,
    });

    const needsPhone = isSignedIn && user && !hasRealPhone(user.phone);

    const title = useMemo(() => {
        if (needsPhone) return "Add your number for member-only offers";
        if (mode === "cart") return "Save your cart and unlock your offer";
        return "Join the Renivet circle";
    }, [mode, needsPhone]);

    const createLead =
        trpc.general.newsletterSubscribers.createNewsletterSubscriber.useMutation(
            {
                onSuccess: (_, variables) => {
                    localStorage.setItem(PENDING_PHONE_KEY, variables.phone);
                    setLeadSaved(true);
                    toast.success("Offer saved. Sign in to attach it.");
                },
                onError: (err) => toast.error(err.message),
            }
        );

    const claimPhone = trpc.general.users.claimPhoneLead.useMutation({
        onSuccess: async () => {
            localStorage.removeItem(PENDING_PHONE_KEY);
            localStorage.setItem("renivet-phone-offer-seen", "true");
            await utils.general.users.currentUser.invalidate();
            toast.success("Phone number added to your profile.");
            closePopup();
        },
        onError: (err) => handleClientError(err),
    });

    useEffect(() => {
        if (!isLoaded || !isSignedIn || hasRealPhone(user?.phone)) return;

        const pendingPhone = localStorage.getItem(PENDING_PHONE_KEY);
        if (pendingPhone) {
            setPhone(pendingPhone);
            claimPhone.mutate({ phone: pendingPhone });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoaded, isSignedIn, user?.phone]);

    function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const cleanPhone = normalizePhone(phone);
        if (cleanPhone.length < 10) {
            toast.error("Please enter a valid phone number");
            return;
        }

        if (needsPhone) {
            claimPhone.mutate({ phone: cleanPhone });
            return;
        }

        createLead.mutate({
            phone: cleanPhone,
            source: mode === "cart" ? "cart_offer_popup" : "welcome_popup",
        });
    }

    if (!isLoaded) return null;
    if (isSignedIn && !needsPhone) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && closePopup()}>
            <DialogContent className="[&>button:last-child]:bg-white/12 h-[calc(100dvh-16px)] w-[calc(100vw-16px)] max-w-[900px] overflow-hidden rounded-[28px] border-none bg-transparent p-0 shadow-[0_40px_120px_-24px_rgba(15,23,42,0.45)] sm:h-auto sm:w-full [&>button:last-child]:right-3 [&>button:last-child]:top-3 [&>button:last-child]:z-40 [&>button:last-child]:rounded-full [&>button:last-child]:border [&>button:last-child]:border-white/20 [&>button:last-child]:p-2.5 [&>button:last-child]:text-white [&>button:last-child]:opacity-100 hover:[&>button:last-child]:bg-white/20">
                <DialogHeader className="sr-only">
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        Share your phone number to receive Renivet offers and
                        account updates.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid h-full overflow-hidden rounded-[28px] bg-[#f7f3eb] lg:grid-cols-[0.98fr_1.02fr]">
                    <div className="relative hidden overflow-hidden bg-[#234236] p-10 text-white lg:block">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(241,227,193,0.2),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(212,232,203,0.2),_transparent_34%),linear-gradient(145deg,_#173328_0%,_#234236_50%,_#2f5a4a_100%)]" />
                        <div className="absolute -right-16 top-20 size-40 rounded-full border border-white/10 bg-white/5 blur-sm" />
                        <div className="absolute -bottom-12 left-8 size-28 rounded-full bg-[#f3e5b7]/10 blur-2xl" />

                        <div className="relative z-10 flex h-full flex-col">
                            <div className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                                <RenivetFull className="h-[30px] w-[108px] text-white" />
                            </div>

                            <div className="mt-12 flex-1">
                                <span className="font-outfit inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-11 font-semibold uppercase tracking-[0.24em] text-[#e9ddbc]">
                                    Private member list
                                </span>
                                <h2 className="mt-5 max-w-[9ch] font-playfair text-[56px] leading-[0.96] text-[#f9f6ef]">
                                    Conscious finds, first.
                                </h2>
                                <p className="font-outfit text-white/78 mt-4 max-w-[32ch] text-16 leading-7">
                                    Get curated drops, thoughtful offers, and a
                                    smoother checkout path when you join.
                                </p>
                            </div>

                            <div className="grid grid-cols-[1.06fr_0.94fr] gap-3">
                                <div className="border-white/12 rounded-[20px] border bg-white/10 p-4 backdrop-blur-md">
                                    <p className="font-outfit text-12 font-semibold uppercase tracking-[0.2em] text-[#d7e8d7]">
                                        First-order perk
                                    </p>
                                    <p className="mt-2 font-playfair text-[32px] leading-none text-[#f3e5b7]">
                                        20% OFF
                                    </p>
                                </div>
                                <div className="rounded-[20px] border border-[#f3e5b7]/20 bg-[#f3e5b7]/10 p-4">
                                    <p className="font-outfit text-12 font-semibold uppercase tracking-[0.2em] text-[#f6ebc7]">
                                        Code
                                    </p>
                                    <p className="font-outfit mt-2 text-[22px] font-bold tracking-[0.06em] text-white">
                                        TRYNEW20
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative flex min-h-0 flex-col overflow-y-auto bg-[#f7f3eb] p-5 sm:p-8 lg:p-10">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(166,198,179,0.22),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(222,204,169,0.2),_transparent_28%)]" />

                        <div className="relative z-10 mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center">
                            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#234236]/10 bg-white/75 px-3 py-1.5 text-12 font-semibold text-[#234236] shadow-[0_18px_50px_-32px_rgba(35,66,54,0.55)] backdrop-blur-sm">
                                <Icons.Sparkles className="size-3.5" />
                                {needsPhone
                                    ? "Complete your profile"
                                    : "Exclusive Renivet offer"}
                            </div>

                            <h3 className="mt-5 font-playfair text-[36px] leading-[1.02] text-[#18261f] sm:text-[40px]">
                                {title}
                            </h3>
                            <p className="font-outfit text-15 mt-4 leading-7 text-[#5c665f]">
                                {needsPhone
                                    ? "Add your number so offers, delivery updates, and account nudges can reach the right place."
                                    : "Enter your number to reserve your welcome offer. Then sign in with Google to connect it to your account."}
                            </p>

                            <div className="mt-6 grid gap-3">
                                {BENEFITS.map((item) => (
                                    <div
                                        key={item}
                                        className="border-[#234236]/8 flex items-center gap-3 rounded-2xl border bg-white/70 px-4 py-3 text-[#234236] shadow-[0_20px_45px_-35px_rgba(35,66,54,0.5)]"
                                    >
                                        <Icons.CheckCircle className="size-4 shrink-0 text-[#6f8f7d]" />
                                        <span className="font-outfit text-sm font-medium text-[#34433b]">
                                            {item}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <form onSubmit={handleSubmit} className="mt-7">
                                <label className="font-outfit text-13 font-semibold text-[#2c3c34]">
                                    Phone number
                                </label>
                                <div className="mt-2 flex gap-2">
                                    <Input
                                        inputMode="tel"
                                        value={phone}
                                        placeholder="+91 98765 43210"
                                        disabled={
                                            createLead.isPending ||
                                            claimPhone.isPending
                                        }
                                        onChange={(e) =>
                                            setPhone(
                                                normalizePhone(e.target.value)
                                            )
                                        }
                                        className="h-12 rounded-2xl border-[#234236]/15 bg-white/85"
                                    />
                                    <Button
                                        type="submit"
                                        disabled={
                                            createLead.isPending ||
                                            claimPhone.isPending
                                        }
                                        className="h-12 rounded-2xl bg-[#234236] px-5 text-white hover:bg-[#1c362c]"
                                    >
                                        {needsPhone ? "Save" : "Reserve"}
                                    </Button>
                                </div>
                            </form>

                            {!needsPhone && (
                                <div className="mt-4 space-y-3">
                                    <SignInButton
                                        mode="modal"
                                        forceRedirectUrl="/"
                                        signUpFallbackRedirectUrl="/"
                                    >
                                        <Button
                                            type="button"
                                            className="border-[#234236]/12 h-12 w-full rounded-2xl border bg-white/85 text-[#22382f] shadow-[0_22px_50px_-36px_rgba(35,66,54,0.5)] hover:bg-white"
                                            disabled={!leadSaved && !phone}
                                        >
                                            <Icons.Google className="size-4" />
                                            Continue with Google
                                        </Button>
                                    </SignInButton>
                                    {!leadSaved && (
                                        <p className="font-outfit text-center text-xs text-[#68756d]">
                                            Reserve with your phone first so we
                                            can attach the offer after login.
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                                {needsPhone ? (
                                    <Button
                                        asChild
                                        variant="ghost"
                                        className="px-0 text-[#566158] hover:bg-transparent hover:text-[#18261f]"
                                    >
                                        <Link href="/profile/personal-details">
                                            Open profile details
                                            <Icons.ArrowRight className="size-4" />
                                        </Link>
                                    </Button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={closePopup}
                                        className="font-outfit inline-flex items-center gap-2 text-[15px] font-medium text-[#566158] transition-colors hover:text-[#18261f]"
                                    >
                                        {mode === "cart"
                                            ? "Continue as guest"
                                            : "Continue exploring"}
                                        <Icons.ArrowRight className="size-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
