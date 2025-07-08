import { ShopByCategoryManageForm } from "@/components/globals/forms/kids/doll-banner-section";
import { DashShell } from "@/components/globals/layouts";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Create New Shop by Category",
    description: "Create a new Shop by Category and publish it to the platform",
};

export default function Page() {
    return (
        <DashShell>
            <div className="space-y-1">
                <h1 className="text-2xl font-bold">
                    Create New Doll Banner section
                </h1>
                <p className="text-sm text-muted-foreground">
                    Create a new Doll Banner section and publish it to the platform
                </p>
            </div>

            <ShopByCategoryManageForm />
        </DashShell>
    );
}
