import { redirect } from "next/navigation";

export default async function BrandSupportDisputesRedirectPage({
    params,
}: {
    params: Promise<{ bId: string }>;
}) {
    const { bId } = await params;

    redirect(`/dashboard/brands/${bId}/support?queue=disputes`);
}
