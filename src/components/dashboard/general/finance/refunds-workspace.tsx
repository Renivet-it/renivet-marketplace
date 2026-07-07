"use client";

import { Button } from "@/components/ui/button-dash";
import { Input } from "@/components/ui/input-dash";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select-general";
import { Textarea } from "@/components/ui/textarea-dash";
import {
    getReturnShippingPaidBy,
    inferRefundCostAllocationFromReason,
    requiresNotesForCostAllocation,
    type RefundCostAllocation,
} from "@/lib/finance/refund-policy";
import { trpc } from "@/lib/trpc/client";
import { formatINR, handleClientError } from "@/lib/utils";
import { useUploadThing } from "@/lib/uploadthing";
import type React from "react";
import { startTransition, useState } from "react";
import { toast } from "sonner";

type RefundReason = {
    id: string;
    name: string | null;
    parentId: string | null;
    parent?: {
        name: string | null;
    } | null;
};

type RefundRow = {
    id: string;
    orderId: string;
    userId: string;
    paymentId: string;
    status: string;
    approvalStatus: string;
    amount: number;
    costAllocation?: string | null;
    policyBucket?: string | null;
    returnShippingPaidBy?: string | null;
    returnQcStatus?: string | null;
    reversePickupRequired?: boolean;
    reversePickupShipmentId?: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
    approvedAt?: Date | string | null;
    returnReceivedAt?: Date | string | null;
    notes?: string | null;
    reasonNotes?: string | null;
    reasonMaster?: {
        name: string | null;
    } | null;
    metadata?: Record<string, unknown> | null;
};

const allocationOptions: Array<{
    value: RefundCostAllocation;
    label: string;
}> = [
    { value: "brand_fault", label: "Brand Fault" },
    { value: "customer_fault", label: "Customer Fault" },
    { value: "renivet_fault", label: "Renivet Fault" },
    { value: "carrier_fault", label: "Carrier Fault" },
];

function buildReasonGroups(reasons: RefundReason[], search: string) {
    const normalizedSearch = search.trim().toLowerCase();
    const byParent = new Map<string, RefundReason[]>();
    const parents = reasons.filter((reason) => !reason.parentId);

    for (const reason of reasons) {
        if (!reason.parentId) continue;
        const items = byParent.get(reason.parentId) ?? [];
        items.push(reason);
        byParent.set(reason.parentId, items);
    }

    return parents
        .map((parent) => {
            const children = byParent.get(parent.id) ?? [];
            const filteredChildren = children.filter((child) =>
                `${parent.name} ${child.name}`.toLowerCase().includes(normalizedSearch)
            );
            const matchesParent = parent.name?.toLowerCase().includes(normalizedSearch);
            return {
                parent,
                children: normalizedSearch
                    ? matchesParent
                        ? children
                        : filteredChildren
                    : children,
            };
        })
        .filter((group) => group.children.length > 0 || group.parent.name?.toLowerCase().includes(normalizedSearch));
}

function getSuggestedAllocation(reason: RefundReason | null | undefined): RefundCostAllocation {
    return (
        inferRefundCostAllocationFromReason({
            reasonName: reason?.name,
            parentReasonName: reason?.parent?.name ?? null,
        }) ?? "brand_fault"
    );
}

function getEvidenceUrls(row: RefundRow) {
    const evidence = row.metadata?.evidenceUrls;
    return Array.isArray(evidence) ? evidence : [];
}

