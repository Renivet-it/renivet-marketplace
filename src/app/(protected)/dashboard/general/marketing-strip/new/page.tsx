import { MarketingStripManageForm } from "@/components/globals/forms";
import { DashShell } from "@/components/globals/layouts";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Add New Marketing Strip Item",
    description: "Add a new item to existing marketing strip",
};

export default function Page() {
    return (
        <DashShell>
            <div className="space-y-1">
                <h1 className="text-2xl font-bold">
                    Add New Marketing Strip Item
                </h1>
                <p className="text-sm text-muted-foreground">
                    Add a new item to existing marketing strip
                </p>
            </div>

            <MarketingStripManageForm />
        </DashShell>
    );
}
