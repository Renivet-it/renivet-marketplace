"use client";

import { Button } from "@/components/ui/button-dash";
import { DataTable } from "@/components/ui/data-table";
import { DataTableViewOptions } from "@/components/ui/data-table-dash";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-general";
import { Input } from "@/components/ui/input-dash";
import { trpc } from "@/lib/trpc/client";
import { ColumnDef, ColumnFiltersState, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable, VisibilityState } from "@tanstack/react-table";
import { AlertTriangle, History, Pencil, Plus, RefreshCw, ShieldOff } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { buildCommissionRuleMetadata, validateCommissionRuleForm } from "./commission-rule-form";

type RuleRow = {
    rule: {
        id: string;
        ruleName: string;
        brandId: string | null;
        categoryId: string | null;
        productTypeId: string | null;
        commissionPercentBps: number;
        priority: number;
        effectiveFrom: string | Date;
        effectiveTo: string | Date | null;
        isActive: boolean;
        metadata: Record<string, unknown> | null;
        updatedAt: string | Date;
    };
    brandName: string | null;
    categoryName: string | null;
    productTypeName: string | null;
};

type FormValues = {
    ruleName: string;
    brandId: string;
    categoryId: string;
    productTypeId: string;
    commissionPercentBps: string;
    priority: string;
    effectiveFrom: string;
    effectiveTo: string;
    isActive: boolean;
    notes: string;
    sourceStatus: "agreement_version" | "no_source_document_on_file";
    agreementVersionId: string;
    approverName: string;
    provisional: boolean;
    commissionBasis: string;
};

const emptyForm: FormValues = {
    ruleName: "",
    brandId: "",
    categoryId: "",
    productTypeId: "",
    commissionPercentBps: "",
    priority: "0",
    effectiveFrom: new Date().toISOString().slice(0, 10),
    effectiveTo: "",
    isActive: true,
    notes: "",
    sourceStatus: "no_source_document_on_file",
    agreementVersionId: "",
    approverName: "Akshay",
    provisional: true,
    commissionBasis: "net_merchandise_value",
};

function specificity(row: RuleRow) {
    return [row.rule.brandId, row.rule.categoryId, row.rule.productTypeId].filter(Boolean).length;
}

function dateValue(value: string | Date | null) {
    return value ? new Date(value).toLocaleDateString() : "Open-ended";
}

