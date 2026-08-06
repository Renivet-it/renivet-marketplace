"use client";

import { CorporateOrderPage } from "@/components/corporate-orders/corporate-order-page";
import { Button } from "@/components/ui/button-general";
import { Input } from "@/components/ui/input-general";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    extractCorporateDeliveryAddress,
    formatCorporateDeliveryAddress,
} from "@/lib/corporate-delivery-address";
import { initializeRazorpayPayment } from "@/lib/razorpay/payment";
import { trpc } from "@/lib/trpc/client";
import { useUploadThing } from "@/lib/uploadthing";
import { formatINR, handleClientError } from "@/lib/utils";
import {
    AlertTriangle,
    ArrowUpRight,
    ArrowRight,
    Building2,
    CheckCircle2,
    Clock,
    Download,
    Eye,
    FileText,
    Headphones,
    LockKeyhole,
    ShoppingCart,
    Upload,
    XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import Script from "next/script";
import type { ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";

function ensureRazorpaySdk() {
    return new Promise<void>((resolve, reject) => {
        if (typeof window === "undefined") {
            reject(
                new Error("Razorpay checkout is only available in the browser")
            );
            return;
        }

        if ((window as any).Razorpay) {
            resolve();
            return;
        }

        const existing = document.querySelector<HTMLScriptElement>(
            "script[src=\"https://checkout.razorpay.com/v1/checkout.js\"]"
        );

        if (existing) {
            existing.addEventListener("load", () => resolve(), { once: true });
            existing.addEventListener(
                "error",
                () => reject(new Error("Failed to load Razorpay checkout")),
                { once: true }
            );
            return;
        }

        reject(new Error("Failed to load Razorpay checkout"));
    });
}

export function CustomerCorporateDashboard({
    initialProfile,
    initialRfqs,
    initialQuotes,
    initialPurchaseOrders,
    initialOrders,
    initialTaxInvoices,
}: {
    initialProfile: any;
    initialRfqs: any[];
    initialQuotes: any[];
    initialPurchaseOrders: any[];
    initialOrders: any[];
    initialTaxInvoices: Array<{ orderId: string; invoiceNumber: string }>;
}) {
    const utils = trpc.useUtils();
    const { startUpload } = useUploadThing("corporateDocumentUploader");
    const [activeTab, setActiveTab] = useState("overview");
    const [quotes, setQuotes] = useState(initialQuotes);
    const [purchaseOrders, setPurchaseOrders] = useState(initialPurchaseOrders);
    const [orderSetupQuoteId, setOrderSetupQuoteId] = useState<string | null>(
        null
    );
    const [poFiles, setPoFiles] = useState<Record<string, File | null>>({});
    const [poNumbers, setPoNumbers] = useState<Record<string, string>>({});
    const [poScopes, setPoScopes] = useState<Record<string, string>>({});
    const [poSignatories, setPoSignatories] = useState<Record<string, string>>(
        {}
    );
    const [purchaseOrderChoice, setPurchaseOrderChoice] = useState<
        Record<string, "direct" | "purchase_order" | undefined>
    >({});
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
        initialOrders[0]?.id ?? null
    );
    const [selectedRfqId, setSelectedRfqId] = useState<string | null>(
        initialRfqs[0]?.id ?? null
    );
    const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(
        initialQuotes[0]?.id ?? null
    );

    const quoteDecision =
        trpc.general.corporatePlatform.decideQuote.useMutation({
            onSuccess: async (updatedQuote) => {
                toast.success("Quote approved");
                setQuotes((current) =>
                    current.map((quote) =>
                        quote.id === updatedQuote.id
                            ? {
                                  ...quote,
                                  ...updatedQuote,
                              }
                            : quote
                    )
                );
                setActiveTab("quotes");
                await Promise.all([
                    utils.general.corporatePlatform.listMyQuotes.invalidate(),
                    utils.general.corporatePlatform.listMyRfqs.invalidate(),
                ]);
            },
            onError: (error) => handleClientError(error),
        });

    const createPo =
        trpc.general.corporatePlatform.createPurchaseOrder.useMutation({
            onSuccess: async (createdPurchaseOrder) => {
                toast.success("Purchase order uploaded");
                setPurchaseOrders((current) => [
                    createdPurchaseOrder,
                    ...current,
                ]);
                const createdQuoteId = createdPurchaseOrder.quoteId;
                if (createdQuoteId) {
                    setPurchaseOrderChoice((current) => ({
                        ...current,
                        [createdQuoteId]: "purchase_order",
                    }));
                    setOrderSetupQuoteId(createdQuoteId);
                }
                setActiveTab("order-setup");
                await Promise.all([
                    utils.general.corporatePlatform.listMyQuotes.invalidate(),
                    utils.general.corporatePlatform.listMyRfqs.invalidate(),
                ]);
            },
            onError: (error) => handleClientError(error),
        });
    const createBalancePaymentOrder =
        trpc.general.corporateOrders.createBalancePaymentOrder.useMutation({
            onError: (error) => handleClientError(error),
        });
    const confirmBalancePayment =
        trpc.general.corporateOrders.confirmBalancePayment.useMutation({
            onSuccess: async () => {
                await utils.general.corporateOrders.listMyOrders.invalidate();
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
            if (
                !file ||
                !poNumber ||
                !productScopeSummary ||
                !authorizedSignatoryName
            ) {
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
                    type:
                        (uploadedFile as any).type ??
                        "application/octet-stream",
                },
            });
        } catch (error) {
            handleClientError(error);
        }
    };

    const purchaseOrdersReadyCount = quotes.filter(
        (quote) => quote.status === "approved"
    ).length;
    const paidOrdersCount = initialOrders.filter(
        (order) => order.paymentStatus === "paid"
    ).length;
    const deliveredOrdersCount = initialOrders.filter(
        (order) => order.status === "delivered"
    ).length;
    const quotesNeedingAction = quotes.filter((quote) =>
        [
            "sent",
            "quote_sent",
            "customer_review",
            "revision_requested",
        ].includes(String(quote.status))
    );
    const purchaseOrderByQuoteId = new Map(
        purchaseOrders
            .filter((purchaseOrder) => purchaseOrder.quoteId)
            .map((purchaseOrder) => [purchaseOrder.quoteId, purchaseOrder])
    );
    const unlockedQuotes = quotes.filter((quote) => {
        if (quote.status !== "approved") return false;

        const selectedPath = purchaseOrderChoice[quote.id];
        if (selectedPath === "direct") return true;
        if (selectedPath === "purchase_order") {
            return purchaseOrderByQuoteId.has(quote.id);
        }

        return purchaseOrderByQuoteId.has(quote.id);
    });
    const selectedOrderSetupQuote =
        quotes.find((quote) => quote.id === orderSetupQuoteId) ??
        unlockedQuotes[0] ??
        null;
    const selectedOrder =
        initialOrders.find((order) => order.id === selectedOrderId) ??
        initialOrders[0] ??
        null;

    const payRemainingBalance = async (order: any) => {
        try {
            const created = await createBalancePaymentOrder.mutateAsync({
                corporateOrderId: order.id,
            });

            await ensureRazorpaySdk();
            initializeRazorpayPayment({
                key: process.env.NEXT_PUBLIC_RAZOR_PAY_KEY_ID!,
                amount: created.razorpay.amount,
                currency: created.razorpay.currency,
                name: created.razorpay.name,
                description: created.razorpay.description,
                order_id: created.razorpay.orderId,
                prefill: {
                    name: order.contactPersonName,
                    email: order.emailAddress,
                    contact: order.mobileNumber,
                },
                theme: {
                    color: "#5B9BD5",
                },
                handler: async (response: {
                    razorpay_order_id: string;
                    razorpay_payment_id: string;
                    razorpay_signature: string;
                }) => {
                    await confirmBalancePayment.mutateAsync({
                        corporateOrderId: order.id,
                        razorpayOrderId: response.razorpay_order_id,
                        razorpayPaymentId: response.razorpay_payment_id,
                        razorpaySignature: response.razorpay_signature,
                    });

                    toast.success("Remaining balance paid successfully");
                    window.location.href = `/corporate-orders/confirmation/${order.id}`;
                },
                modal: {
                    ondismiss: () => {
                        toast.message("Remaining balance payment cancelled");
                    },
                },
            } as any);
        } catch (error) {
            handleClientError(error);
        }
    };

    return (
        <div className="w-full max-w-full space-y-7 overflow-x-hidden pb-6 font-inter text-[#182131]">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />

            <section className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_236px]">
                <div>
                    <div className="flex items-start justify-between gap-5">
                        <div>
                            <p className="text-[13px] font-medium text-[#1d5b47]">
                                Good afternoon, {initialProfile?.contactPerson?.split(" ")[0] ?? "Dark"} 👋
                            </p>
                            <h1 className="mt-3 max-w-[610px] text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-[#172033] md:text-[42px]">
                                Everything your team<br />
                                needs to procure<br />
                                sustainably.
                            </h1>
                            <p className="mt-4 max-w-[430px] text-[15px] leading-6 text-[#5d6879]">
                                Choose how you&apos;d like to place your order.<br />
                                We&apos;ll take care of the rest.
                            </p>
                        </div>
                    </div>

                    <section className="mt-7 rounded-xl border border-[#dde3e6] bg-white p-5 shadow-[0_7px_20px_rgba(25,42,56,0.03)]">
                        <h2 className="text-[17px] font-bold text-[#1b2536]">How would you like to buy?</h2>
                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                            <ActionCard
                                eyebrow=""
                                title="Browse Products"
                                description="Browse our catalog, customize quantities, and place your order instantly."
                                href="/profile/corporate/self-service"
                                cta="Browse Products"
                                tone="reference-primary"
                                icon={<ShoppingCart className="size-6" strokeWidth={1.8} />}
                            />
                            <ActionCard
                                eyebrow=""
                                title="Request a Custom Quote"
                                description="Tell us what you need, and our procurement team will prepare a tailored quotation."
                                href="/profile/corporate/request-quote"
                                cta="Request Quote"
                                tone="reference-secondary"
                                icon={<FileText className="size-6" strokeWidth={1.8} />}
                            />
                        </div>
                    </section>

                    <section className="mt-7 grid grid-cols-2 divide-x divide-y divide-[#edf0f1] rounded-xl border border-[#dde3e6] bg-white px-2 py-4 shadow-[0_7px_20px_rgba(25,42,56,0.03)] sm:grid-cols-3 sm:divide-y-0 lg:grid-cols-6">
                        <MetricCard label="Quote Requests" value={String(initialRfqs.length)} hint="Requests submitted" compact />
                        <MetricCard label="Quotes" value={String(quotes.length)} hint="Quotes received" compact />
                        <MetricCard label="Orders" value={String(initialOrders.length)} hint="Orders placed" compact />
                        <MetricCard label="Approved Quotes" value={String(purchaseOrdersReadyCount)} hint="Ready for checkout" compact />
                        <MetricCard label="Payments" value={String(paidOrdersCount)} hint="Completed payments" compact />
                        <MetricCard label="Deliveries" value={String(deliveredOrdersCount)} hint="Delivered orders" compact />
                    </section>
                </div>

                <aside className="space-y-5">
                    <SideInfoCard
                        icon={<Building2 className="size-4" />}
                        title="Company Profile"
                        body={initialProfile?.companyName
                            ? `${initialProfile.companyName} is ready for corporate orders.`
                            : "Your company details will be saved after your first quotation request."}
                        action={initialProfile ? "View Profile" : "Complete Profile"}
                    />
                    <div>
                        <div className="flex items-center gap-2 text-[16px] font-bold text-[#182131]">
                            <span className="flex size-5 items-center justify-center rounded-full bg-[#1d5b47] text-white"><CheckCircle2 className="size-3.5" /></span>
                            Next Steps
                        </div>
                        <p className="mt-2 text-[13px] leading-5 text-[#687487]">Once your quote is approved, you can continue with your order.</p>
                        <div className="mt-4 space-y-3">
                            <InfoRow icon={<CheckCircle2 className="size-5 text-[#1d5b47]" />} text={quotesNeedingAction.length ? `${quotesNeedingAction.length} quote(s) awaiting your review` : "No quotes awaiting approval"} />
                            <InfoRow icon={<LockKeyhole className="size-5 text-[#a4adba]" />} text="Ordering becomes available after approval" muted />
                        </div>
                    </div>
                    <SideInfoCard
                        icon={<Headphones className="size-4" />}
                        title="Need Help?"
                        body="Our procurement team is here to support you."
                        action="Contact Procurement Team"
                    />
                </aside>
            </section>

            {/* Metrics Section */}
            <section className="hidden">
                <MetricCard
                    label="Requests for Quotation"
                    value={String(initialRfqs.length)}
                    hint="Managed buying requests submitted"
                />
                <MetricCard
                    label="Quotes"
                    value={String(quotes.length)}
                    hint="Commercial drafts received"
                />
                <MetricCard
                    label="Orders"
                    value={String(initialOrders.length)}
                    hint="Corporate orders created"
                />
                <MetricCard
                    label="Approved Quotations"
                    value={String(purchaseOrdersReadyCount)}
                    hint="Ready to continue into order setup"
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

            {/* Tabs List */}
            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-6"
            >
                <div className="border-b border-[#dde3e6]">
                    <TabsList
                        className={`grid h-auto w-full grid-cols-2 gap-1 rounded-none bg-transparent p-0 ${
                            unlockedQuotes.length
                                ? "md:grid-cols-6"
                                : "md:grid-cols-5"
                        }`}
                    >
                        <TabsTrigger
                            value="overview"
                            className="rounded-none border-b-2 border-transparent bg-transparent py-3 text-[13px] font-medium text-[#697485] shadow-none data-[state=active]:border-[#1d5b47] data-[state=active]:bg-transparent data-[state=active]:text-[#1d5b47] data-[state=active]:shadow-none"
                        >
                            Overview
                        </TabsTrigger>
                        <TabsTrigger
                            value="requests"
                            className="rounded-none border-b-2 border-transparent bg-transparent py-3 text-[13px] font-medium text-[#697485] shadow-none data-[state=active]:border-[#1d5b47] data-[state=active]:bg-transparent data-[state=active]:text-[#1d5b47] data-[state=active]:shadow-none"
                        >
                            Requests
                        </TabsTrigger>
                        <TabsTrigger
                            value="quotes"
                            className="rounded-none border-b-2 border-transparent bg-transparent py-3 text-[13px] font-medium text-[#697485] shadow-none data-[state=active]:border-[#1d5b47] data-[state=active]:bg-transparent data-[state=active]:text-[#1d5b47] data-[state=active]:shadow-none"
                        >
                            Quotes
                        </TabsTrigger>
                        <TabsTrigger
                            value="orders"
                            className="rounded-none border-b-2 border-transparent bg-transparent py-3 text-[13px] font-medium text-[#697485] shadow-none data-[state=active]:border-[#1d5b47] data-[state=active]:bg-transparent data-[state=active]:text-[#1d5b47] data-[state=active]:shadow-none"
                        >
                            Orders
                        </TabsTrigger>
                        <TabsTrigger
                            value="company"
                            className="rounded-none border-b-2 border-transparent bg-transparent py-3 text-[13px] font-medium text-[#697485] shadow-none data-[state=active]:border-[#1d5b47] data-[state=active]:bg-transparent data-[state=active]:text-[#1d5b47] data-[state=active]:shadow-none"
                        >
                            Company
                        </TabsTrigger>
                        {unlockedQuotes.length ? (
                            <TabsTrigger
                                value="order-setup"
                                className="rounded-none border-b-2 border-transparent bg-transparent py-3 text-[13px] font-medium text-[#697485] shadow-none data-[state=active]:border-[#1d5b47] data-[state=active]:bg-transparent data-[state=active]:text-[#1d5b47] data-[state=active]:shadow-none"
                            >
                                Order Setup
                            </TabsTrigger>
                        ) : null}
                    </TabsList>
                </div>

                {/* Tab: Overview */}
                <TabsContent value="overview" className="mt-0">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                    >
                        <section className="rounded-xl border border-[#dde3e6] bg-white p-5 shadow-[0_7px_20px_rgba(25,42,56,0.03)]">
                            <h2 className="text-[17px] font-bold text-[#1b2536]">Activity Overview</h2>
                            <div className="mt-6 grid gap-5 md:grid-cols-3">
                                <ActivityCard
                                    icon={<FileText className="size-5" />}
                                    title="Awaiting Your Review"
                                    description="Review and approve quotations assigned to your team."
                                    tone="green"
                                    empty={quotesNeedingAction.length === 0 ? "You're all caught up." : `${quotesNeedingAction.length} quote(s) need your review.`}
                                    onClick={() => quotesNeedingAction.length && setActiveTab("quotes")}
                                />
                                <ActivityCard
                                    icon={<FileText className="size-5" />}
                                    title="Latest Requests"
                                    description="View the most recent quotation requests submitted by your team."
                                    tone="purple"
                                    empty={initialRfqs.length ? `${initialRfqs.length} request(s) submitted.` : "No requests submitted yet."}
                                    onClick={() => setActiveTab("requests")}
                                />
                                <ActivityCard
                                    icon={<ShoppingCart className="size-5" />}
                                    title="Active Orders"
                                    description="Track every active corporate order in one place."
                                    tone="orange"
                                    empty={initialOrders.length ? `${initialOrders.length} active order(s).` : "Your orders will appear here once they're placed."}
                                    onClick={() => setActiveTab("orders")}
                                />
                            </div>
                        </section>

                        <section className="hidden">
                            <SurfacePanel
                                title="Quotes Requiring Action"
                                description="The most important area for your team to review and approve quotations."
                                className="border-[#e8e5db] xl:col-span-6"
                            >
                                <div className="space-y-3">
                                    {quotesNeedingAction
                                        .slice(0, 3)
                                        .map((quote) => (
                                            <div
                                                key={quote.id}
                                                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-[#faf9f5]/40 p-4 shadow-[0_2px_8px_rgba(0,0,0,0.01)] transition duration-150 hover:bg-[#faf9f5]/85"
                                            >
                                                <div>
                                                    <span className="text-sm font-semibold text-slate-900">
                                                        {quote.quoteNumber}
                                                    </span>
                                                    <div className="mt-1 text-xs text-slate-500">
                                                        {formatINR(
                                                            quote.totalAmountPaise
                                                        )}{" "}
                                                        •{" "}
                                                        {quote.brand?.name ??
                                                            "Renivet"}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedQuoteId(
                                                            quote.id
                                                        );
                                                        setActiveTab("quotes");
                                                    }}
                                                    className="rounded-full bg-[#2f3720] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#1e2314]"
                                                >
                                                    Review
                                                </button>
                                            </div>
                                        ))}
                                    {quotesNeedingAction.length === 0 && (
                                        <Empty label="No quotes require action right now." />
                                    )}
                                </div>
                            </SurfacePanel>

                            <SurfacePanel
                                title="Recent Requests"
                                description="Track the latest quotation requests your team has submitted."
                                className="border-[#e8e5db] xl:col-span-3"
                            >
                                {initialRfqs.length ? (
                                    <div className="space-y-3">
                                        {initialRfqs.slice(0, 3).map((rfq) => (
                                            <div
                                                key={rfq.id}
                                                onClick={() => {
                                                    setSelectedRfqId(rfq.id);
                                                    setActiveTab("requests");
                                                }}
                                                className="cursor-pointer rounded-[22px] border border-slate-200 bg-slate-50 p-4 transition duration-150 hover:border-[#4b7c37] hover:bg-[#faf9f5]/60"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <div className="font-semibold text-slate-900">
                                                            {rfq.rfqNumber}
                                                        </div>
                                                        <div className="mt-1 line-clamp-1 text-xs text-slate-600">
                                                            {rfq.useCase}
                                                        </div>
                                                    </div>
                                                    <StatusChip
                                                        label={toLabel(
                                                            rfq.status
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <Empty label="No requests for quotation yet." />
                                )}
                            </SurfacePanel>

                            <SurfacePanel
                                title="Current Orders"
                                description="Live visibility into active corporate orders."
                                className="border-[#e8e5db] xl:col-span-3"
                            >
                                {initialOrders.length ? (
                                    <div className="space-y-3">
                                        {initialOrders
                                            .slice(0, 3)
                                            .map((order) => (
                                                <div
                                                    key={order.id}
                                                    onClick={() => {
                                                        setSelectedOrderId(
                                                            order.id
                                                        );
                                                        setActiveTab("orders");
                                                    }}
                                                    className="cursor-pointer rounded-[22px] border border-slate-200 bg-slate-50 p-4 transition duration-150 hover:border-[#4b7c37] hover:bg-[#faf9f5]/60"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <div className="font-semibold text-slate-900">
                                                                {
                                                                    order.publicOrderId
                                                                }
                                                            </div>
                                                            <div className="mt-1 text-xs text-slate-600">
                                                                {formatINR(
                                                                    order.totalPaise
                                                                )}
                                                            </div>
                                                        </div>
                                                        <StatusChip
                                                            label={toLabel(
                                                                order.status
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                ) : (
                                    <Empty label="No corporate orders yet." />
                                )}
                            </SurfacePanel>
                        </section>
                    </motion.div>
                </TabsContent>

                {/* Tab: Requests */}
                <TabsContent value="requests" className="mt-0">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="space-y-6"
                    >
                        <SurfacePanel
                            title="Request History"
                            description="Track and review every request for quotation submitted by your team."
                            className="border-[#e8e5db]"
                        >
                            {initialRfqs.length ? (
                                <div className="space-y-6">
                                    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full border-collapse text-left">
                                                <thead className="border-b border-slate-100 bg-slate-50">
                                                    <tr className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                                        <th className="px-6 py-4">
                                                            RFQ Number
                                                        </th>
                                                        <th className="px-6 py-4">
                                                            Date Created
                                                        </th>
                                                        <th className="px-6 py-4">
                                                            Use Case
                                                        </th>
                                                        <th className="px-6 py-4">
                                                            Target Quantity
                                                        </th>
                                                        <th className="px-6 py-4">
                                                            Procurement Mode
                                                        </th>
                                                        <th className="px-6 py-4">
                                                            Status
                                                        </th>
                                                        <th className="px-6 py-4 text-right">
                                                            Action
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {initialRfqs.map((rfq) => {
                                                        const isSelected =
                                                            selectedRfqId ===
                                                            rfq.id;
                                                        return (
                                                            <tr
                                                                key={rfq.id}
                                                                onClick={() =>
                                                                    setSelectedRfqId(
                                                                        rfq.id
                                                                    )
                                                                }
                                                                className={`cursor-pointer transition-colors duration-150 hover:bg-[#faf9f5]/50 ${
                                                                    isSelected
                                                                        ? "bg-[#faf9f5]"
                                                                        : "bg-white"
                                                                }`}
                                                            >
                                                                <td className="px-6 py-4 font-semibold text-slate-900">
                                                                    {
                                                                        rfq.rfqNumber
                                                                    }
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-slate-500">
                                                                    {new Date(
                                                                        rfq.createdAt
                                                                    ).toLocaleDateString(
                                                                        "en-IN"
                                                                    )}
                                                                </td>
                                                                <td className="max-w-[200px] truncate px-6 py-4 text-sm text-slate-700">
                                                                    {
                                                                        rfq.useCase
                                                                    }
                                                                </td>
                                                                <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                                                    {
                                                                        rfq.quantity
                                                                    }
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                                    {toLabel(
                                                                        rfq.procurementMode
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <StatusChip
                                                                        label={toLabel(
                                                                            rfq.status
                                                                        )}
                                                                    />
                                                                </td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <button
                                                                        type="button"
                                                                        className="text-xs font-bold text-[#4b7c37] hover:underline"
                                                                        onClick={(
                                                                            e
                                                                        ) => {
                                                                            e.stopPropagation();
                                                                            setSelectedRfqId(
                                                                                rfq.id
                                                                            );
                                                                        }}
                                                                    >
                                                                        Details
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Detailed view of selected RFQ */}
                                    {selectedRfqId &&
                                    initialRfqs.find(
                                        (r) => r.id === selectedRfqId
                                    ) ? (
                                        <CustomerCorporateRfqDetailPanel
                                            rfq={initialRfqs.find(
                                                (r) => r.id === selectedRfqId
                                            )}
                                        />
                                    ) : null}
                                </div>
                            ) : (
                                <Empty label="No requests for quotation yet." />
                            )}
                        </SurfacePanel>
                    </motion.div>
                </TabsContent>

                {/* Tab: Quotes */}
                <TabsContent value="quotes" className="mt-0">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="space-y-6"
                    >
                        <SurfacePanel
                            title="Quotation Approvals & Route Configuration"
                            description="Approve quotes, decide on PO or Direct routing, and kick off the guided order builder."
                            className="border-[#e8e5db]"
                        >
                            {quotes.length ? (
                                <div className="space-y-6">
                                    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full border-collapse text-left">
                                                <thead className="border-b border-slate-100 bg-slate-50">
                                                    <tr className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                                        <th className="px-6 py-4">
                                                            Quote Number
                                                        </th>
                                                        <th className="px-6 py-4">
                                                            Brand
                                                        </th>
                                                        <th className="px-6 py-4">
                                                            Quantity
                                                        </th>
                                                        <th className="px-6 py-4">
                                                            Total Value
                                                        </th>
                                                        <th className="px-6 py-4">
                                                            Date Received
                                                        </th>
                                                        <th className="px-6 py-4">
                                                            Status
                                                        </th>
                                                        <th className="px-6 py-4 text-right">
                                                            Action
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {quotes.map((quote) => {
                                                        const isSelected =
                                                            selectedQuoteId ===
                                                            quote.id;
                                                        return (
                                                            <tr
                                                                key={quote.id}
                                                                onClick={() =>
                                                                    setSelectedQuoteId(
                                                                        quote.id
                                                                    )
                                                                }
                                                                className={`cursor-pointer transition-colors duration-150 hover:bg-[#faf9f5]/50 ${
                                                                    isSelected
                                                                        ? "bg-[#faf9f5]"
                                                                        : "bg-white"
                                                                }`}
                                                            >
                                                                <td className="px-6 py-4 font-semibold text-slate-900">
                                                                    {
                                                                        quote.quoteNumber
                                                                    }
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-slate-700">
                                                                    {quote.brand
                                                                        ?.name ??
                                                                        "Renivet"}
                                                                </td>
                                                                <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                                                    {
                                                                        quote.quantity
                                                                    }
                                                                </td>
                                                                <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                                                                    {formatINR(
                                                                        quote.totalAmountPaise
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-slate-500">
                                                                    {new Date(
                                                                        quote.createdAt
                                                                    ).toLocaleDateString(
                                                                        "en-IN"
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <StatusChip
                                                                        label={toLabel(
                                                                            quote.status
                                                                        )}
                                                                    />
                                                                </td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <button
                                                                        type="button"
                                                                        className="text-xs font-bold text-[#4b7c37] hover:underline"
                                                                        onClick={(
                                                                            e
                                                                        ) => {
                                                                            e.stopPropagation();
                                                                            setSelectedQuoteId(
                                                                                quote.id
                                                                            );
                                                                        }}
                                                                    >
                                                                        Review
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Quote Details Action Panel */}
                                    {selectedQuoteId &&
                                    quotes.find(
                                        (q) => q.id === selectedQuoteId
                                    ) ? (
                                        <CustomerCorporateQuoteDetailPanel
                                            quote={quotes.find(
                                                (q) => q.id === selectedQuoteId
                                            )}
                                            purchaseOrder={purchaseOrderByQuoteId.get(
                                                selectedQuoteId
                                            )}
                                            purchaseOrderChoice={
                                                purchaseOrderChoice[
                                                    selectedQuoteId
                                                ]
                                            }
                                            poNumber={
                                                poNumbers[selectedQuoteId] ?? ""
                                            }
                                            onPoNumberChange={(value) =>
                                                setPoNumbers((current) => ({
                                                    ...current,
                                                    [selectedQuoteId]: value,
                                                }))
                                            }
                                            onFileChange={(file) =>
                                                setPoFiles((current) => ({
                                                    ...current,
                                                    [selectedQuoteId]: file,
                                                }))
                                            }
                                            onApprove={() =>
                                                quoteDecision.mutate({
                                                    quoteId: selectedQuoteId,
                                                    decision: "approved",
                                                    notes: "Approved from customer dashboard",
                                                })
                                            }
                                            onUploadPo={() =>
                                                submitPo(
                                                    quotes.find(
                                                        (q) =>
                                                            q.id ===
                                                            selectedQuoteId
                                                    )
                                                )
                                            }
                                            uploadPending={createPo.isPending}
                                            onChooseDirectOrder={() => {
                                                setPurchaseOrderChoice(
                                                    (current) => ({
                                                        ...current,
                                                        [selectedQuoteId]:
                                                            "direct",
                                                    })
                                                );
                                                setOrderSetupQuoteId(
                                                    selectedQuoteId
                                                );
                                                setActiveTab("order-setup");
                                            }}
                                            onChoosePurchaseOrder={() =>
                                                setPurchaseOrderChoice(
                                                    (current) => ({
                                                        ...current,
                                                        [selectedQuoteId]:
                                                            "purchase_order",
                                                    })
                                                )
                                            }
                                            onContinueToOrderSetup={() => {
                                                setOrderSetupQuoteId(
                                                    selectedQuoteId
                                                );
                                                setActiveTab("order-setup");
                                            }}
                                            poScope={
                                                poScopes[selectedQuoteId] ?? ""
                                            }
                                            onPoScopeChange={(value) =>
                                                setPoScopes((current) => ({
                                                    ...current,
                                                    [selectedQuoteId]: value,
                                                }))
                                            }
                                            signatoryName={
                                                poSignatories[
                                                    selectedQuoteId
                                                ] ?? ""
                                            }
                                            onSignatoryNameChange={(value) =>
                                                setPoSignatories((current) => ({
                                                    ...current,
                                                    [selectedQuoteId]: value,
                                                }))
                                            }
                                        />
                                    ) : null}
                                </div>
                            ) : (
                                <Empty label="No quotes require action right now." />
                            )}
                        </SurfacePanel>
                    </motion.div>
                </TabsContent>

                {/* Tab: Orders */}
                <TabsContent value="orders" className="mt-0">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                    >
                        <SurfacePanel
                            title="Corporate Orders"
                            description="Review final order status, payment progress, remaining balance, and full order details from one place."
                            className="border-[#e8e5db]"
                        >
                            {initialOrders.length ? (
                                <div className="space-y-5">
                                    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full text-left">
                                                <thead className="border-b border-slate-100 bg-slate-50">
                                                    <tr className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                                        <th className="px-6 py-4">
                                                            Order ID
                                                        </th>
                                                        <th className="px-6 py-4">
                                                            Value
                                                        </th>
                                                        <th className="px-6 py-4">
                                                            Paid
                                                        </th>
                                                        <th className="px-6 py-4">
                                                            Balance
                                                        </th>
                                                        <th className="px-6 py-4">
                                                            Payment
                                                        </th>
                                                        <th className="px-6 py-4">
                                                            Fulfillment
                                                        </th>
                                                        <th className="px-6 py-4 text-right">
                                                            Action
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {initialOrders.map(
                                                        (order) => {
                                                            const hasBalance =
                                                                order.balanceDuePaise >
                                                                0;
                                                            const isSelected =
                                                                selectedOrderId ===
                                                                order.id;

                                                            return (
                                                                <tr
                                                                    key={
                                                                        order.id
                                                                    }
                                                                    onClick={() =>
                                                                        setSelectedOrderId(
                                                                            order.id
                                                                        )
                                                                    }
                                                                    className={`cursor-pointer transition-colors duration-150 hover:bg-[#faf9f5]/50 ${
                                                                        isSelected
                                                                            ? "bg-[#faf9f5]"
                                                                            : "bg-white"
                                                                    }`}
                                                                >
                                                                    <td className="px-6 py-4">
                                                                        <div className="font-semibold text-slate-900">
                                                                            {
                                                                                order.publicOrderId
                                                                            }
                                                                        </div>
                                                                        <div className="mt-1 text-xs text-slate-500">
                                                                            {new Date(
                                                                                order.createdAt
                                                                            ).toLocaleDateString(
                                                                                "en-IN"
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                                                                        {formatINR(
                                                                            order.totalPaise
                                                                        )}
                                                                    </td>
                                                                    <td className="px-6 py-4 text-sm font-medium text-slate-700">
                                                                        {formatINR(
                                                                            order.advancePaidPaise
                                                                        )}
                                                                    </td>
                                                                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                                                                        {formatINR(
                                                                            order.balanceDuePaise
                                                                        )}
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <StatusChip
                                                                            label={
                                                                                hasBalance
                                                                                    ? "Remaining Payment Due"
                                                                                    : "Paid in Full"
                                                                            }
                                                                        />
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <StatusChip
                                                                            label={toLabel(
                                                                                order.status
                                                                            )}
                                                                        />
                                                                    </td>
                                                                    <td className="px-6 py-4 text-right">
                                                                        <div
                                                                            className="flex justify-end gap-2"
                                                                            onClick={(
                                                                                e
                                                                            ) =>
                                                                                e.stopPropagation()
                                                                            }
                                                                        >
                                                                            <button
                                                                                type="button"
                                                                                className="text-xs font-bold text-[#4b7c37] hover:underline"
                                                                                onClick={() =>
                                                                                    setSelectedOrderId(
                                                                                        order.id
                                                                                    )
                                                                                }
                                                                            >
                                                                                View
                                                                            </button>
                                                                            {order.advancePaidPaise >
                                                                            0 ? (
                                                                                <a
                                                                                    href={`/api/corporate-orders/${order.id}/receipt-voucher.pdf`}
                                                                                    className="text-xs font-bold text-[#4b7c37] hover:underline"
                                                                                >
                                                                                    Receipt
                                                                                </a>
                                                                            ) : null}
                                                                            {initialTaxInvoices.some(
                                                                                (
                                                                                    item
                                                                                ) =>
                                                                                    item.orderId ===
                                                                                    order.id
                                                                            ) ? (
                                                                                <a
                                                                                    href={`/api/corporate-orders/${order.id}/invoice.pdf`}
                                                                                    className="text-xs font-bold text-[#07345f] hover:underline"
                                                                                >
                                                                                    Invoice
                                                                                </a>
                                                                            ) : null}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        }
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {selectedOrder ? (
                                        <CustomerCorporateOrderDetailPanel
                                            order={selectedOrder}
                                            onPayRemaining={payRemainingBalance}
                                            invoice={initialTaxInvoices.find(
                                                (item) =>
                                                    item.orderId ===
                                                    selectedOrder.id
                                            )}
                                        />
                                    ) : null}
                                </div>
                            ) : (
                                <Empty label="No corporate orders yet." />
                            )}
                        </SurfacePanel>
                    </motion.div>
                </TabsContent>

                {/* Tab: Order Setup */}
                {unlockedQuotes.length ? (
                    <TabsContent value="order-setup" className="mt-0">
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, ease: "easeOut" }}
                        >
                            <div className="space-y-6">
                                <SurfacePanel
                                    title="Continue With Approved Quotation"
                                    description="Complete the premium order builder unlocked from your approved quote. Selection details will prefill automatically."
                                    className="border-[#e8e5db]"
                                >
                                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                                        <div className="rounded-[24px] border border-[#e8e5db] bg-[linear-gradient(180deg,#ffffff_0%,#faf9f5_100%)] p-5">
                                            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4b7c37]">
                                                Ready To Order
                                            </div>
                                            <div className="mt-3 text-2xl font-semibold text-slate-900">
                                                {selectedOrderSetupQuote?.quoteNumber ??
                                                    "Approved quote"}
                                            </div>
                                            <div className="mt-2 text-sm leading-6 text-slate-600">
                                                Configure size breakdown, upload
                                                artwork files, and review final
                                                pricing matching your custom
                                                quotation details.
                                            </div>
                                            <div className="mt-5 grid gap-3 md:grid-cols-2">
                                                {unlockedQuotes.map((quote) => (
                                                    <button
                                                        key={quote.id}
                                                        type="button"
                                                        onClick={() =>
                                                            setOrderSetupQuoteId(
                                                                quote.id
                                                            )
                                                        }
                                                        className={`rounded-[20px] border p-4 text-left transition-all ${
                                                            selectedOrderSetupQuote?.id ===
                                                            quote.id
                                                                ? "border-[#4b7c37] bg-[#f8fbf6] shadow-sm"
                                                                : "border-slate-200 bg-white hover:border-[#c5d6bf]"
                                                        }`}
                                                    >
                                                        <div className="font-semibold text-slate-900">
                                                            {quote.quoteNumber}
                                                        </div>
                                                        <div className="mt-1 text-sm font-medium text-slate-700">
                                                            {formatINR(
                                                                quote.totalAmountPaise
                                                            )}
                                                        </div>
                                                        <div className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                            {purchaseOrderByQuoteId.has(
                                                                quote.id
                                                            )
                                                                ? "PO Mode Active"
                                                                : "Direct Checkout Mode"}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <SurfacePanel
                                            title="Order Setup Walkthrough"
                                            description="Provide sizing, artwork specifications, and submit advance payment to start production."
                                            className="border-none bg-[#2c3022] text-white shadow-md"
                                            inverse
                                        >
                                            <MiniPill
                                                label="1. Authorized details prefilled"
                                                dark
                                            />
                                            <MiniPill
                                                label="2. Specify size breakdown & labels"
                                                dark
                                            />
                                            <MiniPill
                                                label="3. Upload customization artwork uploader"
                                                dark
                                            />
                                            <MiniPill
                                                label="4. Review advance checkout"
                                                dark
                                            />
                                        </SurfacePanel>
                                    </div>
                                </SurfacePanel>

                                {selectedOrderSetupQuote ? (
                                    <CorporateOrderPage
                                        key={selectedOrderSetupQuote.id}
                                        initialPrefill={{
                                            ...extractCorporateDeliveryAddress(
                                                initialProfile?.shippingAddress ??
                                                    selectedOrderSetupQuote
                                                        .profile
                                                        ?.shippingAddress
                                            ),
                                            companyName:
                                                initialProfile?.companyName ??
                                                selectedOrderSetupQuote.profile
                                                    ?.companyName,
                                            contactPersonName:
                                                initialProfile?.contactPerson ??
                                                "",
                                            emailAddress:
                                                initialProfile?.email ?? "",
                                            mobileNumber:
                                                initialProfile?.phone ?? "",
                                            gstNumber:
                                                initialProfile?.gstNumber ?? "",
                                            productTypeId:
                                                selectedOrderSetupQuote.productTypeId ??
                                                undefined,
                                            gsmOptionId:
                                                selectedOrderSetupQuote.gsmOptionId ??
                                                undefined,
                                            fabricCompositionId:
                                                selectedOrderSetupQuote.fabricCompositionId ??
                                                undefined,
                                            quantity:
                                                selectedOrderSetupQuote.quantity ??
                                                0,
                                            numberOfEmployees:
                                                selectedOrderSetupQuote.quantity ??
                                                0,
                                            lockApprovedQuoteSelections: true,
                                            approvedQuoteId:
                                                selectedOrderSetupQuote.id,
                                            approvedQuoteNumber:
                                                selectedOrderSetupQuote.quoteNumber,
                                            approvedQuoteUnitPricePaise:
                                                selectedOrderSetupQuote.quantity
                                                    ? Math.round(
                                                          selectedOrderSetupQuote.totalAmountPaise /
                                                              selectedOrderSetupQuote.quantity
                                                      )
                                                    : 0,
                                            customerNotes: `Approved quotation ${selectedOrderSetupQuote.quoteNumber} for ${selectedOrderSetupQuote.quantity} unit(s).`,
                                            paymentPreference:
                                                selectedOrderSetupQuote.balanceAmountPaise ===
                                                0
                                                    ? "full_upfront"
                                                    : "partial_advance",
                                        }}
                                    />
                                ) : null}
                            </div>
                        </motion.div>
                    </TabsContent>
                ) : null}

                {/* Tab: Company Settings */}
                <TabsContent value="company" className="mt-0">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                    >
                        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                            <SurfacePanel
                                title="Company Profile"
                                description="Your corporate identification details utilized for customized invoices and orders."
                                className="border-[#e8e5db]"
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
                                                value={
                                                    initialProfile.contactPerson
                                                }
                                            />
                                            <StatusRow
                                                label="Email"
                                                value={initialProfile.email}
                                            />
                                            <StatusRow
                                                label="Industry"
                                                value={
                                                    initialProfile.industry ||
                                                    "Pending"
                                                }
                                            />
                                            <StatusRow
                                                label="Company Size"
                                                value={
                                                    initialProfile.companySize ||
                                                    "Pending"
                                                }
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <Empty label="Your company profile will be created automatically from your first request for quotation." />
                                )}
                            </SurfacePanel>

                            <SurfacePanel
                                title="Enterprise Procurement Support"
                                description="Renivet managed workflows cover quality review, testing, packaging, and custom labels."
                                className="border-[#e8e5db] bg-[linear-gradient(135deg,#ffffff_0%,#faf9f5_100%)]"
                            >
                                <div className="grid grid-cols-2 gap-3">
                                    <MiniPill label="Requests Management" />
                                    <MiniPill label="Pricing Negotiations" />
                                    <MiniPill label="Official Purchase Orders" />
                                    <MiniPill label="Strict Quality Control" />
                                    <MiniPill label="E-Commerce Tracking" />
                                    <MiniPill label="Tax Invoices / Auditing" />
                                </div>
                            </SurfacePanel>
                        </section>
                    </motion.div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

/* Redesigned Subcomponents for Premium UI */

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
            className={`rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_-30px_rgba(49,58,31,0.12)] ${className}`}
        >
            <h2
                className={`text-xl font-semibold tracking-tight ${
                    inverse ? "text-white" : "text-slate-900"
                }`}
            >
                {title}
            </h2>
            {description ? (
                <p
                    className={`mt-2 text-sm leading-relaxed ${
                        inverse ? "text-white/70" : "text-slate-500"
                    }`}
                >
                    {description}
                </p>
            ) : null}
            <div className="mt-5 space-y-4">{children}</div>
        </div>
    );
}

function MetricCard({
    label,
    value,
    hint,
    compact = false,
}: {
    label: string;
    value: string;
    hint: string;
    compact?: boolean;
}) {
    return (
        <motion.div
            whileHover={{
                y: -4,
                scale: 1.01,
                boxShadow: "0 20px 40px -25px rgba(49,58,31,0.15)",
                borderColor: "#4b7c37",
            }}
            transition={{ type: "spring", stiffness: 350, damping: 20 }}
            className={compact
                ? "min-w-0 rounded-none border-0 bg-transparent px-2 py-1 shadow-none"
                : "rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_-20px_rgba(0,0,0,0.03)] transition-colors duration-200"}
        >
            <div className={compact ? "flex items-start gap-1 text-[10px] font-semibold leading-3 text-[#5d6879]" : "text-[10px] font-bold uppercase tracking-[0.2em] text-[#4b7c37]"}>
                {label}
            </div>
            <div className={compact ? "mt-3 text-3xl font-bold tracking-[-0.04em] text-[#182131]" : "mt-3 text-4xl font-semibold text-slate-900"}>
                {value}
            </div>
            <div className={compact ? "mt-1 text-[9px] uppercase leading-3 text-[#8a94a3]" : "mt-2 text-xs font-medium leading-relaxed text-slate-500"}>
                {hint}
            </div>
        </motion.div>
    );
}

function Empty({ label }: { label: string }) {
    return (
        <div className="rounded-[22px] border border-dashed border-[#d2cfc4] bg-[#faf9f5]/50 px-4 py-6 text-center text-sm text-slate-500">
            {label}
        </div>
    );
}

function MiniPill({ label, dark = false }: { label: string; dark?: boolean }) {
    return (
        <div
            className={
                dark
                    ? "rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-white"
                    : "rounded-full border border-[#e8e5db] bg-[#faf9f5] px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-emerald-800"
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
    icon,
}: {
    eyebrow: string;
    title: string;
    description: string;
    href: string;
    cta: string;
    tone: "dark" | "light" | "reference-primary" | "reference-secondary";
    icon?: ReactNode;
}) {
    const dark = tone === "dark";
    const referencePrimary = tone === "reference-primary";
    const referenceSecondary = tone === "reference-secondary";

    return (
        <motion.a
            href={href}
            whileHover={{ y: -5, scale: 1.015 }}
            whileTap={{ scale: 0.995 }}
            transition={{ type: "spring", stiffness: 350, damping: 20 }}
            className={
                referencePrimary
                    ? "group block rounded-xl border border-[#edf0f1] bg-[#f8fafb] p-5 text-slate-900 transition-colors duration-200 hover:border-[#b7d9cb] hover:bg-[#f4fbf7]"
                    : referenceSecondary
                      ? "group block rounded-xl border border-[#f1eeeb] bg-[#fcfaf8] p-5 text-slate-900 transition-colors duration-200 hover:border-[#e8c9a9] hover:bg-[#fffaf4]"
                      : dark
                    ? "group block rounded-[28px] border border-[#c8d6c3] bg-[linear-gradient(135deg,#f4f8f2_0%,#e7f0e3_100%)] p-6 text-slate-900 shadow-[0_28px_70px_-42px_rgba(47,55,32,0.15)] transition-colors duration-200 hover:border-[#b1c7ab]"
                    : "group block rounded-[28px] border border-[#e3decb] bg-[linear-gradient(135deg,#faf9f5_0%,#f5f2e9_100%)] p-6 text-slate-900 shadow-[0_24px_60px_-44px_rgba(91,155,213,0.1)] transition-colors duration-200 hover:border-[#cfc7ae]"
            }
        >
            {referencePrimary || referenceSecondary ? (
                <div className={`flex size-11 items-center justify-center rounded-full border bg-white shadow-sm ${referencePrimary ? "border-[#e5f1eb] text-[#1d5b47]" : "border-[#f1e8dd] text-[#d98535]"}`}>
                    {icon}
                </div>
            ) : null}
            <div
                className={
                    referencePrimary || referenceSecondary
                        ? "mt-4 hidden"
                        : dark
                        ? "text-[10px] font-bold uppercase tracking-[0.24em] text-[#315721]"
                        : "text-[10px] font-bold uppercase tracking-[0.24em] text-[#6d6447]"
                }
            >
                {eyebrow}
            </div>
            <div className={referencePrimary || referenceSecondary ? "mt-[-3rem] ml-16 min-h-[52px] text-[17px] font-bold leading-6 text-[#1b2536]" : "mt-3 text-2xl font-semibold leading-tight text-slate-900"}>
                {title}
            </div>
            <div className={referencePrimary || referenceSecondary ? "ml-16 mt-1 min-h-[66px] text-[13px] leading-5 text-[#687487]" : "mt-3 text-sm leading-relaxed text-slate-600"}>
                {description}
            </div>
            <div
                className={
                    referencePrimary
                        ? "mt-5 inline-flex items-center gap-2 rounded-md bg-[#1d5b47] px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#164d3d]"
                        : referenceSecondary
                          ? "mt-5 inline-flex items-center gap-2 rounded-md border border-[#e1e5e8] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#182131] shadow-sm transition hover:border-[#cfd7dc]"
                          : dark
                        ? "btn-liquid btn-liquid-primary mt-6 inline-flex rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider"
                        : "btn-liquid btn-liquid-secondary mt-6 inline-flex rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider"
                }
            >
                <span>{cta}</span>
                {referencePrimary || referenceSecondary ? <ArrowRight className="size-4" /> : null}
            </div>
        </motion.a>
    );
}

function SideInfoCard({
    icon,
    title,
    body,
    action,
}: {
    icon: ReactNode;
    title: string;
    body: string;
    action: string;
}) {
    return (
        <div className="rounded-xl border border-[#dde3e6] bg-white p-4 shadow-[0_7px_20px_rgba(25,42,56,0.04)]">
            <div className="flex items-center gap-2 text-[15px] font-bold text-[#1d2738]">
                <span className="text-[#1d5b47]">{icon}</span>
                {title}
            </div>
            <p className="mt-4 rounded-lg border border-dashed border-[#55d1a8] bg-[#f4fbf7] px-3 py-4 text-center text-[12px] leading-5 text-[#687487]">
                {body}
            </p>
            <a href="#" className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-[#1d5b47] hover:underline">
                {action} <ArrowRight className="size-3.5" />
            </a>
        </div>
    );
}

function InfoRow({ icon, text, muted = false }: { icon: ReactNode; text: string; muted?: boolean }) {
    return (
        <div className={`flex items-center gap-3 rounded-lg border border-[#e1e5e8] bg-white px-3 py-3 text-[12px] leading-5 shadow-[0_4px_12px_rgba(25,42,56,0.03)] ${muted ? "text-[#687487]" : "text-[#2b4f43]"}`}>
            {icon}
            <span>{text}</span>
        </div>
    );
}

function ActivityCard({
    icon,
    title,
    description,
    empty,
    tone,
    onClick,
}: {
    icon: ReactNode;
    title: string;
    description: string;
    empty: string;
    tone: "green" | "purple" | "orange";
    onClick: () => void;
}) {
    const toneStyles = {
        green: "border-[#f0dfc8] bg-[#fffaf4] text-[#d98535]",
        purple: "border-[#ded9fa] bg-[#faf8ff] text-[#7c54f2]",
        orange: "border-[#f2e1cb] bg-[#fffaf3] text-[#e77b20]",
    }[tone];

    return (
        <button type="button" onClick={onClick} className="text-left">
            <div className="flex items-start gap-3">
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-md ${toneStyles}`}>
                    {icon}
                </span>
                <span>
                    <span className="block text-[13px] font-bold text-[#1d2738]">{title}</span>
                    <span className="mt-1 block text-[11px] leading-4 text-[#788293]">{description}</span>
                </span>
            </div>
            <span className={`mt-4 flex min-h-[88px] items-center justify-center rounded-lg border border-dashed px-4 text-center text-[12px] leading-5 text-[#697485] ${toneStyles}`}>
                {empty}
            </span>
        </button>
    );
}

function StatusRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-[20px] border border-slate-200 bg-slate-50/50 p-4 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {label}
            </div>
            <div className="mt-1.5 text-sm font-semibold leading-relaxed text-slate-900">
                {value}
            </div>
        </div>
    );
}

function HeroStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-[20px] border border-slate-200 bg-slate-50/50 p-4 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                {label}
            </div>
            <div className="mt-2 text-xl font-semibold text-slate-900">
                {value}
            </div>
        </div>
    );
}

function DetailLine({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 text-sm last:border-b-0 last:pb-0">
            <div className="font-semibold text-slate-400">{label}</div>
            <div className="text-right font-semibold text-slate-900">
                {value}
            </div>
        </div>
    );
}

function StatusChip({ label }: { label: string }) {
    const rawVal = label.toLowerCase().replaceAll(" ", "_");
    const isApproved = [
        "approved",
        "quote_accepted",
        "po_accepted",
        "qc_approved",
        "delivered",
        "completed",
        "paid_in_full",
    ].includes(rawVal);
    const isPending = [
        "pending",
        "rfq_submitted",
        "under_review",
        "brand_matching",
        "quote_preparation",
        "customer_review",
        "po_uploaded",
        "po_review",
    ].includes(rawVal);
    const isActionNeeded = [
        "sent",
        "quote_sent",
        "revision_requested",
        "po_requires_changes",
        "remaining_payment_due",
    ].includes(rawVal);
    const isRejected = [
        "rejected",
        "quote_rejected",
        "po_rejected",
        "cancelled",
        "closed",
        "expired",
    ].includes(rawVal);

    let classes = "border-slate-200 bg-slate-50 text-slate-700";
    if (isApproved) {
        classes = "border-emerald-200 bg-emerald-50 text-emerald-800";
    } else if (isActionNeeded) {
        classes = "border-amber-200 bg-amber-50 text-amber-800";
    } else if (isPending) {
        classes = "border-blue-200 bg-blue-50 text-blue-800";
    } else if (isRejected) {
        classes = "border-red-200 bg-red-50 text-red-800";
    }

    return (
        <div
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] shadow-sm ${classes}`}
        >
            {label}
        </div>
    );
}

function CustomerCorporateRfqDetailPanel({ rfq }: { rfq: any }) {
    if (!rfq) return null;

    return (
        <div className="rounded-[26px] border border-[#e8e5db] bg-[linear-gradient(180deg,#ffffff_0%,#faf9f5_100%)] p-6 shadow-[0_12px_36px_rgba(49,58,31,0.06)]">
            <div className="mb-6 flex flex-col gap-4 border-b border-slate-100 pb-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4b7c37]">
                        Selected Request Details
                    </span>
                    <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                        {rfq.rfqNumber}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">
                        Submitted{" "}
                        {new Date(rfq.createdAt).toLocaleDateString("en-IN")}
                    </p>
                </div>
                <StatusChip label={toLabel(rfq.status)} />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-[18px] border border-slate-100 bg-white p-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Use Case
                    </span>
                    <p className="mt-1.5 text-sm font-semibold text-slate-900">
                        {rfq.useCase}
                    </p>
                </div>
                <div className="rounded-[18px] border border-slate-100 bg-white p-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Quantity
                    </span>
                    <p className="mt-1.5 text-sm font-semibold text-slate-900">
                        {rfq.quantity} units
                    </p>
                </div>
                <div className="rounded-[18px] border border-slate-100 bg-white p-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Budget Limit
                    </span>
                    <p className="mt-1.5 text-sm font-semibold text-slate-900">
                        {rfq.budgetPerUnitPaise
                            ? formatINR(rfq.budgetPerUnitPaise)
                            : "Open budget"}
                    </p>
                </div>
                <div className="rounded-[18px] border border-slate-100 bg-white p-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Target Delivery
                    </span>
                    <p className="mt-1.5 text-sm font-semibold text-slate-900">
                        {rfq.deliveryDate
                            ? new Date(rfq.deliveryDate).toLocaleDateString(
                                  "en-IN"
                              )
                            : "Flexible"}
                    </p>
                </div>
            </div>

            <div className="mt-5 space-y-4">
                <div className="rounded-[18px] border border-slate-100 bg-white p-5">
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-800">
                        Requirement Specifications
                    </h4>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                        {rfq.requirementDescription}
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-[18px] border border-slate-100 bg-white p-5">
                        <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-800">
                            Customization details
                        </h4>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-400">
                                    Branding Required:
                                </span>
                                <span className="font-bold text-slate-900">
                                    {rfq.brandingRequired ? "Yes" : "No"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">
                                    Sustainability Materials:
                                </span>
                                <span className="font-bold text-slate-900">
                                    {rfq.sustainabilityRequired ? "Yes" : "No"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">
                                    Procurement Strategy:
                                </span>
                                <span className="text-xs font-bold uppercase tracking-wider text-[#4b7c37]">
                                    {toLabel(rfq.procurementMode)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[18px] border border-slate-100 bg-white p-5">
                        <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-800">
                            Uploaded Artwork / Specsheets
                        </h4>
                        {rfq.documents && rfq.documents.length > 0 ? (
                            <div className="space-y-2">
                                {rfq.documents.map((doc: any) => (
                                    <a
                                        key={doc.id}
                                        href={doc.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-sm font-semibold text-[#4b7c37] hover:underline"
                                    >
                                        <FileText className="size-4 shrink-0" />
                                        <span className="max-w-[220px] truncate">
                                            {doc.fileName}
                                        </span>
                                        <ArrowUpRight className="size-3 shrink-0 text-slate-400" />
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400">
                                No attachments provided.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function CustomerCorporateQuoteDetailPanel({
    quote,
    purchaseOrder,
    purchaseOrderChoice,
    poNumber,
    onPoNumberChange,
    poScope,
    onPoScopeChange,
    signatoryName,
    onSignatoryNameChange,
    onFileChange,
    onApprove,
    onUploadPo,
    uploadPending,
    onChooseDirectOrder,
    onChoosePurchaseOrder,
    onContinueToOrderSetup,
}: {
    quote: any;
    purchaseOrder?: any;
    purchaseOrderChoice?: "direct" | "purchase_order";
    poNumber: string;
    onPoNumberChange: (value: string) => void;
    poScope: string;
    onPoScopeChange: (value: string) => void;
    signatoryName: string;
    onSignatoryNameChange: (value: string) => void;
    onFileChange: (file: File | null) => void;
    onApprove: () => void;
    onUploadPo: () => void;
    uploadPending: boolean;
    onChooseDirectOrder: () => void;
    onChoosePurchaseOrder: () => void;
    onContinueToOrderSetup: () => void;
}) {
    const isApproved = quote.status === "approved";
    const isRejected = quote.status === "rejected";
    const canApprove = !isApproved && !isRejected;
    const purchaseOrderUploaded = !!purchaseOrder;
    const directRouteUnlocked = isApproved && purchaseOrderChoice === "direct";
    const purchaseOrderRouteOpen =
        isApproved && purchaseOrderChoice === "purchase_order";

    return (
        <div className="rounded-[26px] border border-[#e8e5db] bg-[linear-gradient(180deg,#ffffff_0%,#faf9f5_100%)] p-6 shadow-[0_12px_36px_rgba(49,58,31,0.06)]">
            <div className="mb-6 flex flex-col gap-4 border-b border-slate-100 pb-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4b7c37]">
                        Quote Evaluation
                    </span>
                    <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                        {quote.quoteNumber}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                        Supplied by {quote.brand?.name ?? "Renivet Marketplace"}
                    </p>
                </div>
                <StatusChip label={toLabel(quote.status)} />
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {/* Pricing Table */}
                <div className="rounded-[18px] border border-slate-100 bg-white p-5 shadow-sm">
                    <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-800">
                        Pricing Breakdown
                    </h4>
                    <div className="space-y-2.5 text-sm">
                        <div className="flex justify-between font-medium text-slate-500">
                            <span>Sourcing Subtotal</span>
                            <span className="font-semibold text-slate-800">
                                {formatINR(quote.subtotalPaise)}
                            </span>
                        </div>
                        {quote.customizationCostPaise > 0 && (
                            <div className="flex justify-between font-medium text-slate-500">
                                <span>Branding/Customization</span>
                                <span className="font-semibold text-slate-800">
                                    {formatINR(quote.customizationCostPaise)}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between font-medium text-slate-500">
                            <span>Applicable GST / Taxes</span>
                            <span className="font-semibold text-slate-800">
                                {formatINR(quote.gstAmountPaise)}
                            </span>
                        </div>
                        <div className="my-2 border-t border-slate-100"></div>
                        <div className="flex justify-between text-base font-bold text-slate-900">
                            <span>Total Quote Value</span>
                            <span>{formatINR(quote.totalAmountPaise)}</span>
                        </div>
                    </div>
                </div>

                {/* Sourcing details */}
                <div className="rounded-[18px] border border-slate-100 bg-white p-5 shadow-sm">
                    <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-800">
                        Order Quantities
                    </h4>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-400">
                                Target Quantity:
                            </span>
                            <span className="font-semibold text-slate-900">
                                {quote.quantity} units
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">
                                Unit Price Estimate:
                            </span>
                            <span className="font-semibold text-slate-900">
                                {quote.quantity
                                    ? formatINR(
                                          Math.round(
                                              quote.totalAmountPaise /
                                                  quote.quantity
                                          )
                                      )
                                    : formatINR(0)}{" "}
                                / unit
                            </span>
                        </div>
                        <div className="my-2 border-t border-slate-100"></div>
                        <div className="flex justify-between rounded-lg bg-emerald-50/50 p-2 text-xs font-bold text-emerald-800">
                            <span>Advance Required</span>
                            <span>{formatINR(quote.advanceAmountPaise)}</span>
                        </div>
                    </div>
                </div>

                {/* Status overview */}
                <div className="rounded-[18px] border border-slate-100 bg-white p-5 shadow-sm">
                    <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-800">
                        Approval Flow
                    </h4>
                    <div className="space-y-3 text-xs font-medium leading-relaxed text-slate-500">
                        {canApprove ? (
                            <p>
                                This draft quotation requires your approval.
                                Once approved, you can proceed directly to setup
                                size charts and place your deposit.
                            </p>
                        ) : isApproved ? (
                            <div className="space-y-2">
                                <p className="flex items-center gap-1.5 font-semibold text-emerald-800">
                                    <CheckCircle2 className="size-4" /> Quote
                                    approved successfully
                                </p>
                                <p>
                                    You can checkout immediately or configure
                                    your enterprise purchase order parameters
                                    first.
                                </p>
                            </div>
                        ) : (
                            <p className="font-semibold text-red-700">
                                This quotation was closed or rejected.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Action buttons */}
            <div className="mt-6 border-t border-slate-100 pt-5">
                {quote.proformaInvoice ? (
                    <a
                        href={`/api/corporate-proforma-invoices/${quote.proformaInvoice.id}/download`}
                        className="mb-4 inline-flex h-11 items-center justify-center rounded-full border border-[#07345f] bg-white px-6 text-xs font-bold uppercase tracking-wider text-[#07345f] transition hover:bg-slate-50"
                    >
                        <Download className="mr-2 size-4" />
                        <span>Download Proforma Invoice</span>
                    </a>
                ) : null}
                {canApprove && (
                    <div className="flex justify-start">
                        <button
                            type="button"
                            onClick={onApprove}
                            className="btn-liquid btn-liquid-primary inline-flex rounded-full px-8 py-3 text-xs font-bold uppercase tracking-widest shadow-md"
                        >
                            <span>Approve Quotation</span>
                        </button>
                    </div>
                )}

                {isApproved && (
                    <div className="space-y-4">
                        <div className="mb-2 text-sm font-bold text-slate-900">
                            Configure Routing Step
                        </div>

                        {!purchaseOrderChoice && !purchaseOrderUploaded ? (
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="rounded-[20px] border border-emerald-100 bg-emerald-50/40 p-5 transition hover:shadow-sm">
                                    <div className="text-sm font-bold text-slate-900">
                                        Fast-Track Checkout
                                    </div>
                                    <div className="mt-2 text-xs leading-relaxed text-slate-600">
                                        Perfect for direct transactions.
                                        Complete sizes, configure labels, and
                                        checkout with advance payment
                                        immediately.
                                    </div>
                                    <button
                                        type="button"
                                        className="btn-liquid btn-liquid-primary mt-4 inline-flex rounded-full px-6 py-2.5 text-xs font-bold uppercase tracking-wider"
                                        onClick={onChooseDirectOrder}
                                    >
                                        <span>Continue to Setup</span>
                                    </button>
                                </div>
                                <div className="rounded-[20px] border border-slate-200 bg-white p-5 transition hover:shadow-sm">
                                    <div className="text-sm font-bold text-slate-900">
                                        Enterprise Purchase Order
                                    </div>
                                    <div className="mt-2 text-xs leading-relaxed text-slate-600">
                                        For teams needing PO verification.
                                        Upload your company PO document first to
                                        unlock size layout setup.
                                    </div>
                                    <button
                                        type="button"
                                        className="btn-liquid btn-liquid-secondary mt-4 inline-flex rounded-full px-6 py-2.5 text-xs font-bold uppercase tracking-wider"
                                        onClick={onChoosePurchaseOrder}
                                    >
                                        <span>Choose PO Route</span>
                                    </button>
                                </div>
                            </div>
                        ) : null}

                        {directRouteUnlocked && (
                            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
                                <div className="text-sm font-semibold text-emerald-800">
                                    Direct order route verified. Switch to the
                                    Setup tab to complete sizes and uploader.
                                </div>
                                <button
                                    type="button"
                                    className="btn-liquid btn-liquid-primary inline-flex rounded-full px-6 py-2.5 text-xs font-bold uppercase tracking-wider"
                                    onClick={onContinueToOrderSetup}
                                >
                                    <span>Open Setup Tab</span>
                                </button>
                            </div>
                        )}

                        {purchaseOrderRouteOpen && !purchaseOrderUploaded ? (
                            <div className="space-y-4 rounded-2xl border border-slate-200 bg-[#faf9f5]/50 p-6">
                                <div className="text-sm font-semibold text-slate-800">
                                    Upload Enterprise Purchase Order Details
                                </div>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold uppercase text-slate-400">
                                            PO Number
                                        </span>
                                        <Input
                                            placeholder="PO-XXXXX"
                                            value={poNumber}
                                            onChange={(e) =>
                                                onPoNumberChange(e.target.value)
                                            }
                                            className="rounded-xl border-slate-200 bg-white"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold uppercase text-slate-400">
                                            Product Scope Summary
                                        </span>
                                        <Input
                                            placeholder="Quantity and configuration summary"
                                            value={
                                                poScope ||
                                                `${quote.quantity ?? ""} unit(s) as per approved quote`
                                            }
                                            onChange={(e) =>
                                                onPoScopeChange(e.target.value)
                                            }
                                            className="rounded-xl border-slate-200 bg-white"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold uppercase text-slate-400">
                                            Authorized Signatory Name
                                        </span>
                                        <Input
                                            placeholder="Enter full legal name"
                                            value={signatoryName}
                                            onChange={(e) =>
                                                onSignatoryNameChange(
                                                    e.target.value
                                                )
                                            }
                                            className="rounded-xl border-slate-200 bg-white"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold uppercase text-slate-400">
                                            PO Document File (PDF)
                                        </span>
                                        <input
                                            type="file"
                                            accept=".pdf,image/*"
                                            className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 focus:outline-none"
                                            onChange={(e) =>
                                                onFileChange(
                                                    e.target.files?.[0] ?? null
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={onUploadPo}
                                    disabled={uploadPending}
                                    className="btn-liquid btn-liquid-primary inline-flex rounded-full px-8 py-3 text-xs font-bold uppercase tracking-widest disabled:opacity-50"
                                >
                                    <span>
                                        {uploadPending
                                            ? "Uploading document..."
                                            : "Upload PO Document"}
                                    </span>
                                </button>
                            </div>
                        ) : null}

                        {purchaseOrderUploaded && (
                            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5">
                                <div>
                                    <div className="text-sm font-semibold text-slate-800">
                                        Purchase Order Verified:{" "}
                                        <span className="font-bold text-[#4b7c37]">
                                            {purchaseOrder.poNumber}
                                        </span>
                                    </div>
                                    <div className="mt-1 text-xs text-slate-500">
                                        Authorized Signatory:{" "}
                                        {purchaseOrder.authorizedSignatoryName}
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <a
                                        href={purchaseOrder.uploadedFileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex rounded-full border border-slate-200 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700"
                                    >
                                        <Download className="mr-2 size-4" />
                                        Download PO
                                    </a>
                                    <button
                                        type="button"
                                        className="btn-liquid btn-liquid-primary inline-flex rounded-full px-6 py-2.5 text-xs font-bold uppercase tracking-wider"
                                        onClick={onContinueToOrderSetup}
                                    >
                                        <span>Open Setup Tab</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function CustomerCorporateOrderDetailPanel({
    order,
    onPayRemaining,
    invoice,
}: {
    order: any;
    onPayRemaining: (order: any) => void;
    invoice?: { orderId: string; invoiceNumber: string };
}) {
    const hasBalance = order.balanceDuePaise > 0;
    const utils = trpc.useUtils();
    const { startUpload } = useUploadThing("corporateDocumentUploader");
    const [requestedQuantity, setRequestedQuantity] = useState("1");
    const [reasonCode, setReasonCode] = useState("size_issue");
    const [reasonDetails, setReasonDetails] = useState("");
    const [replacementFiles, setReplacementFiles] = useState<File[]>([]);
    const [uploadingReplacementFiles, setUploadingReplacementFiles] =
        useState(false);
    const { data: replacementRequests = [] } =
        trpc.general.corporatePlatform.listMyReplacementRequests.useQuery({
            orderId: order.id,
        });
    const createReplacementRequest =
        trpc.general.corporatePlatform.createReplacementRequest.useMutation({
            onSuccess: async () => {
                toast.success("Replacement request submitted");
                setRequestedQuantity("1");
                setReasonCode("size_issue");
                setReasonDetails("");
                setReplacementFiles([]);
                await utils.general.corporatePlatform.listMyReplacementRequests.invalidate(
                    {
                        orderId: order.id,
                    }
                );
            },
            onError: (error) => handleClientError(error),
        });

    const submitReplacementRequest = async () => {
        const quantity = Number(requestedQuantity);
        if (!Number.isInteger(quantity) || quantity <= 0) {
            toast.error("Enter a valid replacement quantity");
            return;
        }

        if (quantity > order.quantity) {
            toast.error("Replacement quantity cannot exceed ordered quantity");
            return;
        }

        if (!replacementFiles.length) {
            toast.error("Upload at least one image");
            return;
        }

        try {
            setUploadingReplacementFiles(true);
            const uploaded = await startUpload(replacementFiles);
            if (!uploaded?.length) {
                throw new Error("Upload failed");
            }

            await createReplacementRequest.mutateAsync({
                orderId: order.id,
                requestedQuantity: quantity,
                reasonCode: reasonCode as
                    | "size_issue"
                    | "damaged_item"
                    | "print_issue"
                    | "stitching_issue"
                    | "wrong_item_received"
                    | "quantity_shortage"
                    | "other",
                reasonDetails: reasonDetails.trim() || null,
                photos: uploaded.map((file) => ({
                    name: file.name,
                    url: file.url,
                    type: file.type,
                    size: file.size,
                    key: file.key,
                })),
            });
        } catch (error) {
            handleClientError(error);
        } finally {
            setUploadingReplacementFiles(false);
        }
    };

    return (
        <div className="rounded-[26px] border border-[#e8e5db] bg-[linear-gradient(180deg,#ffffff_0%,#faf9f5_100%)] p-6 shadow-[0_12px_36px_rgba(49,58,31,0.06)]">
            <div className="mb-5 flex flex-col gap-4 border-b border-slate-100 pb-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#4b7c37]">
                        Selected Order Profile
                    </span>
                    <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                        {order.publicOrderId}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                        Created{" "}
                        {new Date(order.createdAt).toLocaleDateString("en-IN")}{" "}
                        for {order.companyName}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <StatusChip label={toLabel(order.status)} />
                    <StatusChip
                        label={
                            hasBalance
                                ? "Remaining payment due"
                                : "Paid in full"
                        }
                    />
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <StatusRow
                    label="Quantity Ordered"
                    value={`${order.quantity} units`}
                />
                <StatusRow
                    label="Advance Payment Received"
                    value={formatINR(order.advancePaidPaise)}
                />
                <StatusRow
                    label="Outstanding Balance Due"
                    value={formatINR(order.balanceDuePaise)}
                />
                <StatusRow
                    label="Contract Valuation"
                    value={formatINR(order.totalPaise)}
                />
            </div>

            <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 xl:grid-cols-[minmax(0,1fr)_auto]">
                <div className="rounded-[22px] border border-slate-100 bg-white p-4 text-sm font-medium leading-relaxed text-slate-500">
                    {hasBalance
                        ? "This order has a remaining outstanding balance. You can complete the payment via card or bank transfer directly from this dashboard."
                        : "This order is fully paid. Production tracking, quality approvals, and freight updates are displayed live below."}
                </div>

                <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                    <a
                        href={`/api/corporate-orders/${order.id}/summary.pdf`}
                        className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-6 text-xs font-bold uppercase tracking-wider text-slate-700 transition hover:border-slate-400"
                    >
                        <span>Download Summary PDF</span>
                    </a>
                    {order.advancePaidPaise > 0 ? (
                        <a
                            href={`/api/corporate-orders/${order.id}/receipt-voucher.pdf`}
                            className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-6 text-xs font-bold uppercase tracking-wider text-slate-700 transition hover:border-slate-400"
                        >
                            <Download className="mr-2 size-4" />
                            <span>Receipt Voucher</span>
                        </a>
                    ) : null}
                    {invoice ? (
                        <a
                            href={`/api/corporate-orders/${order.id}/invoice.pdf`}
                            className="inline-flex h-11 items-center justify-center rounded-full border border-[#07345f] bg-[#07345f] px-6 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#0b477f]"
                        >
                            <Download className="mr-2 size-4" />
                            <span>Download Tax Invoice</span>
                        </a>
                    ) : null}
                    {order.deliveryChallan ? (
                        <a
                            href={`/api/corporate-orders/${order.id}/delivery-challan.pdf`}
                            className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-6 text-xs font-bold uppercase tracking-wider text-slate-700 transition hover:border-slate-400"
                        >
                            <Download className="mr-2 size-4" />
                            <span>Delivery Challan</span>
                        </a>
                    ) : null}
                    {hasBalance ? (
                        <button
                            type="button"
                            onClick={() => onPayRemaining(order)}
                            className="btn-liquid btn-liquid-primary inline-flex rounded-full px-6 py-3 text-xs font-bold uppercase tracking-wider"
                        >
                            <span>Pay Remaining Balance</span>
                        </button>
                    ) : null}
                </div>
            </div>

            {/* Embedded details for active order */}
            <div className="mt-8">
                <div className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900">
                    Production & Delivery Status
                </div>
                <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-5">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">
                            Signatory Details:
                        </span>
                        <span className="font-semibold text-slate-800">
                            {order.contactPersonName} ({order.emailAddress})
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">
                            Delivery Location:
                        </span>
                        <span className="max-w-[400px] text-right font-semibold text-slate-800">
                            {formatCorporateDeliveryAddress(order) ||
                                "No address specified"}
                        </span>
                    </div>
                </div>
            </div>

            <div className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                <div className="rounded-2xl border border-slate-100 bg-white p-5">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="text-sm font-bold uppercase tracking-wider text-slate-900">
                                Request Replacement
                            </div>
                            <p className="mt-1 text-sm text-slate-500">
                                For bulk orders, raise a request with quantity,
                                issue type, and evidence photos first. Our team
                                will review it before creating the replacement
                                order.
                            </p>
                        </div>
                        <StatusChip
                            label={`${replacementRequests.length} request${
                                replacementRequests.length === 1 ? "" : "s"
                            }`}
                        />
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                                Replacement Quantity
                            </label>
                            <Input
                                type="number"
                                min={1}
                                max={order.quantity}
                                value={requestedQuantity}
                                onChange={(e) =>
                                    setRequestedQuantity(e.target.value)
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                                Reason
                            </label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={reasonCode}
                                onChange={(e) => setReasonCode(e.target.value)}
                            >
                                <option value="size_issue">Size issue</option>
                                <option value="damaged_item">
                                    Damaged item
                                </option>
                                <option value="print_issue">Print issue</option>
                                <option value="stitching_issue">
                                    Stitching issue
                                </option>
                                <option value="wrong_item_received">
                                    Wrong item received
                                </option>
                                <option value="quantity_shortage">
                                    Quantity shortage
                                </option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-3 space-y-2">
                        <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                            Replacement Notes
                        </label>
                        <textarea
                            className="min-h-28 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
                            placeholder="Tell us what went wrong and which pieces need to be replaced."
                            value={reasonDetails}
                            onChange={(e) => setReasonDetails(e.target.value)}
                        />
                    </div>

                    <div className="mt-3 space-y-2">
                        <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                            Evidence Photos
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) =>
                                setReplacementFiles(
                                    Array.from(e.target.files ?? []).slice(0, 6)
                                )
                            }
                            className="block w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-600"
                        />
                        <p className="text-xs text-slate-500">
                            Upload clear issue photos. Maximum 6 images.
                        </p>
                        {replacementFiles.length ? (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {replacementFiles.map((file, index) => (
                                    <div
                                        key={`${file.name}-${index}`}
                                        className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                                    >
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt={file.name}
                                            className="h-32 w-full object-cover"
                                        />
                                        <div className="p-3">
                                            <p className="truncate text-xs font-medium text-slate-700">
                                                {file.name}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs text-slate-500">
                            You can request up to {order.quantity} units from
                            this order.
                        </p>
                        <button
                            type="button"
                            onClick={submitReplacementRequest}
                            disabled={
                                createReplacementRequest.isPending ||
                                uploadingReplacementFiles
                            }
                            className="btn-liquid btn-liquid-primary inline-flex rounded-full px-6 py-3 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                        >
                            <span>
                                {createReplacementRequest.isPending ||
                                uploadingReplacementFiles
                                    ? "Submitting request..."
                                    : "Submit Replacement Request"}
                            </span>
                        </button>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-5">
                    <div className="text-sm font-bold uppercase tracking-wider text-slate-900">
                        Replacement Timeline
                    </div>
                    <div className="mt-4 space-y-3">
                        {replacementRequests.length ? (
                            replacementRequests.map((request: any) => (
                                <div
                                    key={request.id}
                                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="text-sm font-semibold text-slate-900">
                                                {request.reasonLabel}
                                            </div>
                                            <div className="mt-1 text-xs text-slate-500">
                                                Requested for{" "}
                                                {request.requestedQuantity}{" "}
                                                unit(s) on{" "}
                                                {new Date(
                                                    request.createdAt
                                                ).toLocaleDateString("en-IN")}
                                            </div>
                                        </div>
                                        <StatusChip
                                            label={toLabel(request.status)}
                                        />
                                    </div>
                                    {request.reasonDetails ? (
                                        <p className="mt-3 text-sm leading-6 text-slate-600">
                                            {request.reasonDetails}
                                        </p>
                                    ) : null}
                                    {request.adminNote ? (
                                        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                                            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                                Admin Note
                                            </div>
                                            <p className="mt-2 text-sm text-slate-700">
                                                {request.adminNote}
                                            </p>
                                        </div>
                                    ) : null}
                                    {request.replacementOrder?.publicOrderId ? (
                                        <div className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#4b7c37]">
                                            Replacement order created:{" "}
                                            {
                                                request.replacementOrder
                                                    .publicOrderId
                                            }
                                        </div>
                                    ) : null}
                                </div>
                            ))
                        ) : (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-500">
                                No replacement requests yet for this order.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function toLabel(value: string | null | undefined) {
    return (value ?? "")
        .replaceAll("_", " ")
        .replace(/\b\w/g, (match) => match.toUpperCase());
}
