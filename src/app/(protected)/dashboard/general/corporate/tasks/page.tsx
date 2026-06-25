import { AdminPageIntro } from "@/components/corporate-platform/admin-design";
import { AdminTaskCenter } from "@/components/corporate-platform/admin-task-center";
import { DashShell } from "@/components/globals/layouts/shells";
import { corporatePlatformService } from "@/lib/services/corporate-platform";

export default async function Page() {
    const tasks = await corporatePlatformService.listAdminTasks();

    return (
        <DashShell>
            <div className="space-y-6">
                <AdminPageIntro
                    eyebrow="Operational Task Control"
                    title="Assign, prioritize, and track corporate execution work"
                    description="Manage due-date driven tasks across requests for quotation, finance, quality control, dispatch, and escalation response from one wide operational queue."
                />
                <AdminTaskCenter initialTasks={tasks} />
            </div>
        </DashShell>
    );
}

