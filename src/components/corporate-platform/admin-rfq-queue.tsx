"use client";

import {
    AdminPanel,
    EmptyQueue,
    StatusBadge,
} from "@/components/corporate-platform/admin-design";
import { Button } from "@/components/ui/button-dash";
import { Input } from "@/components/ui/input-dash";
import { trpc } from "@/lib/trpc/client";
import { formatINR, handleClientError } from "@/lib/utils";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export function AdminRfqQueue({
    initialRfqs,
    initialQuotes,
}: {
    initialRfqs: any[];
    initialQuotes: any[];
}) {
    const utils = trpc.useUtils();
    const [search, setSearch] = useState("");
    const { data: brandOptions = [] } =
        trpc.general.corporatePlatform.listAdminBrandOptions.useQuery();
    const { data: profileOptions = [] } =
        trpc.general.corporatePlatform.listAdminProfileOptions.useQuery();
    const [selectedRfqId, setSelectedRfqId] = useState<string | null>(
        initialRfqs[0]?.id ?? null
    );
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

    const quoteByRfqId = useMemo(
        () =>
            new Map(
                initialQuotes
                    .filter((quote) => quote.rfqId)
                    .map((quote) => [quote.rfqId, quote])
            ),
        [initialQuotes]
    );

    const filteredRfqs = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return initialRfqs;
        return initialRfqs.filter((rfq) =>
            [
                rfq.rfqNumber,
                rfq.companyName,
                rfq.contactPerson,
                rfq.email,
                rfq.useCase,
                rfq.procurementMode,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(query)
        );
    }, [initialRfqs, search]);

    const awaitingReview = filteredRfqs.filter((rfq) => !quoteByRfqId.has(rfq.id));
    const alreadyQuoted = filteredRfqs.filter((rfq) => quoteByRfqId.has(rfq.id));
    const selectedRfq =
        filteredRfqs.find((rfq) => rfq.id === selectedRfqId) ??
        awaitingReview[0] ??
        alreadyQuoted[0] ??
        null;

    const selectedDraft = selectedRfq ? drafts[selectedRfq.id] ?? {} : {};

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
            <AdminPanel
                title="Review Queue"
                description="Search inbound requests, review requirement details, assign the right buyer company and fulfilling brand, and move the request into quotation preparation."
                actions={
                    <div className="w-full md:w-80">
                        <Input
                            placeholder="Search request number, company, contact, or use case"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                }
            >
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.85fr)]">
                    <div className="space-y-6">
                        <QueueSection
                            title="Requests Awaiting Review"
                            count={awaitingReview.length}
                            emptyTitle="No unquoted requests"
                            emptyDescription="New requests for quotation will appear here for operational review and quote preparation."
                        >
                            {awaitingReview.map((rfq) => (
                                <RfqCard
                                    key={rfq.id}
                                    rfq={rfq}
                                    active={selectedRfq?.id === rfq.id}
                                    onSelect={() => setSelectedRfqId(rfq.id)}
                                />
                            ))}
                        </QueueSection>

                        <QueueSection
                            title="Requests Already Quoted"
                            count={alreadyQuoted.length}
                            emptyTitle="No quoted requests yet"
                            emptyDescription="Requests will move here once quotation preparation is complete."
                        >
                            {alreadyQuoted.map((rfq) => (
                                <RfqCard
                                    key={rfq.id}
                                    rfq={rfq}
                                    active={selectedRfq?.id === rfq.id}
                                    onSelect={() => setSelectedRfqId(rfq.id)}
                                    trailingLabel={quoteByRfqId.get(rfq.id)?.quoteNumber}
                                />
                            ))}
                        </QueueSection>
                    </div>

                    <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
                        <AdminPanel
                            title="Quotation Preparation"
                            description="Use a structured quote builder so the operations team can link the buyer, assign the fulfilling brand, and prepare a customer-ready commercial draft."
                        >
                            {selectedRfq ? (
                                <div className="space-y-4">
                                    <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <StatusBadge tone="blue">{selectedRfq.rfqNumber}</StatusBadge>
                                            <StatusBadge tone="slate">
                                                {toLabel(selectedRfq.procurementMode)}
                                            </StatusBadge>
                                            <StatusBadge tone="amber">
                                                {selectedRfq.documents?.length
                                                    ? `${selectedRfq.documents.length} attachment(s)`
                                                    : "No attachments"}
                                            </StatusBadge>
                                        </div>
                                        <div className="mt-3 text-lg font-semibold text-slate-900">
                                            {selectedRfq.companyName}
                                        </div>
                                        <div className="mt-1 text-sm text-slate-500">
                                            {selectedRfq.contactPerson} • {selectedRfq.email}
                                        </div>
                                        <div className="mt-3 text-sm leading-6 text-slate-600">
                                            {selectedRfq.requirementDescription}
                                        </div>
                                    </div>

                                    <div className="grid gap-3">
                                        <label className="block space-y-2">
                                            <span className="text-sm font-medium text-slate-700">
                                                Select buyer company
                                            </span>
                                            <select
                                                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                                                value={
                                                    selectedDraft.corporateProfileId ??
                                                    selectedRfq.corporateProfileId ??
                                                    ""
                                                }
                                                onChange={(e) =>
                                                    setDraft(
                                                        selectedRfq.id,
                                                        "corporateProfileId",
                                                        e.target.value
                                                    )
                                                }
                                            >
                                                <option value="">Select buyer company</option>
                                                {profileOptions.map((profile) => (
                                                    <option key={profile.id} value={profile.id}>
                                                        {profile.companyName} • {profile.contactPerson}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                        <label className="block space-y-2">
                                            <span className="text-sm font-medium text-slate-700">
                                                Select fulfilling brand
                                            </span>
                                            <select
                                                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                                                value={selectedDraft.brandId ?? ""}
                                                onChange={(e) =>
                                                    setDraft(selectedRfq.id, "brandId", e.target.value)
                                                }
                                            >
                                                <option value="">Select fulfilling brand</option>
                                                {brandOptions.map((brand) => (
                                                    <option key={brand.id} value={brand.id}>
                                                        {brand.name}
                                                        {brand.isActive ? "" : " (Inactive)"}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                        <div className="grid gap-3 md:grid-cols-2">
                                            <LabelledInput
                                                label="Subtotal amount in INR"
                                                placeholder="Subtotal amount in INR"
                                                type="number"
                                                value={selectedDraft.subtotal ?? ""}
                                                onChange={(value) =>
                                                    setDraft(selectedRfq.id, "subtotal", value)
                                                }
                                            />
                                            <LabelledInput
                                                label="Tax amount in INR"
                                                placeholder="Tax amount in INR"
                                                type="number"
                                                value={selectedDraft.gst ?? ""}
                                                onChange={(value) =>
                                                    setDraft(selectedRfq.id, "gst", value)
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-3 md:grid-cols-2">
                                            <LabelledInput
                                                label="Advance percentage"
                                                placeholder="Advance percentage"
                                                type="number"
                                                value={selectedDraft.advancePercent ?? "30"}
                                                onChange={(value) =>
                                                    setDraft(selectedRfq.id, "advancePercent", value)
                                                }
                                            />
                                            <LabelledInput
                                                label="Commercial notes"
                                                placeholder="Commercial notes"
                                                value={selectedDraft.comments ?? ""}
                                                onChange={(value) =>
                                                    setDraft(selectedRfq.id, "comments", value)
                                                }
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        className="w-full"
                                        onClick={() => {
                                            const subtotalPaise = Math.round(
                                                Number(selectedDraft.subtotal ?? 0) * 100
                                            );
                                            const gstAmountPaise = Math.round(
                                                Number(selectedDraft.gst ?? 0) * 100
                                            );
                                            const totalAmountPaise =
                                                subtotalPaise + gstAmountPaise;
                                            const advancePercent = Number(
                                                selectedDraft.advancePercent ?? 30
                                            );
                                            const advanceAmountPaise = Math.round(
                                                (totalAmountPaise * advancePercent) / 100
                                            );

                                            createQuote.mutate({
                                                rfqId: selectedRfq.id,
                                                corporateProfileId:
                                                    selectedDraft.corporateProfileId ??
                                                    selectedRfq.corporateProfileId,
                                                brandId: selectedDraft.brandId,
                                                quantity: selectedRfq.quantity,
                                                subtotalPaise,
                                                customizationCostPaise: 0,
                                                gstAmountPaise,
                                                totalAmountPaise,
                                                advanceAmountPaise,
                                                balanceAmountPaise:
                                                    totalAmountPaise - advanceAmountPaise,
                                                comments: selectedDraft.comments || null,
                                            });
                                        }}
                                        disabled={
                                            createQuote.isPending ||
                                            !(
                                                (selectedDraft.corporateProfileId ??
                                                    selectedRfq.corporateProfileId) &&
                                                selectedDraft.brandId
                                            )
                                        }
                                    >
                                        {createQuote.isPending
                                            ? "Creating Quote..."
                                            : "Create Quote From Selected Request"}
                                    </Button>
                                </div>
                            ) : (
                                <EmptyQueue
                                    title="No request selected"
                                    description="Pick a request from the review queue to prepare and send the quote."
                                />
                            )}
                        </AdminPanel>
                    </div>
                </div>
            </AdminPanel>

            <AdminPanel
                title="Quote Revisions And History"
                description="Track quotation state, customer company, total value, and administrative revision snapshots from one wide review section."
            >
                {initialQuotes.length ? (
                    <div className="grid gap-4 xl:grid-cols-2">
                        {initialQuotes.slice(0, 10).map((quote) => (
                            <div
                                key={quote.id}
                                className="rounded-[24px] border border-slate-200 bg-slate-50 p-5"
                            >
                                <div className="flex flex-wrap items-center gap-2">
                                    <StatusBadge tone="blue">{quote.quoteNumber}</StatusBadge>
                                    <StatusBadge tone={quote.status === "approved" ? "green" : "slate"}>
                                        {toLabel(quote.status)}
                                    </StatusBadge>
                                    <StatusBadge tone="amber">
                                        {quote.revisions?.length ?? 0} revision(s)
                                    </StatusBadge>
                                </div>
                                <div className="mt-3 text-lg font-semibold text-slate-900">
                                    {quote.profile?.companyName ?? "Unknown company"}
                                </div>
                                <div className="mt-1 text-sm text-slate-500">
                                    Total value {formatINR(quote.totalAmountPaise)}
                                </div>
                                <div className="mt-3 text-sm text-slate-600">
                                    Latest update {new Date(quote.updatedAt).toLocaleDateString("en-IN")}
                                </div>
                                <Button
                                    className="mt-4"
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
                ) : (
                    <EmptyQueue
                        title="No quotes created yet"
                        description="Created quotes and revision snapshots will appear here after the review team prepares commercial drafts."
                    />
                )}
            </AdminPanel>
        </div>
    );
}

function QueueSection({
    title,
    count,
    children,
    emptyTitle,
    emptyDescription,
}: {
    title: string;
    count: number;
    children: React.ReactNode;
    emptyTitle: string;
    emptyDescription: string;
}) {
    return (
        <div>
            <div className="mb-3 flex items-center justify-between">
                <div className="text-lg font-semibold text-slate-900">{title}</div>
                <StatusBadge tone="slate">{count} item(s)</StatusBadge>
            </div>
            <div className="space-y-4">
                {count ? (
                    children
                ) : (
                    <EmptyQueue title={emptyTitle} description={emptyDescription} />
                )}
            </div>
        </div>
    );
}

function RfqCard({
    rfq,
    active,
    onSelect,
    trailingLabel,
}: {
    rfq: any;
    active: boolean;
    onSelect: () => void;
    trailingLabel?: string;
}) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={`w-full rounded-[24px] border p-5 text-left transition-colors ${
                active
                    ? "border-[#5B9BD5] bg-[#f7fbff] shadow-sm"
                    : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
        >
            <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone="blue">{rfq.rfqNumber}</StatusBadge>
                <StatusBadge tone="slate">{toLabel(rfq.status)}</StatusBadge>
                <StatusBadge tone="amber">{toLabel(rfq.procurementMode)}</StatusBadge>
                {trailingLabel ? <StatusBadge tone="green">{trailingLabel}</StatusBadge> : null}
            </div>
            <div className="mt-3 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                    <div className="text-lg font-semibold text-slate-900">{rfq.companyName}</div>
                    <div className="mt-1 text-sm text-slate-500">
                        {rfq.contactPerson} • {rfq.email}
                    </div>
                    <div className="mt-3 text-sm leading-6 text-slate-600">{rfq.useCase}</div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-slate-600 md:min-w-[280px]">
                    <MetaPill label="Quantity" value={String(rfq.quantity)} />
                                            <MetaPill
                                                label="Attachments"
                                                value={
                                                    rfq.documents?.length
                                                        ? `${rfq.documents.length} uploaded`
                                                        : "None"
                                                }
                                            />
                                            <MetaPill
                                                label="Buyer Company"
                                                value={
                                                    rfq.corporateProfileId
                                                        ? "Buyer company linked"
                                                        : "Buyer company not assigned"
                                                }
                                            />
                                        </div>
                                    </div>
                                </button>
    );
}

function LabelledInput({
    label,
    value,
    onChange,
    placeholder,
    type,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    type?: string;
}) {
    return (
        <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">{label}</span>
            <Input
                placeholder={placeholder}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </label>
    );
}

function MetaPill({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {label}
            </div>
            <div className="mt-1 font-semibold text-slate-900">{value}</div>
        </div>
    );
}

function toLabel(value: string | null | undefined) {
    return (value ?? "")
        .replaceAll("_", " ")
        .replace(/\b\w/g, (match) => match.toUpperCase());
}
