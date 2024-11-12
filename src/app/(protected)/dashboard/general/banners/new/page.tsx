import { BannerManageForm } from "@/components/globals/forms";
import { DashShell } from "@/components/globals/layouts";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Create New Banner",
    description: "Create a new banner and publish it to the platform",
};

export default function Page() {
    return (
        <DashShell>
            <div className="space-y-1">
                <div className="text-2xl font-semibold">Create New Banner</div>
                <p className="text-sm text-muted-foreground">
                    Create a new banner and publish it to the platform
                </p>
            </div>

            <Suspense fallback={<>Loading...</>}>
                <BannerCreateFetch />
            </Suspense>
        </DashShell>
    );
}

async function BannerCreateFetch() {
    return <BannerManageForm />;
}