function RefundTimeline({ row }: { row: RefundRow }) {
    const points = [
        { label: "Case created", value: row.createdAt },
        { label: "Approved", value: row.approvedAt },
        { label: "Return received", value: row.returnReceivedAt },
        {
            label: row.status === "processed" ? "Refund processed" : "Last update",
            value: row.updatedAt,
        },
    ].filter((point) => point.value);

    return (
        <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Timeline
            </p>
            <div className="space-y-2">
                {points.map((point) => (
                    <div key={point.label} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        <span>{point.label}</span>
                        <span>{new Date(point.value).toLocaleString("en-IN")}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function FinanceRefundsWorkspace({
    initialRows,
    initialReasons,
}: {
    initialRows: RefundRow[];
    initialReasons: RefundReason[];
}) {
    const utils = trpc.useUtils();
    const refundsQuery = trpc.general.financeCompliance.listRefundCases.useQuery(undefined, {
        initialData: initialRows,
    });
    const reasonsQuery = trpc.general.financeCompliance.listRefundReasons.useQuery(undefined, {
        initialData: initialReasons,
    });
    const [search, setSearch] = useState("");
    const [selectedReasonId, setSelectedReasonId] = useState("");
    const [reasonSearch, setReasonSearch] = useState("");
    const [orderId, setOrderId] = useState("");
    const [userId, setUserId] = useState("");
    const [paymentId, setPaymentId] = useState("");
    const [amount, setAmount] = useState("");
    const [refundType, setRefundType] = useState<"full" | "partial" | "exchange" | "credit_note">("full");
    const [costAllocation, setCostAllocation] = useState<RefundCostAllocation>("brand_fault");
    const [returnShippingPaidBy, setReturnShippingPaidBy] = useState<"renivet" | "customer" | "na">("renivet");
    const [notes, setNotes] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [actionNotes, setActionNotes] = useState<Record<string, string>>({});
    const { startUpload } = useUploadThing("financeProofUploader");

    const refreshRefunds = async () => {
        await utils.general.financeCompliance.listRefundCases.invalidate();
    };

    const createRefundMutation = trpc.general.financeCompliance.createRefundCase.useMutation({
        onSuccess: async () => {
            toast.success("Refund case created");
            setOrderId("");
            setUserId("");
            setPaymentId("");
            setAmount("");
            setSelectedReasonId("");
            setNotes("");
            setFiles([]);
            setRefundType("full");
            setCostAllocation("brand_fault");
            setReturnShippingPaidBy("renivet");
            await refreshRefunds();
        },
        onError: handleClientError,
    });

    const approveMutation = trpc.general.financeCompliance.approveRefundCase.useMutation({
        onSuccess: async () => {
            toast.success("Refund approved");
            await refreshRefunds();
        },
        onError: handleClientError,
    });

    const rejectMutation = trpc.general.financeCompliance.rejectRefundCase.useMutation({
        onSuccess: async () => {
            toast.success("Refund rejected");
            await refreshRefunds();
        },
        onError: handleClientError,
    });

    const processMutation = trpc.general.financeCompliance.processRefundCase.useMutation({
        onSuccess: async () => {
            toast.success("Refund workflow started");
            await refreshRefunds();
        },
        onError: handleClientError,
    });

    const reverseMutation = trpc.general.financeCompliance.createReverseLogistics.useMutation({
        onSuccess: async () => {
            toast.success("Reverse pickup created");
            await refreshRefunds();
        },
        onError: handleClientError,
    });

    const receiveMutation = trpc.general.financeCompliance.markRefundReturnReceived.useMutation({
        onSuccess: async () => {
            toast.success("Return marked received");
            await refreshRefunds();
        },
        onError: handleClientError,
    });

    const qcMutation = trpc.general.financeCompliance.updateRefundQcStatus.useMutation({
        onSuccess: async (_, variables) => {
            toast.success(`QC updated to ${variables.qcStatus}`);
            await refreshRefunds();
        },
        onError: handleClientError,
    });

    const retryMutation = trpc.general.financeCompliance.retryRefundCase.useMutation({
        onSuccess: async () => {
            toast.success("Refund retry triggered");
            await refreshRefunds();
        },
        onError: handleClientError,
    });

    const filteredRows = (refundsQuery.data ?? []).filter((row) =>
        `${row.orderId} ${row.id} ${row.reasonMaster?.name ?? ""} ${row.costAllocation ?? ""}`
            .toLowerCase()
            .includes(search.trim().toLowerCase())
    );
    const reasonGroups = buildReasonGroups(reasonsQuery.data ?? [], reasonSearch);
    const selectedReason =
        (reasonsQuery.data ?? []).find((reason) => reason.id === selectedReasonId) ?? null;

    const handleReasonSelection = (reason: RefundReason) => {
        setSelectedReasonId(reason.id);
        const suggested = getSuggestedAllocation(reason);
        setCostAllocation(suggested);
        setReturnShippingPaidBy(getReturnShippingPaidBy(suggested));
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextFiles = Array.from(event.target.files ?? []);
        setFiles(nextFiles.slice(0, 4));
    };

    const submitRefund = async () => {
        if (!selectedReasonId) {
            toast.error("Select a refund reason");
            return;
        }

        if (!orderId || !userId || !paymentId || !amount) {
            toast.error("Order, user, payment, and amount are required");
            return;
        }

        if (requiresNotesForCostAllocation(costAllocation) && !notes.trim()) {
            toast.error("Notes are required for Renivet fault and carrier fault refunds");
            return;
        }

        let evidenceUrls: string[] = [];
        if (files.length) {
            const uploaded = await startUpload(files);
            evidenceUrls = uploaded?.map((file) => file.url) ?? [];
        }

        createRefundMutation.mutate({
            userId,
            orderId,
            paymentId,
            amount: Number(amount),
            reasonCode: selectedReasonId,
            notes: notes.trim() || undefined,
            refundType,
            costAllocation,
            returnShippingPaidBy,
            evidenceUrls,
        });
    };

    return (
        <div className="grid gap-4 xl:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.6fr)]">
            <section className="space-y-4 rounded-md border bg-white p-5 shadow-sm">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                        Initiate Refund
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-950">Refund initiation form</h2>
                    <p className="mt-2 text-sm text-slate-600">
                        Use reason master mapping, upload proof when needed, and keep payout impact aligned to policy.
                    </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                    <Input placeholder="Order ID" value={orderId} onChange={(event) => setOrderId(event.target.value)} />
                    <Input placeholder="User ID" value={userId} onChange={(event) => setUserId(event.target.value)} />
                    <Input placeholder="Razorpay Payment ID" value={paymentId} onChange={(event) => setPaymentId(event.target.value)} />
                    <Input
                        placeholder="Amount in paise"
                        inputMode="numeric"
                        value={amount}
                        onChange={(event) => setAmount(event.target.value.replace(/[^\d]/g, ""))}
                    />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                    <Select
                        value={refundType}
                        onValueChange={(value) =>
                            setRefundType(value as "full" | "partial" | "exchange" | "credit_note")
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Refund type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="full">Full</SelectItem>
                            <SelectItem value="partial">Partial</SelectItem>
                            <SelectItem value="exchange">Exchange</SelectItem>
                            <SelectItem value="credit_note">Credit note</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        value={costAllocation}
                        onValueChange={(value) => {
                            const next = value as RefundCostAllocation;
                            setCostAllocation(next);
                            startTransition(() => {
                                setReturnShippingPaidBy(getReturnShippingPaidBy(next));
                            });
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Cost allocation" />
                        </SelectTrigger>
                        <SelectContent>
                            {allocationOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-medium text-slate-900">Refund reason</p>
                            <p className="text-xs text-slate-500">
                                Search and pick from grouped `reason_master` entries.
                            </p>
                        </div>
                        <Input
                            className="max-w-52"
                            placeholder="Search reason"
                            value={reasonSearch}
                            onChange={(event) => setReasonSearch(event.target.value)}
                        />
                    </div>
                    <div className="max-h-80 space-y-3 overflow-y-auto">
                        {reasonGroups.map((group) => (
                            <div key={group.parent.id} className="rounded-md border bg-white p-3">
                                <p className="text-sm font-semibold text-slate-900">{group.parent.name}</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {(group.children.length ? group.children : [group.parent]).map((reason) => (
                                        <button
                                            key={reason.id}
                                            type="button"
                                            onClick={() => handleReasonSelection(reason)}
                                            className={`rounded-full border px-3 py-1.5 text-xs transition ${
                                                selectedReasonId === reason.id
                                                    ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                                                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                                            }`}
                                        >
                                            {reason.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Suggested policy
                        </p>
                        <p className="mt-2 text-sm font-medium text-slate-900">
                            {selectedReason ? allocationOptions.find((item) => item.value === getSuggestedAllocation(selectedReason))?.label : "Select a reason"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            Override is allowed when finance needs to classify a case differently.
                        </p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Return shipping
                        </p>
                        <p className="mt-2 text-sm font-medium text-slate-900">
                            {returnShippingPaidBy === "na"
                                ? "No return required"
                                : returnShippingPaidBy === "renivet"
                                  ? "Renivet pays"
                                  : "Customer pays"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            This auto-follows the selected cost allocation.
                        </p>
                    </div>
                </div>

                <Textarea
                    minRows={4}
                    placeholder="Notes are mandatory for renivet_fault and carrier_fault"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                />

                <div className="rounded-md border border-dashed border-slate-300 p-4">
                    <p className="text-sm font-medium text-slate-900">Proof attachments</p>
                    <p className="mt-1 text-xs text-slate-500">
                        Upload photos or PDFs for late exceptions, transit damage, and manual review context.
                    </p>
                    <Input className="mt-3" type="file" accept="image/png,image/jpeg,application/pdf" multiple onChange={handleFileChange} />
                    {files.length ? (
                        <div className="mt-3 space-y-1 text-xs text-slate-600">
                            {files.map((file) => (
                                <p key={file.name}>{file.name}</p>
                            ))}
                        </div>
                    ) : null}
                </div>

                <Button
                    onClick={submitRefund}
                    disabled={createRefundMutation.isPending}
                    className="w-full"
                >
                    {createRefundMutation.isPending ? "Creating refund case..." : "Create Refund Case"}
                </Button>
            </section>

            <section className="space-y-4">
                <div className="rounded-md border bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                Refund queue
                            </p>
                            <h2 className="mt-2 text-xl font-semibold text-slate-950">Approval, logistics, and execution</h2>
                        </div>
                        <Input
                            className="max-w-sm"
                            placeholder="Search by order, refund id, reason, or allocation"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>
                </div>

                {filteredRows.length === 0 ? (
                    <div className="rounded-md border bg-white p-8 text-sm text-slate-500 shadow-sm">
                        No refund cases recorded yet.
                    </div>
                ) : (
                    filteredRows.map((row) => {
                        const evidenceUrls = getEvidenceUrls(row);
                        const actionNote = actionNotes[row.id] ?? "";
                        return (
                            <article key={row.id} className="rounded-md border bg-white p-5 shadow-sm">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                                {row.id}
                                            </span>
                                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                                {row.status}
                                            </span>
                                            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                                {row.approvalStatus}
                                            </span>
                                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                                {row.costAllocation ?? row.policyBucket ?? "-"}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-lg font-semibold text-slate-950">
                                                Order {row.orderId}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                {row.reasonMaster?.name ?? "Reason not mapped"} • {formatINR(row.amount)}
                                            </p>
                                        </div>
                                        <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                                            <p>User: {row.userId}</p>
                                            <p>Payment: {row.paymentId}</p>
                                            <p>Return shipping: {row.returnShippingPaidBy ?? "-"}</p>
                                            <p>QC: {row.returnQcStatus ?? "-"}</p>
                                            <p>Reverse pickup: {row.reversePickupShipmentId ? "Created" : row.reversePickupRequired ? "Required" : "No"}</p>
                                            <p>Payout impact: {row.costAllocation === "brand_fault" ? "Deduct next payout" : "Brand still gets paid"}</p>
                                        </div>
                                    </div>
                                    <div className="min-w-64 rounded-md border border-slate-200 bg-slate-50 p-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                            Action note
                                        </p>
                                        <Textarea
                                            minRows={3}
                                            className="mt-3 bg-white"
                                            placeholder="Use this for approve/reject/QC notes"
                                            value={actionNote}
                                            onChange={(event) =>
                                                setActionNotes((current) => ({
                                                    ...current,
                                                    [row.id]: event.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
                                    <div className="space-y-4">
                                        <div className="flex flex-wrap gap-2">
                                            {row.approvalStatus === "pending" ? (
                                                <>
                                                    <Button
                                                        onClick={() =>
                                                            approveMutation.mutate({
                                                                refundId: row.id,
                                                                reason: actionNote || undefined,
                                                            })
                                                        }
                                                        disabled={approveMutation.isPending}
                                                    >
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        onClick={() => {
                                                            if (!actionNote.trim()) {
                                                                toast.error("Rejection reason is required");
                                                                return;
                                                            }
                                                            rejectMutation.mutate({
                                                                refundId: row.id,
                                                                reason: actionNote,
                                                            });
                                                        }}
                                                        disabled={rejectMutation.isPending}
                                                    >
                                                        Reject
                                                    </Button>
                                                </>
                                            ) : null}

                                            {row.approvalStatus === "approved" && row.status === "pending" ? (
                                                <Button
                                                    onClick={() => processMutation.mutate({ refundId: row.id })}
                                                    disabled={processMutation.isPending}
                                                >
                                                    Process Refund
                                                </Button>
                                            ) : null}

                                            {row.reversePickupRequired && !row.reversePickupShipmentId ? (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => reverseMutation.mutate({ refundId: row.id })}
                                                    disabled={reverseMutation.isPending}
                                                >
                                                    Create Reverse Pickup
                                                </Button>
                                            ) : null}

                                            {row.status === "awaiting_return" ? (
                                                <Button
                                                    variant="outline"
                                                    onClick={() =>
                                                        receiveMutation.mutate({ refundId: row.id })
                                                    }
                                                    disabled={receiveMutation.isPending}
                                                >
                                                    Mark Return Received
                                                </Button>
                                            ) : null}

                                            {(row.status === "awaiting_qc" || row.status === "awaiting_return") &&
                                            row.returnQcStatus !== "na" ? (
                                                <>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() =>
                                                            qcMutation.mutate({
                                                                refundId: row.id,
                                                                qcStatus: "passed",
                                                                note: actionNote || undefined,
                                                            })
                                                        }
                                                        disabled={qcMutation.isPending}
                                                    >
                                                        QC Passed
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        onClick={() =>
                                                            qcMutation.mutate({
                                                                refundId: row.id,
                                                                qcStatus: "failed",
                                                                note: actionNote || undefined,
                                                            })
                                                        }
                                                        disabled={qcMutation.isPending}
                                                    >
                                                        QC Failed
                                                    </Button>
                                                </>
                                            ) : null}

                                            {(row.status === "failed" || row.status === "qc_failed") ? (
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => retryMutation.mutate({ refundId: row.id })}
                                                    disabled={retryMutation.isPending}
                                                >
                                                    Retry Workflow
                                                </Button>
                                            ) : null}
                                        </div>

                                        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                                Proof and notes
                                            </p>
                                            <p className="mt-2 text-sm text-slate-700">
                                                {row.notes || row.reasonNotes || "No notes recorded."}
                                            </p>
                                            {evidenceUrls.length ? (
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {evidenceUrls.map((url: string) => (
                                                        <a
                                                            key={url}
                                                            href={url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:border-slate-300"
                                                        >
                                                            View proof
                                                        </a>
                                                    ))}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>

                                    <RefundTimeline row={row} />
                                </div>
                            </article>
                        );
                    })
                )}
            </section>
        </div>
    );
}
