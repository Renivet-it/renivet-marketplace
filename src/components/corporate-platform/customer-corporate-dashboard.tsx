"use client";

import { Button } from "@/components/ui/button-general";
import { Input } from "@/components/ui/input-general";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    const [poScopes, setPoScopes] = useState<Record<string, string>>({});
    const [poSignatories, setPoSignatories] = useState<Record<string, string>>({});
    const [poSectionsOpen, setPoSectionsOpen] = useState<Record<string, boolean>>({});
    const [revisionRequests, setRevisionRequests] = useState<
        Record<
            string,
            {
                open?: boolean;
                price?: boolean;
                quantity?: boolean;
                branding?: boolean;
                timeline?: boolean;
                specification?: boolean;
                notes?: string;
            }
        >
    >({});

    const quoteDecision = trpc.general.corporatePlatform.decideQuote.useMutation({
        onSuccess: async () => {
            toast.success("Quote updated");
            await Promise.all([
                utils.general.corporatePlatform.listMyQuotes.invalidate(),
                utils.general.corporatePlatform.listMyRfqs.invalidate(),
            ]);
        },
        onError: (error) => handleClientError(error),
    });

    const createPo = trpc.general.corporatePlatform.createPurchaseOrder.useMutation({
        onSuccess: async () => {
            toast.success("Purchase order uploaded");
            await Promise.all([
                utils.general.corporatePlatform.listMyQuotes.invalidate(),
                utils.general.corporatePlatform.listMyRfqs.invalidate(),
            ]);
        },
        onError: (error) => handleClientError(error),
    });

    const submitPo = async (quote: any) => {
        try {
            if (!initialProfile?.id || !initialProfile?.companyName) {
                return toast.error(
                    "Your company profile is missing. Please submit a request for quotation first."
                );
            }
            const file = poFiles[quote.id];
            const poNumber = poNumbers[quote.id];
            const productScopeSummary = poScopes[quote.id];
            const authorizedSignatoryName = poSignatories[quote.id];
            if (!file || !poNumber || !productScopeSummary || !authorizedSignatoryName) {
                return toast.error(
                    "Add purchase order number, product scope, authorized signatory, and the uploaded file"
                );
            }

            const uploaded = await startUpload([file]);
            const uploadedFile = uploaded?.[0];
            if (!uploadedFile) {
                return toast.error("Purchase order upload failed");
            }

            await createPo.mutateAsync({
                quoteId: quote.id,
                corporateProfileId: initialProfile.id,
                poNumber,
                companyName: initialProfile.companyName,
                poValuePaise: quote.totalAmountPaise,
                productScopeSummary,
                authorizedSignatoryName,
                authorizedSignatoryConfirmed: true,
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

    const purchaseOrdersReadyCount = initialQuotes.filter(
        (quote) => quote.status === "approved"
    ).length;
    const paidOrdersCount = initialOrders.filter(
        (order) => order.paymentStatus === "paid"
    ).length;
    const deliveredOrdersCount = initialOrders.filter(
        (order) => order.status === "delivered"
    ).length;
    const quotesNeedingAction = initialQuotes.filter((quote) =>
        ["sent", "quote_sent", "customer_review", "revision_requested"].includes(
            String(quote.status)
        )
    );

    const setRevisionDraft = (
        quoteId: string,
        key: string,
        value: boolean | string
    ) => {
        setRevisionRequests((current) => ({
            ...current,
            [quoteId]: {
                ...current[quoteId],
                [key]: value,
            },
        }));
    };

    const buildRevisionNotes = (quoteId: string) => {
        const draft = revisionRequests[quoteId] ?? {};
        const requestedChanges = [
            draft.price ? "pricing" : null,
            draft.quantity ? "quantity" : null,
            draft.branding ? "branding or customization" : null,
            draft.timeline ? "delivery timeline" : null,
            draft.specification ? "product specification" : null,
        ].filter(Boolean);

        const parts: string[] = [];
        if (requestedChanges.length) {
            parts.push(`Please revise: ${requestedChanges.join(", ")}.`);
        }
        if (draft.notes?.trim()) {
            parts.push(draft.notes.trim());
        }

        return parts.join(" ");
    };

    const togglePoSection = (quoteId: string) => {
        setPoSectionsOpen((current) => ({
            ...current,
            [quoteId]: !current[quoteId],
        }));
    };

    return (
        <div className="w-full space-y-8 pb-6">
            <section className="overflow-hidden rounded-[32px] border border-[#d7e2ef] bg-[linear-gradient(135deg,#f7fbff_0%,#f2f7fc_48%,#ffffff_100%)] shadow-[0_30px_80px_-55px_rgba(38,73,108,0.26)]">
                <div className="grid gap-6 p-6 md:p-8 xl:grid-cols-[minmax(0,1.55fr)_320px]">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#5B9BD5]">
                            Corporate Procurement Hub
                        </p>
                        <h1 className="mt-4 max-w-3xl font-serif text-3xl font-semibold leading-tight text-slate-900 md:text-4xl 2xl:text-5xl">
                            Corporate buying made simple for your team
                        </h1>
                        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
                            {initialProfile
                                ? `Welcome back, ${initialProfile.companyName}. Start a self-service order, request a managed quotation, review quotes, and track progress from one clear workspace.`
                                : "Choose the buying path that fits your business. Start a self-service order for standard bulk purchases, or request a managed quotation when you need sourcing and customization support."}
                        </p>

                        <div className="mt-8 grid gap-4 xl:grid-cols-2">
                            <ActionCard
                                eyebrow="Fastest Route"
                                title="Self-Service Ordering"
                                description="Browse catalog-led products, configure quantity and branding, review pricing, and place the order directly."
                                href="/profile/corporate/self-service"
                                cta="Start Self-Service Ordering"
                                tone="dark"
                            />
                            <ActionCard
                                eyebrow="Managed Route"
                                title="Request a Custom Quotation"
                                description="Share the requirement and let Renivet prepare sourcing, pricing, and the full business quotation workflow."
                                href="/profile/corporate/request-quote"
                                cta="Start Managed Procurement"
                                tone="light"
                            />
                        </div>
                    </div>

                    <div className="space-y-4 xl:pl-2">
                        <SurfacePanel
                            title="Company Snapshot"
                            className="bg-white/85 backdrop-blur"
                        >
                            {initialProfile ? (
                                <div className="space-y-4">
                                    <HeroStat
                                        label="Buyer Company"
                                        value={initialProfile.companyName}
                                    />
                                    <div className="grid gap-3">
                                        <DetailLine
                                            label="Contact"
                                            value={initialProfile.contactPerson}
                                        />
                                        <DetailLine
                                            label="Email"
                                            value={initialProfile.email}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <Empty label="Your company profile will be created automatically from your first request for quotation." />
                            )}
                        </SurfacePanel>

                        <SurfacePanel
                            title="Need Help Next?"
                            description="Enterprise purchase order upload becomes available after quote approval."
                            className="bg-[#23311c] text-white"
                            inverse
                        >
                            <div className="space-y-3">
                                <MiniPill
                                    label={
                                        quotesNeedingAction.length
                                            ? `${quotesNeedingAction.length} quote(s) awaiting your decision`
                                            : "No pending quote approvals right now"
                                    }
                                    dark
                                />
                                <MiniPill
                                    label={
                                        purchaseOrdersReadyCount
                                            ? `${purchaseOrdersReadyCount} approved quote(s) ready for purchase order upload`
                                            : "Purchase order route activates after quote approval"
                                    }
                                    dark
                                />
                            </div>
                        </SurfacePanel>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                <MetricCard
                    label="Requests for Quotation"
                    value={String(initialRfqs.length)}
                    hint="Managed buying requests submitted"
                />
                <MetricCard
                    label="Quotes"
                    value={String(initialQuotes.length)}
                    hint="Commercial drafts received"
                />
                <MetricCard
                    label="Orders"
                    value={String(initialOrders.length)}
                    hint="Corporate orders created"
                />
                <MetricCard
                    label="Purchase Orders"
                    value={String(purchaseOrdersReadyCount)}
                    hint="Approved and ready for upload"
                />
                <MetricCard
                    label="Payments"
                    value={String(paidOrdersCount)}
                    hint="Collected payments"
                />
                <MetricCard
                    label="Fulfillment"
                    value={String(deliveredOrdersCount)}
                    hint="Delivered corporate orders"
                />
            </section>

            <Tabs defaultValue="overview" className="space-y-6">
                <div className="rounded-[28px] border border-slate-200 bg-white p-3 shadow-[0_24px_70px_-50px_rgba(15,23,42,0.24)]">
                    <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-[22px] bg-slate-50 p-2 md:grid-cols-5">
                        <TabsTrigger value="overview" className="rounded-[18px] py-3 text-sm font-semibold">
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="requests" className="rounded-[18px] py-3 text-sm font-semibold">
                            Requests
                        </TabsTrigger>
                        <TabsTrigger value="quotes" className="rounded-[18px] py-3 text-sm font-semibold">
                            Quotes
                        </TabsTrigger>
                        <TabsTrigger value="orders" className="rounded-[18px] py-3 text-sm font-semibold">
                            Orders
                        </TabsTrigger>
                        <TabsTrigger value="company" className="rounded-[18px] py-3 text-sm font-semibold">
                            Company
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="overview" className="mt-0">
                    <section className="grid gap-6 xl:grid-cols-12">
                        <SurfacePanel
                            title="Quotes Requiring Action"
                            description="This is the most important area for your team after a quotation is shared."
                            className="xl:col-span-6"
                        >
                            {initialQuotes.length ? (
                                <div className="space-y-3">
                                    {initialQuotes.slice(0, 2).map((quote) => (
                                        <CompactQuoteCard
                                            key={quote.id}
                                            quote={quote}
                                            poNumber={poNumbers[quote.id] ?? ""}
                                            onPoNumberChange={(value) =>
                                                setPoNumbers((current) => ({
                                                    ...current,
                                                    [quote.id]: value,
                                                }))
                                            }
                                            onFileChange={(file) =>
                                                setPoFiles((current) => ({
                                                    ...current,
                                                    [quote.id]: file,
                                                }))
                                            }
                                            onApprove={() =>
                                                quoteDecision.mutate({
                                                    quoteId: quote.id,
                                                    decision: "approved",
                                                    notes: "Approved from customer dashboard",
                                                })
                                            }
                                            onRevision={() =>
                                                quoteDecision.mutate({
                                                    quoteId: quote.id,
                                                    decision: "revision_requested",
                                                    notes:
                                                        buildRevisionNotes(quote.id) ||
                                                        "Customer requested a revision.",
                                                })
                                            }
                                            onReject={() =>
                                                quoteDecision.mutate({
                                                    quoteId: quote.id,
                                                    decision: "rejected",
                                                    notes: "Rejected from customer dashboard",
                                                })
                                            }
                                            onUploadPo={() => submitPo(quote)}
                                            uploadPending={createPo.isPending}
                                            poSectionOpen={!!poSectionsOpen[quote.id]}
                                            onTogglePoSection={() => togglePoSection(quote.id)}
                                            poScope={poScopes[quote.id] ?? ""}
                                            onPoScopeChange={(value) =>
                                                setPoScopes((current) => ({
                                                    ...current,
                                                    [quote.id]: value,
                                                }))
                                            }
                                            signatoryName={poSignatories[quote.id] ?? ""}
                                            onSignatoryNameChange={(value) =>
                                                setPoSignatories((current) => ({
                                                    ...current,
                                                    [quote.id]: value,
                                                }))
                                            }
                                            revisionDraft={revisionRequests[quote.id] ?? {}}
                                            onToggleRevisionOpen={() =>
                                                setRevisionDraft(
                                                    quote.id,
                                                    "open",
                                                    !(revisionRequests[quote.id]?.open ?? false)
                                                )
                                            }
                                            onRevisionFieldChange={(key, value) =>
                                                setRevisionDraft(quote.id, key, value)
                                            }
                                        />
                                    ))}
                                </div>
                            ) : (
                                <Empty label="No quotes need action yet." />
                            )}
                        </SurfacePanel>

                        <SurfacePanel
                            title="Recent Requests"
                            description="Track the latest quotation requests your team has submitted."
                            className="xl:col-span-3"
                        >
                            {initialRfqs.length ? (
                                <div className="space-y-3">
                                    {initialRfqs.slice(0, 3).map((rfq) => (
                                        <ListCard
                                            key={rfq.id}
                                            title={rfq.rfqNumber}
                                            subtitle={rfq.useCase}
                                            meta={toLabel(rfq.status)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <Empty label="No requests for quotation yet." />
                            )}
                        </SurfacePanel>

                        <SurfacePanel
                            title="Current Orders"
                            description="Live visibility into active corporate orders."
                            className="xl:col-span-3"
                        >
                            {initialOrders.length ? (
                                <div className="space-y-3">
                                    {initialOrders.slice(0, 3).map((order) => (
                                        <ListCard
                                            key={order.id}
                                            title={order.publicOrderId}
                                            subtitle={formatINR(order.totalPaise)}
                                            meta={toLabel(order.status)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <Empty label="No corporate orders yet." />
                            )}
                        </SurfacePanel>
                    </section>
                </TabsContent>

                <TabsContent value="requests" className="mt-0">
                    <SurfacePanel
                        title="Request History"
                        description="Track every request for quotation submitted by your team."
                    >
                        {initialRfqs.length ? (
                            <div className="grid gap-4 xl:grid-cols-2">
                                {initialRfqs.map((rfq) => (
                                    <ListCard
                                        key={rfq.id}
                                        title={rfq.rfqNumber}
                                        subtitle={rfq.useCase}
                                        meta={toLabel(rfq.status)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <Empty label="No requests for quotation yet." />
                        )}
                    </SurfacePanel>
                </TabsContent>

                <TabsContent value="quotes" className="mt-0">
                    <SurfacePanel
                        title="Quotes Requiring Action"
                        description="Approve, revise, reject, or upload a purchase order from one focused view."
                    >
                        {initialQuotes.length ? (
                            <div className="space-y-4">
                                {initialQuotes.map((quote) => (
                                    (() => {
                                        const isApproved = quote.status === "approved";
                                        const isRejected = quote.status === "rejected";
                                        const canDecide = !isApproved && !isRejected;
                                        return (
                                    <div
                                        key={quote.id}
                                        className="rounded-[24px] border border-[#d8e3ef] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbfe_100%)] p-5"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-4">
                                            <div>
                                                <div className="text-xl font-semibold text-slate-900">
                                                    {quote.quoteNumber}
                                                </div>
                                                <div className="mt-1 text-sm text-slate-500">
                                                    {toLabel(quote.status)} - {formatINR(quote.totalAmountPaise)}
                                                </div>
                                            </div>
                                            <StatusChip label={toLabel(quote.status)} />
                                        </div>

                                        {canDecide ? (
                                        <div className="mt-4 flex flex-wrap gap-2">
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
                                                Approve Quote
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() =>
                                                    setRevisionDraft(
                                                        quote.id,
                                                        "open",
                                                        !(revisionRequests[quote.id]?.open ?? false)
                                                    )
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
                                        ) : (
                                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                            {isApproved
                                                ? "Quote approved. If your company uses purchase orders, upload it below."
                                                : "Quote rejected. This quote is now closed."}
                                        </div>
                                        )}

                                        {canDecide && revisionRequests[quote.id]?.open ? (
                                            <div className="mt-5 rounded-[22px] border border-amber-200 bg-amber-50 p-4">
                                                <div className="text-sm font-semibold text-slate-900">
                                                    Tell us what should be revised
                                                </div>
                                                <div className="mt-1 text-sm leading-6 text-slate-600">
                                                    Select what needs to change and add a short note so the team knows exactly what to update.
                                                </div>
                                                <div className="mt-4 grid gap-3 md:grid-cols-2">
                                                    <RevisionCheck
                                                        label="Pricing"
                                                        checked={!!revisionRequests[quote.id]?.price}
                                                        onChange={(checked) =>
                                                            setRevisionDraft(quote.id, "price", checked)
                                                        }
                                                    />
                                                    <RevisionCheck
                                                        label="Quantity"
                                                        checked={!!revisionRequests[quote.id]?.quantity}
                                                        onChange={(checked) =>
                                                            setRevisionDraft(quote.id, "quantity", checked)
                                                        }
                                                    />
                                                    <RevisionCheck
                                                        label="Branding or customization"
                                                        checked={!!revisionRequests[quote.id]?.branding}
                                                        onChange={(checked) =>
                                                            setRevisionDraft(quote.id, "branding", checked)
                                                        }
                                                    />
                                                    <RevisionCheck
                                                        label="Delivery timeline"
                                                        checked={!!revisionRequests[quote.id]?.timeline}
                                                        onChange={(checked) =>
                                                            setRevisionDraft(quote.id, "timeline", checked)
                                                        }
                                                    />
                                                    <RevisionCheck
                                                        label="Product specification"
                                                        checked={!!revisionRequests[quote.id]?.specification}
                                                        onChange={(checked) =>
                                                            setRevisionDraft(quote.id, "specification", checked)
                                                        }
                                                    />
                                                </div>
                                                <textarea
                                                    className="mt-4 min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400"
                                                    placeholder="Example: Please revise the price for 250 units and change the branding method to print instead of embroidery."
                                                    value={revisionRequests[quote.id]?.notes ?? ""}
                                                    onChange={(e) =>
                                                        setRevisionDraft(quote.id, "notes", e.target.value)
                                                    }
                                                />
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() =>
                                                            quoteDecision.mutate({
                                                                quoteId: quote.id,
                                                                decision: "revision_requested",
                                                                notes:
                                                                    buildRevisionNotes(quote.id) ||
                                                                    "Customer requested a revision.",
                                                            })
                                                        }
                                                    >
                                                        Send Revision Request
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() =>
                                                            setRevisionDraft(quote.id, "open", false)
                                                        }
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : null}

                                        {isApproved ? (
                                            <div className="mt-5 rounded-[22px] border border-slate-200 bg-white p-4">
                                                <div className="mb-3 text-sm font-semibold text-slate-900">
                                                    Next step after approval
                                                </div>
                                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                                    If your company does not use purchase orders, no action is needed here. Renivet will continue from the approved quote and your order will appear in the Orders tab once the team releases it.
                                                </div>
                                                <div className="mt-3">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => togglePoSection(quote.id)}
                                                    >
                                                        {poSectionsOpen[quote.id]
                                                            ? "Hide Purchase Order Form"
                                                            : "My company uses a purchase order"}
                                                    </Button>
                                                </div>
                                                {poSectionsOpen[quote.id] ? (
                                                    <>
                                                        <div className="mt-4 mb-3 text-sm leading-6 text-slate-500">
                                                            Use this only if your company buys through an official purchase order after approving the quote.
                                                        </div>
                                                        <div className="grid gap-3 xl:grid-cols-2">
                                                            <Input
                                                                placeholder="Enter your company purchase order number"
                                                                value={poNumbers[quote.id] ?? ""}
                                                                onChange={(e) =>
                                                                    setPoNumbers((current) => ({
                                                                        ...current,
                                                                        [quote.id]: e.target.value,
                                                                    }))
                                                                }
                                                            />
                                                            <Input
                                                                placeholder="Summarize the approved product scope"
                                                                value={
                                                                    poScopes[quote.id] ||
                                                                    `${quote.quantity ?? ""} unit(s) as per approved quote`
                                                                }
                                                                onChange={(e) =>
                                                                    setPoScopes((current) => ({
                                                                        ...current,
                                                                        [quote.id]: e.target.value,
                                                                    }))
                                                                }
                                                            />
                                                            <Input
                                                                placeholder="Authorized signatory name"
                                                                value={
                                                                    poSignatories[quote.id] ||
                                                                    initialProfile?.contactPerson ||
                                                                    ""
                                                                }
                                                                onChange={(e) =>
                                                                    setPoSignatories((current) => ({
                                                                        ...current,
                                                                        [quote.id]: e.target.value,
                                                                    }))
                                                                }
                                                            />
                                                            <input
                                                                type="file"
                                                                className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                                                                onChange={(e) =>
                                                                    setPoFiles((current) => ({
                                                                        ...current,
                                                                        [quote.id]: e.target.files?.[0] ?? null,
                                                                    }))
                                                                }
                                                            />
                                                        </div>
                                                        <Button
                                                            className="mt-3"
                                                            variant="outline"
                                                            onClick={() => submitPo(quote)}
                                                            disabled={createPo.isPending}
                                                        >
                                                            Upload Purchase Order
                                                        </Button>
                                                    </>
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </div>
                                        );
                                    })()
                                ))}
                            </div>
                        ) : (
                            <Empty label="No quotes need action yet." />
                        )}
                    </SurfacePanel>
                </TabsContent>

                <TabsContent value="orders" className="mt-0">
                    <SurfacePanel
                        title="Corporate Orders"
                        description="Orders, fulfillment progress, and commercial totals stay visible here."
                    >
                        {initialOrders.length ? (
                            <div className="grid gap-4 xl:grid-cols-2">
                                {initialOrders.map((order) => (
                                    <ListCard
                                        key={order.id}
                                        title={order.publicOrderId}
                                        subtitle={formatINR(order.totalPaise)}
                                        meta={toLabel(order.status)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <Empty label="No corporate orders yet." />
                        )}
                    </SurfacePanel>
                </TabsContent>

                <TabsContent value="company" className="mt-0">
                    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                    <SurfacePanel
                        title="Company Profile"
                        description="Your buyer company details used for managed procurement and enterprise approvals."
                    >
                            {initialProfile ? (
                                <div className="space-y-4">
                                    <HeroStat
                                        label="Buyer Company"
                                        value={initialProfile.companyName}
                                    />
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <StatusRow
                                            label="Contact Person"
                                            value={initialProfile.contactPerson}
                                        />
                                        <StatusRow
                                            label="Email"
                                            value={initialProfile.email}
                                        />
                                        <StatusRow
                                            label="Industry"
                                            value={initialProfile.industry || "Pending"}
                                        />
                                        <StatusRow
                                            label="Company Size"
                                            value={initialProfile.companySize || "Pending"}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <Empty label="Your company profile will be created automatically from your first request for quotation." />
                            )}
                        </SurfacePanel>

                        <SurfacePanel
                            title="Procurement Support"
                            description="How this workspace will help once orders start moving."
                            className="bg-[#23311c] text-white"
                            inverse
                        >
                            <div className="grid grid-cols-2 gap-3">
                                <MiniPill label="Requests" dark />
                                <MiniPill label="Quotes" dark />
                                <MiniPill label="Purchase Orders" dark />
                                <MiniPill label="Quality Control" dark />
                                <MiniPill label="Dispatch" dark />
                                <MiniPill label="Payments" dark />
                            </div>
                        </SurfacePanel>
                    </section>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function SurfacePanel({
    title,
    description,
    children,
    className = "",
    inverse = false,
}: {
    title: string;
    description?: string;
    children: ReactNode;
    className?: string;
    inverse?: boolean;
}) {
    return (
        <div
            className={`rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_-50px_rgba(15,23,42,0.24)] md:p-6 ${className}`}
        >
            <h2
                className={`text-xl font-semibold ${
                    inverse ? "text-white" : "text-slate-900"
                }`}
            >
                {title}
            </h2>
            {description ? (
                <p
                    className={`mt-2 text-sm leading-6 ${
                        inverse ? "text-white/70" : "text-slate-500"
                    }`}
                >
                    {description}
                </p>
            ) : null}
            <div className="mt-4 space-y-3">{children}</div>
        </div>
    );
}

function MetricCard({
    label,
    value,
    hint,
}: {
    label: string;
    value: string;
    hint: string;
}) {
    return (
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_22px_60px_-48px_rgba(15,23,42,0.25)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                {label}
            </div>
            <div className="mt-3 text-4xl font-semibold text-slate-900">{value}</div>
            <div className="mt-2 text-sm text-slate-500">{hint}</div>
        </div>
    );
}

function ListCard({
    title,
    subtitle,
    meta,
}: {
    title: string;
    subtitle: string;
    meta: string;
}) {
    return (
        <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <div className="font-semibold text-slate-900">{title}</div>
                    <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
                </div>
                <StatusChip label={meta} />
            </div>
        </div>
    );
}

function Empty({ label }: { label: string }) {
    return (
        <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
            {label}
        </div>
    );
}

function MiniPill({ label, dark = false }: { label: string; dark?: boolean }) {
    return (
        <div
            className={
                dark
                    ? "rounded-full border border-white/15 bg-white/10 px-3 py-2 text-center text-sm font-medium text-white"
                    : "rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm font-medium text-slate-700"
            }
        >
            {label}
        </div>
    );
}

function ActionCard({
    eyebrow,
    title,
    description,
    href,
    cta,
    tone,
}: {
    eyebrow: string;
    title: string;
    description: string;
    href: string;
    cta: string;
    tone: "dark" | "light";
}) {
    const dark = tone === "dark";

    return (
        <a
            href={href}
            className={
                dark
                    ? "group rounded-[28px] border border-[#2f3720] bg-[linear-gradient(135deg,#2f3720_0%,#41512c_100%)] p-6 text-white shadow-[0_28px_70px_-42px_rgba(47,55,32,0.6)]"
                    : "group rounded-[28px] border border-[#dbe5f0] bg-white p-6 text-slate-900 shadow-[0_24px_60px_-44px_rgba(91,155,213,0.26)]"
            }
        >
            <div
                className={
                    dark
                        ? "text-xs font-semibold uppercase tracking-[0.24em] text-white/70"
                        : "text-xs font-semibold uppercase tracking-[0.24em] text-[#5B9BD5]"
                }
            >
                {eyebrow}
            </div>
            <div className="mt-3 text-2xl font-semibold leading-tight">{title}</div>
            <div
                className={
                    dark
                        ? "mt-3 text-sm leading-7 text-white/80"
                        : "mt-3 text-sm leading-7 text-slate-600"
                }
            >
                {description}
            </div>
            <div
                className={
                    dark
                        ? "mt-6 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#2f3720]"
                        : "mt-6 inline-flex rounded-full border border-slate-300 bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-900"
                }
            >
                {cta}
            </div>
        </a>
    );
}

function StatusRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="text-sm font-semibold text-slate-900">{label}</div>
            <div className="mt-1 text-sm leading-6 text-slate-500">{value}</div>
        </div>
    );
}

function HeroStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {label}
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
        </div>
    );
}

function DetailLine({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3 text-sm last:border-b-0 last:pb-0">
            <div className="font-medium text-slate-500">{label}</div>
            <div className="text-right font-medium text-slate-900">{value}</div>
        </div>
    );
}

function StatusChip({ label }: { label: string }) {
    return (
        <div className="rounded-full border border-[#d8e3ef] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
            {label}
        </div>
    );
}

function RevisionCheck({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <label className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-700">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
            />
            <span>{label}</span>
        </label>
    );
}

function CompactQuoteCard({
    quote,
    poNumber,
    onPoNumberChange,
    poScope,
    onPoScopeChange,
    signatoryName,
    onSignatoryNameChange,
    onFileChange,
    onApprove,
    onRevision,
    onReject,
    onUploadPo,
    uploadPending,
    poSectionOpen,
    onTogglePoSection,
    revisionDraft,
    onToggleRevisionOpen,
    onRevisionFieldChange,
}: {
    quote: any;
    poNumber: string;
    onPoNumberChange: (value: string) => void;
    poScope: string;
    onPoScopeChange: (value: string) => void;
    signatoryName: string;
    onSignatoryNameChange: (value: string) => void;
    onFileChange: (file: File | null) => void;
    onApprove: () => void;
    onRevision: () => void;
    onReject: () => void;
    onUploadPo: () => void;
    uploadPending: boolean;
    poSectionOpen: boolean;
    onTogglePoSection: () => void;
    revisionDraft: {
        open?: boolean;
        price?: boolean;
        quantity?: boolean;
        branding?: boolean;
        timeline?: boolean;
        specification?: boolean;
        notes?: string;
    };
    onToggleRevisionOpen: () => void;
    onRevisionFieldChange: (key: string, value: boolean | string) => void;
}) {
    const isApproved = quote.status === "approved";
    const isRejected = quote.status === "rejected";
    const canDecide = !isApproved && !isRejected;

    return (
        <div className="rounded-[24px] border border-[#d8e3ef] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbfe_100%)] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <div className="text-xl font-semibold text-slate-900">
                        {quote.quoteNumber}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                        {toLabel(quote.status)} - {formatINR(quote.totalAmountPaise)}
                    </div>
                </div>
                <StatusChip label={toLabel(quote.status)} />
            </div>

            {canDecide ? (
                <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                        onClick={onApprove}
                    >
                        Approve Quote
                    </Button>
                    <Button variant="outline" onClick={onToggleRevisionOpen}>
                        Request Revision
                    </Button>
                    <Button variant="outline" onClick={onReject}>
                        Reject
                    </Button>
                </div>
            ) : (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    {isApproved
                        ? "Quote approved. Renivet can now move this into order processing. Upload a company purchase order only if your business requires one."
                        : "Quote rejected. This quote is now closed."}
                </div>
            )}

            {canDecide && revisionDraft.open ? (
                <div className="mt-5 rounded-[22px] border border-amber-200 bg-amber-50 p-4">
                    <div className="text-sm font-semibold text-slate-900">
                        Tell us what should be revised
                    </div>
                    <div className="mt-1 text-sm leading-6 text-slate-600">
                        Select what needs to change and add a short note so the team can revise the quote properly.
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <RevisionCheck
                            label="Pricing"
                            checked={!!revisionDraft.price}
                            onChange={(checked) =>
                                onRevisionFieldChange("price", checked)
                            }
                        />
                        <RevisionCheck
                            label="Quantity"
                            checked={!!revisionDraft.quantity}
                            onChange={(checked) =>
                                onRevisionFieldChange("quantity", checked)
                            }
                        />
                        <RevisionCheck
                            label="Branding or customization"
                            checked={!!revisionDraft.branding}
                            onChange={(checked) =>
                                onRevisionFieldChange("branding", checked)
                            }
                        />
                        <RevisionCheck
                            label="Delivery timeline"
                            checked={!!revisionDraft.timeline}
                            onChange={(checked) =>
                                onRevisionFieldChange("timeline", checked)
                            }
                        />
                        <RevisionCheck
                            label="Product specification"
                            checked={!!revisionDraft.specification}
                            onChange={(checked) =>
                                onRevisionFieldChange("specification", checked)
                            }
                        />
                    </div>
                    <textarea
                        className="mt-4 min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400"
                        placeholder="Example: Please revise the price for 250 units and change the branding method to print instead of embroidery."
                        value={revisionDraft.notes ?? ""}
                        onChange={(e) =>
                            onRevisionFieldChange("notes", e.target.value)
                        }
                    />
                    <div className="mt-4 flex flex-wrap gap-2">
                        <Button variant="outline" onClick={onRevision}>
                            Send Revision Request
                        </Button>
                        <Button variant="outline" onClick={onToggleRevisionOpen}>
                            Cancel
                        </Button>
                    </div>
                </div>
            ) : null}

            {isApproved ? (
                <div className="mt-5 rounded-[22px] border border-slate-200 bg-white p-4">
                    <div className="mb-3 text-sm font-semibold text-slate-900">
                        Next step after approval
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        If your company does not use purchase orders, no action is needed here. Renivet will continue from the approved quote and your order will appear in the Orders tab once the team releases it.
                    </div>
                    <div className="mt-3">
                        <Button variant="outline" onClick={onTogglePoSection}>
                            {poSectionOpen
                                ? "Hide Purchase Order Form"
                                : "My company uses a purchase order"}
                        </Button>
                    </div>
                    {poSectionOpen ? (
                        <>
                            <div className="mt-4 mb-3 text-sm leading-6 text-slate-500">
                                Use this only if your company buys through an official purchase order after approving the quote.
                            </div>
                            <div className="grid gap-3 xl:grid-cols-2">
                                <Input
                                    placeholder="Enter your company purchase order number"
                                    value={poNumber}
                                    onChange={(e) => onPoNumberChange(e.target.value)}
                                />
                                <Input
                                    placeholder="Summarize the approved product scope"
                                    value={
                                        poScope ||
                                        `${quote.quantity ?? ""} unit(s) as per approved quote`
                                    }
                                    onChange={(e) => onPoScopeChange(e.target.value)}
                                />
                                <Input
                                    placeholder="Authorized signatory name"
                                    value={signatoryName}
                                    onChange={(e) => onSignatoryNameChange(e.target.value)}
                                />
                                <input
                                    type="file"
                                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                                    onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
                                />
                            </div>
                            <Button
                                className="mt-3"
                                variant="outline"
                                onClick={onUploadPo}
                                disabled={uploadPending}
                            >
                                Upload Purchase Order
                            </Button>
                        </>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}

function toLabel(value: string | null | undefined) {
    return (value ?? "")
        .replaceAll("_", " ")
        .replace(/\b\w/g, (match) => match.toUpperCase());
}
