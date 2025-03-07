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
                <h1 className="text-2xl font-bold">Create New Role</h1>
                <p className="text-sm text-muted-foreground">
                    Create a new role and assign permissions to it
                </p>
            </div>

            <RoleManageForm type="site" />
        </DashShell>
    );
}
