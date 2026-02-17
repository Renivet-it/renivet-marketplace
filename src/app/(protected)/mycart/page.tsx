import {
    Footer,
    GeneralShell,
    NavbarHome,
    NavbarMob,
} from "@/components/globals/layouts";
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
        <div className="relative flex min-h-screen flex-col bg-[#fcfcf5]">
            <NavbarHome />
            <main className="flex flex-1 flex-col">
                <GeneralShell classNames={{ innerWrapper: "pt-0 md:pt-0" }}>
                    <CheckoutStepper currentStep={step} />

                    <div className="container mx-auto px-4 py-2">
                        {step === 0 && (
                            <div className="flex flex-col gap-6 lg:flex-row">
                                {/* Left sidebar — Profile Nav (desktop only) */}
                                <div className="hidden lg:block">
                                    <ProfileNav className="sticky top-24 h-min shrink-0" />
                                </div>

                                {/* Center content — Cart items */}
                                <div className="flex-1 space-y-4">
                                    <Suspense
                                        fallback={<CartLoadingSkeleton />}
                                    >
                                        <CartComponent />
                                    </Suspense>

                                    {/* Wardrobe suggestions */}
                                    <Suspense fallback={null}>
                                        <WardrobeSuggestions userId={userId} />
                                    </Suspense>
                                </div>

                                {/* Right sidebar — Order Summary (desktop: sticky sidebar, mobile: full-width at bottom) */}
                                <div className="w-full lg:w-80 lg:shrink-0">
                                    <div className="lg:sticky lg:top-24">
                                        <CheckoutSection userId={userId} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 1 && (
                            <div className="flex flex-col gap-5 lg:flex-row lg:gap-6">
                                <div className="w-full rounded-xl border border-gray-200 bg-white p-4 lg:w-2/3 lg:p-5">
                                    <h2 className="mb-4 text-lg font-semibold text-gray-900">
                                        Select Delivery Address
                                    </h2>
                                    <ShippingAddress />
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
                                <div className="w-full rounded-xl border border-gray-200 bg-white p-4 lg:w-2/3 lg:p-5">
                                    <Suspense
                                        fallback={<div>Loading cart...</div>}
                                    >
                                        <CartFetcher userId={userId} />
                                    </Suspense>
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
