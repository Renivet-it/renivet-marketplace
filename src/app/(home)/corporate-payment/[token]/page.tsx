import { CorporatePaymentPage } from "@/components/corporate-platform/corporate-payment-page";
import { corporatePaymentRequestService } from "@/lib/services/corporate-payment-request";
import { notFound } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    try {
        const initialData = await corporatePaymentRequestService.getPublic(token);
        return <CorporatePaymentPage token={token} initialData={initialData} />;
    } catch {
        notFound();
    }
}
