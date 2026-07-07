"use client";

import { Button } from "@/components/ui/button-dash";
import { Input } from "@/components/ui/input-dash";
import { Textarea } from "@/components/ui/textarea-dash";
import { trpc } from "@/lib/trpc/client";
import { formatINR, handleClientError } from "@/lib/utils";
import type React from "react";
import { useDeferredValue, useMemo, useState } from "react";
import { toast } from "sonner";

type HsnRow = {
    id: string;
    hsnCode: string;
    description: string;
    gstRateBps: number;
    categoryLabel?: string | null;
    isActive: boolean;
};

type ReportRun = {
    id: string;
    monthKey: string;
    status: string;
    recordCount: number;
    createdAt: Date | string;
};

type ValidationIssue = {
    severity: "error" | "warning";
    code: string;
    message: string;
    entityType: string;
    entityId: string;
};

type GstPreview = {
    monthKey: string;
    validationIssues: ValidationIssue[];
    totals: {
        totalInvoices: number;
        totalTaxableValuePaise: number;
        totalCgstPaise: number;
        totalSgstPaise: number;
        totalIgstPaise: number;
        totalCreditNotePaise: number;
        totalTcsPaise: number;
        rowCount: number;
    };
    rows: Array<Record<string, unknown>>;
    isReady: boolean;
};

function parseHsnCsv(text: string) {
    const [headerLine, ...body] = text.trim().split(/\r?\n/);
    const headers = headerLine.split(",").map((value) => value.trim().toLowerCase());
    return body
        .map((line) => line.split(",").map((value) => value.trim()))
        .filter((cells) => cells.some(Boolean))
        .map((cells) => {
            const row = Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
            const ratePercent = Number(row.gst_rate ?? row.gst_rate_percent ?? row.gst_percent ?? "0");
            return {
                hsnCode: row.hsn_code ?? row.hsn ?? "",
                description: row.description ?? "",
                gstRateBps: Math.round(ratePercent * 100),
                categoryLabel: row.category_hint ?? row.category_label ?? "",
                isActive: (row.is_active ?? "true").toLowerCase() !== "false",
            };
        });
}

