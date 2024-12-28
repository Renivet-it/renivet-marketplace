import { GeneralShell } from "@/components/globals/layouts";
import { RichTextViewer } from "@/components/ui/rich-text-viewer";
import { legalCache } from "@/lib/redis/methods";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Shipping Policy",
    description: "Shipping Policy for the website",
};

export default function Page() {
    return (
        <GeneralShell>
            <h1 className="text-3xl font-bold">Shipping Policy</h1>

            <Suspense fallback={<div className="h-96" />}>
                <ShippingPolicyFetch />
            </Suspense>
        </GeneralShell>
    );
}

async function ShippingPolicyFetch() {
    const data = await legalCache.get();

    return (
        <RichTextViewer
            content={data?.shippingPolicy || "<p>No content yet</p>"}
        />
    );
}
