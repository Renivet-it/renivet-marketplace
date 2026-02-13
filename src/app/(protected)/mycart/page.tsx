import {
    Footer,
    GeneralShell,
    NavbarHome,
    NavbarMob,
} from "@/components/globals/layouts";
import { ProfileNav } from "@/components/profile";
import { siteConfig } from "@/config/site";
import { userCache } from "@/lib/redis/methods";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";
import { redirect } from "next/navigation";
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
    // Await searchParams to resolve the Promise
    const resolvedSearchParams = await searchParams;

    // Fetch the userId using Clerk's auth
    const { userId } = await auth();

    if (!userId) {
        // Show guest cart with "Proceed" button
        return <GuestCartPage />;
    }

    // Read the step from the query parameter (default to 0 if not present)
    const currentStep = parseInt(resolvedSearchParams.step || "0", 10);

    // Validate step to be within bounds (0 to 2)
    const step = Math.max(0, Math.min(currentStep, 2));

    return (
        <div className="relative flex min-h-screen flex-col bg-gray-50/50">
            <NavbarHome />
            <main className="flex flex-1 flex-col">
                <GeneralShell>
                    {/* Stepper (client component for navigation) */}
                    <CheckoutStepper currentStep={step} />

                    {/* Main content based on the current step */}
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

                                {/* Right sidebar — Order Summary */}
                                <div className="w-full lg:w-80 lg:shrink-0">
                                    <div className="lg:sticky lg:top-24">
                                        <CheckoutSection userId={userId} />
                                    </div>
                                </div>

                                {/* Mobile sticky checkout bar */}
                                <div className="fixed bottom-16 left-0 right-0 z-30 border-t border-gray-200 bg-white p-3 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] lg:hidden">
                                    <MobileCheckoutBar userId={userId} />
                                </div>
                            </div>
                        )}

                        {step === 1 && (
                            <div className="flex flex-col gap-6 md:flex-row">
                                {/* Address Section */}
                                <div className="w-full rounded-lg bg-white p-4 shadow md:w-2/3">
                                    <h2 className="mb-4 text-lg font-semibold text-gray-800">
                                        Select Delivery Address
                                    </h2>
                                    <ShippingAddress />
                                </div>
                                {/* Summary Section */}
                                <div className="w-full rounded-lg bg-white p-4 shadow md:w-1/3">
                                    <AddressCheckoutSection userId={userId} />
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="flex flex-col gap-6 md:flex-row">
                                {/* Payment Section */}
                                <div className="w-full rounded-lg bg-white p-4 shadow md:w-2/3">
                                    <Suspense
                                        fallback={<div>Loading cart...</div>}
                                    >
                                        <CartFetcher userId={userId} />
                                    </Suspense>
                                </div>
                                {/* Summary Section */}
                                <div className="w-full rounded-lg bg-white p-4 shadow md:w-1/3">
                                    <Page
                                        params={Promise.resolve({ id: null })}
                                    />
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

function MobileCheckoutBar({ userId }: { userId: string }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
                <p className="text-[10px] text-gray-500">Total</p>
                <p className="text-base font-bold text-gray-900">
                    {/* This will be reactive via the checkout section */}
                    See summary above
                </p>
            </div>
            <a
                href="?step=1"
                className="flex items-center justify-center rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700"
            >
                Proceed to Checkout
            </a>
        </div>
    );
}
