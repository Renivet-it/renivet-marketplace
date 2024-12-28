import { GeneralShell } from "@/components/globals/layouts";
import { RichTextViewer } from "@/components/ui/rich-text-viewer";
import { legalCache } from "@/lib/redis/methods";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Refund Policy",
    description: "Refund Policy for the website",
};

export default function Page() {
    return (
        <GeneralShell>
            <h1 className="text-3xl font-bold">Refund Policy</h1>

            <Suspense fallback={<div className="h-96" />}>
                <RefundPolicyFetch />
            </Suspense>
        </GeneralShell>
    );
}

async function RefundPolicyFetch() {
    const data = await legalCache.get();

    return (
        <RichTextViewer
            content={data?.refundPolicy || "<p>No content yet</p>"}
        />
    );
}
