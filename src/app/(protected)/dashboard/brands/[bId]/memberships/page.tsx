import { PlansGrid } from "@/components/dashboard/brands/memberships";
import { DashShell } from "@/components/globals/layouts";
import { brandCache, planCache } from "@/lib/redis/methods";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Memberships",
    description: "Manage the membership for the brand",
};

interface PageProps {
    params: Promise<{ bId: string }>;
}

export default function Page(props: PageProps) {
    return (
        <DashShell>
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:gap-2">
                <div className="space-y-1 text-center md:text-start">
                    <h1 className="text-2xl font-bold">Memberships</h1>
                    <p className="text-balance text-sm text-muted-foreground">
                        Manage the membership for the brand
                    </p>
                </div>
            </div>

            <Suspense>
                <PlansFetch {...props} />
            </Suspense>
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />
        </DashShell>
    );
}

async function PlansFetch({ params }: PageProps) {
    const { bId } = await params;

    const [existingBrand, plans] = await Promise.all([
        brandCache.get(bId),
        planCache.getAll(),
    ]);
    if (!existingBrand) notFound();
    const activePlans = plans
        .filter((plan) => plan.isActive)
        .sort((a, b) => a.amount - b.amount);

    return <PlansGrid plans={activePlans} brand={existingBrand} />;
}
