"use client";

import { Button } from "@/components/ui/button-dash";
import { Input } from "@/components/ui/input-dash";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select-general";
import { Textarea } from "@/components/ui/textarea-dash";
import { trpc } from "@/lib/trpc/client";
import { formatINR, handleClientError } from "@/lib/utils";
import { useUploadThing } from "@/lib/uploadthing";
import type React from "react";
import { useDeferredValue, useMemo, useState } from "react";
import { toast } from "sonner";

type CodRow = {
    id: string;
    orderId?: string | null;
    awbNumber?: string | null;
    carrier: string;
    codAmountPaise?: number | null;
    expectedRemittancePaise?: number | null;
    remittedAmountPaise?: number | null;
    discrepancyAmountPaise?: number | null;
    ageingDays: number;
    status: string;
    remittanceReference?: string | null;
    notes?: string | null;
    proofFileUrl?: string | null;
    metadata?: Record<string, unknown> | null;
    run?: {
        id: string;
    } | null;
};

type CodRun = {
    id: string;
    runType: string;
    status: string;
    recordsSynced?: number | null;
    matchedCount?: number | null;
    pendingCount?: number | null;
    discrepancyCount?: number | null;
    startedAt: Date | string;
};

type FeeSchedule = {
    id: string;
    carrier: string;
    feePercentBps?: number | null;
    feeFlatPaise?: number | null;
    effectiveFrom?: string | null;
};

const statusOptions = [
    "all",
    "pending",
    "matched",
    "discrepancy",
    "overdue",
    "critical",
    "ghost",
    "written_off",
] as const;

