import { BrandProductManageManageForm } from "@/components/globals/forms";
import { DashShell } from "@/components/globals/layouts";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Create New Brand Product",
    description: "Create a new brand product and publish it to the platform",
};

export default function Page() {
    return (
        <DashShell>
            <div className="space-y-1">
                <h1 className="text-2xl font-bold">Create New Brand Product</h1>
                <p className="text-sm text-muted-foreground">
                    Create a new brand product and publish it to the platform
                </p>
            </div>

            <BrandProductManageManageForm />
        </DashShell>
    );
}
