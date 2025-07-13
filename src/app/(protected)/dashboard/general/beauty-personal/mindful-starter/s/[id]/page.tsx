import { ShopByCategoryManageForm } from "@/components/globals/forms";
import { DashShell } from "@/components/globals/layouts";
import { homeShopByCategoryQueries } from "@/lib/db/queries";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export const metadata: Metadata = {
    title: "Edit Shop by Category",
    description: "Edit the shop by category and publish it to the platform",
};

export default function Page({ params }: PageProps) {
    return (
        <DashShell>
            <div className="space-y-1">
                <h1 className="text-2xl font-bold">Edit Shop by Category</h1>
                <p className="text-sm text-muted-foreground">
                    Edit the shop by category and publish it to the platform
                </p>
            </div>

            <Suspense>
                <ShopByCategoryEditFetch params={params} />
            </Suspense>
        </DashShell>
    );
}

async function ShopByCategoryEditFetch({ params }: PageProps) {
    const { id } = await params;

    const existingSbc =
        await homeShopByCategoryQueries.getHomeShopByCategory(id);
    if (!existingSbc) notFound();

    return <ShopByCategoryManageForm shopByCategory={existingSbc} />;
}
