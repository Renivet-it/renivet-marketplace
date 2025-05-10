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

// Import the CartComponent
import CartComponent from "./Component/cart-component";
import ShippingAddress from "./Component/address-stepper/address-stepper";
import AddressCheckoutSection from "./Component/address-stepper/address-checkout-section";
// Import the new client component for stepper navigation
import CheckoutStepper from "./Component/checkout-stepper";
import CheckoutSection from "./Component/checkout-section";

type LayoutProps = {
    children: React.ReactNode;
    searchParams: { step?: string };
};

export const metadata: Metadata = {
    title: {
        default: "Profile",
        template: "%s | " + siteConfig.name,
    },
};

export default async function Layout({ children, searchParams }: LayoutProps) {
    // Fetch the userId using Clerk's auth
    const { userId } = await auth();
    if (!userId) redirect("/auth/signin");

    // Read the step from the query parameter (default to 0 if not present)
    const currentStep = parseInt(searchParams.step || "0", 10);

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
                                    {/* Add your price summary logic here */}
                                    {/* <a
                                        href="?step=1"
                                        className="mt-4 inline-block w-full rounded-lg bg-gray-800 py-2 text-center text-white hover:bg-gray-900"
                                    >
                                        Proceed to Address
                                    </a> */}
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
                                    <ShippingAddress/>
                                    {/* Add address content here if needed */}
                                </div>
                                {/* Summary Section */}
                                <div className="w-full rounded-lg bg-white p-4 shadow md:w-1/3">
                                <AddressCheckoutSection userId={userId} />
                                    {/* Add your price summary logic here */}
                                    {/* <a
                                        href="?step=2"
                                        className="mt-4 inline-block w-full rounded-lg bg-gray-800 py-2 text-center text-white hover:bg-gray-900"
                                    >
                                        Proceed to Payment
                                    </a> */}
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="flex flex-col gap-6 md:flex-row">
                                {/* Payment Section */}
                                <div className="w-full rounded-lg bg-white p-4 shadow md:w-2/3">
                                    <h2 className="mb-4 text-lg font-semibold text-gray-800">
                                        Payment
                                    </h2>
                                    {/* Add payment content here if needed */}
                                </div>
                                {/* Summary Section */}
                                <div className="w-full rounded-lg bg-white p-4 shadow md:w-1/3">
                                    <h2 className="mb-4 text-lg font-semibold text-gray-800">
                                        Price Details (1 Item)
                                    </h2>
                                    {/* Add your price summary logic here */}
                                    <a
                                        href="?step=2"
                                        className="mt-4 inline-block w-full rounded-lg bg-gray-800 py-2 text-center text-white hover:bg-gray-900"
                                    >
                                        Place Order
                                    </a>
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