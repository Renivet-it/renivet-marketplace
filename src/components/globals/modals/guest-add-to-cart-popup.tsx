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

// eslint-disable-next-line quotes
const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;

const BENEFITS = [
    "Exclusive welcome discount",
    "Faster checkout and saved wishlist",
    "Updates from mindful, homegrown brands",
];

export function GuestAddToCartPopup() {
    const { isOpen, closePopup, mode } = useGuestPopupStore();
    const { isSignedIn } = useAuth();

    if (isSignedIn) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && closePopup()}>
            <DialogContent className="[&>button:last-child]:bg-white/12 w-[calc(100vw-16px)] max-w-[920px] overflow-hidden rounded-[28px] border-none bg-transparent p-0 shadow-[0_40px_120px_-24px_rgba(15,23,42,0.45)] sm:w-full [&>button:last-child]:right-3 [&>button:last-child]:top-3 [&>button:last-child]:z-40 [&>button:last-child]:rounded-full [&>button:last-child]:border [&>button:last-child]:border-white/20 [&>button:last-child]:p-2.5 [&>button:last-child]:text-white [&>button:last-child]:opacity-100 hover:[&>button:last-child]:bg-white/20 sm:[&>button:last-child]:right-5 sm:[&>button:last-child]:top-5 sm:[&>button:last-child]:border-black/10 sm:[&>button:last-child]:bg-[#f7f3eb] sm:[&>button:last-child]:text-[#234236] sm:hover:[&>button:last-child]:bg-white">
                <DialogHeader className="sr-only">
                    <DialogTitle>Welcome to Renivet</DialogTitle>
                    <DialogDescription>
                        Sign in or create an account to unlock your welcome
                        discount and curated product updates.
                    </DialogDescription>
                </DialogHeader>

                <div className="max-h-[calc(100vh-16px)] overflow-y-auto rounded-[28px] bg-[#f7f3eb] lg:hidden">
                    <div className="relative overflow-hidden bg-[#234236] px-5 pb-6 pt-5 text-white">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(241,227,193,0.18),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(212,232,203,0.2),_transparent_34%),linear-gradient(145deg,_#173328_0%,_#234236_48%,_#2f5a4a_100%)]" />
                        <div
                            className="absolute inset-0 opacity-[0.07]"
                            style={{ backgroundImage: NOISE_SVG }}
                        />
                        <div className="bg-white/8 absolute -right-10 top-20 size-32 rounded-full blur-2xl" />
                        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-[#f7f3eb]" />

                        <div className="relative z-10 flex flex-col gap-5">
                            <div className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                                <RenivetFull className="h-[24px] w-[88px] text-white" />
                            </div>

                            <div className="space-y-3 pr-10">
                                <span className="font-outfit inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-11 font-semibold uppercase tracking-[0.2em] text-[#e9ddbc]">
                                    Welcome offer
                                </span>
                                <h2 className="max-w-[10ch] font-playfair text-[33px] leading-[0.95] text-[#f9f6ef]">
                                    Shop mindfully. Save on your first order.
                                </h2>
                                <p className="font-outfit text-white/82 max-w-[27ch] text-[15px] leading-6">
                                    Join Renivet to unlock your discount, keep
                                    your wishlist, and check out faster.
                                </p>
                            </div>

                            <div className="border-white/12 flex items-end justify-between gap-3 rounded-[24px] border bg-white/10 p-4 backdrop-blur-md">
                                <div>
                                    <p className="font-outfit text-11 font-semibold uppercase tracking-[0.18em] text-[#d7e8d7]">
                                        First order perk
                                    </p>
                                    <p className="mt-2 font-playfair text-[30px] leading-none text-[#f3e5b7]">
                                        20% OFF
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-[#f3e5b7]/20 bg-[#f3e5b7]/10 px-4 py-3 text-right">
                                    <p className="font-outfit text-11 font-semibold uppercase tracking-[0.16em] text-[#f6ebc7]">
                                        Code
                                    </p>
                                    <p className="font-outfit mt-1 text-[18px] font-bold tracking-[0.08em] text-white">
                                        TRYNEW20
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative px-5 pb-5 pt-4">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(166,198,179,0.18),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(222,204,169,0.18),_transparent_24%)]" />

                        <div className="relative z-10 space-y-4">
                            <p className="font-outfit max-w-[30ch] text-[15px] leading-6 text-[#58655d]">
                                Create your account to claim the offer and get
                                product updates that are actually worth opening.
                            </p>

                            <div className="space-y-2.5">
                                {BENEFITS.map((item) => (
                                    <div
                                        key={item}
                                        className="border-[#234236]/8 bg-white/78 flex items-center gap-3 rounded-[20px] border px-4 py-3 shadow-[0_18px_40px_-34px_rgba(35,66,54,0.42)]"
                                    >
                                        <Icons.CheckCircle className="size-4 shrink-0 text-[#6f8f7d]" />
                                        <span className="font-outfit text-[15px] font-medium text-[#34433b]">
                                            {item}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-3 pt-1">
                                <SignInButton
                                    mode="modal"
                                    signUpFallbackRedirectUrl="/mycart"
                                    forceRedirectUrl="/mycart"
                                >
                                    <div className="rounded-[22px] bg-[linear-gradient(135deg,#234236_0%,#315848_100%)] p-[1.5px] shadow-[0_24px_60px_-30px_rgba(35,66,54,0.7)]">
                                        <Button
                                            size="lg"
                                            className="font-outfit h-[54px] w-full rounded-[20px] bg-[linear-gradient(135deg,#234236_0%,#2d5243_100%)] px-5 text-[15px] font-semibold text-[#f9f6ef] hover:bg-[linear-gradient(135deg,#234236_0%,#2d5243_100%)]"
                                        >
                                            Login to claim your offer
                                        </Button>
                                    </div>
                                </SignInButton>

                                <SignUpButton
                                    mode="modal"
                                    signInFallbackRedirectUrl="/mycart"
                                    forceRedirectUrl="/mycart"
                                >
                                    <Button
                                        size="lg"
                                        className="font-outfit bg-white/88 h-[54px] w-full rounded-[20px] border border-[#234236]/10 px-5 text-[15px] font-semibold text-[#22382f] shadow-[0_22px_50px_-36px_rgba(35,66,54,0.45)] transition-all duration-300 hover:bg-white hover:text-[#18261f]"
                                    >
                                        Create free account
                                    </Button>
                                </SignUpButton>
                            </div>

                            <div className="flex items-center gap-4 py-1">
                                <div className="bg-[#234236]/12 h-px flex-1" />
                                <span className="font-outfit text-11 uppercase tracking-[0.18em] text-[#8b8d84]">
                                    or
                                </span>
                                <div className="bg-[#234236]/12 h-px flex-1" />
                            </div>

                            <div className="space-y-3">
                                {mode === "cart" && (
                                    <p className="font-outfit bg-[#234236]/6 w-fit rounded-full px-3 py-1.5 text-13 font-semibold text-[#234236]">
                                        Your item is already in the cart.
                                    </p>
                                )}
                                <button
                                    onClick={closePopup}
                                    className="font-outfit inline-flex items-center gap-2 text-[15px] font-medium text-[#566158] transition-colors hover:text-[#18261f]"
                                >
                                    {mode === "cart"
                                        ? "Continue to checkout as guest"
                                        : "Continue exploring"}
                                    <Icons.ArrowRight className="size-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="hidden max-h-[90vh] overflow-y-auto rounded-[28px] bg-[#f7f3eb] lg:grid lg:grid-cols-[1.03fr_0.97fr]">
                    <div className="relative overflow-hidden bg-[#234236] p-10 text-white">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(241,227,193,0.18),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(212,232,203,0.22),_transparent_34%),linear-gradient(145deg,_#173328_0%,_#234236_48%,_#2f5a4a_100%)]" />
                        <div
                            className="absolute inset-0 opacity-[0.07]"
                            style={{ backgroundImage: NOISE_SVG }}
                        />
                        <div className="absolute -right-16 top-20 size-40 rounded-full border border-white/10 bg-white/5 blur-sm" />
                        <div className="absolute -bottom-12 left-8 size-28 rounded-full bg-[#f3e5b7]/10 blur-2xl" />

                        <div className="relative z-10 flex h-full flex-col">
                            <div className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/10 px-4 py-3 shadow-[0_12px_30px_-18px_rgba(0,0,0,0.65)] backdrop-blur-sm">
                                <RenivetFull className="h-[30px] w-[108px] text-white" />
                            </div>

                            <div className="mt-12 flex-1">
                                <div className="max-w-[380px]">
                                    <span className="font-outfit inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-11 font-semibold uppercase tracking-[0.24em] text-[#e9ddbc]">
                                        Conscious marketplace
                                    </span>
                                    <h2 className="mt-5 font-playfair text-[52px] leading-[0.98] text-[#f9f6ef]">
                                        Discover homegrown brands with a more
                                        thoughtful way to shop.
                                    </h2>
                                    <p className="font-outfit text-white/78 mt-4 max-w-[30ch] text-16 leading-7">
                                        Join Renivet for curated finds,
                                        mindful stories, and a welcome offer
                                        made for your first order.
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-[1.2fr_0.8fr]">
                                <div className="border-white/12 rounded-[24px] border bg-white/10 p-5 backdrop-blur-md">
                                    <p className="font-outfit text-12 font-semibold uppercase tracking-[0.2em] text-[#d7e8d7]">
                                        Welcome offer
                                    </p>
                                    <p className="mt-3 font-playfair text-[42px] leading-none text-[#f3e5b7]">
                                        20% OFF
                                    </p>
                                    <p className="font-outfit text-white/78 mt-3 text-sm leading-6">
                                        Use this code at checkout on your first
                                        order.
                                    </p>
                                </div>

                                <div className="rounded-[24px] border border-[#f3e5b7]/20 bg-[#f3e5b7]/10 p-5">
                                    <p className="font-outfit text-12 font-semibold uppercase tracking-[0.2em] text-[#f6ebc7]">
                                        Code
                                    </p>
                                    <p className="font-outfit mt-3 text-[26px] font-bold tracking-[0.08em] text-white">
                                        TRYNEW20
                                    </p>
                                    <p className="font-outfit text-white/72 mt-2 text-sm">
                                        Crafted to welcome you in.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden bg-[#f7f3eb] p-10">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(166,198,179,0.22),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(222,204,169,0.2),_transparent_28%)]" />
                        <div className="absolute right-0 top-0 size-56 -translate-y-1/3 translate-x-1/3 rounded-full bg-[#d2e2d1]/35 blur-3xl" />

                        <div className="relative z-10 mx-auto flex h-full max-w-[390px] flex-col justify-center">
                            <div>
                                <div className="font-outfit inline-flex items-center gap-2 rounded-full border border-[#234236]/10 bg-white/75 px-3 py-1.5 text-12 font-semibold text-[#234236] shadow-[0_18px_50px_-32px_rgba(35,66,54,0.55)] backdrop-blur-sm">
                                    <Icons.Sparkles className="size-3.5" />
                                    Members get early access and offers
                                </div>

                                <h3 className="mt-5 font-playfair text-[38px] leading-[1.02] text-[#18261f]">
                                    Stay close to the brands you will actually
                                    want to follow.
                                </h3>

                                <p className="font-outfit mt-4 text-16 leading-7 text-[#5c665f]">
                                    Create your Renivet account to save your
                                    favorites, unlock your first-order offer,
                                    and get thoughtfully curated updates.
                                </p>
                            </div>

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

                            <div className="mt-7 flex flex-col gap-3">
                                <SignInButton
                                    mode="modal"
                                    signUpFallbackRedirectUrl="/mycart"
                                    forceRedirectUrl="/mycart"
                                >
                                    <div className="rounded-[22px] bg-[linear-gradient(135deg,#234236_0%,#315848_100%)] p-[1.5px] shadow-[0_24px_60px_-30px_rgba(35,66,54,0.8)] transition-transform duration-300 hover:scale-[1.01]">
                                        <Button
                                            size="lg"
                                            className="font-outfit h-[56px] w-full rounded-[20px] bg-[linear-gradient(135deg,#234236_0%,#2d5243_100%)] px-6 text-[15px] font-semibold text-[#f9f6ef] hover:bg-[linear-gradient(135deg,#234236_0%,#2d5243_100%)]"
                                        >
                                            Login to claim your offer
                                        </Button>
                                    </div>
                                </SignInButton>

                                <SignUpButton
                                    mode="modal"
                                    signInFallbackRedirectUrl="/mycart"
                                    forceRedirectUrl="/mycart"
                                >
                                    <Button
                                        size="lg"
                                        className="font-outfit h-[56px] w-full rounded-[20px] border border-[#234236]/10 bg-white/80 px-6 text-[15px] font-semibold text-[#22382f] shadow-[0_22px_50px_-36px_rgba(35,66,54,0.5)] transition-all duration-300 hover:bg-white hover:text-[#18261f]"
                                    >
                                        Create free account
                                    </Button>
                                </SignUpButton>
                            </div>

                            <div className="relative mt-7 flex items-center py-1">
                                <div className="border-[#234236]/12 grow border-t" />
                                <span className="font-outfit mx-4 shrink-0 text-11 uppercase tracking-[0.18em] text-[#8b8d84]">
                                    or
                                </span>
                                <div className="border-[#234236]/12 grow border-t" />
                            </div>

                            <div className="mt-5 flex flex-col items-start gap-3">
                                {mode === "cart" && (
                                    <p className="font-outfit bg-[#234236]/6 rounded-full px-3 py-1.5 text-13 font-semibold text-[#234236]">
                                        Your item is already in the cart.
                                    </p>
                                )}
                                <button
                                    onClick={closePopup}
                                    className="font-outfit inline-flex items-center gap-2 text-[15px] font-medium text-[#566158] transition-colors hover:text-[#18261f]"
                                >
                                    {mode === "cart"
                                        ? "Continue to checkout as guest"
                                        : "Continue exploring"}
                                    <Icons.ArrowRight className="size-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
