"use client";

import { Button } from "@/components/ui/button-dash";
import { Input } from "@/components/ui/input-dash";
import { financeModules } from "@/lib/db/schema";
import { trpc } from "@/lib/trpc/client";
import { useMemo, useState } from "react";

type ModuleKey = (typeof financeModules)[number];

const moduleLabels: Record<ModuleKey, string> = {
    refunds: "Refunds",
    cod_reconciliation: "COD Reconciliation",
    payouts: "Payouts",
    gst_reports: "GST Reports",
    tds_reports: "TDS Reports",
    monthly_pl: "Monthly P&L",
    data_deletion: "Data Deletion",
    compliance_admin: "Compliance Admin",
    audit_log_finance: "Finance Audit Log",
};

export function ModuleAccessWorkspace({
    canManage,
    isAj,
}: {
    canManage: boolean;
    isAj: boolean;
}) {
    const [moduleKey, setModuleKey] = useState<ModuleKey>("monthly_pl");
    const [query, setQuery] = useState("");
    const [selectedUserId, setSelectedUserId] = useState("");
    const [canView, setCanView] = useState(true);
    const [canManageGrant, setCanManageGrant] = useState(false);
    const [notes, setNotes] = useState("");

    const accessQuery = trpc.general.financeCompliance.listModuleAccess.useQuery(undefined, {
        refetchOnWindowFocus: false,
    });
    const usersQuery = trpc.general.financeCompliance.searchFinanceUsers.useQuery(
        { q: query || undefined },
        { refetchOnWindowFocus: false }
    );

    const grantMutation = trpc.general.financeCompliance.upsertModuleAccess.useMutation({
        onSuccess: async () => {
            setNotes("");
            await accessQuery.refetch();
        },
    });

    const groupedRows = useMemo(() => {
        const rows = accessQuery.data ?? [];
        return financeModules.map((key) => ({
            moduleKey: key,
            rows: rows.filter((row) => row.moduleKey === key && !row.revokedAt),
        }));
    }, [accessQuery.data]);

    const handleGrant = async (revoke = false) => {
        if (!selectedUserId) return;
        await grantMutation.mutateAsync({
            moduleKey,
            userId: selectedUserId,
            canView,
            canManage: canManageGrant,
            notes: notes || undefined,
            revoke,
        });
    };

    return (
        <div className="space-y-4">
            <section className="rounded-md border bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                    Access Control
                </p>
                <h1 className="mt-2 text-2xl font-semibold text-slate-950">Finance Module Access</h1>
                <p className="mt-2 text-sm text-slate-600">
                    Module access is additive. `monthly_pl` is explicit allowlist access only and does not inherit from
                    admin role.
                </p>
                {!isAj ? (
                    <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                        Only AJ can grant or revoke access. You can still review the current authorization list here.
                    </p>
                ) : null}
            </section>

            {canManage ? (
                <section className="rounded-md border bg-white p-4 shadow-sm">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        <div>
                            <label className="text-xs font-semibold uppercase text-slate-500">Module</label>
                            <select
                                value={moduleKey}
                                onChange={(event) => setModuleKey(event.target.value as ModuleKey)}
                                className="mt-1 h-10 w-full rounded-md border px-3 text-sm"
                            >
                                {financeModules.map((key) => (
                                    <option key={key} value={key}>
                                        {moduleLabels[key]}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase text-slate-500">Find user</label>
                            <Input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                className="mt-1"
                                placeholder="Search by name, email, or user id"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase text-slate-500">Selected user ID</label>
                            <Input
                                value={selectedUserId}
                                onChange={(event) => setSelectedUserId(event.target.value)}
                                className="mt-1"
                                placeholder="clerk user id"
                            />
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        <label className="flex items-center gap-2 text-sm text-slate-700">
                            <input type="checkbox" checked={canView} onChange={(event) => setCanView(event.target.checked)} />
                            View
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-700">
                            <input
                                type="checkbox"
                                checked={canManageGrant}
                                onChange={(event) => setCanManageGrant(event.target.checked)}
                            />
                            Manage
                        </label>
                    </div>

                    <div className="mt-4">
                        <label className="text-xs font-semibold uppercase text-slate-500">Notes</label>
                        <Input
                            value={notes}
                            onChange={(event) => setNotes(event.target.value)}
                            className="mt-1"
                            placeholder="Why this access is being granted"
                        />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        <Button disabled={!isAj || !selectedUserId || grantMutation.isPending} onClick={() => handleGrant(false)}>
                            Grant Access
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={!isAj || !selectedUserId || grantMutation.isPending}
                            onClick={() => handleGrant(true)}
                        >
                            Revoke Access
                        </Button>
                    </div>

                    <div className="mt-4 rounded-md border bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase text-slate-500">User matches</p>
                        <div className="mt-3 space-y-2">
                            {(usersQuery.data ?? []).map((user) => (
                                <button
                                    key={user.id}
                                    type="button"
                                    onClick={() => setSelectedUserId(user.id)}
                                    className="flex w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-left text-sm hover:bg-slate-50"
                                >
                                    <span className="font-medium text-slate-900">
                                        {user.firstName} {user.lastName}
                                    </span>
                                    <span className="text-slate-500">{user.email}</span>
                                </button>
                            ))}
                            {!usersQuery.isLoading && !(usersQuery.data ?? []).length ? (
                                <p className="text-sm text-slate-500">No matching users found.</p>
                            ) : null}
                        </div>
                    </div>
                </section>
            ) : null}

            <section className="space-y-4">
                {groupedRows.map((group) => (
                    <div key={group.moduleKey} className="overflow-hidden rounded-md border bg-white shadow-sm">
                        <div className="border-b bg-slate-100 px-4 py-3">
                            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">
                                {moduleLabels[group.moduleKey]}
                            </h2>
                        </div>
                        {group.rows.length ? (
                            <div className="divide-y">
                                {group.rows.map((row) => (
                                    <div
                                        key={row.id}
                                        className="grid gap-3 px-4 py-3 text-sm md:grid-cols-[1.2fr_1fr_0.5fr_0.6fr_1fr]"
                                    >
                                        <div>
                                            <p className="font-medium text-slate-900">{row.userId}</p>
                                            {row.notes ? <p className="text-xs text-slate-500">{row.notes}</p> : null}
                                        </div>
                                        <span className="text-slate-600">{row.grantedBy ?? "Unknown grantor"}</span>
                                        <span>{row.canView ? "Yes" : "No"}</span>
                                        <span>{row.canManage ? "Yes" : "No"}</span>
                                        <span className="text-slate-500">
                                            {row.grantedAt ? new Date(row.grantedAt).toLocaleString() : "N/A"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="p-4 text-sm text-slate-500">No active user grants for this module.</p>
                        )}
                    </div>
                ))}
            </section>
        </div>
    );
}
