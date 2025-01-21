import { AnalyticsPage } from "@/components/analytics";
import { DashShell } from "@/components/globals/layouts";
import { Metadata } from "next";
import { Suspense } from "react";

interface PageProps {
    params: Promise<{ bId: string }>;
}

export const metadata: Metadata = {
    title: "Analytics",
    description: "View the brand's analytics",
};

export default function Page(props: PageProps) {
    return (
        <DashShell className="max-w-7xl">
            <Suspense>
                <AnalyticsFetch {...props} />
            </Suspense>
        </DashShell>
    );
}

async function AnalyticsFetch({ params }: PageProps) {
    const { bId } = await params;

    return <AnalyticsPage brandId={bId} />;
}
