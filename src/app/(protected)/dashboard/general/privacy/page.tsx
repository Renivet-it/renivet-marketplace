import { PrivacyManageForm } from "@/components/globals/forms";
import { DashShell } from "@/components/globals/layouts";
import { LegalSkeleton } from "@/components/globals/skeletons";
import { legalCache } from "@/lib/redis/methods";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Privacy Policy",
    description: "Manage privacy policy for the website",
};

export default function Page() {
    return (
        <DashShell>
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:gap-2">
                <div className="space-y-1 text-center md:text-start">
                    <h1 className="text-2xl font-bold">Privacy Policy</h1>
                    <p className="text-balance text-sm text-muted-foreground">
                        Manage privacy policy for the website
                    </p>
                </div>
            </div>

            <Suspense fallback={<LegalSkeleton />}>
                <PrivacyFetch />
            </Suspense>
        </DashShell>
    );
}

async function PrivacyFetch() {
    const data = await legalCache.get();

    return <PrivacyManageForm legal={data} />;
}
