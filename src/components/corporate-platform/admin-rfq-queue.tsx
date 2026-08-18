"use client";

import {
    AdminPanel,
    EmptyQueue,
    StatusBadge,
} from "@/components/corporate-platform/admin-design";
import { AdminManualQuoteModal } from "@/components/corporate-platform/admin-manual-quote-modal";
import { Button } from "@/components/ui/button-dash";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-dash";
import { Input } from "@/components/ui/input-dash";
import { trpc } from "@/lib/trpc/client";
import { formatINR, handleClientError } from "@/lib/utils";
import { Building2, Eye, FileText, Plus, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export function AdminRfqQueue({
    initialRfqs,
    initialQuotes,
}: {
    initialRfqs: any[];
    initialQuotes: any[];
}) {
    const router = useRouter();
    const utils = trpc.useUtils();
    const [search, setSearch] = useState("");
    const [queueFilter, setQueueFilter] = useState<
        "all" | "awaiting" | "quoted"
    >("all");
    const [detailRfq, setDetailRfq] = useState<any | null>(null);
    const quotePreparationRef = useRef<HTMLDivElement>(null);
    const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
    const [isManualQuoteOpen, setIsManualQuoteOpen] = useState(false);
    const [manualCompany, setManualCompany] = useState({
        companyName: "",
        contactPerson: "",
        email: "",
        phone: "",
    });
    const { data: brandOptions = [] } =
        trpc.general.corporatePlatform.listAdminBrandOptions.useQuery();
    const { data: profileOptions = [] } =
        trpc.general.corporatePlatform.listAdminProfileOptions.useQuery();
    const { data: orderConfig } =
        trpc.general.corporateOrders.getFormConfig.useQuery();
    const [selectedRfqId, setSelectedRfqId] = useState<string | null>(null);
    const [drafts, setDrafts] = useState<Record<string, any>>({});

    const createQuote = trpc.general.corporatePlatform.createQuote.useMutation({
        onSuccess: async () => {
            toast.success("Quote created");
            setSelectedRfqId(null);
            await Promise.all([
                utils.general.corporatePlatform.listAdminRfqs.invalidate(),
                utils.general.corporatePlatform.listAdminQuotes.invalidate(),
            ]);
        },
        onError: (error) => handleClientError(error),
    });

    const addRevision =
        trpc.general.corporatePlatform.addQuoteRevision.useMutation({
            onSuccess: async () => {
                toast.success("Quote revision added");
                await utils.general.corporatePlatform.listAdminQuotes.invalidate();
            },
            onError: (error) => handleClientError(error),
        });

    const createBuyerProfile =
        trpc.general.corporatePlatform.createAdminBuyerProfile.useMutation({
            onSuccess: async (profile, variables) => {
                if (variables.rfqId) {
                    setDrafts((current) => ({
                        ...current,
                        [variables.rfqId]: {
                            ...current[variables.rfqId],
                            corporateProfileId: profile.id,
                        },
                    }));
                }
                setIsCompanyDialogOpen(false);
                toast.success(`${profile.companyName} added and selected`);
                await Promise.all([
                    utils.general.corporatePlatform.listAdminProfileOptions.invalidate(),
                    utils.general.corporatePlatform.listAdminRfqs.invalidate(),
                ]);
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

    const awaitingReview = filteredRfqs.filter(
        (rfq) => !quoteByRfqId.has(rfq.id)
    );
    const alreadyQuoted = filteredRfqs.filter((rfq) =>
        quoteByRfqId.has(rfq.id)
    );
    const visibleRfqs = filteredRfqs.filter((rfq) => {
        if (queueFilter === "awaiting") return !quoteByRfqId.has(rfq.id);
        if (queueFilter === "quoted") return quoteByRfqId.has(rfq.id);
        return true;
    });
    const selectedRfq =
        initialRfqs.find((rfq) => rfq.id === selectedRfqId) ?? null;
    const selectedExistingQuote = selectedRfq
        ? quoteByRfqId.get(selectedRfq.id)
        : null;
    const selectedDraft = useMemo(() => {
        if (!selectedRfq) return {};

        return {
            corporateProfileId:
                selectedExistingQuote?.corporateProfileId ??
                selectedRfq.corporateProfileId ??
                "",
            brandId: selectedExistingQuote?.brandId ?? "",
            productTypeId: selectedExistingQuote?.productTypeId ?? "",
            gsmOptionId: selectedExistingQuote?.gsmOptionId ?? "",
            fabricCompositionId:
                selectedExistingQuote?.fabricCompositionId ?? "",
            subtotal:
                selectedExistingQuote?.subtotalPaise !== undefined
                    ? String(selectedExistingQuote.subtotalPaise / 100)
                    : "",
            gst:
                selectedExistingQuote?.gstAmountPaise !== undefined
                    ? String(selectedExistingQuote.gstAmountPaise / 100)
                    : "",
            advancePercent:
                selectedExistingQuote &&
                selectedExistingQuote.totalAmountPaise > 0
                    ? String(
                          Math.round(
                              (selectedExistingQuote.advanceAmountPaise /
                                  selectedExistingQuote.totalAmountPaise) *
                                  100
                          )
                      )
                    : String(
                          (orderConfig?.settings.advancePercentBps ?? 3000) /
                              100
                      ),
            comments:
                selectedExistingQuote?.revisions?.[0]?.comments ??
                selectedExistingQuote?.customerDecisionNotes ??
                "",
            ...(drafts[selectedRfq.id] ?? {}),
        };
    }, [drafts, orderConfig, selectedExistingQuote, selectedRfq]);
    const matchedPricingSlab = useMemo(() => {
        if (
            !selectedRfq ||
            !orderConfig ||
            !selectedDraft.productTypeId ||
            !selectedDraft.gsmOptionId ||
            !selectedDraft.fabricCompositionId
        ) {
            return null;
        }

        return (
            orderConfig.pricingSlabs
                .filter(
                    (slab) =>
                        slab.productTypeId === selectedDraft.productTypeId &&
                        slab.gsmOptionId === selectedDraft.gsmOptionId &&
                        slab.minQuantity <= selectedRfq.quantity &&
                        (slab.maxQuantity === null ||
                            slab.maxQuantity >= selectedRfq.quantity)
                )
                .sort((a, b) => b.minQuantity - a.minQuantity)[0] ?? null
        );
    }, [
        orderConfig,
        selectedDraft.fabricCompositionId,
        selectedDraft.gsmOptionId,
        selectedDraft.productTypeId,
        selectedRfq,
    ]);
    const computedUnitPricePaise = matchedPricingSlab?.unitPricePaise ?? 0;
    const computedSubtotalPaise = selectedRfq
        ? computedUnitPricePaise * selectedRfq.quantity
        : 0;

    const setDraft = (rfqId: string, key: string, value: string) => {
        setDrafts((current) => ({
            ...current,
            [rfqId]: {
                ...current[rfqId],
                [key]: value,
            },
        }));
    };

    const openCompanyDialog = () => {
        if (!selectedRfq) return;
        setManualCompany({
            companyName: selectedRfq.companyName ?? "",
            contactPerson: selectedRfq.contactPerson ?? "",
            email: selectedRfq.email ?? "",
            phone: selectedRfq.phone ?? "",
        });
        setIsCompanyDialogOpen(true);
    };

    const openQuotePreparation = (rfqId: string) => {
        setSelectedRfqId(rfqId);
        window.requestAnimationFrame(() => {
            quotePreparationRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        });
    };

    const canCreateCompany =
        manualCompany.companyName.trim().length >= 2 &&
        manualCompany.contactPerson.trim().length >= 2 &&
        /^\S+@\S+\.\S+$/.test(manualCompany.email.trim()) &&
        manualCompany.phone.trim().length >= 8;

    return (
        <div className="space-y-4">
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-slate-900">
                            RFQ Register
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-500">
                            {filteredRfqs.length} request(s)
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Button
                            type="button"
                            className="h-9 whitespace-nowrap px-3 text-[11px]"
                            onClick={() => setIsManualQuoteOpen(true)}
                        >
                            <Plus className="mr-1.5 size-3.5" />
                            Create manual quote
                        </Button>
                        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                            <QueueFilterButton
                                active={queueFilter === "all"}
                                onClick={() => setQueueFilter("all")}
                            >
                                All {filteredRfqs.length}
                            </QueueFilterButton>
                            <QueueFilterButton
                                active={queueFilter === "awaiting"}
                                onClick={() => setQueueFilter("awaiting")}
                            >
                                Awaiting {awaitingReview.length}
                            </QueueFilterButton>
                            <QueueFilterButton
                                active={queueFilter === "quoted"}
                                onClick={() => setQueueFilter("quoted")}
                            >
                                Quoted {alreadyQuoted.length}
                            </QueueFilterButton>
                        </div>
                        <div className="relative w-full sm:w-72">
                            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                            <Input
                                className="h-9 pl-9 text-xs"
                                placeholder="Search RFQ, company or contact"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1050px] text-left text-xs">
                        <thead className="border-b border-slate-200 bg-slate-50/80 text-[10px] uppercase tracking-[0.08em] text-slate-500">
                            <tr>
                                <th className="w-10 px-3 py-2.5" />
                                <th className="px-3 py-2.5 font-semibold">
                                    RFQ
                                </th>
                                <th className="px-3 py-2.5 font-semibold">
                                    Company
                                </th>
                                <th className="px-3 py-2.5 font-semibold">
                                    Status
                                </th>
                                <th className="px-3 py-2.5 font-semibold">
                                    Queue
                                </th>
                                <th className="px-3 py-2.5 font-semibold">
                                    Quantity
                                </th>
                                <th className="px-3 py-2.5 font-semibold">
                                    Mode
                                </th>
                                <th className="px-3 py-2.5 font-semibold">
                                    Quote
                                </th>
                                <th className="px-3 py-2.5 font-semibold">
                                    Submitted
                                </th>
                                <th className="w-48 px-3 py-2.5 !text-center font-semibold">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {visibleRfqs.map((rfq) => {
                                const quote = quoteByRfqId.get(rfq.id);
                                const isSelected = selectedRfq?.id === rfq.id;

                                return (
                                    <tr
                                        key={rfq.id}
                                        className={`transition-colors ${
                                            isSelected
                                                ? "bg-slate-100/80"
                                                : "bg-white hover:bg-slate-50"
                                        }`}
                                    >
                                        <td className="px-3 py-3">
                                            <span
                                                className={`block size-2 rounded-full ${
                                                    isSelected
                                                        ? "bg-slate-900"
                                                        : "bg-slate-300"
                                                }`}
                                            />
                                        </td>
                                        <td className="px-3 py-3 font-semibold text-slate-900">
                                            {rfq.rfqNumber}
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="font-medium text-slate-900">
                                                {rfq.companyName}
                                            </div>
                                            <div className="mt-0.5 max-w-[220px] truncate text-[11px] text-slate-500">
                                                {rfq.contactPerson} ·{" "}
                                                {rfq.email}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3">
                                            <RequestStatusPill
                                                status={rfq.status}
                                            />
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className="font-medium text-slate-700">
                                                {quote
                                                    ? "Quoted"
                                                    : "Awaiting review"}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 tabular-nums text-slate-700">
                                            {rfq.quantity}
                                        </td>
                                        <td className="px-3 py-3 text-slate-600">
                                            {toLabel(rfq.procurementMode)}
                                        </td>
                                        <td className="px-3 py-3 font-medium text-slate-700">
                                            {quote?.quoteNumber ?? "—"}
                                        </td>
                                        <td className="px-3 py-3 text-slate-600">
                                            {formatDate(rfq.createdAt)}
                                        </td>
                                        <td className="relative px-3 py-3 !align-middle">
                                            <div className="flex items-center justify-center pr-10">
                                                {!quote ? (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openQuotePreparation(
                                                                rfq.id
                                                            )
                                                        }
                                                        className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-md bg-slate-900 px-3 pb-0 pt-0 text-[10px] font-semibold leading-none text-white transition-colors hover:bg-slate-700"
                                                    >
                                                        Open &amp; create quote
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openQuotePreparation(
                                                                rfq.id
                                                            )
                                                        }
                                                        className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-md border border-slate-300 bg-white px-3 pb-0 pt-0 text-[10px] font-semibold leading-none text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950"
                                                    >
                                                        Open quote
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    title={`View ${rfq.rfqNumber}`}
                                                    aria-label={`View details for ${rfq.rfqNumber}`}
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        setDetailRfq(rfq);
                                                    }}
                                                    className="absolute right-3 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
                                                >
                                                    <Eye className="size-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {!visibleRfqs.length ? (
                    <div className="border-t border-slate-200 px-4 py-10 text-center">
                        <p className="text-sm font-medium text-slate-800">
                            No RFQs found
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            Adjust the search or queue filter.
                        </p>
                    </div>
                ) : null}
            </section>

            {selectedRfq ? (
                <div ref={quotePreparationRef} className="scroll-mt-4">
                    <AdminPanel
                        title="Quotation Preparation"
                        className="!rounded-xl !p-4 [&>div+div]:!mt-3 [&_h2]:!text-xs"
                        actions={
                            <div className="flex items-center gap-3">
                                <span className="text-[11px] font-medium text-slate-500">
                                    Selected: {selectedRfq.rfqNumber}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setSelectedRfqId(null)}
                                    aria-label="Close quotation preparation"
                                    className="inline-flex size-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                                >
                                    <X className="size-3.5" />
                                </button>
                            </div>
                        }
                    >
                        <div className="space-y-3">
                            <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
                                <div className="flex flex-wrap items-center gap-2">
                                    <StatusBadge tone="slate">
                                        {selectedRfq.rfqNumber}
                                    </StatusBadge>
                                    <StatusBadge tone="slate">
                                        {toLabel(selectedRfq.procurementMode)}
                                    </StatusBadge>
                                    <StatusBadge tone="slate">
                                        {selectedRfq.documents?.length
                                            ? `${selectedRfq.documents.length} attachment(s)`
                                            : "No attachments"}
                                    </StatusBadge>
                                </div>
                                <div className="min-w-0 space-y-0.5 md:text-center">
                                    <div className="truncate text-[11px] font-semibold text-slate-900">
                                        {selectedRfq.companyName}
                                    </div>
                                    <div className="truncate text-[10px] text-slate-500">
                                        {selectedRfq.contactPerson} •{" "}
                                        {selectedRfq.email}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setDetailRfq(selectedRfq)}
                                    className="inline-flex h-7 shrink-0 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                                >
                                    <Eye className="size-3.5" />
                                    View details
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div className="grid items-end gap-3 lg:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <div className="flex h-4 items-center justify-between gap-3 text-[11px] font-medium leading-none text-slate-700">
                                            <span>Buyer company</span>
                                            <button
                                                type="button"
                                                onClick={openCompanyDialog}
                                                className="inline-flex items-center gap-1 text-[10px] font-semibold leading-none text-slate-600 hover:text-slate-950"
                                            >
                                                <Plus className="size-3" /> Add
                                                manually
                                            </button>
                                        </div>
                                        <select
                                            aria-label="Buyer company"
                                            className="!h-9 w-full rounded-md border border-input bg-background !px-3 !py-0 !text-xs !leading-normal"
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
                                            <option value="">
                                                Select buyer company
                                            </option>
                                            {profileOptions.map((profile) => (
                                                <option
                                                    key={profile.id}
                                                    value={profile.id}
                                                >
                                                    {profile.companyName} •{" "}
                                                    {profile.contactPerson}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex h-4 items-center text-[11px] font-medium leading-none text-slate-700">
                                            Select fulfilling brand
                                        </div>
                                        <select
                                            aria-label="Fulfilling brand"
                                            className="!h-9 w-full rounded-md border border-input bg-background !px-3 !py-0 !text-xs !leading-normal"
                                            value={selectedDraft.brandId ?? ""}
                                            onChange={(e) =>
                                                setDraft(
                                                    selectedRfq.id,
                                                    "brandId",
                                                    e.target.value
                                                )
                                            }
                                        >
                                            <option value="">
                                                Select fulfilling brand
                                            </option>
                                            {brandOptions.map((brand) => (
                                                <option
                                                    key={brand.id}
                                                    value={brand.id}
                                                >
                                                    {brand.name}
                                                    {brand.isActive
                                                        ? ""
                                                        : " (Inactive)"}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid gap-3 md:grid-cols-3">
                                    <label className="block space-y-1.5">
                                        <span className="text-[11px] font-medium text-slate-700">
                                            Product type
                                        </span>
                                        <select
                                            className="!h-9 w-full rounded-md border border-input bg-background !px-3 !py-0 !text-xs !leading-normal"
                                            value={
                                                selectedDraft.productTypeId ??
                                                ""
                                            }
                                            onChange={(e) =>
                                                setDraft(
                                                    selectedRfq.id,
                                                    "productTypeId",
                                                    e.target.value
                                                )
                                            }
                                        >
                                            <option value="">
                                                Select product type
                                            </option>
                                            {orderConfig?.productTypes.map(
                                                (item) => (
                                                    <option
                                                        key={item.id}
                                                        value={item.id}
                                                    >
                                                        {item.name}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </label>
                                    <label className="block space-y-1.5">
                                        <span className="text-[11px] font-medium text-slate-700">
                                            GSM
                                        </span>
                                        <select
                                            className="!h-9 w-full rounded-md border border-input bg-background !px-3 !py-0 !text-xs !leading-normal"
                                            value={
                                                selectedDraft.gsmOptionId ?? ""
                                            }
                                            onChange={(e) =>
                                                setDraft(
                                                    selectedRfq.id,
                                                    "gsmOptionId",
                                                    e.target.value
                                                )
                                            }
                                        >
                                            <option value="">Select GSM</option>
                                            {orderConfig?.gsmOptions.map(
                                                (item) => (
                                                    <option
                                                        key={item.id}
                                                        value={item.id}
                                                    >
                                                        {item.label}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </label>
                                    <label className="block space-y-1.5">
                                        <span className="text-[11px] font-medium text-slate-700">
                                            Fabric composition
                                        </span>
                                        <select
                                            className="!h-9 w-full rounded-md border border-input bg-background !px-3 !py-0 !text-xs !leading-normal"
                                            value={
                                                selectedDraft.fabricCompositionId ??
                                                ""
                                            }
                                            onChange={(e) =>
                                                setDraft(
                                                    selectedRfq.id,
                                                    "fabricCompositionId",
                                                    e.target.value
                                                )
                                            }
                                        >
                                            <option value="">
                                                Select fabric composition
                                            </option>
                                            {orderConfig?.fabricCompositions.map(
                                                (item) => (
                                                    <option
                                                        key={item.id}
                                                        value={item.id}
                                                    >
                                                        {item.name}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </label>
                                </div>
                                <div className="grid gap-3 md:grid-cols-3">
                                    <MetaPill
                                        label="Per Unit Cost"
                                        value={
                                            matchedPricingSlab
                                                ? formatINR(
                                                      computedUnitPricePaise
                                                  )
                                                : "Select garment setup"
                                        }
                                    />
                                    <MetaPill
                                        label="RFQ Quantity"
                                        value={
                                            selectedRfq
                                                ? String(selectedRfq.quantity)
                                                : "-"
                                        }
                                    />
                                    <MetaPill
                                        label="Overall Cost"
                                        value={
                                            matchedPricingSlab
                                                ? formatINR(
                                                      computedSubtotalPaise
                                                  )
                                                : "Select garment setup"
                                        }
                                    />
                                </div>
                                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                    <LabelledInput
                                        label="Subtotal amount in INR"
                                        placeholder="Subtotal amount in INR"
                                        type="number"
                                        value={
                                            matchedPricingSlab
                                                ? String(
                                                      computedSubtotalPaise /
                                                          100
                                                  )
                                                : ""
                                        }
                                        disabled
                                    />
                                    <LabelledInput
                                        label="Tax amount in INR"
                                        placeholder="Tax amount in INR"
                                        type="number"
                                        value={selectedDraft.gst ?? ""}
                                        onChange={(value) =>
                                            setDraft(
                                                selectedRfq.id,
                                                "gst",
                                                value
                                            )
                                        }
                                    />
                                    <LabelledInput
                                        label="Advance percentage"
                                        placeholder="Advance percentage"
                                        type="number"
                                        value={
                                            selectedDraft.advancePercent ?? "30"
                                        }
                                        onChange={(value) =>
                                            setDraft(
                                                selectedRfq.id,
                                                "advancePercent",
                                                value
                                            )
                                        }
                                    />
                                    <LabelledInput
                                        label="Commercial notes"
                                        placeholder="Commercial notes"
                                        value={selectedDraft.comments ?? ""}
                                        onChange={(value) =>
                                            setDraft(
                                                selectedRfq.id,
                                                "comments",
                                                value
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end border-t border-slate-100 pt-3">
                                <Button
                                    className="h-8 w-full px-5 text-[11px] sm:w-auto sm:min-w-64"
                                    onClick={() => {
                                        const subtotalPaise =
                                            computedSubtotalPaise;
                                        const gstAmountPaise = Math.round(
                                            Number(selectedDraft.gst ?? 0) * 100
                                        );
                                        const totalAmountPaise =
                                            subtotalPaise + gstAmountPaise;
                                        const advancePercent = Number(
                                            selectedDraft.advancePercent ?? 30
                                        );
                                        const advanceAmountPaise = Math.round(
                                            (totalAmountPaise *
                                                advancePercent) /
                                                100
                                        );

                                        createQuote.mutate({
                                            rfqId: selectedRfq.id,
                                            corporateProfileId:
                                                selectedDraft.corporateProfileId ??
                                                selectedRfq.corporateProfileId,
                                            brandId: selectedDraft.brandId,
                                            productTypeId:
                                                selectedDraft.productTypeId ||
                                                null,
                                            gsmOptionId:
                                                selectedDraft.gsmOptionId ||
                                                null,
                                            fabricCompositionId:
                                                selectedDraft.fabricCompositionId ||
                                                null,
                                            quantity: selectedRfq.quantity,
                                            subtotalPaise,
                                            customizationCostPaise: 0,
                                            gstAmountPaise,
                                            totalAmountPaise,
                                            advanceAmountPaise,
                                            balanceAmountPaise:
                                                totalAmountPaise -
                                                advanceAmountPaise,
                                            comments:
                                                selectedDraft.comments || null,
                                        });
                                    }}
                                    disabled={
                                        Boolean(selectedExistingQuote) ||
                                        createQuote.isPending ||
                                        !matchedPricingSlab ||
                                        !(
                                            (selectedDraft.corporateProfileId ??
                                                selectedRfq.corporateProfileId) &&
                                            selectedDraft.brandId &&
                                            selectedDraft.productTypeId &&
                                            selectedDraft.gsmOptionId &&
                                            selectedDraft.fabricCompositionId
                                        )
                                    }
                                >
                                    {selectedExistingQuote
                                        ? `Quote already created: ${selectedExistingQuote.quoteNumber}`
                                        : createQuote.isPending
                                          ? "Creating Quote..."
                                          : "Create Quote From Selected Request"}
                                </Button>
                            </div>
                        </div>
                    </AdminPanel>
                </div>
            ) : null}

            <AdminPanel
                title="Quote Revisions & History"
                className="!rounded-xl !p-0 [&>div+div]:!mt-0 [&>div:first-child]:!px-4 [&>div:first-child]:!py-3 [&_h2]:!text-sm"
            >
                {initialQuotes.length ? (
                    <div className="overflow-x-auto border-t border-slate-200">
                        <table className="w-full min-w-[760px] text-left text-xs">
                            <thead className="border-b border-slate-200 bg-slate-50/80 text-[10px] uppercase tracking-[0.08em] text-slate-500">
                                <tr>
                                    <th className="px-4 py-2.5 font-semibold">
                                        Quote
                                    </th>
                                    <th className="px-4 py-2.5 font-semibold">
                                        Company
                                    </th>
                                    <th className="px-4 py-2.5 font-semibold">
                                        Status
                                    </th>
                                    <th className="px-4 py-2.5 font-semibold">
                                        Value
                                    </th>
                                    <th className="px-4 py-2.5 font-semibold">
                                        Revisions
                                    </th>
                                    <th className="px-4 py-2.5 font-semibold">
                                        Updated
                                    </th>
                                    <th className="px-4 py-2.5 text-right font-semibold">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {initialQuotes.slice(0, 10).map((quote) => (
                                    <tr
                                        key={quote.id}
                                        className="hover:bg-slate-50"
                                    >
                                        <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                                            {quote.quoteNumber}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-800">
                                            {quote.profile?.companyName ??
                                                "Unknown company"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <QuoteStatusPill
                                                status={quote.status}
                                            />
                                        </td>
                                        <td className="px-4 py-3 tabular-nums text-slate-700">
                                            {formatINR(quote.totalAmountPaise)}
                                        </td>
                                        <td className="px-4 py-3 tabular-nums text-slate-700">
                                            {quote.revisions?.length ?? 0}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {formatDate(quote.updatedAt)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Button
                                                className="h-8 text-xs"
                                                variant="outline"
                                                onClick={() =>
                                                    addRevision.mutate({
                                                        quoteId: quote.id,
                                                        subtotalPaise:
                                                            quote.subtotalPaise,
                                                        customizationCostPaise:
                                                            quote.customizationCostPaise,
                                                        gstAmountPaise:
                                                            quote.gstAmountPaise,
                                                        totalAmountPaise:
                                                            quote.totalAmountPaise,
                                                        comments:
                                                            "Administrative revision snapshot",
                                                    })
                                                }
                                                disabled={addRevision.isPending}
                                            >
                                                Add revision
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyQueue
                        title="No quotes created yet"
                        description="Created quotes and revision snapshots will appear here after the review team prepares commercial drafts."
                    />
                )}
            </AdminPanel>

            <AdminManualQuoteModal
                open={isManualQuoteOpen}
                onOpenChange={setIsManualQuoteOpen}
                brandOptions={brandOptions}
                orderConfig={orderConfig}
            />

            <Dialog
                open={isCompanyDialogOpen}
                onOpenChange={setIsCompanyDialogOpen}
            >
                <DialogContent className="max-w-md gap-3 p-5">
                    <DialogHeader className="text-left">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                            <Building2 className="size-4" />
                        </div>
                        <DialogTitle className="pt-1 text-base">
                            Add buyer company
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            This company will be linked to{" "}
                            {selectedRfq?.rfqNumber} and selected for the quote.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <LabelledInput
                            label="Company name"
                            placeholder="Company name"
                            value={manualCompany.companyName}
                            onChange={(companyName) =>
                                setManualCompany((current) => ({
                                    ...current,
                                    companyName,
                                }))
                            }
                        />
                        <LabelledInput
                            label="Contact person"
                            placeholder="Contact person"
                            value={manualCompany.contactPerson}
                            onChange={(contactPerson) =>
                                setManualCompany((current) => ({
                                    ...current,
                                    contactPerson,
                                }))
                            }
                        />
                        <LabelledInput
                            label="Email"
                            placeholder="name@company.com"
                            type="email"
                            value={manualCompany.email}
                            onChange={(email) =>
                                setManualCompany((current) => ({
                                    ...current,
                                    email,
                                }))
                            }
                        />
                        <LabelledInput
                            label="Phone"
                            placeholder="Phone number"
                            type="tel"
                            value={manualCompany.phone}
                            onChange={(phone) =>
                                setManualCompany((current) => ({
                                    ...current,
                                    phone,
                                }))
                            }
                        />
                    </div>
                    <DialogFooter className="mt-1 gap-2 sm:space-x-0">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-9 text-xs"
                            onClick={() => setIsCompanyDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            className="h-9 text-xs"
                            disabled={
                                !selectedRfq ||
                                !canCreateCompany ||
                                createBuyerProfile.isPending
                            }
                            onClick={() => {
                                if (!selectedRfq) return;
                                createBuyerProfile.mutate({
                                    rfqId: selectedRfq.id,
                                    companyName:
                                        manualCompany.companyName.trim(),
                                    contactPerson:
                                        manualCompany.contactPerson.trim(),
                                    email: manualCompany.email.trim(),
                                    phone: manualCompany.phone.trim(),
                                });
                            }}
                        >
                            {createBuyerProfile.isPending
                                ? "Adding company..."
                                : "Add and select company"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <RfqDetailsDialog
                rfq={detailRfq}
                quote={detailRfq ? quoteByRfqId.get(detailRfq.id) : null}
                open={Boolean(detailRfq)}
                onOpenChange={(open) => {
                    if (!open) setDetailRfq(null);
                }}
            />
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
                <div className="text-sm font-semibold text-slate-900">
                    {title}
                </div>
                <StatusBadge tone="slate">{count} item(s)</StatusBadge>
            </div>
            <div className="space-y-2">
                {count ? (
                    children
                ) : (
                    <EmptyQueue
                        title={emptyTitle}
                        description={emptyDescription}
                    />
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
            className={`w-full rounded-xl border p-3 text-left transition-colors ${
                active
                    ? "border-[#5B9BD5] bg-[#f7fbff] shadow-sm"
                    : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
        >
            <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone="blue">{rfq.rfqNumber}</StatusBadge>
                <StatusBadge tone="slate">{toLabel(rfq.status)}</StatusBadge>
                <StatusBadge tone="amber">
                    {toLabel(rfq.procurementMode)}
                </StatusBadge>
                {trailingLabel ? (
                    <StatusBadge tone="green">{trailingLabel}</StatusBadge>
                ) : null}
            </div>
            <div className="mt-2 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <div>
                    <div className="text-sm font-semibold text-slate-900">
                        {rfq.companyName}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                        {rfq.contactPerson} • {rfq.email}
                    </div>
                    <CompactDetails text={rfq.useCase} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 md:min-w-[250px]">
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

function QueueFilterButton({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                active
                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-500 hover:text-slate-900"
            }`}
        >
            {children}
        </button>
    );
}

function RequestStatusPill({ status }: { status?: string | null }) {
    const positive = status === "quote_accepted" || status === "approved";
    const negative = status === "quote_rejected" || status === "closed";

    return (
        <span
            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                positive
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : negative
                      ? "border-rose-200 bg-rose-50 text-rose-700"
                      : "border-slate-200 bg-slate-50 text-slate-600"
            }`}
        >
            {toLabel(status)}
        </span>
    );
}

function QuoteStatusPill({ status }: { status?: string | null }) {
    return <RequestStatusPill status={status} />;
}

function RfqDetailsDialog({
    rfq,
    quote,
    open,
    onOpenChange,
}: {
    rfq: any | null;
    quote: any | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    if (!rfq) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto rounded-xl p-0">
                <DialogHeader className="border-b border-slate-200 px-5 py-4 pr-12">
                    <div className="flex flex-wrap items-center gap-2">
                        <DialogTitle className="font-mono text-base">
                            {rfq.rfqNumber}
                        </DialogTitle>
                        <RequestStatusPill status={rfq.status} />
                    </div>
                    <DialogDescription className="text-xs">
                        Submitted {formatDate(rfq.createdAt)}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 px-5 pb-5">
                    <DetailSection title="Company & contact">
                        <DetailField label="Company" value={rfq.companyName} />
                        <DetailField
                            label="Contact"
                            value={rfq.contactPerson}
                        />
                        <DetailField label="Email" value={rfq.email} />
                        <DetailField label="Phone" value={rfq.phone} />
                    </DetailSection>

                    <DetailSection title="Request">
                        <DetailField label="Use case" value={rfq.useCase} />
                        <DetailField
                            label="Quantity"
                            value={String(rfq.quantity)}
                        />
                        <DetailField
                            label="Budget / unit"
                            value={
                                rfq.budgetPerUnitPaise
                                    ? formatINR(rfq.budgetPerUnitPaise)
                                    : "Not specified"
                            }
                        />
                        <DetailField
                            label="Delivery date"
                            value={rfq.deliveryDate || "Not specified"}
                        />
                        <DetailField
                            label="Procurement mode"
                            value={toLabel(rfq.procurementMode)}
                        />
                        <DetailField
                            label="Buyer company"
                            value={
                                rfq.corporateProfileId ? "Linked" : "Not linked"
                            }
                        />
                    </DetailSection>

                    <div>
                        <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                            Requirement
                        </h3>
                        <p className="mt-2 whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-700">
                            {rfq.requirementDescription}
                        </p>
                    </div>

                    <div>
                        <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                            Attachments ({rfq.documents?.length ?? 0})
                        </h3>
                        <div className="mt-2 space-y-2">
                            {rfq.documents?.length ? (
                                rfq.documents.map((document: any) => (
                                    <a
                                        key={document.id}
                                        href={document.fileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                                    >
                                        <span className="flex min-w-0 items-center gap-2">
                                            <FileText className="size-3.5 shrink-0 text-slate-400" />
                                            <span className="truncate">
                                                {document.fileName}
                                            </span>
                                        </span>
                                        <span className="shrink-0 text-slate-500">
                                            Open
                                        </span>
                                    </a>
                                ))
                            ) : (
                                <p className="text-xs text-slate-500">
                                    No attachments uploaded.
                                </p>
                            )}
                        </div>
                    </div>

                    {quote ? (
                        <DetailSection title="Quotation">
                            <DetailField
                                label="Quote"
                                value={quote.quoteNumber}
                            />
                            <DetailField
                                label="Status"
                                value={toLabel(quote.status)}
                            />
                            <DetailField
                                label="Value"
                                value={formatINR(quote.totalAmountPaise)}
                            />
                            <DetailField
                                label="Revisions"
                                value={String(quote.revisions?.length ?? 0)}
                            />
                        </DetailSection>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function DetailSection({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section>
            <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                {title}
            </h3>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">{children}</div>
        </section>
    );
}

function DetailField({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-slate-500">
                {label}
            </div>
            <div className="mt-1 break-words text-xs font-medium text-slate-900">
                {value || "—"}
            </div>
        </div>
    );
}

function LabelledInput({
    label,
    value,
    onChange,
    placeholder,
    type,
    disabled = false,
}: {
    label: string;
    value: string;
    onChange?: (value: string) => void;
    placeholder: string;
    type?: string;
    disabled?: boolean;
}) {
    return (
        <label className="block space-y-1.5">
            <span className="text-[11px] font-medium text-slate-700">
                {label}
            </span>
            <Input
                className="h-8 px-2.5 text-[11px]"
                placeholder={placeholder}
                type={type}
                value={value}
                disabled={disabled}
                onChange={(e) => onChange?.(e.target.value)}
            />
        </label>
    );
}

function CompactSelect({
    label,
    value,
    onChange,
    options,
    optional = false,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
    optional?: boolean;
}) {
    return (
        <label className="block space-y-1.5">
            <span className="text-[11px] font-medium text-slate-700">
                {label}
            </span>
            <select
                className="!h-9 w-full rounded-md border border-input bg-background !px-3 !py-0 !text-xs !leading-normal"
                value={value}
                onChange={(event) => onChange(event.target.value)}
            >
                <option value="">
                    {optional
                        ? "Not specified"
                        : `Select ${label.toLowerCase()}`}
                </option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    );
}

function MetaPill({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-1.5">
            <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                {label}
            </div>
            <div className="mt-0.5 text-[11px] font-semibold text-slate-900">
                {value}
            </div>
        </div>
    );
}

function CompactDetails({ text }: { text?: string | null }) {
    if (!text) return null;

    return <span className="sr-only">{text}</span>;
}

function toLabel(value: string | null | undefined) {
    return (value ?? "")
        .replaceAll("_", " ")
        .replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatDate(value: string | Date | null | undefined) {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}
