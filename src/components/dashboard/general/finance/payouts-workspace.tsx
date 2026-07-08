"use client";

import { Button } from "@/components/ui/button-dash";
import { Input } from "@/components/ui/input-dash";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select-general";
import { Textarea } from "@/components/ui/textarea-dash";
import { trpc } from "@/lib/trpc/client";
import { useUploadThing } from "@/lib/uploadthing";
import { formatINR, handleClientError } from "@/lib/utils";
import type React from "react";
import { startTransition, useDeferredValue, useMemo, useState } from "react";
import { toast } from "sonner";

type CycleRow = {
    id: string;
    cycleKey: string;
    cycleStart: string;
    cycleEnd: string;
    payoutDate: string;
    status: string;
    calculationSummary?: Record<string, unknown> | null;
};

type PayoutLineItem = {
    id: string;
    brandId: string;
    lineType: string;
    description: string;
    amountPaise: number;
    referenceId?: string | null;
};

type OverrideRow = {
    id: string;
    cycleId: string;
    brandId: string;
    adjustmentType: string;
    amountPaise: number;
    reasonCode: string;
    notes: string;
    proofFileUrl: string;
    createdBy: string;
    approvedBy?: string | null;
};

type BrandSummary = {
    brandId: string;
    brandName: string;
    grossSalesPaise: number;
    commissionPaise: number;
    returnsPaise: number;
    carrierClaimsPaise: number;
    holdbackPaise: number;
    holdbackReleasePaise: number;
    overrideNetPaise: number;
    tdsPaise: number;
    netPayablePaise: number;
    payoutMethod: "razorpay_route" | "manual_neft";
    reviewStatus: "pending" | "approved";
    executionStatus: string;
    transactionId?: string | null;
    statementUrl?: string | null;
    metadata?: Record<string, unknown>;
};

type CycleDetail = {
    cycle: CycleRow | null | undefined;
    lineItems: PayoutLineItem[];
    overrides: OverrideRow[];
};

const adjustmentTypes = [
    "shipping_cost_dispute",
    "qc_adjustment",
    "manual_correction",
    "duplicate_deduction",
    "other",
] as const;

function getBrandSummaries(cycle?: CycleRow | null) {
    const summary = cycle?.calculationSummary as
        | {
              brands?: BrandSummary[];
          }
        | undefined;
    return summary?.brands ?? [];
}