export function CodReconciliationWorkspace({
    initialItems,
    initialRuns,
    initialFeeSchedules,
}: {
    initialItems: CodRow[];
    initialRuns: CodRun[];
    initialFeeSchedules: FeeSchedule[];
}) {
    const utils = trpc.useUtils();
    const [status, setStatus] = useState<(typeof statusOptions)[number]>("all");
    const [search, setSearch] = useState("");
    const [attentionOnly, setAttentionOnly] = useState(false);
    const [actionNotes, setActionNotes] = useState<Record<string, string>>({});
    const [proofFiles, setProofFiles] = useState<Record<string, File[]>>({});
    const deferredSearch = useDeferredValue(search);
    const { startUpload } = useUploadThing("financeProofUploader");

    const codQuery = trpc.general.financeCompliance.listCodReconciliation.useQuery(
        {
            status: status === "all" ? undefined : status,
            q: deferredSearch || undefined,
            attentionOnly,
        },
        {
            initialData: {
                items: initialItems,
                runs: initialRuns,
            },
        }
    );
    const feeSchedulesQuery = trpc.general.financeCompliance.listCarrierFeeSchedules.useQuery(
        undefined,
        {
            initialData: initialFeeSchedules,
        }
    );

    const rows = codQuery.data?.items ?? initialItems;
    const runs = codQuery.data?.runs ?? initialRuns;
    const feeSchedules = feeSchedulesQuery.data ?? initialFeeSchedules;

    const refresh = async () => {
        await utils.general.financeCompliance.listCodReconciliation.invalidate();
        await utils.general.financeCompliance.listCarrierFeeSchedules.invalidate();
    };

    const feeSync = trpc.general.financeCompliance.runCodFeeSync.useMutation({
        onSuccess: async () => {
            toast.success("COD fee sync completed");
            await refresh();
        },
        onError: handleClientError,
    });

    const remittanceSync = trpc.general.financeCompliance.runCodRemittanceSync.useMutation({
        onSuccess: async () => {
            toast.success("COD remittance sync completed");
            await refresh();
        },
        onError: handleClientError,
    });

    const resolveRow = trpc.general.financeCompliance.resolveCodRow.useMutation({
        onSuccess: async (_, variables) => {
            toast.success(`Row moved to ${variables.status}`);
            await refresh();
        },
        onError: handleClientError,
    });

    const writeOff = trpc.general.financeCompliance.writeOffCodRow.useMutation({
        onSuccess: async () => {
            toast.success("Write-off recorded");
            await refresh();
        },
        onError: handleClientError,
    });

    const summary = useMemo(() => {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const monthRows = rows.filter((row) => {
            const deliveryDate = row.metadata?.deliveryDate;
            return typeof deliveryDate === "string"
                ? deliveryDate.startsWith(currentMonth)
                : true;
        });

        return {
            totalExpected: monthRows.reduce(
                (sum, row) => sum + (row.expectedRemittancePaise ?? row.codAmountPaise ?? 0),
                0
            ),
            totalReceived: monthRows.reduce(
                (sum, row) => sum + (row.remittedAmountPaise ?? 0),
                0
            ),
            pending: monthRows.filter((row) => row.status === "pending").length,
            overdue: monthRows.filter((row) => row.status === "overdue").length,
            discrepancies: monthRows.filter((row) => row.status === "discrepancy").length,
            writtenOff: monthRows.filter((row) => row.status === "written_off").length,
        };
    }, [rows]);

    const exportUrl = `/api/finance/cod-reconciliation/export?${new URLSearchParams({
        ...(status !== "all" ? { status } : {}),
        ...(search ? { q: search } : {}),
        ...(attentionOnly ? { attentionOnly: "true" } : {}),
    }).toString()}`;

    const handleProofChange = (rowId: string, event: React.ChangeEvent<HTMLInputElement>) => {
        setProofFiles((current) => ({
            ...current,
            [rowId]: Array.from(event.target.files ?? []).slice(0, 1),
        }));
    };

    const triggerWriteOff = async (rowId: string) => {
        const note = actionNotes[rowId]?.trim();
        const files = proofFiles[rowId] ?? [];
        if (!note) {
            toast.error("Write-off reason is required");
            return;
        }
        if (!files.length) {
            toast.error("Proof upload is required");
            return;
        }

        const uploaded = await startUpload(files);
        const proofFileUrl = uploaded?.[0]?.url;
        if (!proofFileUrl) {
            toast.error("Proof upload failed");
            return;
        }

        writeOff.mutate({
            id: rowId,
            reason: note,
            proofFileUrl,
            notes: note,
        });
    };

    return (
        <div className="space-y-4">
            <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
                <SummaryCard label="Expected" value={formatINR(summary.totalExpected)} />
                <SummaryCard label="Received" value={formatINR(summary.totalReceived)} />
                <SummaryCard label="Pending" value={String(summary.pending)} />
                <SummaryCard label="Overdue" value={String(summary.overdue)} />
                <SummaryCard label="Discrepancies" value={String(summary.discrepancies)} />
                <SummaryCard label="Written Off" value={String(summary.writtenOff)} />
            </section>

            <section className="rounded-md border bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Controls
                        </p>
                        <h2 className="mt-2 text-xl font-semibold text-slate-950">
                            Daily sync, Thursday review, and carrier export
                        </h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => feeSync.mutate()} disabled={feeSync.isPending}>
                            {feeSync.isPending ? "Syncing fees..." : "Run Fee Sync"}
                        </Button>
                        <Button onClick={() => remittanceSync.mutate()} disabled={remittanceSync.isPending}>
                            {remittanceSync.isPending ? "Syncing remittances..." : "Run Remittance Sync"}
                        </Button>
                        <a href={exportUrl}>
                            <Button variant="secondary">Export CSV</Button>
                        </a>
                    </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)_200px]">
                    <Select value={status} onValueChange={(value) => setStatus(value as (typeof statusOptions)[number])}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            {statusOptions.map((option) => (
                                <SelectItem key={option} value={option}>
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Input
                        placeholder="Search by order id, AWB, or carrier"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                    <Button
                        variant={attentionOnly ? "default" : "outline"}
                        onClick={() => setAttentionOnly((current) => !current)}
                    >
                        {attentionOnly ? "Thursday Review On" : "Thursday Review"}
                    </Button>
                </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.5fr)]">
                <div className="space-y-4">
                    {rows.length === 0 ? (
                        <div className="rounded-md border bg-white p-8 text-sm text-slate-500 shadow-sm">
                            No COD reconciliation rows yet.
                        </div>
                    ) : (
                        rows.map((row) => {
                            const note = actionNotes[row.id] ?? "";
                            const proofFile = proofFiles[row.id]?.[0];
                            return (
                                <article key={row.id} className="rounded-md border bg-white p-5 shadow-sm">
                                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap gap-2">
                                                <Badge tone="slate">{row.orderId ?? "Ghost row"}</Badge>
                                                <Badge tone="blue">{row.awbNumber ?? "No AWB"}</Badge>
                                                <Badge tone="emerald">{row.carrier}</Badge>
                                                <Badge tone="amber">{row.status}</Badge>
                                            </div>
                                            <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                                                <p>Expected: {formatINR(row.expectedRemittancePaise ?? row.codAmountPaise ?? 0)}</p>
                                                <p>Received: {formatINR(row.remittedAmountPaise ?? 0)}</p>
                                                <p>Diff: {formatINR(row.discrepancyAmountPaise ?? 0)}</p>
                                                <p>Age: {row.ageingDays} days</p>
                                                <p>Reference: {row.remittanceReference ?? "-"}</p>
                                                <p>Proof: {row.proofFileUrl ? "Attached" : "Not attached"}</p>
                                            </div>
                                        </div>

                                        <div className="w-full max-w-sm rounded-md border border-slate-200 bg-slate-50 p-4">
                                            <Textarea
                                                minRows={3}
                                                placeholder="Resolution or write-off note"
                                                value={note}
                                                onChange={(event) =>
                                                    setActionNotes((current) => ({
                                                        ...current,
                                                        [row.id]: event.target.value,
                                                    }))
                                                }
                                            />
                                            <Input
                                                className="mt-3"
                                                type="file"
                                                accept="image/png,image/jpeg,application/pdf"
                                                onChange={(event) => handleProofChange(row.id, event)}
                                            />
                                            {proofFile ? (
                                                <p className="mt-2 text-xs text-slate-500">{proofFile.name}</p>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                resolveRow.mutate({
                                                    id: row.id,
                                                    status: "matched",
                                                    notes: note || undefined,
                                                })
                                            }
                                            disabled={resolveRow.isPending}
                                        >
                                            Mark Matched
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                resolveRow.mutate({
                                                    id: row.id,
                                                    status: "discrepancy",
                                                    notes: note || undefined,
                                                })
                                            }
                                            disabled={resolveRow.isPending}
                                        >
                                            Mark Discrepancy
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                resolveRow.mutate({
                                                    id: row.id,
                                                    status: "overdue",
                                                    notes: note || undefined,
                                                })
                                            }
                                            disabled={resolveRow.isPending}
                                        >
                                            Mark Overdue
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            onClick={() => void triggerWriteOff(row.id)}
                                            disabled={writeOff.isPending}
                                        >
                                            Write Off
                                        </Button>
                                        {row.proofFileUrl ? (
                                            <a href={row.proofFileUrl} target="_blank" rel="noreferrer">
                                                <Button variant="secondary">View Proof</Button>
                                            </a>
                                        ) : null}
                                    </div>
                                </article>
                            );
                        })
                    )}
                </div>

                <aside className="space-y-4">
                    <section className="rounded-md border bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Run history
                        </p>
                        <div className="mt-4 space-y-3">
                            {runs.length === 0 ? (
                                <p className="text-sm text-slate-500">No sync runs yet.</p>
                            ) : (
                                runs.slice(0, 10).map((run) => (
                                    <div key={run.id} className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                                        <p className="font-medium text-slate-900">
                                            {run.runType} • {run.status}
                                        </p>
                                        <p className="mt-1">
                                            Synced {run.recordsSynced ?? 0} • matched {run.matchedCount ?? 0} • pending {run.pendingCount ?? 0}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {new Date(run.startedAt).toLocaleString("en-IN")}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    <section className="rounded-md border bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Fee schedules
                        </p>
                        <div className="mt-4 space-y-3">
                            {feeSchedules.length === 0 ? (
                                <p className="text-sm text-slate-500">No fee schedules synced yet.</p>
                            ) : (
                                feeSchedules.slice(0, 6).map((fee) => (
                                    <div key={fee.id} className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                                        <p className="font-medium text-slate-900">{fee.carrier}</p>
                                        <p className="mt-1">
                                            Rate {(fee.feePercentBps ?? 0) / 100}% • Flat {formatINR(fee.feeFlatPaise ?? 0)}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Effective {fee.effectiveFrom ?? "-"}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </aside>
            </section>
        </div>
    );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md border bg-white p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
        </div>
    );
}

function Badge({ children, tone }: { children: React.ReactNode; tone: "slate" | "blue" | "emerald" | "amber" }) {
    const className =
        tone === "blue"
            ? "bg-blue-50 text-blue-700"
            : tone === "emerald"
              ? "bg-emerald-50 text-emerald-700"
              : tone === "amber"
                ? "bg-amber-50 text-amber-700"
                : "bg-slate-100 text-slate-700";

    return (
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${className}`}>
            {children}
        </span>
    );
}
