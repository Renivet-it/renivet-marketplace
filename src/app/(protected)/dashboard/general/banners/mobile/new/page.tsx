import { BannerManageForm } from "@/components/globals/forms";
import { DashShell } from "@/components/globals/layouts";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Create Mobile Banner",
    description: "Create a mobile homepage banner",
};

export default function Page() {
    return (
        <DashShell>
            <div className="space-y-1">
                <h1 className="text-2xl font-bold">Create Mobile Banner</h1>
                <p className="text-sm text-muted-foreground">
                    Add a title, mobile image, and redirect URL
                </p>
            </div>
            <BannerManageForm isMobile />
        </DashShell>
    );
}
