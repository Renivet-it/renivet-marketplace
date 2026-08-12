import { AdminTaskCenter } from "@/components/corporate-platform/admin-task-center";
import { CorporateTabs } from "@/components/corporate-platform/corporate-tabs";
import { DashShell } from "@/components/globals/layouts/shells";
import { corporatePlatformService } from "@/lib/services/corporate-platform";

export default async function Page() {
    const tasks = await corporatePlatformService.listAdminTasks();

    return (
        <DashShell>
            <div className="space-y-4">
                <CorporateTabs />
                <header className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <h1 className="text-lg font-semibold text-slate-950">
                        Task Control
                    </h1>
                    <p className="mt-0.5 text-xs text-slate-500">
                        Assign, prioritize and track operational work
                    </p>
                </header>
                <AdminTaskCenter initialTasks={tasks} />
            </div>
        </DashShell>
    );
}
