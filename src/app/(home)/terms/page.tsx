import { ConsumerProtectionNotice } from "@/components/legal/consumer-protection-notice";
import { GeneralShell } from "@/components/globals/layouts";
import { RichTextViewer } from "@/components/ui/rich-text-viewer";
import { legalCache } from "@/lib/redis/methods";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Terms of Services",
    description: "Terms of Services for the website",
};

export default function Page() {
    return (
        <GeneralShell>
            <h1 className="text-3xl font-bold">Terms of Services</h1>

            <Suspense fallback={<div className="h-96" />}>
                <TermsFetch />
            </Suspense>
        </GeneralShell>
    );
}

async function TermsFetch() {
    const data = await legalCache.get();

    return (
        <>
            <RichTextViewer
                content={data?.termsOfService || "<p>No content yet</p>"}
            />
            <ConsumerProtectionNotice
                supportEmail={data?.supportEmail}
                supportPhone={data?.supportPhone}
                grievanceOfficerName={data?.grievanceOfficerName}
                grievanceOfficerEmail={data?.grievanceOfficerEmail}
                grievanceOfficerPhone={data?.grievanceOfficerPhone}
                grievanceOfficerAddress={data?.grievanceOfficerAddress}
            />
        </>
    );
}
