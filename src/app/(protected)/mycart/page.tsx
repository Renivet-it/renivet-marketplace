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
                            <section className="overflow-hidden rounded-[28px] border border-[#e7e2d8] bg-[linear-gradient(180deg,#ffffff_0%,#faf8f3_100%)] shadow-[0_24px_70px_-52px_rgba(24,31,27,0.25)]">
                                <div className="space-y-6 px-5 py-6 md:p-8">
                                    <div className="space-y-3">
                                        <div className="inline-flex items-center gap-2 rounded-full border border-[#e7e2d8] bg-[#fcfbf8] px-3 py-1.5 text-11 font-semibold uppercase tracking-[0.18em] text-[#6d746d]">
                                            <Icons.Sparkles className="size-3.5" />
                                            Curated for checkout
                                        </div>
                                        <h1 className="max-w-[15ch] text-[30px] font-semibold leading-[1.02] tracking-[-0.03em] text-[#1f2521] md:text-[42px]">
                                            A considered cart, ready when you are.
                                        </h1>
                                        <p className="max-w-[64ch] text-sm leading-6 text-[#6b706c] md:text-[15px]">
                                            Review your selected pieces, refine
                                            the details, and complete your order
                                            through a secure, carefully paced
                                            checkout.
                                        </p>
                                    </div>

                                    <div className="grid gap-3 border-t border-[#ece7de] pt-5 sm:grid-cols-3">
                                        {[
                                            {
                                                icon: Icons.Truck,
                                                label: "Delivery",
                                                copy: "Tracked updates from dispatch to doorstep",
                                            },
                                            {
                                                icon: Icons.Shield,
                                                label: "Payments",
                                                copy: "Protected checkout with verified fulfilment",
                                            },
                                            {
                                                icon: Icons.Leaf,
                                                label: "Selection",
                                                copy: "Homegrown brands chosen for lasting value",
                                            },
                                        ].map((item) => (
                                            <div
                                                key={item.label}
                                                className="flex items-start gap-3 rounded-2xl bg-white/70 p-1"
                                            >
                                                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border border-[#ece7de] bg-[#fcfbf8]">
                                                    <item.icon className="size-4 text-[#667166]" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-[#202722]">
                                                        {item.label}
                                                    </p>
                                                    <p className="mt-1 text-xs leading-5 text-[#747a74]">
                                                        {item.copy}
                                                    </p>
                                                </div>
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