export function PayoutsWorkspace({
    initialCycles,
    initialDetail,
}: {
    initialCycles: CycleRow[];
    initialDetail: CycleDetail | null;
}) {
    const utils = trpc.useUtils();
    const [selectedCycleId, setSelectedCycleId] = useState(initialCycles[0]?.id ?? "");
    const [createForm, setCreateForm] = useState({
        cycleKey: "",
        cycleStart: "",
        cycleEnd: "",
        payoutDate: "",
    });
    const [activeBrandId, setActiveBrandId] = useState("");
    const [overrideForm, setOverrideForm] = useState({
        adjustmentType: "manual_correction",
        amountPaise: "",
        reasonCode: "",
        notes: "",
        approverId: "",
    });
    const [overrideFiles, setOverrideFiles] = useState<File[]>([]);
    const [manualTxns, setManualTxns] = useState<Record<string, string>>({});
    const deferredCycleId = useDeferredValue(selectedCycleId);
    const { startUpload } = useUploadThing("financeProofUploader");

    const cyclesQuery = trpc.general.financeCompliance.listPayoutCycles.useQuery();
    const detailQuery = trpc.general.financeCompliance.getPayoutCycleDetail.useQuery(
        { cycleId: deferredCycleId },
        {
            enabled: !!deferredCycleId,
        }
    );

    const cycles = cyclesQuery.data ?? initialCycles;
    const detail = detailQuery.data ?? initialDetail;
    const cycle = detail?.cycle ?? null;
    const lineItems = detail?.lineItems ?? [];
    const overrides = detail?.overrides ?? [];
    const brands = getBrandSummaries(cycle);
    const activeBrand = brands.find((brand) => brand.brandId === activeBrandId) ?? brands[0];
    const filteredLineItems = lineItems.filter(
        (line) => line.brandId === (activeBrand?.brandId ?? "")
    );

    const refresh = async () => {
        await utils.general.financeCompliance.listPayoutCycles.invalidate();
        if (selectedCycleId) {
            await utils.general.financeCompliance.getPayoutCycleDetail.invalidate({
                cycleId: selectedCycleId,
            });
        }
    };

    const createCycle = trpc.general.financeCompliance.createPayoutCycle.useMutation({
        onSuccess: async (row) => {
            toast.success("Payout cycle created");
            setSelectedCycleId(row.id);
            setCreateForm({
                cycleKey: "",
                cycleStart: "",
                cycleEnd: "",
                payoutDate: "",
            });
            await refresh();
        },
        onError: (error) => {
            handleClientError(error);
        },
    });

    const calculateCycle = trpc.general.financeCompliance.calculatePayoutCycle.useMutation({
        onSuccess: async () => {
            toast.success("Payout cycle calculated");
            await refresh();
        },
        onError: (error) => {
            handleClientError(error);
        },
    });

    const approveCycle = trpc.general.financeCompliance.approvePayoutCycle.useMutation({
        onSuccess: async () => {
            toast.success("Approval recorded");
            await refresh();
        },
        onError: (error) => {
            handleClientError(error);
        },
    });

    const executeCycle = trpc.general.financeCompliance.executePayoutCycle.useMutation({
        onSuccess: async () => {
            toast.success("Execution updated");
            await refresh();
        },
        onError: (error) => {
            handleClientError(error);
        },
    });

    const createOverride = trpc.general.financeCompliance.createPayoutOverride.useMutation({
        onSuccess: async () => {
            toast.success("Override recorded");
            setOverrideFiles([]);
            setOverrideForm({
                adjustmentType: "manual_correction",
                amountPaise: "",
                reasonCode: "",
                notes: "",
                approverId: "",
            });
            await refresh();
        },
        onError: (error) => {
            handleClientError(error);
        },
    });

    const approveOverride = trpc.general.financeCompliance.approvePayoutOverride.useMutation({
        onSuccess: async () => {
            toast.success("Override approved");
            await refresh();
        },
        onError: (error) => {
            handleClientError(error);
        },
    });

    const completeManual = trpc.general.financeCompliance.completeManualPayout.useMutation({
        onSuccess: async () => {
            toast.success("Manual payout completed");
            await refresh();
        },
        onError: (error) => {
            handleClientError(error);
        },
    });

    const summary = useMemo(() => {
        return {
            totalBrands: brands.length,
            totalNet: brands.reduce((sum, brand) => sum + brand.netPayablePaise, 0),
            pending: brands.filter((brand) => brand.reviewStatus === "pending").length,
            awaitingManual: brands.filter(
                (brand) => brand.executionStatus === "awaiting_manual_confirmation"
            ).length,
            failed: brands.filter((brand) => brand.executionStatus === "failed").length,
        };
    }, [brands]);

    const submitCreateCycle = () => {
        if (
            !createForm.cycleKey ||
            !createForm.cycleStart ||
            !createForm.cycleEnd ||
            !createForm.payoutDate
        ) {
            toast.error("Fill all cycle fields");
            return;
        }

        createCycle.mutate({
            cycleKey: createForm.cycleKey,
            cycleStart: new Date(createForm.cycleStart),
            cycleEnd: new Date(createForm.cycleEnd),
            payoutDate: new Date(createForm.payoutDate),
        });
    };

    const submitOverride = async () => {
        if (!cycle || !activeBrand) {
            toast.error("Select a cycle and brand first");
            return;
        }
        if (!overrideForm.reasonCode || !overrideForm.notes || !overrideForm.amountPaise) {
            toast.error("Adjustment amount, reason, and notes are required");
            return;
        }
        if (!overrideFiles.length) {
            toast.error("Proof upload is required");
            return;
        }

        const uploaded = await startUpload(overrideFiles);
        const proofFileUrl = uploaded?.[0]?.url;
        if (!proofFileUrl) {
            toast.error("Proof upload failed");
            return;
        }

        createOverride.mutate({
            cycleId: cycle.id,
            brandId: activeBrand.brandId,
            adjustmentType: overrideForm.adjustmentType as (typeof adjustmentTypes)[number],
            amountPaise: Number(overrideForm.amountPaise),
            reasonCode: overrideForm.reasonCode,
            notes: overrideForm.notes,
            proofFileUrl,
            approverId: overrideForm.approverId || undefined,
        });
    };

    return (
        <div className="space-y-4">
            <section className="grid gap-4 md:grid-cols-5">
                <StatCard label="Brands" value={String(summary.totalBrands)} />
                <StatCard label="Net Payable" value={formatINR(summary.totalNet)} />
                <StatCard label="Pending Approval" value={String(summary.pending)} />
                <StatCard label="Awaiting Manual" value={String(summary.awaitingManual)} />
                <StatCard label="Failed" value={String(summary.failed)} />
            </section>

            <section className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)] 2xl:grid-cols-[360px_minmax(0,1fr)]">
                <div className="space-y-4">
                    <section className="rounded-md border bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Create Cycle
                        </p>
                        <h2 className="mt-2 text-xl font-semibold text-slate-950">Start a payout run</h2>
                        <p className="mt-1 text-sm text-slate-600">
                            Create one settlement window, then calculate payouts, review TDS, and execute
                            brand payments from the control desk.
                        </p>
                        <div className="mt-4 space-y-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                    Cycle Key
                                </label>
                                <Input
                                    placeholder="Example: 2026-07-H1"
                                    value={createForm.cycleKey}
                                    onChange={(event) =>
                                        setCreateForm((current) => ({
                                            ...current,
                                            cycleKey: event.target.value,
                                        }))
                                    }
                                />
                                <p className="text-xs text-slate-500">
                                    Use a readable batch name for finance, for example month plus half.
                                </p>
                            </div>
                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                        Start Date
                                    </label>
                                    <Input
                                        type="date"
                                        value={createForm.cycleStart}
                                        onChange={(event) =>
                                            setCreateForm((current) => ({
                                                ...current,
                                                cycleStart: event.target.value,
                                            }))
                                        }
                                    />
                                    <p className="text-xs text-slate-500">First order date in this payout window.</p>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                        End Date
                                    </label>
                                    <Input
                                        type="date"
                                        value={createForm.cycleEnd}
                                        onChange={(event) =>
                                            setCreateForm((current) => ({
                                                ...current,
                                                cycleEnd: event.target.value,
                                            }))
                                        }
                                    />
                                    <p className="text-xs text-slate-500">Last order date included in this cycle.</p>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                        Payout Date
                                    </label>
                                    <Input
                                        type="date"
                                        value={createForm.payoutDate}
                                        onChange={(event) =>
                                            setCreateForm((current) => ({
                                                ...current,
                                                payoutDate: event.target.value,
                                            }))
                                        }
                                    />
                                    <p className="text-xs text-slate-500">Date on which this batch will be paid.</p>
                                </div>
                            </div>
                            <Button onClick={submitCreateCycle} disabled={createCycle.isPending}>
                                {createCycle.isPending ? "Creating..." : "Create Cycle"}
                            </Button>
                        </div>
                    </section>

                    <section className="rounded-md border bg-white shadow-sm">
                        <div className="border-b px-4 py-3">
                            <p className="text-sm font-semibold text-slate-900">Cycles</p>
                        </div>
                        <div className="divide-y">
                            {cycles.length === 0 ? (
                                <p className="p-4 text-sm text-slate-500">No payout cycles yet.</p>
                            ) : (
                                cycles.map((row) => (
                                    <button
                                        key={row.id}
                                        type="button"
                                        className={`block w-full px-4 py-3 text-left text-sm transition ${
                                            row.id === selectedCycleId
                                                ? "bg-emerald-50 text-emerald-900"
                                                : "hover:bg-slate-50"
                                        }`}
                                        onClick={() => {
                                            setSelectedCycleId(row.id);
                                            startTransition(() => {
                                                setActiveBrandId("");
                                            });
                                        }}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="font-medium">{row.cycleKey}</span>
                                            <span className="text-xs uppercase text-slate-500">
                                                {row.status}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {row.cycleStart} to {row.cycleEnd} • payout {row.payoutDate}
                                        </p>
                                    </button>
                                ))
                            )}
                        </div>
                    </section>
                </div>

                <div className="space-y-4">
                    <section className="rounded-md border bg-white p-5 shadow-sm">
                        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
                            <div className="min-w-0">
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                    Control Desk
                                </p>
                                <h2 className="mt-2 text-xl font-semibold text-slate-950">
                                    {cycle?.cycleKey ?? "Select a cycle"}
                                </h2>
                                {cycle ? (
                                    <p className="mt-1 text-sm text-slate-600">
                                        Window {cycle.cycleStart} to {cycle.cycleEnd} • payout date{" "}
                                        {cycle.payoutDate}
                                    </p>
                                ) : (
                                    <p className="mt-1 text-sm text-slate-600">
                                        Create a cycle on the left, then select it here to calculate brand payouts.
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2 xl:max-w-[420px] xl:justify-end">
                                <Button
                                    variant="outline"
                                    disabled={!cycle || calculateCycle.isPending}
                                    onClick={() =>
                                        cycle && calculateCycle.mutate({ cycleId: cycle.id })
                                    }
                                >
                                    {calculateCycle.isPending ? "Calculating..." : "Run Calculation"}
                                </Button>
                                <Button
                                    variant="secondary"
                                    disabled={!cycle || approveCycle.isPending}
                                    onClick={() =>
                                        cycle && approveCycle.mutate({ cycleId: cycle.id })
                                    }
                                >
                                    Approve All Clean
                                </Button>
                                <Button
                                    disabled={!cycle || executeCycle.isPending}
                                    onClick={() =>
                                        cycle && executeCycle.mutate({ cycleId: cycle.id })
                                    }
                                >
                                    Execute Approved
                                </Button>
                            </div>
                        </div>
                    </section>

                    <section className="grid gap-4">
                        {brands.length === 0 ? (
                            <section className="rounded-md border bg-white p-5 shadow-sm">
                                <h3 className="text-base font-semibold text-slate-900">How to use this page</h3>
                                <div className="mt-3 grid gap-3 md:grid-cols-3">
                                    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                            Step 1
                                        </p>
                                        <p className="mt-2 text-sm font-medium text-slate-900">Create a cycle</p>
                                        <p className="mt-1 text-sm text-slate-600">
                                            Enter cycle key, start date, end date, and payout date.
                                        </p>
                                    </div>
                                    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                            Step 2
                                        </p>
                                        <p className="mt-2 text-sm font-medium text-slate-900">Run calculation</p>
                                        <p className="mt-1 text-sm text-slate-600">
                                            The system computes commission, returns, holdback, and TDS for each brand.
                                        </p>
                                    </div>
                                    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                            Step 3
                                        </p>
                                        <p className="mt-2 text-sm font-medium text-slate-900">Approve and pay</p>
                                        <p className="mt-1 text-sm text-slate-600">
                                            Review payout cards, apply overrides if needed, then approve and execute.
                                        </p>
                                    </div>
                                </div>
                            </section>
                        ) : (
                            brands.map((brand) => (
                                <section
                                    key={brand.brandId}
                                    className={`rounded-md border bg-white p-5 shadow-sm ${
                                        activeBrand?.brandId === brand.brandId
                                            ? "border-emerald-300"
                                            : ""
                                    }`}
                                >
                                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
                                        <div className="min-w-0">
                                            <button
                                                type="button"
                                                className="text-left"
                                                onClick={() => setActiveBrandId(brand.brandId)}
                                            >
                                                <h3 className="truncate text-lg font-semibold text-slate-950">
                                                    {brand.brandName}
                                                </h3>
                                            </button>
                                            <p className="mt-1 break-words text-sm text-slate-500">
                                                {brand.payoutMethod === "razorpay_route"
                                                    ? "Razorpay Route"
                                                    : "Manual NEFT"}{" "}
                                                • {brand.reviewStatus} • {brand.executionStatus}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2 xl:justify-end">
                                            <Button
                                                variant="outline"
                                                disabled={approveCycle.isPending}
                                                onClick={() =>
                                                    cycle &&
                                                    approveCycle.mutate({
                                                        cycleId: cycle.id,
                                                        brandId: brand.brandId,
                                                    })
                                                }
                                            >
                                                Approve & Review
                                            </Button>
                                            <Button
                                                disabled={executeCycle.isPending}
                                                onClick={() =>
                                                    cycle &&
                                                    executeCycle.mutate({
                                                        cycleId: cycle.id,
                                                        brandId: brand.brandId,
                                                    })
                                                }
                                            >
                                                Approve & Pay
                                            </Button>
                                            {brand.statementUrl ? (
                                                <a href={brand.statementUrl} target="_blank" rel="noreferrer">
                                                    <Button variant="secondary">Statement PDF</Button>
                                                </a>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-8">
                                        <MiniStat label="Gross" value={formatINR(brand.grossSalesPaise)} />
                                        <MiniStat label="Commission" value={formatINR(brand.commissionPaise)} />
                                        <MiniStat label="Returns" value={formatINR(brand.returnsPaise)} />
                                        <MiniStat label="Claims" value={formatINR(brand.carrierClaimsPaise)} />
                                        <MiniStat label="Holdback" value={formatINR(brand.holdbackPaise)} />
                                        <MiniStat label="Release" value={formatINR(brand.holdbackReleasePaise)} />
                                        <MiniStat label="TDS" value={formatINR(brand.tdsPaise)} />
                                        <MiniStat label="Net" value={formatINR(brand.netPayablePaise)} />
                                    </div>

                                    {brand.payoutMethod === "manual_neft" &&
                                    brand.executionStatus === "awaiting_manual_confirmation" ? (
                                        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
                                            <Input
                                                placeholder="Bank transaction ID"
                                                value={manualTxns[brand.brandId] ?? ""}
                                                onChange={(event) =>
                                                    setManualTxns((current) => ({
                                                        ...current,
                                                        [brand.brandId]: event.target.value,
                                                    }))
                                                }
                                            />
                                            <Button
                                                onClick={() =>
                                                    cycle &&
                                                    completeManual.mutate({
                                                        cycleId: cycle.id,
                                                        brandId: brand.brandId,
                                                        transactionId:
                                                            manualTxns[brand.brandId] ?? "",
                                                    })
                                                }
                                            >
                                                Confirm NEFT
                                            </Button>
                                        </div>
                                    ) : null}
                                </section>
                            ))
                        )}
                    </section>

                    {activeBrand ? (
                        <section className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
                            <section className="rounded-md border bg-white p-5 shadow-sm">
                                <p className="text-sm font-semibold text-slate-900">
                                    Override for {activeBrand.brandName}
                                </p>
                                <div className="mt-4 space-y-3">
                                    <Select
                                        value={overrideForm.adjustmentType}
                                        onValueChange={(value) =>
                                            setOverrideForm((current) => ({
                                                ...current,
                                                adjustmentType: value,
                                            }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Adjustment type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {adjustmentTypes.map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {type}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        placeholder="Amount in paise, negative for deduction"
                                        value={overrideForm.amountPaise}
                                        onChange={(event) =>
                                            setOverrideForm((current) => ({
                                                ...current,
                                                amountPaise: event.target.value,
                                            }))
                                        }
                                    />
                                    <Input
                                        placeholder="Reason code"
                                        value={overrideForm.reasonCode}
                                        onChange={(event) =>
                                            setOverrideForm((current) => ({
                                                ...current,
                                                reasonCode: event.target.value,
                                            }))
                                        }
                                    />
                                    <Input
                                        placeholder="Second approver user ID for > Rs. 500"
                                        value={overrideForm.approverId}
                                        onChange={(event) =>
                                            setOverrideForm((current) => ({
                                                ...current,
                                                approverId: event.target.value,
                                            }))
                                        }
                                    />
                                    <Textarea
                                        placeholder="Notes"
                                        value={overrideForm.notes}
                                        onChange={(event) =>
                                            setOverrideForm((current) => ({
                                                ...current,
                                                notes: event.target.value,
                                            }))
                                        }
                                    />
                                    <Input
                                        type="file"
                                        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                            setOverrideFiles(Array.from(event.target.files ?? []).slice(0, 1))
                                        }
                                    />
                                    <Button
                                        disabled={createOverride.isPending}
                                        onClick={() => void submitOverride()}
                                    >
                                        {createOverride.isPending ? "Saving..." : "Add Override"}
                                    </Button>
                                </div>
                            </section>

                            <section className="rounded-md border bg-white p-5 shadow-sm">
                                <p className="text-sm font-semibold text-slate-900">
                                    Line Items and Override Queue
                                </p>
                                <div className="mt-4 space-y-3">
                                    {filteredLineItems.map((line) => (
                                        <div
                                            key={line.id}
                                            className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                                        >
                                            <div>
                                                <p className="font-medium text-slate-900">
                                                    {line.description}
                                                </p>
                                                <p className="text-xs uppercase text-slate-500">
                                                    {line.lineType}
                                                </p>
                                            </div>
                                            <span className="font-medium text-slate-900">
                                                {formatINR(line.amountPaise)}
                                            </span>
                                        </div>
                                    ))}
                                    {overrides
                                        .filter((row) => row.brandId === activeBrand.brandId)
                                        .map((row) => (
                                            <div
                                                key={row.id}
                                                className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm"
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>
                                                        <p className="font-medium text-slate-900">
                                                            {row.adjustmentType} • {formatINR(row.amountPaise)}
                                                        </p>
                                                        <p className="text-xs text-slate-600">
                                                            {row.reasonCode}
                                                        </p>
                                                    </div>
                                                    {!row.approvedBy ? (
                                                        <Button
                                                            variant="outline"
                                                            onClick={() =>
                                                                approveOverride.mutate({
                                                                    overrideId: row.id,
                                                                })
                                                            }
                                                        >
                                                            Checker Approve
                                                        </Button>
                                                    ) : (
                                                        <span className="text-xs font-semibold uppercase text-emerald-700">
                                                            Approved
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-2 text-slate-700">{row.notes}</p>
                                                <a
                                                    href={row.proofFileUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="mt-2 inline-block text-xs font-medium text-emerald-700"
                                                >
                                                    View proof
                                                </a>
                                            </div>
                                        ))}
                                </div>
                            </section>
                        </section>
                    ) : null}
                </div>
            </section>
        </div>
    );
}

function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md border bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
        </div>
    );
}

function MiniStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-w-0 rounded-md border bg-slate-50 px-3 py-2">
            <p className="break-words text-xs font-semibold uppercase leading-tight tracking-[0.08em] text-slate-500">
                {label}
            </p>
            <p className="mt-1 text-sm font-semibold leading-tight text-slate-950">{value}</p>
        </div>
    );
}
