"use client";

import { Button } from "@/components/ui/button-dash";
import { Input } from "@/components/ui/input-dash";
import { trpc } from "@/lib/trpc/client";
import { formatINR, handleClientError } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

export function AdminRfqQueue({
    initialRfqs,
    initialQuotes,
}: {
    initialRfqs: any[];
    initialQuotes: any[];
}) {
    const utils = trpc.useUtils();
    const [drafts, setDrafts] = useState<Record<string, any>>({});

    const createQuote = trpc.general.corporatePlatform.createQuote.useMutation({
        onSuccess: async () => {
            toast.success("Quote created");
            await Promise.all([
                utils.general.corporatePlatform.listAdminRfqs.invalidate(),
                utils.general.corporatePlatform.listAdminQuotes.invalidate(),
            ]);
        },
        onError: (error) => handleClientError(error),
    });

    const addRevision = trpc.general.corporatePlatform.addQuoteRevision.useMutation({
        onSuccess: async () => {
            toast.success("Quote revision added");
            await utils.general.corporatePlatform.listAdminQuotes.invalidate();
        },
        onError: (error) => handleClientError(error),
    });

    const setDraft = (rfqId: string, key: string, value: string) => {
        setDrafts((current) => ({
            ...current,
            [rfqId]: {
                ...current[rfqId],
                [key]: value,
            },
        }));
    };

    return (
        <div className="space-y-6">
            <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
                <table className="w-full min-w-[1100px] text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                        <tr>
                            <th className="px-4 py-3">RFQ</th>
                            <th className="px-4 py-3">Company</th>
                            <th className="px-4 py-3">Use Case</th>
                            <th className="px-4 py-3">Qty</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Quote Builder</th>
                        </tr>
                    </thead>
                    <tbody>
                        {initialRfqs.map((rfq) => (
                            <tr key={rfq.id} className="border-t border-slate-100 align-top">
                                <td className="px-4 py-3 font-semibold text-slate-900">{rfq.rfqNumber}</td>
                                <td className="px-4 py-3">{rfq.companyName}</td>
                                <td className="px-4 py-3">{rfq.useCase}</td>
                                <td className="px-4 py-3">{rfq.quantity}</td>
                                <td className="px-4 py-3">{rfq.status}</td>
                                <td className="px-4 py-3">
                                    <div className="grid gap-2 md:grid-cols-2">
                                        <Input
                                            placeholder="Brand ID"
                                            value={drafts[rfq.id]?.brandId ?? ""}
                                            onChange={(e) => setDraft(rfq.id, "brandId", e.target.value)}
                                        />
                                        <Input
                                            placeholder="Profile ID"
                                            value={
                                                drafts[rfq.id]?.corporateProfileId ??
                                                rfq.corporateProfileId ??
                                                ""
                                            }
                                            onChange={(e) =>
                                                setDraft(rfq.id, "corporateProfileId", e.target.value)
                                            }
                                        />
                                        <Input
                                            placeholder="Subtotal INR"
                                            type="number"
                                            value={drafts[rfq.id]?.subtotal ?? ""}
                                            onChange={(e) => setDraft(rfq.id, "subtotal", e.target.value)}
                                        />
                                        <Input
                                            placeholder="GST INR"
                                            type="number"
                                            value={drafts[rfq.id]?.gst ?? ""}
                                            onChange={(e) => setDraft(rfq.id, "gst", e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        className="mt-3"
                                        onClick={() =>
                                            createQuote.mutate({
                                                rfqId: rfq.id,
                                                corporateProfileId:
                                                    drafts[rfq.id]?.corporateProfileId ??
                                                    rfq.corporateProfileId,
                                                brandId: drafts[rfq.id]?.brandId,
                                                quantity: rfq.quantity,
                                                subtotalPaise: Math.round(
                                                    Number(drafts[rfq.id]?.subtotal ?? 0) * 100
                                                ),
                                                customizationCostPaise: 0,
                                                gstAmountPaise: Math.round(
                                                    Number(drafts[rfq.id]?.gst ?? 0) * 100
                                                ),
                                                totalAmountPaise:
                                                    Math.round(
                                                        Number(drafts[rfq.id]?.subtotal ?? 0) * 100
                                                    ) +
                                                    Math.round(
                                                        Number(drafts[rfq.id]?.gst ?? 0) * 100
                                                    ),
                                                advanceAmountPaise: Math.round(
                                                    Number(drafts[rfq.id]?.subtotal ?? 0) * 30
                                                ),
                                                balanceAmountPaise: Math.round(
                                                    Number(drafts[rfq.id]?.subtotal ?? 0) * 70
                                                ),
                                            })
                                        }
                                        disabled={createQuote.isPending}
                                    >
                                        Create Quote
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Quote Revisions</h2>
                <div className="mt-4 space-y-3">
                    {initialQuotes.slice(0, 8).map((quote) => (
                        <div key={quote.id} className="rounded-xl border border-slate-200 p-4">
                            <div className="font-semibold text-slate-900">
                                {quote.quoteNumber} • {formatINR(quote.totalAmountPaise)}
                            </div>
                            <div className="mt-1 text-sm text-slate-500">
                                {quote.profile?.companyName ?? "Unknown company"} • {quote.status}
                            </div>
                            <Button
                                className="mt-3"
                                variant="outline"
                                onClick={() =>
                                    addRevision.mutate({
                                        quoteId: quote.id,
                                        subtotalPaise: quote.subtotalPaise,
                                        customizationCostPaise: quote.customizationCostPaise,
                                        gstAmountPaise: quote.gstAmountPaise,
                                        totalAmountPaise: quote.totalAmountPaise,
                                        comments: "Administrative revision snapshot",
                                    })
                                }
                                disabled={addRevision.isPending}
                            >
                                Add Revision Snapshot
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