export function CommissionRulesWorkspace({ canManage }: { canManage: boolean }) {
    const utils = trpc.useUtils();
    const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
    const [brandId, setBrandId] = useState("all");
    const [categoryId, setCategoryId] = useState("all");
    const [query, setQuery] = useState("");
    const [sorting, setSorting] = useState<SortingState>([
        { id: "priority", desc: true },
        { id: "specificity", desc: true },
    ]);
    const [visibility, setVisibility] = useState<VisibilityState>({});
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [formOpen, setFormOpen] = useState(false);
    const [form, setForm] = useState<FormValues>(emptyForm);
    const [editing, setEditing] = useState<RuleRow | null>(null);
    const [formError, setFormError] = useState<Record<string, string>>({});
    const [previewError, setPreviewError] = useState<string | null>(null);
    const [deactivateRow, setDeactivateRow] = useState<RuleRow | null>(null);
    const [historyRow, setHistoryRow] = useState<RuleRow | null>(null);

    const rowsQuery = trpc.general.financeCompliance.listCommissionRuleAdminRows.useQuery({
        brandId: brandId === "all" ? undefined : brandId,
        categoryId: categoryId === "all" ? undefined : categoryId,
        isActive: status === "all" ? undefined : status === "active",
    });
    const lookupsQuery = trpc.general.financeCompliance.listCommissionRuleLookups.useQuery();
    const formInput = {
        id: editing?.rule.id,
        ruleName: form.ruleName,
        brandId: form.brandId || undefined,
        categoryId: form.categoryId || undefined,
        productTypeId: form.productTypeId || undefined,
        commissionPercentBps: Number(form.commissionPercentBps || 0),
        priority: Number(form.priority || 0),
        effectiveFrom: form.effectiveFrom,
        effectiveTo: form.effectiveTo || undefined,
    };
    const validForm = Object.keys(validateCommissionRuleForm(form)).length === 0;
    const previewQuery = trpc.general.financeCompliance.previewCommissionRule.useQuery(formInput, {
        enabled: formOpen && validForm && !previewError,
        retry: false,
    });
    const upsert = trpc.general.financeCompliance.upsertCommissionRule.useMutation({
        onSuccess: async () => {
            await utils.general.financeCompliance.listCommissionRuleAdminRows.invalidate();
            toast.success(editing ? "Commission rule updated" : "Commission rule created");
            setFormOpen(false);
            setEditing(null);
            setForm(emptyForm);
            setFormError({});
        },
        onError: (error) => toast.error(error.message),
    });

    const historyQuery = trpc.general.financeCompliance.listCommissionRuleHistory.useQuery(
        { ruleId: historyRow?.rule.id ?? "00000000-0000-0000-0000-000000000000" },
        { enabled: Boolean(historyRow) }
    );

    const rows = useMemo(() => {
        const source = (rowsQuery.data ?? []) as RuleRow[];
        return source.filter((row) => {
            if (status === "inactive" && row.rule.isActive) return false;
            if (query && !`${row.rule.ruleName} ${row.brandName ?? ""} ${row.categoryName ?? ""}`.toLowerCase().includes(query.toLowerCase())) return false;
            return true;
        });
    }, [rowsQuery.data, query, status]);

    const columns = useMemo<ColumnDef<RuleRow>[]>(() => [
        { accessorKey: "rule.ruleName", id: "ruleName", header: "Rule", cell: ({ row }) => <span className="font-medium">{row.original.rule.ruleName}</span> },
        { accessorKey: "brandName", id: "brand", header: "Brand", cell: ({ row }) => row.original.brandName ?? "All brands" },
        { accessorKey: "categoryName", id: "category", header: "Category", cell: ({ row }) => row.original.categoryName ?? "All categories" },
        { id: "productType", header: "Product type", cell: ({ row }) => row.original.productTypeName ?? "All types" },
        { id: "commission", header: "Commission", cell: ({ row }) => `${(row.original.rule.commissionPercentBps / 100).toFixed(2)}%` },
        { accessorKey: "priority", header: "Priority" },
        { id: "specificity", accessorFn: specificity, header: "Specificity" },
        { id: "effective", header: "Effective", cell: ({ row }) => `${dateValue(row.original.rule.effectiveFrom)} – ${dateValue(row.original.rule.effectiveTo)}` },
        { id: "status", header: "Status", cell: ({ row }) => <span className={row.original.rule.isActive ? "text-emerald-700" : "text-slate-500"}>{row.original.rule.isActive ? "Active" : "Inactive"}</span> },
        { id: "actions", header: "Actions", enableHiding: false, cell: ({ row }) => <div className="flex gap-1">
            {canManage && <Button variant="ghost" size="icon" aria-label="Edit rule" onClick={() => { setEditing(row.original); setForm(fromRow(row.original)); setFormOpen(true); }}><Pencil /></Button>}
            {canManage && row.original.rule.isActive && <Button variant="ghost" size="icon" aria-label="Deactivate rule" onClick={() => setDeactivateRow(row.original)}><ShieldOff /></Button>}
            <Button variant="ghost" size="icon" aria-label="View history" onClick={() => setHistoryRow(row.original)}><History /></Button>
        </div> },
    ], [canManage]);

    const table = useReactTable({
        data: rows,
        columns,
        onSortingChange: setSorting,
        onColumnVisibilityChange: setVisibility,
        onColumnFiltersChange: setColumnFilters,
        state: { sorting, columnVisibility: visibility, columnFilters },
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    function openCreate() {
        setEditing(null);
        setForm(emptyForm);
        setFormError({});
        setPreviewError(null);
        setFormOpen(true);
    }

    function save() {
        const errors = validateCommissionRuleForm(form);
        setFormError(errors);
        if (Object.keys(errors).length || !previewQuery.data || previewQuery.data.kind === "conflict") return;
        upsert.mutate({
            id: editing?.rule.id,
            ruleName: form.ruleName.trim(),
            brandId: form.brandId || undefined,
            categoryId: form.categoryId || undefined,
            productTypeId: form.productTypeId || undefined,
            commissionPercentBps: Number(form.commissionPercentBps),
            holdbackPercentBps: 0,
            priority: Number(form.priority || 0),
            effectiveFrom: form.effectiveFrom,
            effectiveTo: form.effectiveTo || undefined,
            isActive: form.isActive,
            ...buildCommissionRuleMetadata(form),
        });
    }

    function deactivate() {
        if (!deactivateRow) return;
        const row = deactivateRow;
        upsert.mutate({
            id: row.rule.id,
            ruleName: row.rule.ruleName,
            brandId: row.rule.brandId ?? undefined,
            categoryId: row.rule.categoryId ?? undefined,
            productTypeId: row.rule.productTypeId ?? undefined,
            commissionPercentBps: row.rule.commissionPercentBps,
            holdbackPercentBps: 0,
            priority: row.rule.priority,
            effectiveFrom: new Date(row.rule.effectiveFrom).toISOString().slice(0, 10),
            effectiveTo: row.rule.effectiveTo ? new Date(row.rule.effectiveTo).toISOString().slice(0, 10) : undefined,
            isActive: false,
            ...buildCommissionRuleMetadata({
                notes: String(row.rule.metadata?.notes ?? ""),
        sourceStatus: row.rule.metadata?.sourceStatus === "agreement_version" ? "agreement_version" : "no_source_document_on_file",
                agreementVersionId: String(row.rule.metadata?.agreementVersionId ?? ""),
                approverName: String(row.rule.metadata?.approverName ?? "Akshay"),
                provisional: row.rule.metadata?.provisional !== false,
                commissionBasis: String(row.rule.metadata?.commissionBasis ?? "net_merchandise_value"),
            }),
        }, { onSuccess: () => setDeactivateRow(null) });
    }

    return <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h1 className="text-2xl font-semibold">Commission Rules</h1><p className="text-sm text-slate-600">Review approved brand/category rules and their deterministic precedence.</p></div>
            {canManage && <Button onClick={openCreate}><Plus /> New rule</Button>}
        </div>
        <div className="grid gap-2 rounded-md border bg-white p-3 md:grid-cols-5">
            <Input placeholder="Search rules..." value={query} onChange={(e) => setQuery(e.target.value)} />
            <select className="h-10 rounded-md border bg-white px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}><option value="active">Active</option><option value="inactive">Inactive</option><option value="all">All statuses</option></select>
            <select className="h-10 rounded-md border bg-white px-3 text-sm" value={brandId} onChange={(e) => { setBrandId(e.target.value); table.getColumn("brand")?.setFilterValue(e.target.value === "all" ? undefined : e.target.options[e.target.selectedIndex].text); }}><option value="all">All brands</option>{lookupsQuery.data?.brands.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
            <select className="h-10 rounded-md border bg-white px-3 text-sm" value={categoryId} onChange={(e) => { setCategoryId(e.target.value); table.getColumn("category")?.setFilterValue(e.target.value === "all" ? undefined : e.target.options[e.target.selectedIndex].text); }}><option value="all">All categories</option>{lookupsQuery.data?.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
            <DataTableViewOptions table={table} />
        </div>
        {rowsQuery.error && <div className="flex items-center justify-between rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">Unable to load commission rules.<Button variant="outline" size="sm" onClick={() => rowsQuery.refetch()}><RefreshCw /> Retry</Button></div>}
        <DataTable table={table} columns={columns} count={rows.length} pages={Math.max(1, Math.ceil(rows.length / 10))} />

        <Dialog open={formOpen} onOpenChange={setFormOpen}><DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>{editing ? "Edit commission rule" : "Create commission rule"}</DialogTitle><DialogDescription>Required fields are validated before the server conflict preview. Holdback is fixed at 0 bps and is not editable here.</DialogDescription></DialogHeader>
            <div className="grid gap-3 md:grid-cols-2">
                <Field label="Rule name" error={formError.ruleName}><Input value={form.ruleName} onChange={(e) => setForm({ ...form, ruleName: e.target.value })} /></Field>
                <Field label="Commission basis" error={formError.commissionBasis}><Input value={form.commissionBasis} onChange={(e) => setForm({ ...form, commissionBasis: e.target.value })} /></Field>
                <Field label="Commission (basis points)" hint={`${(Number(form.commissionPercentBps || 0) / 100).toFixed(2)}%`} error={formError.commissionPercentBps}><Input inputMode="numeric" value={form.commissionPercentBps} onChange={(e) => setForm({ ...form, commissionPercentBps: e.target.value })} /></Field>
                <Field label="Priority"><Input inputMode="numeric" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} /></Field>
                <Field label="Effective from" error={formError.effectiveFrom}><Input type="date" value={form.effectiveFrom} onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })} /></Field>
                <Field label="Effective to"><Input type="date" value={form.effectiveTo} onChange={(e) => setForm({ ...form, effectiveTo: e.target.value })} /></Field>
                <SelectField label="Brand" value={form.brandId} onChange={(value) => setForm({ ...form, brandId: value })} options={lookupsQuery.data?.brands ?? []} />
                <SelectField label="Category" value={form.categoryId} onChange={(value) => setForm({ ...form, categoryId: value, productTypeId: "" })} options={lookupsQuery.data?.categories ?? []} />
                <SelectField label="Product type" value={form.productTypeId} onChange={(value) => setForm({ ...form, productTypeId: value })} options={(lookupsQuery.data?.productTypes ?? []).filter((item) => !form.categoryId || item.categoryId === form.categoryId)} />
                <Field label="Agreement version ID"><Input value={form.agreementVersionId} onChange={(e) => setForm({ ...form, agreementVersionId: e.target.value })} /></Field>
                <Field label="Approver"><Input value={form.approverName} onChange={(e) => setForm({ ...form, approverName: e.target.value })} /></Field>
                <Field label="Source status"><select className="h-10 w-full rounded-md border bg-white px-3 text-sm" value={form.sourceStatus} onChange={(e) => setForm({ ...form, sourceStatus: e.target.value as FormValues["sourceStatus"] })}><option value="agreement_version">Agreement version</option><option value="no_source_document_on_file">No source document on file</option></select></Field>
                <Field label="Notes"><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.provisional} onChange={(e) => setForm({ ...form, provisional: e.target.checked })} /> Provisional rule</label>
            </div>
            {previewQuery.error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">Conflict preview failed. Save is disabled until it succeeds. <Button variant="outline" size="sm" onClick={() => { setPreviewError(null); previewQuery.refetch(); }}>Retry preview</Button></div>}
            {previewQuery.data?.kind === "conflict" && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"><AlertTriangle className="mr-2 inline size-4" />An exact overlapping rule exists. Resolve or deactivate it before saving.</div>}
            {previewQuery.data?.kind === "ambiguous" && <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><AlertTriangle className="mr-2 inline size-4" />This rule overlaps {previewQuery.data.conflicts.map((conflict) => conflict.ruleName).join(", ") || "another scope"}. The existing resolver winner is {previewQuery.data.winner?.ruleName ?? "not available"}; review the priority before saving.</div>}
            {previewQuery.data?.kind === "none" && <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">Fallback indication: no active commission rule currently resolves for this scope, so the runtime result is no commission rule (manual fallback). This read-only outcome is not changed by the form.</div>}
            {upsert.error && <p className="text-sm text-red-700">{upsert.error.message}</p>}
            <DialogFooter><Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>{canManage && <Button disabled={!validForm || previewQuery.isPending || previewQuery.isError || previewQuery.data?.kind === "conflict" || upsert.isPending} onClick={save}>{upsert.isPending ? "Saving..." : "Save rule"}</Button>}</DialogFooter>
        </DialogContent></Dialog>

        <Dialog open={Boolean(deactivateRow)} onOpenChange={(open) => !open && setDeactivateRow(null)}><DialogContent><DialogHeader><DialogTitle>Deactivate commission rule?</DialogTitle><DialogDescription>This will remove the rule from future resolution for {deactivateRow?.brandName ?? "all brands"} / {deactivateRow?.categoryName ?? "all categories"} / {deactivateRow?.productTypeName ?? "all product types"}. The row and its history remain visible; the existing resolver will determine the resulting category/default fallback. No row will be deleted.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeactivateRow(null)}>Cancel</Button><Button variant="destructive" disabled={upsert.isPending} onClick={deactivate}>Deactivate</Button></DialogFooter></DialogContent></Dialog>

        <Dialog open={Boolean(historyRow)} onOpenChange={(open) => !open && setHistoryRow(null)}><DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>Rule history</DialogTitle><DialogDescription>{historyRow?.rule.ruleName}</DialogDescription></DialogHeader>{historyQuery.isLoading ? <p className="text-sm text-slate-600">Loading history...</p> : historyQuery.error ? <p className="text-sm text-red-700">Unable to load history.</p> : <div className="space-y-3">{historyQuery.data?.map((entry) => <div key={entry.id} className="rounded border p-3 text-sm"><div className="flex justify-between"><strong>{entry.actionType}</strong><span>{new Date(entry.createdAt).toLocaleString()}</span></div><p className="text-slate-600">Actor: {entry.userId ?? "System"}</p><pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify({ before: entry.beforeValue, after: entry.afterValue }, null, 2)}</pre></div>)}</div>}</DialogContent></Dialog>
    </section>;
}

