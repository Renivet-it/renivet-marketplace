"use client";

import * as XLSX from "xlsx";
import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";

type Row = { sku: string; discount: number };
type PreviewRow = {
    rowNumber: number; sku: string; discount: number; targetType: "product" | "variant" | null;
    targetId: string | null; title: string | null; currentPrice: number | null;
    compareAtPrice: number | null; discountedPrice: number | null; status: string;
};

export function ProductDiscountsWorkspace({ canManage }: { canManage: boolean }) {
    const [preview, setPreview] = useState<PreviewRow[]>([]);
    const [fileName, setFileName] = useState("");
    const previewMutation = trpc.general.financeCompliance.previewProductDiscounts.useMutation({ onError: (e) => toast.error(e.message) });
    const applyMutation = trpc.general.financeCompliance.applyProductDiscounts.useMutation({ onSuccess: (result) => toast.success(`${result.updated} products updated; ${result.stale} stale rows skipped`), onError: (e) => toast.error(e.message) });

    const parseFile = async (file: File) => {
        setFileName(file.name);
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array", cellFormula: false, cellNF: false, cellText: true });
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
        const normalized = rows.map((raw) => {
            const keys = Object.keys(raw);
            const skuKey = keys.find((key) => /unique product code|sku|product code/i.test(key));
            const discountKey = keys.find((key) => /discount/i.test(key));
            const value = Number(String(raw[discountKey ?? ""]).replace("%", ""));
            return { sku: String(raw[skuKey ?? ""] ?? "").trim(), discount: value > 1 ? value / 100 : value };
        }).filter((row) => row.sku && Number.isFinite(row.discount));
        const result = await previewMutation.mutateAsync({ rows: normalized });
        setPreview(result);
    };

    const ready = preview.filter((row) => row.status === "ready");
    return <main className="min-h-screen bg-slate-50/80 p-4 sm:p-6"><div className="mx-auto max-w-7xl space-y-4">
        <header className="rounded-md border bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Platform Settings</p><h1 className="mt-2 text-2xl font-semibold">Product Discounts</h1><p className="mt-2 text-sm text-slate-600">Upload a CSV/XLSX file, review every matched product or variant, then apply approved price changes.</p></header>
        <section className="rounded-md border bg-white p-5 shadow-sm"><input type="file" accept=".csv,.xlsx,.xls" disabled={!canManage || previewMutation.isPending} onChange={(event) => { const file = event.target.files?.[0]; if (file) void parseFile(file); }} /><span className="ml-3 text-sm text-slate-500">{fileName || "No file selected"}</span></section>
        {preview.length > 0 && <section className="rounded-md border bg-white p-5 shadow-sm"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div className="flex gap-2 text-sm"><span className="rounded bg-emerald-100 px-2 py-1">Ready: {ready.length}</span><span className="rounded bg-red-100 px-2 py-1">Blocked: {preview.length - ready.length}</span></div><button className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50" disabled={!canManage || !ready.length || applyMutation.isPending} onClick={() => applyMutation.mutate({ rows: ready.map((row) => ({ targetType: row.targetType!, targetId: row.targetId!, currentPrice: row.currentPrice!, discountedPrice: row.discountedPrice!, compareAtPrice: row.compareAtPrice })) })}>Apply {ready.length} discounts</button></div><div className="max-h-[560px] overflow-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="p-2">SKU</th><th className="p-2">Target</th><th className="p-2">Current</th><th className="p-2">Discount</th><th className="p-2">New price</th><th className="p-2">Status</th></tr></thead><tbody>{preview.map((row) => <tr key={`${row.rowNumber}-${row.sku}`} className="border-b"><td className="p-2">{row.sku}</td><td className="p-2">{row.title ?? "—"} <span className="text-xs text-slate-500">{row.targetType ?? ""}</span></td><td className="p-2">{row.currentPrice ?? "—"}</td><td className="p-2">{Math.round(row.discount * 100)}%</td><td className="p-2">{row.discountedPrice ?? "—"}</td><td className="p-2">{row.status}</td></tr>)}</tbody></table></div></section>}
    </div></main>;
}
