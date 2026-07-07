"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button-dash";
import { Input } from "@/components/ui/input-dash";
import { Textarea } from "@/components/ui/textarea-dash";
import { trpc } from "@/lib/trpc/client";
import { useMemo, useState } from "react";

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    pending: "secondary",
    identity_check: "outline",
    in_progress: "default",
    completed: "secondary",
    rejected: "destructive",
};

export function DataDeletionWorkspace() {
    const [status, setStatus] = useState<string>("");
    const [activeId, setActiveId] = useState<string | null>(null);
    const [notes, setNotes] = useState("");
    const [rejectionReason, setRejectionReason] = useState("");
    const utils = trpc.useUtils();

    const requestsQuery = trpc.general.financeCompliance.listDataDeletionRequests.useQuery(
        status ? { status } : undefined
    );

    const reviewRequest = trpc.general.financeCompliance.reviewDataDeletionRequest.useMutation({
        onSuccess: async () => {
            await utils.general.financeCompliance.listDataDeletionRequests.invalidate();
            setNotes("");
            setRejectionReason("");
        },
    });
    const executeRequest =
        trpc.general.financeCompliance.executeDataDeletionRequest.useMutation({
            onSuccess: async () => {
                await utils.general.financeCompliance.listDataDeletionRequests.invalidate();
            },
        });
    const runSlaSweep = trpc.general.financeCompliance.runDataDeletionSlaSweep.useMutation();

    const activeRequest = useMemo(
        () => requestsQuery.data?.find((item) => item.id === activeId) ?? null,
        [activeId, requestsQuery.data]
    );

    return (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="overflow-hidden rounded-md border bg-white shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
                    <div>
                        <p className="text-sm font-semibold text-slate-900">Deletion queue</p>
                        <p className="text-xs text-slate-500">
                            Verified requests must be completed within 7 days.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Input
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                            placeholder="Filter by status"
                            className="h-9 w-36"
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => runSlaSweep.mutate()}
                            disabled={runSlaSweep.isPending}
                        >
                            Run SLA Sweep
                        </Button>
                    </div>
                </div>

                <div className="divide-y">
                    {requestsQuery.data?.length ? (
                        requestsQuery.data.map((row) => (
                            <button
                                key={row.id}
                                type="button"
                                onClick={() => setActiveId(row.id)}
                                className="grid w-full grid-cols-[1.2fr_0.7fr_0.9fr] gap-3 px-4 py-3 text-left hover:bg-slate-50"
                            >
                                <div>
                                    <p className="font-medium text-slate-900">{row.userEmail}</p>
                                    <p className="text-xs text-slate-500">{row.id}</p>
                                </div>
                                <div>
                                    <Badge variant={STATUS_COLORS[row.status] ?? "outline"}>
                                        {row.status}
                                    </Badge>
                                </div>
                                <div className="text-xs text-slate-500">
                                    {row.requestedAt.toLocaleDateString()}
                                </div>
                            </button>
                        ))
                    ) : (
                        <p className="p-6 text-sm text-slate-500">No deletion requests found.</p>
                    )}
                </div>
            </section>

            <section className="rounded-md border bg-white p-4 shadow-sm">
                {activeRequest ? (
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-semibold text-slate-900">{activeRequest.userEmail}</p>
                            <p className="text-xs text-slate-500">{activeRequest.id}</p>
                        </div>

                        <div className="space-y-2 text-sm text-slate-600">
                            <p>Status: {activeRequest.status}</p>
                            <p>
                                Verified:{" "}
                                {activeRequest.identityVerifiedAt
                                    ? activeRequest.identityVerifiedAt.toLocaleString()
                                    : "Pending email verification"}
                            </p>
                            <p>Notes: {activeRequest.notes || "-"}</p>
                            <p>Rejection reason: {activeRequest.rejectionReason || "-"}</p>
                        </div>

                        <Textarea
                            minRows={3}
                            value={notes}
                            onChange={(event) => setNotes(event.target.value)}
                            placeholder="Review or execution notes"
                        />
                        <Textarea
                            minRows={2}
                            value={rejectionReason}
                            onChange={(event) => setRejectionReason(event.target.value)}
                            placeholder="Rejection reason if rejecting"
                        />

                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    reviewRequest.mutate({
                                        id: activeRequest.id,
                                        status: "pending",
                                        notes: notes || undefined,
                                    })
                                }
                            >
                                Mark Pending
                            </Button>
                            <Button
                                size="sm"
                                onClick={() =>
                                    reviewRequest.mutate({
                                        id: activeRequest.id,
                                        status: "in_progress",
                                        notes: notes || undefined,
                                    })
                                }
                            >
                                Start Execution
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                    reviewRequest.mutate({
                                        id: activeRequest.id,
                                        status: "rejected",
                                        notes: notes || undefined,
                                        rejectionReason: rejectionReason || undefined,
                                    })
                                }
                            >
                                Reject
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => executeRequest.mutate({ id: activeRequest.id })}
                            >
                                Execute Deletion
                            </Button>
                        </div>

                        <div className="rounded-md border bg-slate-50 p-3 text-xs text-slate-600">
                            <p className="font-semibold text-slate-900">Retention scope</p>
                            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap">
                                {JSON.stringify(activeRequest.retentionScope ?? {}, null, 2)}
                            </pre>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-slate-500">Select a deletion request to review or execute it.</p>
                )}
            </section>
        </div>
    );
}
