import { BrandProductManageManageForm } from "@/components/globals/forms";
import { DashShell } from "@/components/globals/layouts";
import { homeBrandProductQueries } from "@/lib/db/queries";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export const metadata: Metadata = {
    title: "Edit Brand Product",
    description: "Edit brand product and publish it to the platform",
};

export default function Page({ params }: PageProps) {
    return (
        <DashShell>
            <div className="space-y-1">
                <h1 className="text-2xl font-bold">Edit Brand Product</h1>
                <p className="text-sm text-muted-foreground">
                    Edit the brand product and publish it to the platform
                </p>
            </div>

            <Suspense>
                <BrandProductEditFetch params={params} />
            </Suspense>
        </DashShell>
    );
}

async function BrandProductEditFetch({ params }: PageProps) {
    const { id } = await params;

    const existingBp = await homeBrandProductQueries.getHomeBrandProduct(id);
    if (!existingBp) notFound();

    return <BrandProductManageManageForm brandProduct={existingBp} />;
}
