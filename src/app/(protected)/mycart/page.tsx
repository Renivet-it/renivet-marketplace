import {
    Footer,
    GeneralShell,
    NavbarHome,
    NavbarMob,
} from "@/components/globals/layouts";
import { siteConfig } from "@/config/site";
import { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { userCache } from "@/lib/redis/methods";
import CartComponent from "./Component/cart-component";
import ShippingAddress from "./Component/address-stepper/address-stepper";
import AddressCheckoutSection from "./Component/address-stepper/address-checkout-section";
import CheckoutStepper from "./Component/checkout-stepper";
import CheckoutSection from "./Component/checkout-section";
import CartFetcher from "./Component/cart-fetcher";
import Page from "./Component/payment-stepper/payment";
import GuestCartPage from "././Component/guest-cart-page";

export const metadata: Metadata = {
    title: {
        default: "Profile",
        template: "%s | " + siteConfig.name,
    },
};

export default async function CartPage({ searchParams }: { searchParams: Promise<{ step?: string; orderId?: string }> }) {
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
        <div className="relative flex min-h-screen flex-col">
            <NavbarHome />
            <main className="flex flex-1 flex-col">
                <GeneralShell>
                    {/* Stepper (client component for navigation) */}
                    <CheckoutStepper currentStep={step} />

                    {/* Main content based on the current step */}
                    <div className="container mx-auto p-4">
                        {step === 0 && (
                            <div className="flex flex-col gap-6 md:flex-row">
                                {/* Bag/Order Section */}
                                <Suspense fallback={<div>Loading...</div>}>
                                    <CartComponent />
                                </Suspense>
                                {/* Summary Section */}
                                <div className="w-full rounded-lg bg-white p-4 shadow md:w-1/3">
                                    <CheckoutSection userId={userId} />
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
                                    <Suspense fallback={<div>Loading cart...</div>}>
                                        <CartFetcher userId={userId} />
                                    </Suspense>
                                </div>
                                {/* Summary Section */}
                                <div className="w-full rounded-lg bg-white p-4 shadow md:w-1/3">
                                    <Page params={Promise.resolve({ id: null })} />
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