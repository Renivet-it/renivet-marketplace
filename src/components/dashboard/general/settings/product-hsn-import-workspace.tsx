"use client";

import { Button } from "@/components/ui/button-dash";
import { normalizeHsnImportRows, type HsnImportRow } from "@/lib/product-import/hsn";
import { trpc } from "@/lib/trpc/client";
import Papa from "papaparse";
import { useState } from "react";
import * as XLSX from "xlsx";

const BATCH_SIZE = 500;

export function ProductHsnImportWorkspace() {
    const [rows, setRows] = useState<HsnImportRow[]>([]);
    const [errors, setErrors] = useState<Array<{ row: number; sku: string; code: string; message: string }>>([]);
    const [preview, setPreview] = useState<Array<{ sku: string; hsCode: string; status: string }>>([]);
    const [previewTokens, setPreviewTokens] = useState<string[]>([]);
    const [fileName, setFileName] = useState("");
    const [progress, setProgress] = useState({ completed: 0, total: 0 });
    const [message, setMessage] = useState("");

    const previewMutation = trpc.general.financeCompliance.previewProductHsnImport.useMutation();
    const applyMutation = trpc.general.financeCompliance.applyProductHsnImport.useMutation();

    const parseFile = async (file: File) => {
        setMessage("");
        setPreview([]);
        setPreviewTokens([]);
        setErrors([]);
        setRows([]);
        setFileName(file.name);
        const buffer = await file.arrayBuffer();
        let rawRows: Record<string, unknown>[];
        if (file.name.toLowerCase().endsWith(".csv")) {
            rawRows = Papa.parse<Record<string, unknown>>(new TextDecoder().decode(buffer), {
                header: true,
                skipEmptyLines: true,
            }).data;
        } else {
            const workbook = XLSX.read(buffer, { type: "array" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
        }
        const result = normalizeHsnImportRows(rawRows);
        setRows(result.rows);
        setErrors(result.errors);
        if (!result.rows.length) {
            setMessage("No valid HSN rows found.");
            return;
        }
        const previews: Array<{ sku: string; hsCode: string; status: string }> = [];
        const tokens: string[] = [];
        for (let index = 0; index < result.rows.length; index += BATCH_SIZE) {
            const batch = result.rows.slice(index, index + BATCH_SIZE);
            const response = await previewMutation.mutateAsync({ rows: batch });
            previews.push(...response.rows.map((row) => ({ sku: row.sku, hsCode: row.hsCode, status: row.status })));
            tokens.push(response.previewToken);
        }
        setPreview(previews);
        setPreviewTokens(tokens);
        setMessage("Preview ready. No products have been changed.");
    };

    const applyImport = async () => {
        if (!rows.length || !window.confirm("Apply these HSN updates to the catalog?")) return;
        setProgress({ completed: 0, total: rows.length });
        setMessage("");
        let updated = 0;
        let unchanged = 0;
        let unmatched = 0;
        let ambiguous = 0;
        let failed = 0;
        for (let index = 0; index < rows.length; index += BATCH_SIZE) {
            const batch = rows.slice(index, index + BATCH_SIZE);
            try {
                const response = await applyMutation.mutateAsync({ rows: batch, previewToken: previewTokens[index / BATCH_SIZE] });
                updated += response.updated;
                unchanged += response.unchanged;
                unmatched += response.unmatched;
                ambiguous += response.ambiguous;
            } catch {
                failed += batch.length;
                setErrors((current) => [...current, ...batch.map((row, rowIndex) => ({ row: index + rowIndex + 2, sku: row.sku, code: "apply_failed", message: "Batch failed; no update was applied for this row" }))]);
            }
            setProgress({ completed: Math.min(index + batch.length, rows.length), total: rows.length });
        }
        const skipped = errors.filter((error) => error.code === "blank_hsn").length;
        setMessage(`Completed: ${updated} updated, ${unchanged} unchanged, ${unmatched} unmatched, ${ambiguous} ambiguous, ${skipped} skipped, ${failed} failed.`);
    };

    const validPreviewCount = preview.filter((row) => row.status === "product" || row.status === "variant").length;
    const hasBlockingErrors = errors.some((error) => error.code !== "blank_hsn");

    const downloadErrors = () => {
        const csv = ["row,sku,code,message", ...errors.map((error) => [error.row, error.sku, error.code, error.message].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))].join("\n");
        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = "product-hsn-import-errors.csv";
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <main className="min-h-screen bg-slate-50/80 p-4 sm:p-6">
            <div className="mx-auto max-w-5xl space-y-4">
                <section className="rounded-md border bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Catalog maintenance</p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-950">Product HSN Import</h1>
                    <p className="mt-2 text-sm text-slate-600">Upload a CSV or Excel file containing SKU and HS Code/HSN Code. Blank HSN values are skipped; duplicate and ambiguous SKUs are reported as errors.</p>
                    <input className="mt-5 block w-full rounded-md border bg-white p-3 text-sm" type="file" accept=".csv,.xlsx,.xls" onChange={(event) => { const file = event.target.files?.[0]; if (file) void parseFile(file); }} />
                    {fileName ? <p className="mt-2 text-xs text-slate-500">Selected: {fileName}</p> : null}
                </section>

                {message ? <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div> : null}

                <section className="rounded-md border bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="font-semibold text-slate-900">Preview</h2>
                            <p className="text-sm text-slate-600">{validPreviewCount} matched rows, {errors.length} input errors.</p>
                        </div>
                        <Button disabled={!preview.length || hasBlockingErrors || applyMutation.isPending || previewMutation.isPending} onClick={() => void applyImport()}>
                            {applyMutation.isPending ? "Applying..." : "Apply HSN Updates"}
                        </Button>
                    </div>
                    {progress.total ? <div className="mt-4"><div className="h-2 overflow-hidden rounded bg-slate-200"><div className="h-full bg-emerald-600 transition-all" style={{ width: `${(progress.completed / progress.total) * 100}%` }} /></div><p className="mt-1 text-xs text-slate-600">Processed {progress.completed} of {progress.total}</p></div> : null}
                    {errors.length ? <div className="mt-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><div className="flex items-center justify-between gap-3"><p>{errors.length} input errors</p><Button variant="outline" size="sm" onClick={downloadErrors}>Download errors</Button></div><div className="mt-2 max-h-48 overflow-auto">{errors.slice(0, 50).map((error) => <p key={`${error.row}-${error.sku}`}>Row {error.row}: {error.sku || "(missing SKU)"} — {error.message}</p>)}</div></div> : null}
                    {preview.length ? <div className="mt-4 max-h-64 overflow-auto rounded border"><table className="w-full text-left text-sm"><thead className="sticky top-0 bg-slate-100"><tr><th className="p-2">SKU</th><th className="p-2">HSN</th><th className="p-2">Result</th></tr></thead><tbody>{preview.slice(0, 100).map((row) => <tr key={row.sku} className="border-t"><td className="p-2">{row.sku}</td><td className="p-2">{row.hsCode}</td><td className="p-2">{row.status}</td></tr>)}</tbody></table></div> : null}
                </section>
            </div>
        </main>
    );
}
