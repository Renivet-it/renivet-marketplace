import { RefundPolicyManageForm } from "@/components/globals/forms";
import { DashShell } from "@/components/globals/layouts";
import { legalCache } from "@/lib/redis/methods";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Refund Policy",
    description: "Manage refund policy for the website",
};

export default function Page() {
    return (
        <DashShell>
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:gap-2">
                <div className="space-y-1 text-center md:text-start">
                    <h1 className="text-2xl font-bold">Refund Policy</h1>
                    <p className="text-balance text-sm text-muted-foreground">
                        Manage refund policy for the website
                    </p>
                </div>
            </div>

            <Suspense>
                <RefundPolicyFetch />
            </Suspense>
        </DashShell>
    );
}

async function RefundPolicyFetch() {
    const data = await legalCache.get();

    return <RefundPolicyManageForm legal={data} />;
}
