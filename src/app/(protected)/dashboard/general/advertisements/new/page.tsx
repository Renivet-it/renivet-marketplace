import { AdvertisementManageForm } from "@/components/globals/forms";
import { DashShell } from "@/components/globals/layouts";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Create New Advertisement",
    description: "Create a new advertisement and publish it to the platform",
};

export default function Page() {
    return (
        <DashShell>
            <div className="space-y-1">
                <h1 className="text-2xl font-bold">Create New Advertisement</h1>
                <p className="text-sm text-muted-foreground">
                    Create a new advertisement and publish it to the platform
                </p>
            </div>

            <AdvertisementManageForm />
        </DashShell>
    );
}
