import { AdminTaskCenter } from "@/components/corporate-platform/admin-task-center";
import { DashShell } from "@/components/globals/layouts/shells";
import { corporatePlatformService } from "@/lib/services/corporate-platform";

export default async function Page() {
    const tasks = await corporatePlatformService.listAdminTasks();

    return (
        <DashShell>
            <div className="space-y-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Corporate Tasks</h1>
                    <p className="text-sm text-slate-500">
                        Operational task queue for RFQs, finance, QC, dispatch, and escalations.
                    </p>
                </div>
                <AdminTaskCenter initialTasks={tasks} />
            </div>
        </DashShell>
    );
}

