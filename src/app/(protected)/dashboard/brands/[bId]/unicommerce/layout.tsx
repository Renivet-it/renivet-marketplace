import { UnicommerceLocalNav } from "@/components/dashboard/brands/unicommerce";
import { DashShell } from "@/components/globals/layouts";
import { ReactNode } from "react";

interface UnicommerceLayoutProps {
    children: ReactNode;
    params: Promise<{ bId: string }>;
}

export default async function UnicommerceLayout({
    children,
    params,
}: UnicommerceLayoutProps) {
    const { bId } = await params;

    return (
        <DashShell className="max-w-[1400px]">
            <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
                <div className="lg:sticky lg:top-6 lg:self-start">
                    <UnicommerceLocalNav brandId={bId} />
                </div>
                <div className="min-w-0">{children}</div>
            </div>
        </DashShell>
    );
}

