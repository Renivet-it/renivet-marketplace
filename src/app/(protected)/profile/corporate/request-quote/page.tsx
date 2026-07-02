import { CorporateRequestQuoteForm } from "@/components/corporate-platform/request-quote-form";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Corporate Request for Quotation",
    description: "Submit a corporate request for quotation from your profile dashboard.",
};

export default async function Page() {
    const { userId } = await auth();
    if (!userId) {
        redirect("/auth/signin?redirect_url=/profile/corporate/request-quote");
    }

    return <CorporateRequestQuoteForm />;
}
