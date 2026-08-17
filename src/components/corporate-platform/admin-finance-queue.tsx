"use client";

import { Button } from "@/components/ui/button-dash";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-dash";
import { Input } from "@/components/ui/input-dash";
import { trpc } from "@/lib/trpc/client";
import { useUploadThing } from "@/lib/uploadthing";
import { cn, formatINR, handleClientError } from "@/lib/utils";
import {
    ChevronLeft,
    ChevronRight,
    ClipboardCheck,
    Copy,
    Download,
    Eye,
    FileText,
    Loader2,
    ReceiptText,
    Search,
    Upload,
    WalletCards,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { AdminDirectOrderWizard } from "./admin-direct-order-wizard";

type WorkspaceTab = "queue" | "orders" | "ledger" | "documents";
type QueueRow =
    | { kind: "release"; id: string; data: any }
    | { kind: "po"; id: string; data: any };

const PAGE_SIZE = 8;

export function AdminFinanceQueue({ initialData }: { initialData: any }) {
    const router = useRouter();
    const utils = trpc.useUtils();
    const [tab, setTab] = useState<WorkspaceTab>("queue");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [selectedPo, setSelectedPo] = useState<any | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [poReviewNote, setPoReviewNote] = useState("");
    const [addPoOpen, setAddPoOpen] = useState(false);
    const [acceptingQuoteId, setAcceptingQuoteId] = useState<string | null>(
        null
    );
    const [acceptedQuoteIds, setAcceptedQuoteIds] = useState<Set<string>>(
        () => new Set()
    );
    const [directOrderPo, setDirectOrderPo] = useState<any | null>(null);
    const [poDraft, setPoDraft] = useState({
        quoteId: "",
        poNumber: "",
        poValue: "",
        poDate: "",
        deliveryDate: "",
        note: "",
    });
    const [poFile, setPoFile] = useState<File | null>(null);
    const { startUpload: uploadCorporateDocument, isUploading: poUploading } =
        useUploadThing("corporateDocumentUploader");

    const latestPaymentRequestByOrder = useMemo(() => {
        const requests = new Map<string, any>();
        for (const request of initialData.paymentRequests ?? []) {
            if (!requests.has(request.orderId))
                requests.set(request.orderId, request);
        }
        return requests;
    }, [initialData.paymentRequests]);
    const collectedByOrder = useMemo(() => {
        const amounts = new Map<string, number>();
        for (const payment of initialData.payments ?? []) {
            if (
                !["payment_success", "payment_partial"].includes(
                    payment.paymentStatus
                )
            )
                continue;
            amounts.set(
                payment.orderId,
                (amounts.get(payment.orderId) ?? 0) + (payment.amountPaise ?? 0)
            );
        }
        return amounts;
    }, [initialData.payments]);

    const quoteIdsWithPurchaseOrders = useMemo(
        () =>
            new Set(
                initialData.purchaseOrders
                    .map((po: any) => po.quoteId)
                    .filter(Boolean)
            ),
        [initialData.purchaseOrders]
    );
    const quoteIdsWithCreatedOrders = useMemo(
        () =>
            new Set(
                initialData.orders
                    .map((order: any) => {
                        const match = String(order.internalNotes ?? "").match(
                            /quote:([a-f0-9-]+)/i
                        );
                        return match?.[1] ?? null;
                    })
                    .filter(Boolean)
            ),
        [initialData.orders]
    );
    const approvedQuotesReadyForOrderRelease = initialData.quotes.filter(
        (quote: any) =>
            quote.status === "approved" &&
            !quoteIdsWithPurchaseOrders.has(quote.id) &&
            !quoteIdsWithCreatedOrders.has(quote.id)
    );
    const purchaseOrdersAwaitingDecision = initialData.purchaseOrders.filter(
        (purchaseOrder: any) =>
            ["po_uploaded", "po_review"].includes(purchaseOrder.status)
    );
    const outstandingBalancePaise = initialData.orders.reduce(
        (total: number, order: any) =>
            total + Math.max(0, order.balanceDuePaise ?? 0),
        0
    );
    const recordedCollectionsPaise = initialData.payments.reduce(
        (total: number, payment: any) => total + (payment.amountPaise ?? 0),
        0
    );

    const refreshFinance = async () => {
        await utils.general.corporatePlatform.listAdminFinance.invalidate();
        router.refresh();
    };

    const reviewPo =
        trpc.general.corporatePlatform.reviewPurchaseOrder.useMutation({
            onSuccess: async () => {
                toast.success("Purchase order reviewed");
                setSelectedPo(null);
                await refreshFinance();
            },
            onError: (error) => handleClientError(error),
        });
    const issueProforma =
        trpc.general.corporatePlatform.issueProformaInvoice.useMutation({
            onSuccess: async (invoice) => {
                toast.success("Proforma invoice ready. Download starting...");
                window.location.assign(
                    `/api/corporate-proforma-invoices/${invoice.id}/download`
                );
                await refreshFinance();
            },
            onError: (error) => handleClientError(error),
        });
    const issueTax = trpc.general.corporatePlatform.issueTaxInvoice.useMutation(
        {
            onSuccess: (invoice) => {
                toast.success("Tax invoice issued. Download starting...");
                window.location.assign(
                    `/api/corporate-orders/${invoice.orderId}/invoice.pdf`
                );
            },
            onError: (error) => handleClientError(error),
        }
    );
    const createAdminPo =
        trpc.general.corporatePlatform.createAdminPurchaseOrder.useMutation({
            onSuccess: async () => {
                toast.success("Emailed purchase order added to review queue");
                setAddPoOpen(false);
                setPoFile(null);
                await refreshFinance();
            },
            onError: (error) => handleClientError(error),
        });
    const acceptQuote =
        trpc.general.corporatePlatform.acceptQuoteAsAdmin.useMutation({
            onMutate: ({ quoteId }) => setAcceptingQuoteId(quoteId),
            onSuccess: async (quote) => {
                setAcceptedQuoteIds((current) => {
                    const next = new Set(current);
                    next.add(quote.id);
                    return next;
                });
                toast.success(
                    `${quote.quoteNumber} accepted on the customer's behalf`
                );
                await refreshFinance();
            },
            onError: (error) => handleClientError(error),
            onSettled: () => setAcceptingQuoteId(null),
        });

    const queueRows: QueueRow[] = [
        ...purchaseOrdersAwaitingDecision.map((data: any) => ({
            kind: "po" as const,
            id: `po-${data.id}`,
            data,
        })),
        ...approvedQuotesReadyForOrderRelease.map((data: any) => ({
            kind: "release" as const,
            id: `release-${data.id}`,
            data,
        })),
    ];
    const normalizedSearch = search.trim().toLowerCase();
    const includesSearch = (...values: unknown[]) =>
        !normalizedSearch ||
        values.some((value) =>
            String(value ?? "")
                .toLowerCase()
                .includes(normalizedSearch)
        );

    const filteredQueue = queueRows.filter((row) => {
        const item = row.data;
        return includesSearch(
            item.poNumber,
            item.quoteNumber,
            item.companyName,
            item.profile?.companyName,
            item.quote?.quoteNumber
        );
    });
    const filteredOrders = initialData.orders.filter((order: any) =>
        includesSearch(order.publicOrderId, order.companyName, order.status)
    );
    const ledgerRows = [
        ...initialData.payments.map((data: any) => ({
            id: `payment-${data.id}`,
            kind: "Payment" as const,
            status: data.paymentStatus,
            mode: data.paymentMode,
            amount: data.amountPaise,
            reference: data.paymentReference,
            date: data.paymentDate ?? data.createdAt,
            subtype: data.paymentType,
        })),
        ...initialData.refunds.map((data: any) => ({
            id: `refund-${data.id}`,
            kind: "Refund" as const,
            status: data.refundStatus,
            mode: data.refundMode ?? "Refund",
            amount: data.refundAmountPaise,
            reference: data.refundReference ?? data.id,
            date: data.refundDate ?? data.createdAt,
            subtype: data.refundType ?? "Credit",
        })),
    ].filter((row) =>
        includesSearch(
            row.kind,
            row.status,
            row.mode,
            row.reference,
            row.subtype
        )
    );
    const filteredQuotes = initialData.quotes.filter((quote: any) =>
        includesSearch(
            quote.quoteNumber,
            quote.profile?.companyName,
            quote.status
        )
    );

    const activeRows =
        tab === "queue"
            ? filteredQueue
            : tab === "orders"
              ? filteredOrders
              : tab === "ledger"
                ? ledgerRows
                : filteredQuotes;
    const pageCount = Math.max(1, Math.ceil(activeRows.length / PAGE_SIZE));
    const currentPage = Math.min(page, pageCount);
    const pagedRows = activeRows.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    useEffect(() => {
        setPage(1);
    }, [tab, search]);

    const openPoReview = (po: any) => {
        setPoReviewNote(po.reviewNotes ?? "");
        setSelectedPo(po);
    };
    const openAddPoForQuote = (quote: any) => {
        setPoDraft({
            quoteId: quote.id,
            poNumber: "",
            poValue: String((quote.totalAmountPaise ?? 0) / 100),
            poDate: "",
            deliveryDate: "",
            note: "",
        });
        setPoFile(null);
        setAddPoOpen(true);
    };
    const openCollection = (order: any) => {
        setSelectedOrder(order);
    };

    return (
        <div className="space-y-3">
            <section className="grid grid-cols-2 gap-2 xl:grid-cols-4">
                <Metric
                    label="Direct releases"
                    value={approvedQuotesReadyForOrderRelease.length}
                />
                <Metric
                    label="POs requiring review"
                    value={purchaseOrdersAwaitingDecision.length}
                    attention
                />
                <Metric
                    label="Outstanding balance"
                    value={formatINR(outstandingBalancePaise)}
                />
                <Metric
                    label="Recorded collections"
                    value={formatINR(recordedCollectionsPaise)}
                />
            </section>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex min-w-0 gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1">
                        <TabButton
                            active={tab === "queue"}
                            onClick={() => setTab("queue")}
                            icon={<ClipboardCheck />}
                        >
                            Action queue <Count>{queueRows.length}</Count>
                        </TabButton>
                        <TabButton
                            active={tab === "orders"}
                            onClick={() => setTab("orders")}
                            icon={<WalletCards />}
                        >
                            Collections{" "}
                            <Count>{initialData.orders.length}</Count>
                        </TabButton>
                        <TabButton
                            active={tab === "ledger"}
                            onClick={() => setTab("ledger")}
                            icon={<ReceiptText />}
                        >
                            Ledger <Count>{ledgerRows.length}</Count>
                        </TabButton>
                        <TabButton
                            active={tab === "documents"}
                            onClick={() => setTab("documents")}
                            icon={<FileText />}
                        >
                            Proforma invoices{" "}
                            <Count>{initialData.quotes.length}</Count>
                        </TabButton>
                    </div>
                    <div className="flex w-full gap-2 xl:w-auto">
                        <div className="relative min-w-0 flex-1 xl:w-72">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search this table"
                                className="h-9 pl-9 text-xs"
                            />
                        </div>
                    </div>
                </div>

                <div className="border-b border-slate-200 px-4 py-3">
                    <h2 className="text-sm font-semibold text-slate-950">
                        {tab === "queue" && "Orders requiring action"}
                        {tab === "orders" && "Order collections & tax invoices"}
                        {tab === "ledger" && "Payments, refunds & credits"}
                        {tab === "documents" && "Quote documents"}
                    </h2>
                    <p className="mt-0.5 text-11 text-slate-500">
                        {activeRows.length} record
                        {activeRows.length === 1 ? "" : "s"}
                    </p>
                </div>

                {tab === "queue" && (
                    <QueueTable
                        rows={pagedRows as QueueRow[]}
                        openPoReview={openPoReview}
                        openAddPo={openAddPoForQuote}
                        createDirectOrder={setDirectOrderPo}
                    />
                )}
                {tab === "orders" && (
                    <OrdersTable
                        rows={pagedRows as any[]}
                        paymentRequests={latestPaymentRequestByOrder}
                        collectedByOrder={collectedByOrder}
                        openCollection={openCollection}
                        issueTax={(orderId) => issueTax.mutate({ orderId })}
                        taxPending={issueTax.isPending}
                    />
                )}
                {tab === "ledger" && <LedgerTable rows={pagedRows as any[]} />}
                {tab === "documents" && (
                    <DocumentsTable
                        rows={pagedRows as any[]}
                        issueProforma={(quoteId) =>
                            issueProforma.mutate({ quoteId })
                        }
                        acceptQuote={(quoteId) =>
                            acceptQuote.mutate({ quoteId })
                        }
                        canAddPo={(quoteId) =>
                            !quoteIdsWithPurchaseOrders.has(quoteId)
                        }
                        openAddPo={openAddPoForQuote}
                        acceptedQuoteIds={acceptedQuoteIds}
                        acceptingQuoteId={acceptingQuoteId}
                        pending={
                            issueProforma.isPending || acceptQuote.isPending
                        }
                    />
                )}

                <Pagination
                    page={currentPage}
                    pageCount={pageCount}
                    total={activeRows.length}
                    onPage={setPage}
                />
            </section>

            <PoReviewDialog
                po={selectedPo}
                note={poReviewNote}
                setNote={setPoReviewNote}
                onClose={() => setSelectedPo(null)}
                pending={reviewPo.isPending}
                onReview={(status) => {
                    if (!selectedPo) return;
                    reviewPo.mutate({
                        purchaseOrderId: selectedPo.id,
                        status,
                        reviewNotes:
                            poReviewNote ||
                            (status === "po_accepted"
                                ? "Approved from finance workspace"
                                : "Purchase order requires clarification"),
                        validationSummary: selectedPo.validationSummary,
                    });
                }}
            />

            <PaymentWorkspaceDialog
                order={selectedOrder}
                paymentRequest={
                    selectedOrder
                        ? (latestPaymentRequestByOrder.get(selectedOrder.id) ??
                          null)
                        : null
                }
                onClose={() => setSelectedOrder(null)}
                onComplete={refreshFinance}
            />
            <AdminDirectOrderWizard
                po={directOrderPo}
                onClose={() => setDirectOrderPo(null)}
                onComplete={refreshFinance}
            />
            <AddPurchaseOrderDialog
                open={addPoOpen}
                onClose={() => setAddPoOpen(false)}
                quotes={initialData.quotes.filter(
                    (quote: any) =>
                        quote.status === "approved" &&
                        !quoteIdsWithPurchaseOrders.has(quote.id)
                )}
                draft={poDraft}
                setDraft={setPoDraft}
                file={poFile}
                setFile={setPoFile}
                pending={createAdminPo.isPending || poUploading}
                onSubmit={async () => {
                    if (!poFile)
                        return toast.error(
                            "Upload the customer purchase order"
                        );
                    const uploaded = await uploadCorporateDocument([poFile]);
                    const file = uploaded?.[0];
                    if (!file)
                        return toast.error("Purchase order upload failed");
                    createAdminPo.mutate({
                        quoteId: poDraft.quoteId,
                        poNumber: poDraft.poNumber,
                        poValuePaise: Math.round(Number(poDraft.poValue) * 100),
                        poDate: poDraft.poDate || null,
                        deliveryDate: poDraft.deliveryDate,
                        reviewNotes: poDraft.note || null,
                        uploadedFile: {
                            name: file.name,
                            url: file.url,
                            size: file.size,
                            key: file.key,
                            type:
                                (file as any).type ||
                                poFile.type ||
                                "application/pdf",
                        },
                    });
                }}
            />
        </div>
    );
}

function QueueTable({
    rows,
    openPoReview,
    openAddPo,
    createDirectOrder,
}: {
    rows: QueueRow[];
    openPoReview: (po: any) => void;
    openAddPo: (quote: any) => void;
    createDirectOrder: (po: any) => void;
}) {
    if (!rows.length) return <EmptyTable title="No finance actions waiting" />;
    return (
        <TableShell>
            <thead>
                <tr>
                    <Th>Reference</Th>
                    <Th>Company</Th>
                    <Th>Action type</Th>
                    <Th>Value</Th>
                    <Th>Status</Th>
                    <Th>Checks</Th>
                    <Th align="right">Action</Th>
                </tr>
            </thead>
            <tbody>
                {rows.map((row) => {
                    const item = row.data;
                    const isPo = row.kind === "po";
                    const issueCount =
                        item.validationSummary?.issues?.length ?? 0;
                    return (
                        <tr
                            key={row.id}
                            className="border-t border-slate-100 hover:bg-slate-50/70"
                        >
                            <Td strong>
                                {isPo ? item.poNumber : item.quoteNumber}
                            </Td>
                            <Td>
                                <div className="max-w-56 truncate font-medium text-slate-800">
                                    {item.profile?.companyName ??
                                        item.companyName ??
                                        "Buyer company pending"}
                                </div>
                                <div className="mt-0.5 text-11 text-slate-500">
                                    {isPo
                                        ? (item.quote?.quoteNumber ??
                                          "No linked quote")
                                        : `${item.quantity} unit(s)`}
                                </div>
                            </Td>
                            <Td>
                                {isPo
                                    ? "Purchase order review"
                                    : "Direct order release"}
                            </Td>
                            <Td strong>
                                {formatINR(
                                    isPo
                                        ? item.poValuePaise
                                        : item.totalAmountPaise
                                )}
                            </Td>
                            <Td>
                                <SmallBadge tone={isPo ? "amber" : "green"}>
                                    {isPo ? toLabel(item.status) : "Approved"}
                                </SmallBadge>
                            </Td>
                            <Td>
                                {isPo ? (
                                    <SmallBadge
                                        tone={issueCount ? "rose" : "green"}
                                    >
                                        {issueCount
                                            ? `${issueCount} issue${issueCount === 1 ? "" : "s"}`
                                            : "Passed"}
                                    </SmallBadge>
                                ) : (
                                    <span className="text-xs text-slate-500">
                                        No PO required
                                    </span>
                                )}
                            </Td>
                            <Td align="right">
                                {isPo ? (
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 text-xs"
                                            onClick={() => openPoReview(item)}
                                        >
                                            <Eye /> Review
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="h-8 text-xs"
                                            disabled={issueCount > 0}
                                            onClick={() =>
                                                createDirectOrder(item)
                                            }
                                        >
                                            Direct order
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        size="sm"
                                        className="h-8 text-xs"
                                        onClick={() => openAddPo(item)}
                                    >
                                        <Upload /> Add emailed PO
                                    </Button>
                                )}
                            </Td>
                        </tr>
                    );
                })}
            </tbody>
        </TableShell>
    );
}

function OrdersTable({
    rows,
    paymentRequests,
    collectedByOrder,
    openCollection,
    issueTax,
    taxPending,
}: {
    rows: any[];
    paymentRequests: Map<string, any>;
    collectedByOrder: Map<string, number>;
    openCollection: (order: any) => void;
    issueTax: (id: string) => void;
    taxPending: boolean;
}) {
    if (!rows.length) return <EmptyTable title="No corporate orders found" />;
    return (
        <TableShell>
            <thead>
                <tr>
                    <Th>Order</Th>
                    <Th>Company</Th>
                    <Th>Total</Th>
                    <Th>Collected</Th>
                    <Th>Balance</Th>
                    <Th>Payment request</Th>
                    <Th>Status</Th>
                    <Th align="right">Actions</Th>
                </tr>
            </thead>
            <tbody>
                {rows.map((order) => {
                    const total = order.totalPaise ?? 0;
                    const paid = collectedByOrder.get(order.id) ?? 0;
                    const actualBalance = Math.max(0, total - paid);
                    const request = paymentRequests.get(order.id);
                    return (
                        <tr
                            key={order.id}
                            className="border-t border-slate-100 hover:bg-slate-50/70"
                        >
                            <Td strong>{order.publicOrderId}</Td>
                            <Td>
                                <div>
                                    {order.companyName ?? "Unknown company"}
                                </div>
                                <div className="mt-0.5 text-[10px] text-slate-500">
                                    {order.emailAddress}
                                </div>
                            </Td>
                            <Td strong>{formatINR(total)}</Td>
                            <Td>{formatINR(paid)}</Td>
                            <Td>
                                <span
                                    className={cn(
                                        "font-semibold",
                                        actualBalance > 0
                                            ? "text-amber-700"
                                            : "text-emerald-700"
                                    )}
                                >
                                    {formatINR(actualBalance)}
                                </span>
                            </Td>
                            <Td>
                                {request ? (
                                    <div>
                                        <SmallBadge
                                            tone={
                                                request.status === "paid"
                                                    ? "green"
                                                    : request.status ===
                                                        "cancelled"
                                                      ? "slate"
                                                      : "amber"
                                            }
                                        >
                                            {toLabel(request.status)}
                                        </SmallBadge>
                                        <div className="mt-1 text-[10px] text-slate-500">
                                            {formatINR(request.amountPaise)}
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-11 text-slate-400">
                                        Not sent
                                    </span>
                                )}
                            </Td>
                            <Td>
                                <SmallBadge>
                                    {toLabel(order.status ?? "active")}
                                </SmallBadge>
                            </Td>
                            <Td align="right">
                                <div className="flex justify-end gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 text-xs"
                                        onClick={() => openCollection(order)}
                                    >
                                        Manage payment
                                    </Button>
                                    {order.receiptVoucher ? (
                                        <Button
                                            asChild
                                            size="sm"
                                            variant="outline"
                                            className="h-8 text-xs"
                                        >
                                            <a
                                                href={`/api/corporate-orders/${order.id}/receipt-voucher.pdf`}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                <Download /> Receipt
                                            </a>
                                        </Button>
                                    ) : null}
                                    <Button
                                        size="sm"
                                        className="h-8 text-xs"
                                        disabled={taxPending}
                                        onClick={() => issueTax(order.id)}
                                    >
                                        Tax invoice
                                    </Button>
                                </div>
                            </Td>
                        </tr>
                    );
                })}
            </tbody>
        </TableShell>
    );
}

function LedgerTable({ rows }: { rows: any[] }) {
    if (!rows.length)
        return <EmptyTable title="No payments or refunds recorded" />;
    return (
        <TableShell>
            <thead>
                <tr>
                    <Th>Transaction</Th>
                    <Th>Type</Th>
                    <Th>Status</Th>
                    <Th>Mode</Th>
                    <Th>Amount</Th>
                    <Th>Reference</Th>
                    <Th>Date</Th>
                </tr>
            </thead>
            <tbody>
                {rows.map((row) => (
                    <tr
                        key={row.id}
                        className="border-t border-slate-100 hover:bg-slate-50/70"
                    >
                        <Td strong>{row.kind}</Td>
                        <Td>{toLabel(row.subtype)}</Td>
                        <Td>
                            <SmallBadge
                                tone={row.kind === "Refund" ? "rose" : "green"}
                            >
                                {toLabel(row.status)}
                            </SmallBadge>
                        </Td>
                        <Td>{toLabel(row.mode)}</Td>
                        <Td strong>{formatINR(row.amount)}</Td>
                        <Td>
                            <span
                                className="block max-w-64 truncate"
                                title={row.reference ?? undefined}
                            >
                                {row.reference || "Pending reference"}
                            </span>
                        </Td>
                        <Td>{formatDate(row.date)}</Td>
                    </tr>
                ))}
            </tbody>
        </TableShell>
    );
}

function DocumentsTable({
    rows,
    issueProforma,
    acceptQuote,
    canAddPo,
    openAddPo,
    acceptedQuoteIds,
    acceptingQuoteId,
    pending,
}: {
    rows: any[];
    issueProforma: (id: string) => void;
    acceptQuote: (id: string) => void;
    canAddPo: (id: string) => boolean;
    openAddPo: (quote: any) => void;
    acceptedQuoteIds: Set<string>;
    acceptingQuoteId: string | null;
    pending: boolean;
}) {
    if (!rows.length)
        return <EmptyTable title="No quotations available for invoicing" />;
    return (
        <TableShell>
            <thead>
                <tr>
                    <Th>Quote</Th>
                    <Th>Company</Th>
                    <Th>Quote status</Th>
                    <Th>Proforma</Th>
                    <Th>Quantity</Th>
                    <Th>Quote value</Th>
                    <Th>Updated</Th>
                    <Th align="right">Action</Th>
                </tr>
            </thead>
            <tbody>
                {rows.map((quote) => {
                    const invoice = quote.proformaInvoice;
                    const isAccepted =
                        quote.status === "approved" ||
                        acceptedQuoteIds.has(quote.id);
                    const isAccepting = acceptingQuoteId === quote.id;
                    return (
                        <tr
                            key={quote.id}
                            className="border-t border-slate-100 hover:bg-slate-50/70"
                        >
                            <Td strong>{quote.quoteNumber}</Td>
                            <Td>
                                {quote.profile?.companyName ??
                                    "Unknown company"}
                            </Td>
                            <Td>
                                <SmallBadge
                                    tone={isAccepted ? "green" : "slate"}
                                >
                                    {isAccepted
                                        ? "Approved"
                                        : toLabel(quote.status)}
                                </SmallBadge>
                            </Td>
                            <Td>
                                {invoice ? (
                                    <div>
                                        <SmallBadge tone="green">
                                            Issued
                                        </SmallBadge>
                                        <div className="mt-1 text-[10px] text-slate-500">
                                            {invoice.invoiceNumber}
                                        </div>
                                    </div>
                                ) : (
                                    <SmallBadge>Not issued</SmallBadge>
                                )}
                            </Td>
                            <Td>{quote.quantity ?? "—"}</Td>
                            <Td strong>{formatINR(quote.totalAmountPaise)}</Td>
                            <Td>
                                {formatDate(
                                    invoice?.createdAt ??
                                        quote.updatedAt ??
                                        quote.createdAt
                                )}
                            </Td>
                            <Td align="right">
                                <div className="flex justify-end gap-2">
                                    {invoice && !isAccepted ? (
                                        <Button
                                            size="sm"
                                            className="h-8 text-xs"
                                            disabled={pending}
                                            onClick={() =>
                                                acceptQuote(quote.id)
                                            }
                                        >
                                            {isAccepting ? (
                                                <>
                                                    <Loader2 className="animate-spin" />{" "}
                                                    Accepting...
                                                </>
                                            ) : (
                                                "Accept quote"
                                            )}
                                        </Button>
                                    ) : null}
                                    {isAccepted && canAddPo(quote.id) ? (
                                        <Button
                                            size="sm"
                                            className="h-8 text-xs"
                                            onClick={() => openAddPo(quote)}
                                        >
                                            <Upload /> Add emailed PO
                                        </Button>
                                    ) : null}
                                    {invoice ? (
                                        <Button
                                            asChild
                                            size="sm"
                                            variant="outline"
                                            className="h-8 text-xs"
                                        >
                                            <a
                                                href={`/api/corporate-proforma-invoices/${invoice.id}/download`}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                <Download /> Download
                                            </a>
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 text-xs"
                                            disabled={pending}
                                            onClick={() =>
                                                issueProforma(quote.id)
                                            }
                                        >
                                            Issue & download
                                        </Button>
                                    )}
                                </div>
                            </Td>
                        </tr>
                    );
                })}
            </tbody>
        </TableShell>
    );
}

function PoReviewDialog({
    po,
    note,
    setNote,
    onClose,
    onReview,
    pending,
}: {
    po: any | null;
    note: string;
    setNote: (value: string) => void;
    onClose: () => void;
    onReview: (status: "po_accepted" | "po_requires_changes") => void;
    pending: boolean;
}) {
    const checks = po
        ? ([
              [
                  "Company matches approved quote",
                  po.validationSummary.companyNameMatches,
              ],
              [
                  "Order value matches quote",
                  po.validationSummary.orderValueMatches,
              ],
              [
                  "Delivery date is feasible",
                  po.validationSummary.deliveryDateFeasible,
              ],
          ] as Array<[string, boolean]>)
        : [];
    return (
        <Dialog open={Boolean(po)} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[88vh] max-w-2xl gap-0 overflow-y-auto rounded-xl p-0">
                <DialogHeader className="border-b border-slate-200 px-5 py-4">
                    <DialogTitle className="text-base">
                        Purchase order review
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Validate the PO before releasing it to fulfilment.
                    </DialogDescription>
                </DialogHeader>
                {po && (
                    <div className="space-y-4 p-5">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <Meta label="PO" value={po.poNumber} />
                            <Meta
                                label="Quote"
                                value={po.quote?.quoteNumber ?? "Not linked"}
                            />
                            <Meta
                                label="Company"
                                value={
                                    po.profile?.companyName ??
                                    po.companyName ??
                                    "Not linked"
                                }
                            />
                            <Meta
                                label="Value"
                                value={formatINR(po.poValuePaise)}
                            />
                        </div>
                        <div className="overflow-hidden rounded-lg border border-slate-200">
                            {checks.map(([label, passed]) => (
                                <div
                                    key={label}
                                    className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5 text-xs last:border-0"
                                >
                                    <span className="text-slate-700">
                                        {label}
                                    </span>
                                    <SmallBadge
                                        tone={passed ? "green" : "rose"}
                                    >
                                        {passed ? "Pass" : "Fail"}
                                    </SmallBadge>
                                </div>
                            ))}
                        </div>
                        {po.validationSummary.issues?.length > 0 && (
                            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700">
                                {po.validationSummary.issues.join(". ")}
                            </div>
                        )}
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Meta
                                label="PO file"
                                value={
                                    po.uploadedFileUrl ? "Available" : "Missing"
                                }
                            />
                            <Meta
                                label="Delivery"
                                value={formatDate(po.deliveryDate)}
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-slate-700">
                                Review notes
                            </label>
                            <Input
                                value={note}
                                onChange={(event) =>
                                    setNote(event.target.value)
                                }
                                placeholder="Add a concise review note"
                                className="h-9 text-xs"
                            />
                        </div>
                        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onReview("po_requires_changes")}
                                disabled={pending}
                            >
                                Request changes
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => onReview("po_accepted")}
                                disabled={
                                    pending ||
                                    po.validationSummary.issues?.length > 0
                                }
                            >
                                Accept purchase order
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

function PaymentWorkspaceDialog({
    order,
    paymentRequest,
    onClose,
    onComplete,
}: {
    order: any | null;
    paymentRequest: any | null;
    onClose: () => void;
    onComplete: () => Promise<void>;
}) {
    const [mode, setMode] = useState<"request" | "offline">("request");
    const [amount, setAmount] = useState("");
    const [paymentType, setPaymentType] = useState<
        "advance" | "balance" | "full" | "partial"
    >("advance");
    const [reference, setReference] = useState("");
    const [paymentMode, setPaymentMode] = useState<
        "bank_transfer" | "upi" | "neft" | "rtgs" | "manual"
    >("bank_transfer");
    const [paymentDate, setPaymentDate] = useState(() =>
        new Date().toISOString().slice(0, 10)
    );
    const [notes, setNotes] = useState("");
    const [proof, setProof] = useState<File | null>(null);
    const [generatedUrl, setGeneratedUrl] = useState("");
    const { startUpload, isUploading } = useUploadThing(
        "corporateDocumentUploader"
    );
    const createRequest =
        trpc.general.corporatePlatform.createAdminPaymentRequest.useMutation();
    const recordOffline =
        trpc.general.corporatePlatform.recordAdminOfflinePayment.useMutation();

    useEffect(() => {
        if (!order) return;
        setMode("request");
        setAmount(((order.balanceDuePaise ?? 0) / 100).toFixed(2));
        setPaymentType(order.advancePaidPaise > 0 ? "balance" : "advance");
        setReference("");
        setNotes("");
        setProof(null);
        setGeneratedUrl("");
    }, [order]);

    const amountPaise = Math.round(Number(amount) * 100);
    const validAmount =
        Number.isFinite(amountPaise) &&
        amountPaise > 0 &&
        amountPaise <= (order?.balanceDuePaise ?? 0);
    const submit = async () => {
        if (!order || !validAmount)
            return toast.error(
                "Enter an amount within the outstanding balance"
            );
        try {
            if (mode === "request") {
                const created = await createRequest.mutateAsync({
                    orderId: order.id,
                    amountPaise,
                    paymentType,
                    expiresInDays: 7,
                    notes: notes.trim() || null,
                    sendEmail: true,
                });
                setGeneratedUrl(created.paymentUrl);
                toast.success(`Payment link sent to ${order.emailAddress}`);
            } else {
                if (!reference.trim())
                    return toast.error(
                        "Enter the bank or transaction reference"
                    );
                let proofFile: any = null;
                if (proof) {
                    const uploaded = await startUpload([proof]);
                    const file = uploaded?.[0];
                    if (!file) throw new Error("Payment proof upload failed");
                    proofFile = {
                        name: file.name,
                        url: file.url,
                        key: file.key,
                        size: file.size,
                        type:
                            (file as any).type ||
                            proof.type ||
                            "application/octet-stream",
                    };
                }
                const result = await recordOffline.mutateAsync({
                    orderId: order.id,
                    paymentRequestId:
                        paymentRequest?.status !== "paid"
                            ? (paymentRequest?.id ?? null)
                            : null,
                    amountPaise,
                    paymentType,
                    paymentMode,
                    paymentReference: reference.trim(),
                    paymentDate,
                    proofFile,
                    notes: notes.trim() || null,
                });
                toast.success(
                    `Payment recorded. Receipt ${result.receiptVoucher?.voucherNumber ?? "created"}`
                );
                onClose();
            }
            await onComplete();
        } catch (error) {
            handleClientError(error);
        }
    };
    const pending =
        createRequest.isPending || recordOffline.isPending || isUploading;

    return (
        <Dialog
            open={Boolean(order)}
            onOpenChange={(open) => !open && onClose()}
        >
            <DialogContent className="max-h-[90vh] max-w-2xl gap-0 overflow-y-auto rounded-xl p-0">
                <DialogHeader className="border-b border-slate-200 px-5 py-4">
                    <DialogTitle className="text-base">
                        Payment setup
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Send a secure payment link or record a verified offline
                        collection.
                    </DialogDescription>
                </DialogHeader>
                {order && (
                    <div className="space-y-4 p-5">
                        <div className="grid gap-2 sm:grid-cols-4">
                            <Meta label="Order" value={order.publicOrderId} />
                            <Meta label="Customer" value={order.companyName} />
                            <Meta label="Email" value={order.emailAddress} />
                            <Meta
                                label="Balance due"
                                value={formatINR(order.balanceDuePaise ?? 0, {
                                    keepDecimals: true,
                                })}
                            />
                        </div>
                        {paymentRequest ? (
                            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs">
                                <span>
                                    Latest request:{" "}
                                    <b>
                                        {formatINR(paymentRequest.amountPaise, {
                                            keepDecimals: true,
                                        })}
                                    </b>{" "}
                                    · {toLabel(paymentRequest.status)}
                                </span>
                                <span>
                                    Sent{" "}
                                    {formatDate(
                                        paymentRequest.sentAt ??
                                            paymentRequest.createdAt
                                    )}
                                </span>
                            </div>
                        ) : null}
                        <div className="inline-flex rounded-lg bg-slate-100 p-1">
                            <button
                                type="button"
                                onClick={() => setMode("request")}
                                className={cn(
                                    "rounded-md px-3 py-1.5 text-xs font-medium",
                                    mode === "request" && "bg-white shadow-sm"
                                )}
                            >
                                Send payment link
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode("offline")}
                                className={cn(
                                    "rounded-md px-3 py-1.5 text-xs font-medium",
                                    mode === "offline" && "bg-white shadow-sm"
                                )}
                            >
                                Record offline payment
                            </button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Field label="Amount (INR)">
                                <Input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={amount}
                                    onChange={(event) =>
                                        setAmount(event.target.value)
                                    }
                                    className="h-9 text-xs"
                                />
                            </Field>
                            <Field label="Payment type">
                                <Select
                                    value={paymentType}
                                    onChange={(value) =>
                                        setPaymentType(
                                            value as typeof paymentType
                                        )
                                    }
                                    options={[
                                        ["advance", "Advance"],
                                        ["partial", "Partial"],
                                        ["balance", "Balance"],
                                        ["full", "Full payment"],
                                    ]}
                                />
                            </Field>
                        </div>
                        {mode === "offline" ? (
                            <div className="grid gap-3 sm:grid-cols-2">
                                <Field label="Payment mode">
                                    <Select
                                        value={paymentMode}
                                        onChange={(value) =>
                                            setPaymentMode(
                                                value as typeof paymentMode
                                            )
                                        }
                                        options={[
                                            ["bank_transfer", "Bank transfer"],
                                            ["neft", "NEFT"],
                                            ["rtgs", "RTGS"],
                                            ["upi", "UPI"],
                                            [
                                                "manual",
                                                "Other verified payment",
                                            ],
                                        ]}
                                    />
                                </Field>
                                <Field label="Payment date">
                                    <Input
                                        type="date"
                                        value={paymentDate}
                                        onChange={(event) =>
                                            setPaymentDate(event.target.value)
                                        }
                                        className="h-9 text-xs"
                                    />
                                </Field>
                                <Field label="Transaction / bank reference">
                                    <Input
                                        value={reference}
                                        onChange={(event) =>
                                            setReference(event.target.value)
                                        }
                                        placeholder="UTR, transaction ID or bank reference"
                                        className="h-9 text-xs"
                                    />
                                </Field>
                                <Field label="Payment proof (optional)">
                                    <Input
                                        type="file"
                                        accept="application/pdf,image/png,image/jpeg"
                                        onChange={(event) =>
                                            setProof(
                                                event.target.files?.[0] ?? null
                                            )
                                        }
                                        className="h-9 pt-1.5 text-xs"
                                    />
                                </Field>
                            </div>
                        ) : (
                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
                                The secure link will be emailed to{" "}
                                <b>{order.emailAddress}</b>. Registered
                                customers also see Pay Now in their Renivet
                                corporate orders; guest customers can pay from
                                the email link.
                            </div>
                        )}
                        <Field label="Internal/payment note">
                            <Input
                                value={notes}
                                onChange={(event) =>
                                    setNotes(event.target.value)
                                }
                                placeholder="Advance agreed, bank confirmation, or other context"
                                className="h-9 text-xs"
                            />
                        </Field>
                        {generatedUrl ? (
                            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2">
                                <Input
                                    readOnly
                                    value={generatedUrl}
                                    className="h-8 bg-white text-11"
                                />
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8"
                                    onClick={async () => {
                                        await navigator.clipboard.writeText(
                                            generatedUrl
                                        );
                                        toast.success("Payment link copied");
                                    }}
                                >
                                    <Copy /> Copy
                                </Button>
                            </div>
                        ) : null}
                        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
                            {order.receiptVoucher ? (
                                <Button asChild size="sm" variant="outline">
                                    <a
                                        href={`/api/corporate-orders/${order.id}/receipt-voucher.pdf`}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <Download />{" "}
                                        {order.receiptVoucher.voucherNumber}
                                    </a>
                                </Button>
                            ) : null}
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={onClose}
                            >
                                Close
                            </Button>
                            <Button
                                size="sm"
                                onClick={submit}
                                disabled={pending || !validAmount}
                            >
                                {mode === "request"
                                    ? "Email payment link"
                                    : "Record & issue receipt"}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

function AddPurchaseOrderDialog({
    open,
    onClose,
    quotes,
    draft,
    setDraft,
    file,
    setFile,
    pending,
    onSubmit,
}: {
    open: boolean;
    onClose: () => void;
    quotes: any[];
    draft: any;
    setDraft: (value: any) => void;
    file: File | null;
    setFile: (value: File | null) => void;
    pending: boolean;
    onSubmit: () => void;
}) {
    const selectedQuote = quotes.find((quote) => quote.id === draft.quoteId);
    const quoteOptions: Array<[string, string]> = [
        ["", "Select approved quote"],
        ...quotes.map((quote): [string, string] => [
            quote.id,
            `${quote.quoteNumber} - ${quote.profile?.companyName ?? "Customer"} - ${formatINR(quote.totalAmountPaise)}`,
        ]),
    ];
    const update = (key: string, value: string) =>
        setDraft({ ...draft, [key]: value });
    useEffect(() => {
        if (!selectedQuote) return;
        setDraft((current: any) => ({
            ...current,
            poValue:
                current.poValue ||
                String((selectedQuote.totalAmountPaise ?? 0) / 100),
        }));
    }, [selectedQuote, setDraft]);
    const valid =
        draft.quoteId &&
        draft.poNumber.trim() &&
        Number(draft.poValue) > 0 &&
        draft.deliveryDate &&
        file;
    return (
        <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
            <DialogContent className="max-h-[90vh] max-w-xl gap-0 overflow-y-auto rounded-xl p-0">
                <DialogHeader className="border-b border-slate-200 px-5 py-4">
                    <DialogTitle className="text-base">
                        Add emailed purchase order
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Link the customer PO to its approved quotation. The
                        fulfilling brand and order specification come from that
                        quote.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 p-5">
                    <Field label="Approved quotation">
                        <Select
                            value={draft.quoteId}
                            onChange={(value) => update("quoteId", value)}
                            options={quoteOptions}
                        />
                    </Field>
                    {selectedQuote ? (
                        <div className="grid gap-2 sm:grid-cols-3">
                            <Meta
                                label="Company"
                                value={
                                    selectedQuote.profile?.companyName ??
                                    "Customer"
                                }
                            />
                            <Meta
                                label="Quantity"
                                value={`${selectedQuote.quantity} units`}
                            />
                            <Meta
                                label="Quote value"
                                value={formatINR(
                                    selectedQuote.totalAmountPaise
                                )}
                            />
                        </div>
                    ) : null}
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Customer PO number">
                            <Input
                                value={draft.poNumber}
                                onChange={(event) =>
                                    update("poNumber", event.target.value)
                                }
                                className="h-9 text-xs"
                            />
                        </Field>
                        <Field label="PO value (INR)">
                            <Input
                                type="number"
                                value={draft.poValue}
                                onChange={(event) =>
                                    update("poValue", event.target.value)
                                }
                                className="h-9 text-xs"
                            />
                        </Field>
                        <Field label="PO date">
                            <Input
                                type="date"
                                value={draft.poDate}
                                onChange={(event) =>
                                    update("poDate", event.target.value)
                                }
                                className="h-9 text-xs"
                            />
                        </Field>
                        <Field label="Required delivery date">
                            <Input
                                type="date"
                                value={draft.deliveryDate}
                                onChange={(event) =>
                                    update("deliveryDate", event.target.value)
                                }
                                className="h-9 text-xs"
                            />
                        </Field>
                        <Field label="PO file">
                            <Input
                                type="file"
                                accept="application/pdf,image/png,image/jpeg"
                                onChange={(event) =>
                                    setFile(event.target.files?.[0] ?? null)
                                }
                                className="h-9 pt-1.5 text-xs"
                            />
                        </Field>
                    </div>
                    <Field label="Review note (optional)">
                        <Input
                            value={draft.note}
                            onChange={(event) =>
                                update("note", event.target.value)
                            }
                            className="h-9 text-xs"
                        />
                    </Field>
                    <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                        <Button size="sm" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            disabled={pending || !valid}
                            onClick={onSubmit}
                        >
                            {pending ? "Uploading..." : "Add to review queue"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-11 font-medium text-slate-700">
                {label}
            </span>
            {children}
        </label>
    );
}
function Select({
    value,
    onChange,
    options,
}: {
    value: string;
    onChange: (value: string) => void;
    options: Array<[string, string]>;
}) {
    return (
        <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        >
            {options.map(([optionValue, label]) => (
                <option key={optionValue} value={optionValue}>
                    {label}
                </option>
            ))}
        </select>
    );
}

function Metric({
    label,
    value,
    attention = false,
}: {
    label: string;
    value: ReactNode;
    attention?: boolean;
}) {
    return (
        <div
            className={cn(
                "rounded-xl border bg-white px-4 py-3 shadow-sm",
                attention && Number(value) > 0
                    ? "border-amber-200"
                    : "border-slate-200"
            )}
        >
            <p className="text-11 font-medium text-slate-500">{label}</p>
            <p className="mt-1 text-lg font-semibold leading-none text-slate-950">
                {value}
            </p>
        </div>
    );
}
function TabButton({
    active,
    onClick,
    icon,
    children,
}: {
    active: boolean;
    onClick: () => void;
    icon: ReactNode;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition",
                active
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-600 hover:text-slate-950",
                "[&_svg]:size-3.5"
            )}
        >
            {icon}
            {children}
        </button>
    );
}
function Count({ children }: { children: ReactNode }) {
    return (
        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
            {children}
        </span>
    );
}
function TableShell({ children }: { children: ReactNode }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] table-auto text-left text-xs text-slate-600">
                {children}
            </table>
        </div>
    );
}
function Th({
    children,
    align = "left",
}: {
    children: ReactNode;
    align?: "left" | "right";
}) {
    return (
        <th
            className={cn(
                "whitespace-nowrap bg-slate-50 px-4 py-2.5 text-11 font-semibold text-slate-500",
                align === "right" && "text-right"
            )}
        >
            {children}
        </th>
    );
}
function Td({
    children,
    strong = false,
    align = "left",
}: {
    children: ReactNode;
    strong?: boolean;
    align?: "left" | "right";
}) {
    return (
        <td
            className={cn(
                "whitespace-nowrap px-4 py-3 align-middle",
                strong && "font-semibold text-slate-900",
                align === "right" && "text-right"
            )}
        >
            {children}
        </td>
    );
}
function SmallBadge({
    children,
    tone = "slate",
}: {
    children: ReactNode;
    tone?: "slate" | "green" | "amber" | "rose";
}) {
    return (
        <span
            className={cn(
                "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                tone === "slate" &&
                    "border-slate-200 bg-slate-50 text-slate-600",
                tone === "green" &&
                    "border-emerald-200 bg-emerald-50 text-emerald-700",
                tone === "amber" &&
                    "border-amber-200 bg-amber-50 text-amber-700",
                tone === "rose" && "border-rose-200 bg-rose-50 text-rose-700"
            )}
        >
            {children}
        </span>
    );
}
function Meta({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                {label}
            </p>
            <div className="mt-1 truncate text-xs font-semibold text-slate-900">
                {value}
            </div>
        </div>
    );
}
function EmptyTable({ title }: { title: string }) {
    return (
        <div className="grid min-h-44 place-items-center px-4 py-10 text-center">
            <div>
                <div className="mx-auto grid size-9 place-items-center rounded-full bg-slate-100">
                    <FileText className="size-4 text-slate-400" />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-800">
                    {title}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                    New records will appear here automatically.
                </p>
            </div>
        </div>
    );
}
function Pagination({
    page,
    pageCount,
    total,
    onPage,
}: {
    page: number;
    pageCount: number;
    total: number;
    onPage: (page: number) => void;
}) {
    const start = total ? (page - 1) * PAGE_SIZE + 1 : 0;
    const end = Math.min(page * PAGE_SIZE, total);
    return (
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-2.5 text-11 text-slate-500">
            <span>
                Showing {start}–{end} of {total}
            </span>
            <div className="flex items-center gap-2">
                <span>
                    Page {page} of {pageCount}
                </span>
                <button
                    type="button"
                    aria-label="Previous page"
                    disabled={page <= 1}
                    onClick={() => onPage(page - 1)}
                    className="grid size-7 place-items-center rounded-md border border-slate-200 disabled:opacity-40"
                >
                    <ChevronLeft className="size-3.5" />
                </button>
                <button
                    type="button"
                    aria-label="Next page"
                    disabled={page >= pageCount}
                    onClick={() => onPage(page + 1)}
                    className="grid size-7 place-items-center rounded-md border border-slate-200 disabled:opacity-40"
                >
                    <ChevronRight className="size-3.5" />
                </button>
            </div>
        </div>
    );
}
function formatDate(value: unknown) {
    if (!value) return "Pending";
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
}
function toLabel(value: string | null | undefined) {
    return (value ?? "")
        .replaceAll("_", " ")
        .replace(/\b\w/g, (match) => match.toUpperCase());
}
