import { ShopByCategoryManageForm } from "@/components/globals/forms/home-living/curate-concious";
import { DashShell } from "@/components/globals/layouts";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Create  Curate Concious by Category",
    description: "Create a  Curate Concious by Category and publish it to the platform",
};

export default function Page() {
    return (
        <DashShell>
            <div className="space-y-1">
                <h1 className="text-2xl font-bold">
                    Create Curate Concious section page banner
                </h1>
                <p className="text-sm text-muted-foreground">
                    Create a new Curate Concious and publish it to the platform
                </p>
            </div>

            <ShopByCategoryManageForm />
        </DashShell>
    );
}
