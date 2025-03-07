import { BannerManageForm } from "@/components/globals/forms";
import { DashShell } from "@/components/globals/layouts";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Create New Banner",
    description: "Create a new banner and publish it to the platform",
};

export default function Page() {
    return (
        <DashShell>
            <div className="space-y-1">
                <h1 className="text-2xl font-bold">Create New Banner</h1>
                <p className="text-sm text-muted-foreground">
                    Create a new banner and publish it to the platform
                </p>
            </div>

            <BannerManageForm />
        </DashShell>
    );
}