export function GstReportWorkspace({
    initialMonthKey,
    initialHsnRows,
    initialReportRuns,
    initialPreview,
}: {
    initialMonthKey: string;
    initialHsnRows: HsnRow[];
    initialReportRuns: ReportRun[];
    initialPreview: GstPreview;
}) {
    const utils = trpc.useUtils();
    const [monthKey, setMonthKey] = useState(initialMonthKey);
    const [importText, setImportText] = useState("");
    const [manualRow, setManualRow] = useState({
        hsnCode: "",
        description: "",
        gstRatePercent: "",
        categoryLabel: "",
    });
    const deferredMonthKey = useDeferredValue(monthKey);

    const hsnQuery = trpc.general.financeCompliance.listHsnMaster.useQuery(undefined, {
        initialData: initialHsnRows,
    });
    const runsQuery = trpc.general.financeCompliance.listGstReportRuns.useQuery(undefined, {
        initialData: initialReportRuns,
    });
    const previewQuery = trpc.general.financeCompliance.previewGstExport.useQuery(
        { monthKey: deferredMonthKey },
        {
            initialData: initialPreview,
        }
    );

    const refresh = async () => {
        await utils.general.financeCompliance.listHsnMaster.invalidate();
        await utils.general.financeCompliance.listGstReportRuns.invalidate();
        await utils.general.financeCompliance.previewGstExport.invalidate({
            monthKey,
        });
    };

    const upsertHsn = trpc.general.financeCompliance.upsertHsnMaster.useMutation({
        onSuccess: async () => {
            toast.success("HSN row saved");
            setManualRow({
                hsnCode: "",
                description: "",
                gstRatePercent: "",
                categoryLabel: "",
            });
            await refresh();
        },
        onError: (error) => {
            handleClientError(error);
        },
    });

    const preview = previewQuery.data ?? initialPreview;
    const hsnRows = hsnQuery.data ?? initialHsnRows;
    const reportRuns = runsQuery.data ?? initialReportRuns;

    const summary = useMemo(
        () => ({
            activeHsn: hsnRows.filter((row) => row.isActive).length,
            errors: preview.validationIssues.filter((issue) => issue.severity === "error").length,
            warnings: preview.validationIssues.filter((issue) => issue.severity === "warning").length,
        }),
        [hsnRows, preview.validationIssues]
    );

    const exportUrl = `/api/finance/gst-report/export?month=${monthKey}`;

    const submitManualRow = () => {
        if (!manualRow.hsnCode || !manualRow.description || !manualRow.gstRatePercent) {
            toast.error("HSN code, description, and GST rate are required");
            return;
        }

        upsertHsn.mutate({
            hsnCode: manualRow.hsnCode,
            description: manualRow.description,
            gstRateBps: Math.round(Number(manualRow.gstRatePercent) * 100),
            categoryLabel: manualRow.categoryLabel || undefined,
            isActive: true,
        });
    };

    const importRows = async () => {
        const rows = parseHsnCsv(importText);
        if (!rows.length) {
            toast.error("Paste a valid CSV first");
            return;
        }

        for (const row of rows) {
            if (!row.hsnCode || !row.description) continue;
            await upsertHsn.mutateAsync({
                hsnCode: row.hsnCode,
                description: row.description,
                gstRateBps: row.gstRateBps,
                categoryLabel: row.categoryLabel || undefined,
                isActive: row.isActive,
            });
        }

        toast.success("HSN import completed");
        setImportText("");
    };

    return (
        <div className="space-y-4">
            <section className="grid gap-4 md:grid-cols-3">
                <StatCard label="Active HSN Rows" value={String(summary.activeHsn)} />
                <StatCard label="Pre-flight Errors" value={String(summary.errors)} />
                <StatCard label="Pre-flight Warnings" value={String(summary.warnings)} />
            </section>

            <section className="rounded-md border bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Generate
                        </p>
                        <h2 className="mt-2 text-xl font-semibold text-slate-950">
                            GST and TCS export
                        </h2>
                        <p className="mt-1 text-sm text-slate-600">
                            Preview validation first, then download the RegisterKaro-ready combined CSV.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                                Month
                            </label>
                            <Input
                                type="month"
                                value={monthKey}
                                onChange={(event) => setMonthKey(event.target.value)}
                            />
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => void refresh()}
                            disabled={previewQuery.isFetching}
                        >
                            {previewQuery.isFetching ? "Refreshing..." : "Run Pre-flight"}
                        </Button>
                        <a
                            href={preview.isReady ? exportUrl : undefined}
                            onClick={(event) => {
                                if (!preview.isReady) {
                                    event.preventDefault();
                                    toast.error("Fix validation errors before generating the CSV");
                                }
                            }}
                        >
                            <Button disabled={!preview.isReady}>Generate GST Report</Button>
                        </a>
                    </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                    <MiniStat label="Invoices" value={String(preview.totals.totalInvoices)} />
                    <MiniStat label="Taxable Value" value={formatINR(preview.totals.totalTaxableValuePaise)} />
                    <MiniStat label="CGST" value={formatINR(preview.totals.totalCgstPaise)} />
                    <MiniStat label="SGST" value={formatINR(preview.totals.totalSgstPaise)} />
                    <MiniStat label="IGST" value={formatINR(preview.totals.totalIgstPaise)} />
                    <MiniStat label="TCS" value={formatINR(preview.totals.totalTcsPaise)} />
                </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                <section className="rounded-md border bg-white p-5 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">Pre-flight issues</h3>
                    <div className="mt-4 space-y-3">
                        {preview.validationIssues.length === 0 ? (
                            <p className="text-sm text-emerald-700">No validation issues. Export is ready.</p>
                        ) : (
                            preview.validationIssues.map((issue, index) => (
                                <div
                                    key={`${issue.entityType}-${issue.entityId}-${index}`}
                                    className={`rounded-md border p-3 text-sm ${
                                        issue.severity === "error"
                                            ? "border-rose-200 bg-rose-50"
                                            : "border-amber-200 bg-amber-50"
                                    }`}
                                >
                                    <p className="font-medium text-slate-900">{issue.code}</p>
                                    <p className="mt-1 text-slate-700">{issue.message}</p>
                                    <p className="mt-1 text-xs uppercase text-slate-500">
                                        {issue.entityType} • {issue.entityId}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <section className="rounded-md border bg-white p-5 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">Recent runs</h3>
                    <div className="mt-4 divide-y">
                        {reportRuns.length === 0 ? (
                            <p className="py-3 text-sm text-slate-500">No GST report runs yet.</p>
                        ) : (
                            reportRuns.map((run) => (
                                <div key={run.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                                    <div>
                                        <p className="font-medium text-slate-900">{run.monthKey}</p>
                                        <p className="text-slate-500">{run.status}</p>
                                    </div>
                                    <span className="text-slate-600">{run.recordCount} rows</span>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </section>

            <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                <section className="rounded-md border bg-white p-5 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">HSN editor</h3>
                    <div className="mt-4 space-y-3">
                        <Input
                            placeholder="HSN code"
                            value={manualRow.hsnCode}
                            onChange={(event) =>
                                setManualRow((current) => ({
                                    ...current,
                                    hsnCode: event.target.value,
                                }))
                            }
                        />
                        <Input
                            placeholder="Description"
                            value={manualRow.description}
                            onChange={(event) =>
                                setManualRow((current) => ({
                                    ...current,
                                    description: event.target.value,
                                }))
                            }
                        />
                        <Input
                            placeholder="GST rate percent, eg 5 or 18"
                            value={manualRow.gstRatePercent}
                            onChange={(event) =>
                                setManualRow((current) => ({
                                    ...current,
                                    gstRatePercent: event.target.value,
                                }))
                            }
                        />
                        <Input
                            placeholder="Category hint"
                            value={manualRow.categoryLabel}
                            onChange={(event) =>
                                setManualRow((current) => ({
                                    ...current,
                                    categoryLabel: event.target.value,
                                }))
                            }
                        />
                        <Button onClick={submitManualRow} disabled={upsertHsn.isPending}>
                            {upsertHsn.isPending ? "Saving..." : "Save HSN Row"}
                        </Button>
                    </div>

                    <div className="mt-6">
                        <p className="text-sm font-semibold text-slate-900">One-time CSV import</p>
                        <p className="mt-1 text-sm text-slate-600">
                            Paste CSV with `hsn_code,description,gst_rate,category_hint,is_active`.
                        </p>
                        <Textarea
                            className="mt-3 min-h-40"
                            placeholder="hsn_code,description,gst_rate,category_hint,is_active"
                            value={importText}
                            onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                                setImportText(event.target.value)
                            }
                        />
                        <div className="mt-3 flex gap-2">
                            <Button variant="outline" onClick={() => void importRows()}>
                                Import CSV Rows
                            </Button>
                        </div>
                    </div>
                </section>

                <section className="rounded-md border bg-white p-5 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">HSN coverage</h3>
                    <div className="mt-4 divide-y">
                        {hsnRows.slice(0, 25).map((row) => (
                            <div key={row.id} className="flex items-start justify-between gap-4 py-3 text-sm">
                                <div>
                                    <p className="font-medium text-slate-900">{row.hsnCode}</p>
                                    <p className="text-slate-600">{row.description}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium text-slate-900">
                                        {(row.gstRateBps / 100).toFixed(2)}%
                                    </p>
                                    <p className="text-slate-500">
                                        {row.categoryLabel ?? (row.isActive ? "Active" : "Inactive")}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </section>
        </div>
    );
}

function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md border bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
        </div>
    );
}

function MiniStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md border bg-slate-50 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
        </div>
    );
}
