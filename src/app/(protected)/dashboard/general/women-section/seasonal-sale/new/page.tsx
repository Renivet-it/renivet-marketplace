import { ShopByCategoryManageForm } from "@/components/globals/forms/women/seasonal-sale";
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
                    Create new Seasona Sale
                </h1>
                <p className="text-sm text-muted-foreground">
                    Create a new Seasona Sale and publish it to the platform
                </p>
            </div>

            <ShopByCategoryManageForm />
        </DashShell>
    );
}
