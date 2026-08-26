"use client";

import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";

const SETTING_KEY = "external_side_effects";

export function ExternalSideEffectsWorkspace({
    canManage,
    isProduction,
}: {
    canManage: boolean;
    isProduction: boolean;
}) {
    const settingsQuery =
        trpc.general.financeCompliance.listPlatformSettings.useQuery(
            undefined,
            { refetchOnWindowFocus: false }
        );
    const updateSetting =
        trpc.general.financeCompliance.upsertPlatformSetting.useMutation({
            onSuccess: async () => {
                await settingsQuery.refetch();
                toast.success("External side-effect setting saved");
            },
            onError: (error) => toast.error(error.message),
        });

    const setting = (settingsQuery.data ?? []).find(
        (row) => row.key === SETTING_KEY
    );
    const enabled =
        typeof setting?.value?.enabled === "boolean"
            ? setting.value.enabled
            : true;

    const updateEnabled = (nextEnabled: boolean) => {
        updateSetting.mutate({
            key: SETTING_KEY,
            value: { enabled: nextEnabled },
            description:
                "Allows real external side effects outside production; enabled by default.",
        });
    };

    return (
        <main className="min-h-screen bg-slate-50/80 p-4 sm:p-6">
            <div className="mx-auto max-w-3xl space-y-4">
                <header className="rounded-md border bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                        Staging and development control
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-950">
                        External Side Effects
                    </h1>
                    <p className="mt-2 text-sm text-slate-600">
                        This switch controls real emails, WhatsApp messages,
                        Delhivery shipment creation, and Meta CAPI events
                        outside production. Production is always enabled.
                    </p>
                </header>

                <section className="rounded-md border bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-6">
                        <div>
                            <h2 className="font-semibold text-slate-950">
                                Allow external side effects
                            </h2>
                            <p className="mt-1 text-sm text-slate-600">
                                Enabled by default. Turn this off before placing
                                staging or development test orders when you do
                                not want real external services to run.
                            </p>
                        </div>
                        <Switch
                            checked={enabled}
                            onCheckedChange={updateEnabled}
                            disabled={
                                isProduction ||
                                !canManage ||
                                settingsQuery.isLoading ||
                                updateSetting.isPending
                            }
                        />
                    </div>
                    {!canManage ? (
                        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                            You can view this setting, but need configuration
                            management permission to change it.
                        </p>
                    ) : null}
                    {isProduction ? (
                        <p className="mt-4 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                            Production is permanently enabled. This control is read-only.
                        </p>
                    ) : null}
                </section>
            </div>
        </main>
    );
}
