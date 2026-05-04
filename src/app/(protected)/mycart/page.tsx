import {
    Footer,
    GeneralShell,
    NavbarHome,
    NavbarMob,
} from "@/components/globals/layouts";
import { Icons } from "@/components/icons";
import { ProfileNav } from "@/components/profile";
import { siteConfig } from "@/config/site";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";
import { Suspense } from "react";
import GuestCartPage from "././Component/guest-cart-page";
import AddressCheckoutSection from "./Component/address-stepper/address-checkout-section";
import ShippingAddress from "./Component/address-stepper/address-stepper";
import CartComponent from "./Component/cart-component";
import CartFetcher from "./Component/cart-fetcher";
import CheckoutSection from "./Component/checkout-section";
import CheckoutStepper from "./Component/checkout-stepper";
import Page from "./Component/payment-stepper/payment";
import WardrobeSuggestions from "./Component/wardrobe-suggestions";

export const metadata: Metadata = {
    title: {
        default: "Profile",
        template: "%s | " + siteConfig.name,
    },
};

export default async function CartPage({
    searchParams,
}: {
    searchParams: Promise<{ step?: string; orderId?: string }>;
}) {
    const resolvedSearchParams = await searchParams;
    const { userId } = await auth();

    if (!userId) {
        return <GuestCartPage />;
    }

    const currentStep = parseInt(resolvedSearchParams.step || "0", 10);
    const step = Math.max(0, Math.min(currentStep, 2));

    return (
        <div className="relative flex min-h-screen flex-col bg-[linear-gradient(180deg,#fbfbf8_0%,#f3f1ea_100%)]">
            <NavbarHome />
            <main className="flex flex-1 flex-col">
                <GeneralShell>
                    <div className="flex flex-col gap-6">
                        {step === 0 && (
                            <section className="overflow-hidden rounded-[28px] border border-[#e6e0d4] bg-[linear-gradient(135deg,#ffffff_0%,#f7f4ed_52%,#eef3ee_100%)] shadow-[0_30px_80px_-50px_rgba(27,39,33,0.28)]">
                                <div className="grid gap-6 px-5 py-6 md:p-8 xl:grid-cols-[1.25fr_0.75fr]">
                                    <div className="space-y-5">
                                        <div className="inline-flex items-center gap-2 rounded-full border border-[#d9e5dc] bg-white/80 px-3 py-1.5 text-11 font-semibold uppercase tracking-[0.18em] text-[#516457]">
                                            <Icons.Sparkles className="size-3.5" />
                                            Almost yours
                                        </div>
                                        <div className="space-y-3">
                                            <h1 className="max-w-[14ch] text-[30px] font-semibold leading-[1.02] tracking-[-0.03em] text-[#1d2b23] md:text-[42px]">
                                                Your cart is one calm, easy step
                                                away from checkout.
                                            </h1>
                                            <p className="max-w-[62ch] text-sm leading-6 text-[#667267] md:text-[15px]">
                                                We kept everything you loved in
                                                one place. Review your picks,
                                                enjoy your welcome savings, and
                                                complete your order with secure
                                                delivery and thoughtful support.
                                            </p>
                                        </div>
                                        <div className="grid gap-3 sm:grid-cols-3">
                                            {[
                                                {
                                                    icon: Icons.Truck,
                                                    title: "Fast dispatch",
                                                    copy: "Delivery updates at every step",
                                                },
                                                {
                                                    icon: Icons.Shield,
                                                    title: "Secure checkout",
                                                    copy: "Protected payments and trusted fulfilment",
                                                },
                                                {
                                                    icon: Icons.Leaf,
                                                    title: "Better choices",
                                                    copy: "Curated homegrown brands worth keeping",
                                                },
                                            ].map((item) => (
                                                <div
                                                    key={item.title}
                                                    className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-[0_20px_40px_-34px_rgba(40,56,45,0.35)] backdrop-blur-sm"
                                                >
                                                    <item.icon className="size-4 text-[#5f7866]" />
                                                    <p className="mt-3 text-sm font-semibold text-[#1f2b24]">
                                                        {item.title}
                                                    </p>
                                                    <p className="mt-1 text-xs leading-5 text-[#708071]">
                                                        {item.copy}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid gap-3 self-start sm:grid-cols-3 xl:grid-cols-1">
                                        {[
                                            "Best value is auto-applied where eligible",
                                            "Selected items stay grouped for faster checkout",
                                            "Wishlist and pairing suggestions keep momentum high",
                                        ].map((point, index) => (
                                            <div
                                                key={point}
                                                className="flex items-start gap-3 rounded-2xl border border-[#e6e1d7] bg-[#fffdfa] p-4"
                                            >
                                                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#1f3328] text-xs font-bold text-white">
                                                    {index + 1}
                                                </div>
                                                <p className="text-sm leading-6 text-[#556257]">
                                                    {point}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}

                    <div className="flex flex-col gap-6 md:flex-row">
                        {step === 0 && (
                            <ProfileNav
                                className="hidden shrink-0 md:block"
                                style={{ width: 300, minHeight: 966 }}
                            />
                        )}

                        <div className="flex flex-1 flex-col gap-6">
                            {step === 0 && (
                                <div className="flex flex-col gap-6 lg:flex-row">
                                    {/* Center content — Cart items */}
                                    <div className="flex-1 space-y-5">
                                        <CheckoutStepper currentStep={step} />
                                        <Suspense
                                            fallback={<CartLoadingSkeleton />}
                                        >
                                            <CartComponent />
                                        </Suspense>

                                        {/* Wardrobe suggestions */}
                                        <Suspense fallback={null}>
                                            <WardrobeSuggestions
                                                userId={userId}
                                            />
                                        </Suspense>
                                    </div>

                                    {/* Right sidebar — Order Summary (desktop: sticky sidebar, mobile: full-width at bottom) */}
                                    <div className="w-full lg:w-[360px] lg:shrink-0">
                                        <div className="lg:sticky lg:top-28">
                                            <CheckoutSection userId={userId} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 1 && (
                                <div className="flex flex-col gap-5 lg:flex-row lg:gap-6">
                                    <div className="flex w-full flex-col gap-4 lg:w-2/3">
                                        <CheckoutStepper currentStep={step} />
                                        <div className="rounded-xl border border-gray-200 bg-white p-4 lg:p-5">
                                            <h2 className="mb-4 text-lg font-semibold text-gray-900">
                                                Select Delivery Address
                                            </h2>
                                            <ShippingAddress />
                                        </div>
                                    </div>
                                    <div className="w-full lg:w-1/3">
                                        <div className="lg:sticky lg:top-24">
                                            <AddressCheckoutSection
                                                userId={userId}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="flex flex-col gap-5 lg:flex-row lg:gap-6">
                                    <div className="flex w-full flex-col gap-4 lg:w-2/3">
                                        <CheckoutStepper currentStep={step} />
                                        <div className="rounded-xl border border-gray-200 bg-white p-4 lg:p-5">
                                            <Suspense
                                                fallback={
                                                    <div>Loading cart...</div>
                                                }
                                            >
                                                <CartFetcher userId={userId} />
                                            </Suspense>
                                        </div>
                                    </div>
                                    <div className="w-full lg:w-1/3">
                                        <div className="lg:sticky lg:top-24">
                                            <Page
                                                params={Promise.resolve({
                                                    id: null,
                                                })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    </div>
                </GeneralShell>
            </main>
            <Footer />
            <NavbarMob />
        </div>
    );
}

function CartLoadingSkeleton() {
    return (
        <div className="space-y-4">
            <div className="h-24 animate-pulse rounded-xl bg-gray-200" />
            <div className="h-16 animate-pulse rounded-xl bg-gray-200" />
            <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                    <div
                        key={i}
                        className="h-40 animate-pulse rounded-xl bg-gray-200"
                    />
                ))}
            </div>
        </div>
    );
}
