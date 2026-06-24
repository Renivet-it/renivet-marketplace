"use client";

import { Button } from "@/components/ui/button-general";
import { Input } from "@/components/ui/input-general";
import { trpc } from "@/lib/trpc/client";
import { formatINR, handleClientError } from "@/lib/utils";
import { useUploadThing } from "@/lib/uploadthing";
import type { ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";

export function CustomerCorporateDashboard({
    initialProfile,
    initialRfqs,
    initialQuotes,
    initialOrders,
}: {
    initialProfile: any;
    initialRfqs: any[];
    initialQuotes: any[];
    initialOrders: any[];
}) {
    const utils = trpc.useUtils();
    const { startUpload } = useUploadThing("corporateDocumentUploader");
    const [poFiles, setPoFiles] = useState<Record<string, File | null>>({});
    const [poNumbers, setPoNumbers] = useState<Record<string, string>>({});

    const quoteDecision = trpc.general.corporatePlatform.decideQuote.useMutation({
        onSuccess: async () => {
            toast.success("Quote updated");
            await utils.general.corporatePlatform.listMyQuotes.invalidate();
        },
        onError: (error) => handleClientError(error),
    });

    const createPo = trpc.general.corporatePlatform.createPurchaseOrder.useMutation({
        onSuccess: () => toast.success("Purchase order uploaded"),
        onError: (error) => handleClientError(error),
    });

    const submitPo = async (quote: any) => {
        try {
            const file = poFiles[quote.id];
            const poNumber = poNumbers[quote.id];
            if (!file || !poNumber) {
                return toast.error("Add both PO number and uploaded file");
            }

            const uploaded = await startUpload([file]);
            const uploadedFile = uploaded?.[0];
            if (!uploadedFile) {
                return toast.error("PO upload failed");
            }

            await createPo.mutateAsync({
                quoteId: quote.id,
                corporateProfileId: initialProfile?.id ?? null,
                poNumber,
                poValuePaise: quote.totalAmountPaise,
                uploadedFile: {
                    name: uploadedFile.name,
                    size: uploadedFile.size,
                    url: uploadedFile.url,
                    key: uploadedFile.key,
                    type: (uploadedFile as any).type ?? "application/octet-stream",
                },
            });
        } catch (error) {
            handleClientError(error);
        }
    };

    return (
        <div className="space-y-8">
            <section className="rounded-[28px] border border-[#dbe5f0] bg-[linear-gradient(135deg,#ffffff_0%,#f5f9fd_55%,#edf4fb_100%)] p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#5B9BD5]">
                    Corporate Dashboard
                </p>
                <h1 className="mt-3 font-serif text-3xl font-semibold text-slate-900">
                    RFQs, quotes, and orders in one place
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                    {initialProfile
                        ? `Corporate profile active for ${initialProfile.companyName}.`
                        : "No corporate profile found yet. Submit an RFQ or use the legacy corporate order flow to get started."}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                    <a
                        href="/corporate"
                        className="rounded-full bg-[#5B9BD5] px-5 py-3 text-sm font-semibold text-white"
                    >
                        Browse Corporate Hub
                    </a>
                    <a
                        href="/corporate/request-quote"
                        className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900"
                    >
                        New RFQ
                    </a>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
                <Metric label="RFQs" value={String(initialRfqs.length)} />
                <Metric label="Quotes" value={String(initialQuotes.length)} />
                <Metric label="Orders" value={String(initialOrders.length)} />
            </section>

            <section className="grid gap-6 xl:grid-cols-3">
                <Panel title="Recent RFQs">
                    {initialRfqs.length ? (
                        initialRfqs.slice(0, 5).map((rfq) => (
                            <Row
                                key={rfq.id}
                                title={rfq.rfqNumber}
                                meta={`${rfq.useCase} • ${rfq.status}`}
                            />
                        ))
                    ) : (
                        <Empty label="No RFQs yet" />
                    )}
                </Panel>

                <Panel title="Quotes Requiring Action">
                    {initialQuotes.length ? (
                        initialQuotes.slice(0, 5).map((quote) => (
                            <div key={quote.id} className="rounded-2xl border border-slate-200 p-4">
                                <div className="font-semibold text-slate-900">
                                    {quote.quoteNumber}
                                </div>
                                <div className="mt-1 text-sm text-slate-500">
                                    {quote.status} • {formatINR(quote.totalAmountPaise)}
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <Button
                                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                                        onClick={() =>
                                            quoteDecision.mutate({
                                                quoteId: quote.id,
                                                decision: "approved",
                                                notes: "Approved from customer dashboard",
                                            })
                                        }
                                    >
                                        Approve
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            quoteDecision.mutate({
                                                quoteId: quote.id,
                                                decision: "revision_requested",
                                                notes: "Revision requested from customer dashboard",
                                            })
                                        }
                                    >
                                        Request Revision
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            quoteDecision.mutate({
                                                quoteId: quote.id,
                                                decision: "rejected",
                                                notes: "Rejected from customer dashboard",
                                            })
                                        }
                                    >
                                        Reject
                                    </Button>
                                </div>
                                <div className="mt-4 space-y-2 rounded-2xl bg-slate-50 p-3">
                                    <Input
                                        placeholder="PO number for enterprise approval"
                                        value={poNumbers[quote.id] ?? ""}
                                        onChange={(e) =>
                                            setPoNumbers((current) => ({
                                                ...current,
                                                [quote.id]: e.target.value,
                                            }))
                                        }
                                    />
                                    <input
                                        type="file"
                                        className="block w-full text-sm"
                                        onChange={(e) =>
                                            setPoFiles((current) => ({
                                                ...current,
                                                [quote.id]: e.target.files?.[0] ?? null,
                                            }))
                                        }
                                    />
                                    <Button
                                        variant="outline"
                                        onClick={() => submitPo(quote)}
                                        disabled={createPo.isPending}
                                    >
                                        Upload PO
                                    </Button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <Empty label="No quotes yet" />
                    )}
                </Panel>

                <Panel title="Legacy Orders">
                    {initialOrders.length ? (
                        initialOrders.slice(0, 5).map((order) => (
                            <Row
                                key={order.id}
                                title={order.publicOrderId}
                                meta={`${order.status} • ${formatINR(order.totalPaise)}`}
                            />
                        ))
                    ) : (
                        <Empty label="No legacy orders yet" />
                    )}
                </Panel>
            </section>
        </div>
    );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <div className="mt-4 space-y-3">{children}</div>
        </div>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {label}
            </div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">{value}</div>
        </div>
    );
}

function Row({ title, meta }: { title: string; meta: string }) {
    return (
        <div className="rounded-2xl border border-slate-200 px-4 py-3">
            <div className="font-semibold text-slate-900">{title}</div>
            <div className="mt-1 text-sm text-slate-500">{meta}</div>
        </div>
    );
}

function Empty({ label }: { label: string }) {
    return <div className="text-sm text-slate-500">{label}</div>;
}
