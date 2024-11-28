import { RoleManageForm } from "@/components/globals/forms";
import { DashShell } from "@/components/globals/layouts";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Create New Role",
    description: "Create a new role and assign permissions to it",
};

export default function Page() {
    return (
        <DashShell>
            <div className="space-y-1">
                <div className="text-2xl font-semibold">Create New Role</div>
                <p className="text-sm text-muted-foreground">
                    Create a new role and assign permissions to it
                </p>
            </div>

            <RoleManageForm type="site" />
        </DashShell>
    );
}
