"use client";

import { Button } from "@/components/ui/button-dash";
import { Input } from "@/components/ui/input-dash";
import { trpc } from "@/lib/trpc/client";
import { useEffect, useMemo, useState } from "react";

type DraftManualRow = {
    id?: string;
    lineItem: string;
    subLabel: string;
    description: string;
    amountPaise: number;
    notes: string;
};

const manualLineOptions = [
    "other_income",
    "salaries",
    "paid_marketing",
    "social_media",
    "tools_saas",
    "infrastructure_hosting",
    "registerkaro",
    "miscellaneous",
    "bank_balance_start",
    "bank_balance_end",
] as const;

function formatMoney(amountPaise: number) {
    return `INR ${(amountPaise / 100).toFixed(2)}`;
}

export function MonthlyPlDashboard({
    initialMonthKey,
}: {
    initialMonthKey: string;
}) {
    const [monthKey, setMonthKey] = useState(initialMonthKey);
    const [unlockReason, setUnlockReason] = useState("");
    const [draftRows, setDraftRows] = useState<DraftManualRow[]>([]);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const utils = trpc.useUtils();
    const dashboardQuery = trpc.general.financeCompliance.getMonthlyPlDashboard.useQuery(
        { monthKey },
        {
            refetchOnWindowFocus: false,
        }
    );
    const refreshMutation = trpc.general.financeCompliance.refreshMonthlyPl.useMutation({
        onSuccess: async () => {
            await utils.general.financeCompliance.getMonthlyPlDashboard.invalidate({ monthKey });
        },
    });
    const saveEntryMutation = trpc.general.financeCompliance.upsertPlEntry.useMutation();
    const lockMutation = trpc.general.financeCompliance.lockPlMonth.useMutation({
        onSuccess: async () => {
            await utils.general.financeCompliance.getMonthlyPlDashboard.invalidate({ monthKey });
        },
    });
    const unlockMutation = trpc.general.financeCompliance.unlockPlMonth.useMutation({
        onSuccess: async () => {
            await utils.general.financeCompliance.getMonthlyPlDashboard.invalidate({ monthKey });
            setUnlockReason("");
        },
    });

    const summary = dashboardQuery.data?.summary;
    const isLocked = dashboardQuery.data?.isLocked ?? false;

    useEffect(() => {
        if (!dashboardQuery.data) return;
        const currentManual = dashboardQuery.data.entries.length
            ? dashboardQuery.data.entries
            : dashboardQuery.data.previousEntries;

        setDraftRows(
            currentManual.map((entry) => ({
                id: dashboardQuery.data?.entries.length ? entry.id : undefined,
                lineItem: entry.lineItem ?? entry.category,
                subLabel: entry.subLabel ?? "",
                description: entry.description,
                amountPaise: entry.amountPaise,
                notes: entry.notes ?? "",
            }))
        );
        setHasUnsavedChanges(false);
    }, [dashboardQuery.data]);

    useEffect(() => {
        if (!hasUnsavedChanges || !draftRows.length || isLocked) return;

        const timer = setTimeout(async () => {
            for (const row of draftRows) {
                await saveEntryMutation.mutateAsync({
                    id: row.id,
                    monthKey,
                    lineItem: row.lineItem,
                    subLabel: row.subLabel || undefined,
                    description: row.description,
                    amountPaise: row.amountPaise,
                    notes: row.notes || undefined,
                });
            }
            setHasUnsavedChanges(false);
            await utils.general.financeCompliance.getMonthlyPlDashboard.invalidate({ monthKey });
        }, 30000);

        return () => clearTimeout(timer);
    }, [draftRows, hasUnsavedChanges, isLocked, monthKey, saveEntryMutation, utils.general.financeCompliance]);

    const autoLines = useMemo(
        () => summary?.lines.filter((line) => line.type !== "manual") ?? [],
        [summary]
    );

    const addManualRow = () => {
        setDraftRows((current) => [
            ...current,
            {
                lineItem: "miscellaneous",
                subLabel: "",
                description: "",
                amountPaise: 0,
                notes: "",
            },
        ]);
        setHasUnsavedChanges(true);
    };

    return (
        <div className="space-y-4">
            <section className="flex flex-wrap items-end justify-between gap-3 rounded-md border bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-end gap-3">
                    <div>
                        <label className="text-xs font-semibold uppercase text-slate-500">Month</label>
                        <Input
                            type="month"
                            value={monthKey}
                            onChange={(event) => setMonthKey(event.target.value)}
                            className="mt-1 w-44"
                        />
                    </div>
                    <Button variant="outline" onClick={() => refreshMutation.mutate({ monthKey })}>
                        {refreshMutation.isPending ? "Refreshing..." : "Refresh sources"}
                    </Button>
                    {isLocked ? (
                        <a
                            href={`/api/finance/monthly-pl/${monthKey}/export`}
                            className="inline-flex h-10 items-center rounded-md border px-4 text-sm font-medium"
                        >
                            Export PDF
                        </a>
                    ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {isLocked ? (
                        <>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">Locked</span>
                            {dashboardQuery.data?.snapshot?.lockedAt ? (
                                <span className="text-sm text-slate-500">
                                    Locked {new Date(dashboardQuery.data.snapshot.lockedAt).toLocaleString()}
                                </span>
                            ) : null}
                            <Input
                                value={unlockReason}
                                onChange={(event) => setUnlockReason(event.target.value)}
                                placeholder={
                                    dashboardQuery.data?.canUnlock
                                        ? "Unlock reason"
                                        : "Only AJ can unlock locked months"
                                }
                                className="w-64"
                                disabled={!dashboardQuery.data?.canUnlock || unlockMutation.isPending}
                            />
                            <Button
                                variant="destructive"
                                disabled={
                                    !dashboardQuery.data?.canUnlock ||
                                    unlockMutation.isPending ||
                                    unlockReason.trim().length < 3
                                }
                                onClick={() =>
                                    unlockMutation.mutate({
                                        monthKey,
                                        reason: unlockReason,
                                    })
                                }
                            >
                                {unlockMutation.isPending ? "Unlocking..." : "Unlock Month"}
                            </Button>
                            {!dashboardQuery.data?.canUnlock ? (
                                <span className="text-xs text-slate-500">
                                    Locked months can only be unlocked by AJ.
                                </span>
                            ) : null}
                        </>
                    ) : (
                        <Button disabled={lockMutation.isPending} onClick={() => lockMutation.mutate({ monthKey })}>
                            {lockMutation.isPending ? "Locking..." : "Lock Month"}
                        </Button>
                    )}
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Total income" value={summary ? formatMoney(summary.metrics.totalIncomePaise) : "-"} />
                <MetricCard label="Total OpEx" value={summary ? formatMoney(summary.metrics.totalOpexPaise) : "-"} />
                <MetricCard label="Net P&L" value={summary ? formatMoney(summary.metrics.netProfitLossPaise) : "-"} />
                <MetricCard
                    label="Cash runway"
                    value={
                        summary?.metrics.cashRunwayMonths !== null &&
                        summary?.metrics.cashRunwayMonths !== undefined
                            ? `${summary.metrics.cashRunwayMonths} months`
                            : "Needs inputs"
                    }
                />
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-md border bg-white shadow-sm">
                    <div className="border-b px-4 py-3">
                        <h2 className="text-lg font-semibold text-slate-950">Automated and calculated lines</h2>
                    </div>
                    <div className="divide-y">
                        {autoLines.map((line) => (
                            <div key={line.key} className="grid grid-cols-[1fr_auto] gap-3 px-4 py-3 text-sm">
                                <div>
                                    <p className="font-medium text-slate-900">{line.label}</p>
                                    <p className="text-xs text-slate-500">
                                        {line.sourceLabel} · synced {new Date(line.lastSyncedAt).toLocaleString()}
                                    </p>
                                    {line.description ? (
                                        <p className="mt-1 text-xs text-slate-500">{line.description}</p>
                                    ) : null}
                                </div>
                                <div className="text-right font-semibold text-slate-900">
                                    {line.key === "cash_runway"
                                        ? line.description ?? "Needs inputs"
                                        : formatMoney(line.amountPaise)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-md border bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-950">Manual lines</h2>
                            <p className="text-xs text-slate-500">
                                Autosaves every 30 seconds and logs every change in the finance audit trail.
                            </p>
                        </div>
                        {!isLocked ? (
                            <Button size="sm" variant="outline" onClick={addManualRow}>
                                Add row
                            </Button>
                        ) : null}
                    </div>
                    <div className="space-y-3 p-4">
                        {draftRows.map((row, index) => (
                            <div key={`${row.id ?? "new"}-${index}`} className="rounded-md border p-3">
                                <div className="grid gap-3">
                                    <select
                                        value={row.lineItem}
                                        disabled={isLocked}
                                        onChange={(event) => {
                                            const value = event.target.value;
                                            setDraftRows((current) =>
                                                current.map((item, itemIndex) =>
                                                    itemIndex === index ? { ...item, lineItem: value } : item
                                                )
                                            );
                                            setHasUnsavedChanges(true);
                                        }}
                                        className="h-10 rounded-md border px-3 text-sm"
                                    >
                                        {manualLineOptions.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                    <Input
                                        value={row.subLabel}
                                        disabled={isLocked}
                                        placeholder="Sub-label"
                                        onChange={(event) => {
                                            const value = event.target.value;
                                            setDraftRows((current) =>
                                                current.map((item, itemIndex) =>
                                                    itemIndex === index ? { ...item, subLabel: value } : item
                                                )
                                            );
                                            setHasUnsavedChanges(true);
                                        }}
                                    />
                                    <Input
                                        value={row.description}
                                        disabled={isLocked}
                                        placeholder="Description"
                                        onChange={(event) => {
                                            const value = event.target.value;
                                            setDraftRows((current) =>
                                                current.map((item, itemIndex) =>
                                                    itemIndex === index ? { ...item, description: value } : item
                                                )
                                            );
                                            setHasUnsavedChanges(true);
                                        }}
                                    />
                                    <Input
                                        type="number"
                                        value={String(row.amountPaise)}
                                        disabled={isLocked}
                                        placeholder="Amount in paise (e.g. 400000 = INR 4,000)"
                                        onChange={(event) => {
                                            const value = Number(event.target.value || 0);
                                            setDraftRows((current) =>
                                                current.map((item, itemIndex) =>
                                                    itemIndex === index ? { ...item, amountPaise: value } : item
                                                )
                                            );
                                            setHasUnsavedChanges(true);
                                        }}
                                    />
                                    <p className="text-xs text-slate-500">
                                        Enter amount in paise. Example: `400` = INR 4.00, `400000` = INR 4,000.00
                                    </p>
                                    <Input
                                        value={row.notes}
                                        disabled={isLocked}
                                        placeholder="Notes"
                                        onChange={(event) => {
                                            const value = event.target.value;
                                            setDraftRows((current) =>
                                                current.map((item, itemIndex) =>
                                                    itemIndex === index ? { ...item, notes: value } : item
                                                )
                                            );
                                            setHasUnsavedChanges(true);
                                        }}
                                    />
                                </div>
                            </div>
                        ))}

                        {!draftRows.length ? <p className="text-sm text-slate-500">No manual rows yet for this month.</p> : null}

                        {!isLocked && draftRows.length ? (
                            <Button
                                disabled={saveEntryMutation.isPending}
                                onClick={async () => {
                                    for (const row of draftRows) {
                                        await saveEntryMutation.mutateAsync({
                                            id: row.id,
                                            monthKey,
                                            lineItem: row.lineItem,
                                            subLabel: row.subLabel || undefined,
                                            description: row.description,
                                            amountPaise: row.amountPaise,
                                            notes: row.notes || undefined,
                                        });
                                    }
                                    setHasUnsavedChanges(false);
                                    await utils.general.financeCompliance.getMonthlyPlDashboard.invalidate({
                                        monthKey,
                                    });
                                }}
                            >
                                {saveEntryMutation.isPending ? "Saving..." : "Save Manual Entries"}
                            </Button>
                        ) : null}
                    </div>
                </div>
            </section>
        </div>
    );
}

function MetricCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md border bg-white p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
        </div>
    );
}
