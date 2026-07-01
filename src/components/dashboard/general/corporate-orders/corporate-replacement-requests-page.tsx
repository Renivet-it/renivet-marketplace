"use client";

import {
    AdminMetricGrid,
    AdminPageIntro,
    AdminPanel,
    EmptyQueue,
    StatusBadge,
} from "@/components/corporate-platform/admin-design";
import { Button } from "@/components/ui/button-dash";
import { Input } from "@/components/ui/input-dash";
import { trpc } from "@/lib/trpc/client";
import { convertValueToLabel, handleClientError } from "@/lib/utils";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export function CorporateReplacementRequestsPage({
    initialRequests,
}: {
    initialRequests: any[];
}) {
    const utils = trpc.useUtils();
    const [search, setSearch] = useState("");
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
        initialRequests[0]?.id ?? null
    );
    const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
    const { data: requests = initialRequests } =
        trpc.general.corporatePlatform.listAdminReplacementRequests.useQuery(
            undefined,
            {
                initialData: initialRequests,
            }
        );
    const reviewReplacementRequest =
        trpc.general.corporatePlatform.reviewReplacementRequest.useMutation({
            onSuccess: async () => {
                toast.success("Replacement request updated");
                await utils.general.corporatePlatform.listAdminReplacementRequests.invalidate();
            },
            onError: (error) => handleClientError(error),
        });

    const filteredRequests = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return requests;

        return requests.filter((request: any) =>
            [
                request.order?.publicOrderId,
                request.order?.companyName,
                request.requestedBy?.email,
                request.reasonLabel,
                request.status,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(query)
        );
    }, [requests, search]);

    const requestedItems = filteredRequests.filter(
        (request: any) => request.status === "requested"
    );
    const completedItems = filteredRequests.filter(
        (request: any) => request.status !== "requested"
    );
    const selectedRequest =
        filteredRequests.find((request: any) => request.id === selectedRequestId) ??
        requestedItems[0] ??
        completedItems[0] ??
        null;

    return (
        <div className="space-y-6">
            <AdminPageIntro
                eyebrow="Replacement Operations"
                title="Review and approve corporate replacement requests"
                description="Keep replacement handling in one workspace. Review the customer reason, inspect the uploaded evidence, and approve or reject without digging through individual order detail pages."
                actions={
                    <div className="w-full md:w-80">
                        <Input
                            placeholder="Search order ID, company, customer, or reason"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                }
            />

            <AdminMetricGrid
                items={[
                    {
                        label: "Open Requests",
                        value: String(
                            requests.filter((request: any) => request.status === "requested")
                                .length
                        ),
                        tone: "gold",
                    },
                    {
                        label: "Approved",
                        value: String(
                            requests.filter((request: any) => request.status === "approved")
                                .length
                        ),
                        tone: "blue",
                    },
                    {
                        label: "Rejected",
                        value: String(
                            requests.filter((request: any) => request.status === "rejected")
                                .length
                        ),
                    },
                ]}
            />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,1.05fr)]">
                <div className="space-y-6">
                    <AdminPanel
                        title="Awaiting Review"
                        description="Fresh replacement requests that still need an admin decision."
                    >
                        <div className="space-y-3">
                            {requestedItems.length ? (
                                requestedItems.map((request: any) => (
                                    <ReplacementRequestCard
                                        key={request.id}
                                        request={request}
                                        active={selectedRequest?.id === request.id}
                                        onSelect={() => setSelectedRequestId(request.id)}
                                    />
                                ))
                            ) : (
                                <EmptyQueue
                                    title="No open replacement requests"
                                    description="New customer replacement submissions will appear here."
                                />
                            )}
                        </div>
                    </AdminPanel>

                    <AdminPanel
                        title="Reviewed Requests"
                        description="Previously approved or rejected replacement requests."
                    >
                        <div className="space-y-3">
                            {completedItems.length ? (
                                completedItems.map((request: any) => (
                                    <ReplacementRequestCard
                                        key={request.id}
                                        request={request}
                                        active={selectedRequest?.id === request.id}
                                        onSelect={() => setSelectedRequestId(request.id)}
                                    />
                                ))
                            ) : (
                                <EmptyQueue
                                    title="No reviewed requests yet"
                                    description="Approved and rejected items will appear here once the team starts reviewing them."
                                />
                            )}
                        </div>
                    </AdminPanel>
                </div>

                <AdminPanel
                    title="Replacement Review Desk"
                    description="Inspect the issue, validate evidence photos, and decide whether a replacement order should be generated."
                    className="xl:sticky xl:top-6 xl:self-start"
                >
                    {selectedRequest ? (
                        <div className="space-y-5">
                            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <StatusBadge tone="blue">
                                        {selectedRequest.order?.publicOrderId ?? "Order"}
                                    </StatusBadge>
                                    <StatusBadge
                                        tone={
                                            selectedRequest.status === "approved"
                                                ? "green"
                                                : selectedRequest.status === "rejected"
                                                  ? "rose"
                                                  : "amber"
                                        }
                                    >
                                        {convertValueToLabel(selectedRequest.status)}
                                    </StatusBadge>
                                </div>
                                <div className="mt-3 text-lg font-semibold text-slate-900">
                                    {selectedRequest.order?.companyName ?? "Corporate customer"}
                                </div>
                                <div className="mt-1 text-sm text-slate-500">
                                    Requested by{" "}
                                    {selectedRequest.requestedBy?.email ??
                                        selectedRequest.order?.emailAddress ??
                                        "Customer"}
                                </div>
                                <div className="mt-3 grid gap-3 md:grid-cols-2">
                                    <InfoTile
                                        label="Reason"
                                        value={selectedRequest.reasonLabel}
                                    />
                                    <InfoTile
                                        label="Quantity"
                                        value={`${selectedRequest.requestedQuantity} unit(s)`}
                                    />
                                </div>
                                {selectedRequest.rtoShipment ? (
                                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                                        <InfoTile
                                            label="Corporate RTO Status"
                                            value={convertValueToLabel(
                                                selectedRequest.rtoShipment.status
                                            )}
                                        />
                                        <InfoTile
                                            label="Original AWB"
                                            value={
                                                selectedRequest.rtoShipment
                                                    .originalAwbNumber || "Not linked"
                                            }
                                        />
                                    </div>
                                ) : null}
                                {selectedRequest.reasonDetails ? (
                                    <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
                                        {selectedRequest.reasonDetails}
                                    </div>
                                ) : null}
                                <div className="mt-4 flex flex-wrap gap-3">
                                    <Link
                                        href={`/dashboard/general/corporate-orders/${selectedRequest.orderId}`}
                                        className="text-sm font-semibold text-sky-700 underline-offset-4 hover:underline"
                                    >
                                        Open source order
                                    </Link>
                                    {selectedRequest.replacementOrder?.id ? (
                                        <Link
                                            href={`/dashboard/general/corporate-orders/${selectedRequest.replacementOrder.id}`}
                                            className="text-sm font-semibold text-emerald-700 underline-offset-4 hover:underline"
                                        >
                                            Open replacement order
                                        </Link>
                                    ) : null}
                                </div>
                            </div>

                            <div>
                                <div className="text-sm font-semibold text-slate-900">
                                    Evidence Photos
                                </div>
                                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                    {selectedRequest.photos?.length ? (
                                        selectedRequest.photos.map((photo: any, index: number) => (
                                            <a
                                                key={`${selectedRequest.id}-${index}`}
                                                href={photo.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                                            >
                                                <img
                                                    src={photo.url}
                                                    alt={photo.name ?? `Evidence ${index + 1}`}
                                                    className="h-40 w-full object-cover"
                                                />
                                                <div className="p-3 text-xs font-medium text-slate-700">
                                                    {photo.name ?? `Evidence ${index + 1}`}
                                                </div>
                                            </a>
                                        ))
                                    ) : (
                                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                                            No photos uploaded.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {selectedRequest.status === "requested" ? (
                                <div className="space-y-3">
                                    <textarea
                                        className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        placeholder="Internal note for the review decision"
                                        value={adminNotes[selectedRequest.id] ?? ""}
                                        onChange={(e) =>
                                            setAdminNotes((current) => ({
                                                ...current,
                                                [selectedRequest.id]: e.target.value,
                                            }))
                                        }
                                    />
                                    <div className="flex flex-wrap gap-3">
                                        <Button
                                            onClick={() =>
                                                reviewReplacementRequest.mutate({
                                                    requestId: selectedRequest.id,
                                                    decision: "approved",
                                                    adminNote:
                                                        adminNotes[selectedRequest.id] ||
                                                        null,
                                                })
                                            }
                                            disabled={reviewReplacementRequest.isPending}
                                        >
                                            {reviewReplacementRequest.isPending
                                                ? "Processing..."
                                                : "Approve & Create Replacement Order"}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                reviewReplacementRequest.mutate({
                                                    requestId: selectedRequest.id,
                                                    decision: "rejected",
                                                    adminNote:
                                                        adminNotes[selectedRequest.id] ||
                                                        null,
                                                })
                                            }
                                            disabled={reviewReplacementRequest.isPending}
                                        >
                                            Reject Request
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        Review Outcome
                                    </div>
                                    <div className="mt-2 text-sm leading-6 text-slate-700">
                                        {selectedRequest.adminNote || "No admin note added."}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <EmptyQueue
                            title="No replacement request selected"
                            description="Choose a request from the queue to review its details."
                        />
                    )}
                </AdminPanel>
            </div>
        </div>
    );
}

function ReplacementRequestCard({
    request,
    active,
    onSelect,
}: {
    request: any;
    active: boolean;
    onSelect: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={`w-full rounded-[22px] border p-4 text-left transition ${
                active
                    ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
            }`}
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-semibold">
                    {request.order?.publicOrderId ?? "Corporate order"}
                </div>
                <StatusBadge
                    tone={
                        request.status === "approved"
                            ? "green"
                            : request.status === "rejected"
                              ? "rose"
                              : "amber"
                    }
                >
                    {convertValueToLabel(request.status)}
                </StatusBadge>
            </div>
            <div
                className={`mt-2 text-sm ${
                    active ? "text-slate-200" : "text-slate-600"
                }`}
            >
                {request.order?.companyName ?? "Corporate account"} • {request.reasonLabel}
            </div>
            <div
                className={`mt-1 text-xs ${
                    active ? "text-slate-300" : "text-slate-500"
                }`}
            >
                {request.requestedQuantity} unit(s) •{" "}
                {new Date(request.createdAt).toLocaleDateString("en-IN")}
            </div>
        </button>
    );
}

function InfoTile({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                {label}
            </div>
            <div className="mt-2 text-sm font-medium text-slate-900">{value}</div>
        </div>
    );
}