function fromRow(row: RuleRow): FormValues {
    const metadata = row.rule.metadata ?? {};
    return {
        ...emptyForm,
        ruleName: row.rule.ruleName,
        brandId: row.rule.brandId ?? "",
        categoryId: row.rule.categoryId ?? "",
        productTypeId: row.rule.productTypeId ?? "",
        commissionPercentBps: String(row.rule.commissionPercentBps),
        priority: String(row.rule.priority),
        effectiveFrom: new Date(row.rule.effectiveFrom).toISOString().slice(0, 10),
        effectiveTo: row.rule.effectiveTo ? new Date(row.rule.effectiveTo).toISOString().slice(0, 10) : "",
        isActive: row.rule.isActive,
        notes: String(metadata.notes ?? ""),
        sourceStatus: metadata.sourceStatus === "agreement_version" ? "agreement_version" : "no_source_document_on_file",
        agreementVersionId: String(metadata.agreementVersionId ?? ""),
        approverName: String(metadata.approverName ?? "Akshay"),
        provisional: metadata.provisional !== false,
        commissionBasis: String(metadata.commissionBasis ?? "net_merchandise_value"),
    };
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
    return <label className="space-y-1 text-sm"><span className="flex justify-between font-medium"><span>{label}</span>{hint && <span className="font-normal text-slate-500">{hint}</span>}</span>{children}{error && <span className="text-xs text-red-700">{error}</span>}</label>;
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ id: string; name: string }> }) {
    return <Field label={label}><select className="h-10 w-full rounded-md border bg-white px-3 text-sm" value={value} onChange={(e) => onChange(e.target.value)}><option value="">All / wildcard</option>{options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></Field>;
}
