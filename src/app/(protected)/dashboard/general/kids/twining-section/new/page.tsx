import { ShopByCategoryManageForm } from "@/components/globals/forms/kids/twining-section";
import { DashShell } from "@/components/globals/layouts";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Create New Twining ",
    description: "Create a New Twining and publish it to the platform",
};

export default function Page() {
    return (
        <DashShell>
            <div className="space-y-1">
                <h1 className="text-2xl font-bold">
                    Create New Men Twining Section
                </h1>
                <p className="text-sm text-muted-foreground">
                    Create a new Men Twining Section and publish it to the platform
                </p>
            </div>

            <ShopByCategoryManageForm />
        </DashShell>
    );
}
