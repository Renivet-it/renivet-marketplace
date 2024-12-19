import { GeneralShell } from "@/components/globals/layouts";
import { RichTextViewer } from "@/components/ui/rich-text-viewer";
import { legalCache } from "@/lib/redis/methods";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Privacy Policy",
    description: "Privacy policy for the website",
};

export default function Page() {
    return (
        <GeneralShell>
            <h1 className="text-3xl font-bold">Privacy Policy</h1>

            <Suspense fallback={<div className="h-96" />}>
                <PrivacyFetch />
            </Suspense>
        </GeneralShell>
    );
}

async function PrivacyFetch() {
    const data = await legalCache.get();

    return (
        <RichTextViewer
            content={data?.privacyPolicy || "<p>No content yet</p>"}
        />
    );
}
