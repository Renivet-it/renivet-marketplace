"use client";

import { Button } from "@/components/ui/button-dash";
import { Input } from "@/components/ui/input-dash";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea-dash";
import { trpc } from "@/lib/trpc/client";
import { handleClientError } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export type HsnMasterRow = {
    id: string;
    hsnCode: string;
    description: string;
    gstRateBps: number;
    categoryLabel?: string | null;
    isActive: boolean;
};

const HSN_IMPORT_TEMPLATE = [
    "hsn_code,description,gst_rate,category_hint,is_active",
    "61091000,Cotton T-shirts knitted or crocheted,5,apparel,true",
    "42022220,Handbags and totes,18,bags,true",
].join("\n");

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

export function HsnMasterWorkspace({
    initialHsnRows,
    intro,
}: {
    initialHsnRows: HsnMasterRow[];
    intro?: React.ReactNode;
}) {
    const utils = trpc.useUtils();
    const searchParams = useSearchParams();
    const [importText, setImportText] = useState("");
    const [importFileName, setImportFileName] = useState("");
    const [manualRow, setManualRow] = useState({
        hsnCode: "",
        description: "",
        gstRatePercent: "",
        categoryLabel: "",
    });
    const [coveragePage, setCoveragePage] = useState(1);
    const requestedHsnCode = searchParams.get("hsn")?.trim() ?? "";
    const pageSize = 6;

    const hsnQuery = trpc.general.financeCompliance.listHsnMaster.useQuery();

    const refresh = async () => {
        await utils.general.financeCompliance.listHsnMaster.invalidate();
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

    const hsnRows = hsnQuery.data ?? initialHsnRows;
    const summary = useMemo(
        () => ({
            activeHsn: hsnRows.filter((row) => row.isActive).length,
            totalHsn: hsnRows.length,
            categories: new Set(
                hsnRows.map((row) => row.categoryLabel?.trim()).filter((value): value is string => Boolean(value))
            ).size,
        }),
        [hsnRows]
    );
    const totalCoveragePages = Math.max(1, Math.ceil(hsnRows.length / pageSize));
    const paginatedCoverageRows = useMemo(() => {
        const startIndex = (coveragePage - 1) * pageSize;
        return hsnRows.slice(startIndex, startIndex + pageSize);
    }, [coveragePage, hsnRows]);
    const coverageStart = hsnRows.length === 0 ? 0 : (coveragePage - 1) * pageSize + 1;
    const coverageEnd = Math.min(coveragePage * pageSize, hsnRows.length);

    useEffect(() => {
        if (!requestedHsnCode) {
            return;
        }

        setManualRow((current) =>
            current.hsnCode === requestedHsnCode
                ? current
                : {
                      ...current,
                      hsnCode: requestedHsnCode,
                  }
        );
    }, [requestedHsnCode]);

    useEffect(() => {
        setCoveragePage((current) => Math.min(current, Math.max(1, Math.ceil(hsnRows.length / pageSize))));
    }, [hsnRows.length]);

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

    const importRows = async (csvText: string) => {
        const rows = parseHsnCsv(csvText);
        if (!rows.length) {
            toast.error("Upload a valid CSV file first");
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
        setImportFileName("");
    };

    const loadTemplate = () => {
        setImportText(HSN_IMPORT_TEMPLATE);
        setImportFileName("hsn-master-template.csv");
        toast.success("CSV template loaded");
    };

    const downloadTemplate = () => {
        const blob = new Blob([HSN_IMPORT_TEMPLATE], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "hsn-master-template.csv";
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        if (!file.name.toLowerCase().endsWith(".csv")) {
            toast.error("Please choose a CSV file");
            return;
        }

        const fileText = await file.text();
        setImportText(fileText);
        setImportFileName(file.name);
        toast.success(`${file.name} ready to import`);
    };

    return (
        <div className="space-y-6">
            {intro ? (
                <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
                    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_35%),linear-gradient(135deg,_rgba(255,255,255,1),_rgba(248,250,252,0.96))] px-6 py-7 sm:px-8">
                        {intro}
                    </div>
                </section>
            ) : null}

            <section className="grid gap-4 md:grid-cols-3">
                <StatCard
                    label="Active HSN Rows"
                    value={String(summary.activeHsn)}
                    helper="Available for tax mapping and billing usage"
                />
                <StatCard
                    label="Total HSN Rows"
                    value={String(summary.totalHsn)}
                    helper="All records currently stored in the master"
                />
                <StatCard
                    label="Category Buckets"
                    value={String(summary.categories)}
                    helper="Distinct category hints defined for reporting"
                />
            </section>

            <section className="grid gap-5 xl:grid-cols-[1fr_1.08fr]">
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h3 className="text-xl font-semibold text-slate-950">HSN editor</h3>
                            <p className="mt-1 text-sm text-slate-600">
                                Add a new HSN entry with its GST rate so finance and billing use the same tax master.
                            </p>
                        </div>
                        {requestedHsnCode ? (
                            <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                                Prefilled from GST issue
                            </div>
                        ) : null}
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <FieldShell label="HSN code" hint="8-digit code used for GST classification">
                            <Input
                                placeholder="Eg 61091000"
                                value={manualRow.hsnCode}
                                onChange={(event) =>
                                    setManualRow((current) => ({
                                        ...current,
                                        hsnCode: event.target.value,
                                    }))
                                }
                            />
                        </FieldShell>
                        <FieldShell label="GST rate" hint="Enter the overall GST percent">
                            <Input
                                placeholder="Eg 5, 12 or 18"
                                value={manualRow.gstRatePercent}
                                onChange={(event) =>
                                    setManualRow((current) => ({
                                        ...current,
                                        gstRatePercent: event.target.value,
                                    }))
                                }
                            />
                        </FieldShell>
                        <FieldShell
                            label="Description"
                            hint="Used in finance review and export context"
                            className="sm:col-span-2"
                        >
                            <Input
                                placeholder="Describe the goods covered by this HSN"
                                value={manualRow.description}
                                onChange={(event) =>
                                    setManualRow((current) => ({
                                        ...current,
                                        description: event.target.value,
                                    }))
                                }
                            />
                        </FieldShell>
                        <FieldShell
                            label="Category hint"
                            hint="Optional grouping label like apparel or books"
                            className="sm:col-span-2"
                        >
                            <Input
                                placeholder="Eg apparel"
                                value={manualRow.categoryLabel}
                                onChange={(event) =>
                                    setManualRow((current) => ({
                                        ...current,
                                        categoryLabel: event.target.value,
                                    }))
                                }
                            />
                        </FieldShell>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-sm text-slate-600">
                            Save the HSN row once the code, description, and GST rate are filled.
                        </p>
                        <Button onClick={submitManualRow} disabled={upsertHsn.isPending}>
                            {upsertHsn.isPending ? "Saving..." : "Save HSN Row"}
                        </Button>
                    </div>

                    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">One-time CSV import</p>
                                <p className="mt-1 text-sm text-slate-600">
                                    Download the template, fill your rows in Excel, then upload the CSV file here.
                                </p>
                            </div>
                            <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 shadow-sm">
                                Bulk upload
                            </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}>
                                Download template
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={loadTemplate}>
                                Preview sample template
                            </Button>
                        </div>
                        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white/80 p-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                Expected columns
                            </p>
                            <p className="mt-2 break-all font-mono text-xs text-slate-600">
                                hsn_code,description,gst_rate,category_hint,is_active
                            </p>
                        </div>
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Upload CSV file</p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Only `.csv` files following the template format are supported.
                                    </p>
                                </div>
                                <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
                                    Choose CSV file
                                    <input
                                        type="file"
                                        accept=".csv,text/csv"
                                        className="hidden"
                                        onChange={(event) => void handleFileUpload(event)}
                                    />
                                </label>
                            </div>
                            <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                    Selected file
                                </p>
                                <p className="mt-2 text-sm text-slate-700">
                                    {importFileName || "No file selected yet"}
                                </p>
                            </div>
                        </div>
                        {importText ? (
                            <div className="mt-4 rounded-xl border border-slate-200 bg-white/80 p-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                    Template preview
                                </p>
                                <Textarea
                                    className="mt-3 min-h-32 border-slate-200 bg-white"
                                    value={importText}
                                    onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                                        setImportText(event.target.value)
                                    }
                                />
                            </div>
                        ) : null}
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                            <p className="text-xs text-slate-500">
                                Download, fill, upload, and then run import.
                            </p>
                            <Button variant="outline" onClick={() => void importRows(importText)} disabled={!importText}>
                                Import CSV Rows
                            </Button>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h3 className="text-xl font-semibold text-slate-950">HSN coverage</h3>
                            <p className="mt-1 text-sm text-slate-600">
                                Quick view of the currently configured HSN codes, GST rates, and category hints.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-right">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                Showing
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-950">
                                {coverageStart}-{coverageEnd} of {hsnRows.length} rows
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                        <Table className="min-w-full">
                            <TableHeader className="bg-slate-50">
                                <TableRow className="hover:bg-slate-50">
                                    <TableHead className="w-[22%] text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                        HSN Code
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                        Description
                                    </TableHead>
                                    <TableHead className="w-[16%] text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                        GST Rate
                                    </TableHead>
                                    <TableHead className="w-[18%] text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                        Category
                                    </TableHead>
                                    <TableHead className="w-[14%] text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                        Status
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedCoverageRows.length === 0 ? (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={5} className="py-10 text-center text-sm text-slate-500">
                                            No HSN rows available yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedCoverageRows.map((row) => (
                                        <TableRow key={row.id} className="hover:bg-slate-50/80">
                                            <TableCell className="font-semibold text-slate-950">
                                                {row.hsnCode}
                                            </TableCell>
                                            <TableCell>
                                                <p className="line-clamp-2 max-w-[26rem] leading-6 text-slate-600">
                                                    {row.description}
                                                </p>
                                            </TableCell>
                                            <TableCell className="font-semibold text-slate-950">
                                                {(row.gstRateBps / 100).toFixed(2)}%
                                            </TableCell>
                                            <TableCell>
                                                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                                                    {row.categoryLabel ?? "Unassigned"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                                                        row.isActive
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : "bg-slate-200 text-slate-600"
                                                    }`}
                                                >
                                                    {row.isActive ? "Active" : "Inactive"}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-600">
                            Page {totalCoveragePages === 0 ? 0 : coveragePage} of {totalCoveragePages}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCoveragePage((current) => Math.max(1, current - 1))}
                                disabled={coveragePage === 1}
                            >
                                <ChevronLeft className="mr-1 size-4" />
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setCoveragePage((current) => Math.min(totalCoveragePages, current + 1))
                                }
                                disabled={coveragePage === totalCoveragePages || hsnRows.length === 0}
                            >
                                Next
                                <ChevronRight className="ml-1 size-4" />
                            </Button>
                        </div>
                    </div>
                </section>
            </section>
        </div>
    );
}

function StatCard({ label, value, helper }: { label: string; value: string; helper: string }) {
    return (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
            <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{helper}</p>
            </div>
        </div>
    );
}

function FieldShell({
    label,
    hint,
    className,
    children,
}: {
    label: string;
    hint: string;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={className}>
            <div className="mb-2 flex items-center justify-between gap-3">
                <label className="text-sm font-semibold text-slate-900">{label}</label>
                <span className="text-xs text-slate-500">{hint}</span>
            </div>
            {children}
        </div>
    );
}
