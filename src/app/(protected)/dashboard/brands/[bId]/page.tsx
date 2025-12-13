import { redirect } from "next/navigation";
import { Suspense } from "react";

interface PageProps {
    params: Promise<{ bId: string }>;
}

export default function Page(props: PageProps) {
    return (
        <Suspense>
            <BrandFetch {...props} />
        </Suspense>
    );
}

async function BrandFetch({ params }: PageProps) {
    const { bId } = await params;

    redirect(`/dashboard/brands/${bId}/new-analytics`);
    return null;
}
