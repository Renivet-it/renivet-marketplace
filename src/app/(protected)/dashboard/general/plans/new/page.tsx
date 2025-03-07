import { PlanManageForm } from "@/components/globals/forms";
import { DashShell } from "@/components/globals/layouts";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Create New Plan",
    description: "Create a new plan and add it to the platform",
};

export default function Page() {
    return (
        <DashShell>
            <div className="space-y-1">
                <h1 className="text-2xl font-bold">Create New Plan</h1>
                <p className="text-sm text-muted-foreground">
                    Create a new plan and add it to the platform
                </p>
            </div>

            <Suspense>
                <PlanCreateFetch />
            </Suspense>
        </DashShell>
    );
}

async function PlanCreateFetch() {
    return <PlanManageForm />;
}
