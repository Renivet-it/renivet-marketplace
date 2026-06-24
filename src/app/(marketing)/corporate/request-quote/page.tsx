import { CorporateRequestQuoteForm } from "@/components/corporate-platform/request-quote-form";
import { GeneralShell } from "@/components/globals/layouts/shells";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Request Corporate Quote",
    description: "Submit a managed corporate RFQ to Renivet.",
};

export default async function Page() {
    const { userId } = await auth();
    if (!userId) {
        redirect("/auth/signin?redirect_url=/corporate/request-quote");
    }

    return (
        <GeneralShell>
            <CorporateRequestQuoteForm />
        </GeneralShell>
    );
}
