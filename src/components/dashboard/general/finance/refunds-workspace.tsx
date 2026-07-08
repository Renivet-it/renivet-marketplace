"use client";

import { Button } from "@/components/ui/button-dash";
import { Input } from "@/components/ui/input-dash";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select-general";
import { Textarea } from "@/components/ui/textarea-dash";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-dash";
import {
    getReturnShippingPaidBy,
    inferRefundCostAllocationFromReason,
    requiresNotesForCostAllocation,
    type RefundCostAllocation,
} from "@/lib/finance/refund-policy";
import { trpc } from "@/lib/trpc/client";
import { formatINR, handleClientError } from "@/lib/utils";
import { useUploadThing } from "@/lib/uploadthing";
import React, { startTransition, useState } from "react";
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
    user?: {
        firstName: string;
        lastName: string;
        email: string;
    } | null;
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

    const [isFetchingOrder, setIsFetchingOrder] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState("all");
    const [approvalStatusFilter, setApprovalStatusFilter] = useState("all");
    const [costAllocationFilter, setCostAllocationFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    const handleFetchOrder = async () => {
        if (!orderId.trim()) {
            toast.error("Please enter an Order ID first");
            return;
        }
        setIsFetchingOrder(true);
        try {
            const data = await utils.general.financeCompliance.getOrderDetailsForRefund.fetch({
                orderId: orderId.trim(),
            });
            setUserId(data.userId);
            setPaymentId(data.paymentId);
            setAmount(String(data.amount));
            toast.success(`Loaded order details for ${data.userName}`);
        } catch (err) {
            toast.error("Could not find order. Please fill details manually.");
        } finally {
            setIsFetchingOrder(false);
        }
    };

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
            setIsFormOpen(false);
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

    const filteredRows = (refundsQuery.data ?? [])
        .filter((row) => {
            const searchStr = `${row.orderId} ${row.id} ${row.reasonMaster?.name ?? ""} ${row.costAllocation ?? ""} ${row.user?.firstName ?? ""} ${row.user?.lastName ?? ""} ${row.user?.email ?? ""}`.toLowerCase();
            const matchesSearch = searchStr.includes(search.trim().toLowerCase());

            const matchesStatus = statusFilter === "all" || row.status === statusFilter;
            const matchesApproval = approvalStatusFilter === "all" || row.approvalStatus === approvalStatusFilter;
            const matchesAllocation = costAllocationFilter === "all" || row.costAllocation === costAllocationFilter;

            return matchesSearch && matchesStatus && matchesApproval && matchesAllocation;
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const totalPages = Math.ceil(filteredRows.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedRows = filteredRows.slice(startIndex, startIndex + itemsPerPage);
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
        <div className="space-y-4">
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Initiate Refund Case</DialogTitle>
                        <DialogDescription>
                            Use reason master mapping, upload proof when needed, and keep payout impact aligned to policy.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Order ID"
                                    value={orderId}
                                    onChange={(event) => setOrderId(event.target.value)}
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleFetchOrder}
                                    disabled={isFetchingOrder}
                                    className="shrink-0"
                                >
                                    {isFetchingOrder ? "Fetching..." : "Fetch Info"}
                                </Button>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                                <Input placeholder="User ID" value={userId} onChange={(event) => setUserId(event.target.value)} />
                                <Input placeholder="Razorpay Payment ID" value={paymentId} onChange={(event) => setPaymentId(event.target.value)} />
                                <Input
                                    placeholder="Amount in paise"
                                    inputMode="numeric"
                                    value={amount}
                                    onChange={(event) => setAmount(event.target.value.replace(/[^\d]/g, ""))}
                                    className="md:col-span-2"
                                />
                            </div>
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
                                    className="max-w-52 bg-white"
                                    placeholder="Search reason"
                                    value={reasonSearch}
                                    onChange={(event) => setReasonSearch(event.target.value)}
                                />
                            </div>
                            <div className="max-h-60 space-y-3 overflow-y-auto">
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
                            minRows={3}
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
                            className="w-full mt-2"
                        >
                            {createRefundMutation.isPending ? "Creating refund case..." : "Create Refund Case"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <section className="space-y-4">
                <div className="rounded-md border bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                    Refund queue
                                </p>
                                <h2 className="mt-2 text-xl font-semibold text-slate-950">Approval, logistics, and execution</h2>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                                <Input
                                    className="w-full sm:max-w-sm"
                                    placeholder="Search by order, refund id, user name/email, reason, or allocation"
                                    value={search}
                                    onChange={(event) => {
                                        setSearch(event.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                                <Button onClick={() => setIsFormOpen(true)} className="shrink-0">
                                    Create Refund Case
                                </Button>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 border-t border-slate-100 pt-4">
                            <div className="w-full sm:w-48">
                                <label className="text-xs font-semibold text-slate-600 block mb-1">Status</label>
                                <Select
                                    value={statusFilter}
                                    onValueChange={(value) => {
                                        setStatusFilter(value);
                                        setCurrentPage(1);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="awaiting_approval">Awaiting Approval</SelectItem>
                                        <SelectItem value="awaiting_return">Awaiting Return</SelectItem>
                                        <SelectItem value="awaiting_qc">Awaiting QC</SelectItem>
                                        <SelectItem value="qc_failed">QC Failed</SelectItem>
                                        <SelectItem value="processed">Processed</SelectItem>
                                        <SelectItem value="failed">Failed</SelectItem>
                                        <SelectItem value="rejected">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="w-full sm:w-48">
                                <label className="text-xs font-semibold text-slate-600 block mb-1">Approval Status</label>
                                <Select
                                    value={approvalStatusFilter}
                                    onValueChange={(value) => {
                                        setApprovalStatusFilter(value);
                                        setCurrentPage(1);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Approvals" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Approvals</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="approved">Approved</SelectItem>
                                        <SelectItem value="rejected">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="w-full sm:w-48">
                                <label className="text-xs font-semibold text-slate-600 block mb-1">Cost Allocation</label>
                                <Select
                                    value={costAllocationFilter}
                                    onValueChange={(value) => {
                                        setCostAllocationFilter(value);
                                        setCurrentPage(1);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Allocations" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Allocations</SelectItem>
                                        {allocationOptions.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="w-full sm:w-36 ml-auto flex flex-col justify-end">
                                <label className="text-xs font-semibold text-slate-600 block mb-1">Per Page</label>
                                <Select
                                    value={String(itemsPerPage)}
                                    onValueChange={(value) => {
                                        setItemsPerPage(Number(value));
                                        setCurrentPage(1);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="5 per page" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="2">2 cases</SelectItem>
                                        <SelectItem value="5">5 cases</SelectItem>
                                        <SelectItem value="10">10 cases</SelectItem>
                                        <SelectItem value="25">25 cases</SelectItem>
                                        <SelectItem value="50">50 cases</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>

                {paginatedRows.length === 0 ? (
                    <div className="rounded-md border bg-white p-8 text-sm text-slate-500 shadow-sm text-center">
                        No matching refund cases recorded.
                    </div>
                ) : (
                    paginatedRows.map((row) => {
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
                                            <p className="flex gap-1.5 items-center">
                                                <span className="text-slate-400 font-medium">User:</span>
                                                <span className="text-slate-900 font-semibold">
                                                    {row.user ? `${row.user.firstName} ${row.user.lastName} (${row.user.email})` : row.userId}
                                                </span>
                                            </p>
                                            <p className="flex gap-1.5 items-center">
                                                <span className="text-slate-400 font-medium">Payment:</span>
                                                <span className="text-slate-900 font-mono text-xs">{row.paymentId}</span>
                                            </p>
                                            <p className="flex gap-1.5 items-center">
                                                <span className="text-slate-400 font-medium">Return shipping:</span>
                                                <span className="text-slate-900 font-medium">{row.returnShippingPaidBy ?? "-"}</span>
                                            </p>
                                            <p className="flex gap-1.5 items-center">
                                                <span className="text-slate-400 font-medium">QC:</span>
                                                <span className="text-slate-900 font-medium">{row.returnQcStatus ?? "-"}</span>
                                            </p>
                                            <p className="flex gap-1.5 items-center">
                                                <span className="text-slate-400 font-medium">Reverse pickup:</span>
                                                <span className="text-slate-900 font-medium">
                                                    {row.reversePickupShipmentId ? "Created" : row.reversePickupRequired ? "Required" : "No"}
                                                </span>
                                            </p>
                                            <p className="flex gap-1.5 items-center">
                                                <span className="text-slate-400 font-medium">Payout impact:</span>
                                                <span className="text-slate-900 font-medium">
                                                    {row.costAllocation === "brand_fault" ? "Deduct next payout" : "Brand still gets paid"}
                                                </span>
                                            </p>
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

                {filteredRows.length > 0 && (
                    <div className="flex flex-col items-center justify-between gap-4 rounded-md border bg-white p-4 shadow-sm sm:flex-row">
                        <p className="text-sm text-slate-600">
                            Showing <span className="font-semibold text-slate-900">{startIndex + 1}</span> to{" "}
                            <span className="font-semibold text-slate-900">
                                {Math.min(startIndex + itemsPerPage, filteredRows.length)}
                            </span>{" "}
                            of <span className="font-semibold text-slate-900">{filteredRows.length}</span> cases
                        </p>
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            
                            <span className="text-sm font-medium text-slate-600">
                                Page <span className="font-semibold text-slate-900">{currentPage}</span> of{" "}
                                <span className="font-semibold text-slate-900">{totalPages}</span>
                            </span>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
