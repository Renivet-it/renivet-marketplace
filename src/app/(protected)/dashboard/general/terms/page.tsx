import { TermsManageForm } from "@/components/globals/forms";
import { DashShell } from "@/components/globals/layouts";
import { LegalSkeleton } from "@/components/globals/skeletons";
import { legalCache } from "@/lib/redis/methods";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Terms of Services",
    description: "Manage terms of services for the website",
};

export default function Page() {
    return (
        <DashShell>
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:gap-2">
                <div className="space-y-1 text-center md:text-start">
                    <h1 className="text-2xl font-bold">Terms of Services</h1>
                    <p className="text-balance text-sm text-muted-foreground">
                        Manage terms of services for the website
                    </p>
                </div>
            </div>

            <Suspense fallback={<LegalSkeleton />}>
                <TermsFetch />
            </Suspense>
        </DashShell>
    );
}

async function TermsFetch() {
    const data = await legalCache.get();

    return <TermsManageForm legal={data} />;
}
