"use client";

import { CorporateOrderPage } from "@/components/corporate-orders/corporate-order-page";
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button-general";
import { initializeRazorpayPayment } from "@/lib/razorpay/payment";
import { trpc } from "@/lib/trpc/client";
import { cn, convertValueToLabel, formatINR } from "@/lib/utils";
import {
    BarChart3,
    CreditCard,
    FileText,
    PackageCheck,
    Plus,
    ShieldCheck,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import Script from "next/script";
import { useState, type ReactNode } from "react";
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

        const script = Array.from(document.scripts).find(
            (item) =>
                item.src === "https://checkout.razorpay.com/v1/checkout.js"
        );

        if (!script) {
            reject(new Error("Failed to load Razorpay checkout"));
            return;
        }

        script.addEventListener("load", () => resolve(), { once: true });
        script.addEventListener(
            "error",
            () => reject(new Error("Failed to load Razorpay checkout")),
            { once: true }
        );
    });
}

export function CorporateOrdersPage({ initialData }: { initialData: any[] }) {
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const searchParams = useSearchParams();
    const confirmedOrderId = searchParams.get("confirmed");
    const confirmedOrder = initialData.find(
        (order) => order.id === confirmedOrderId
    );
    const createBalancePaymentOrder =
        trpc.general.corporateOrders.createBalancePaymentOrder.useMutation();
    const confirmBalancePayment =
        trpc.general.corporateOrders.confirmBalancePayment.useMutation();
    const totalOrders = initialData.length;
    const pendingOrders = initialData.filter(
        (order) => order.balanceDuePaise > 0
    ).length;
    const paidOrders = initialData.filter(
        (order) => order.balanceDuePaise === 0
    ).length;
    const totalValuePaise = initialData.reduce(
        (sum, order) => sum + (order.totalPaise ?? 0),
        0
    );

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
                theme: { color: "#5B9BD5" },
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
                    window.location.href = `/profile/corporate-orders?confirmed=${order.id}`;
                },
                modal: {
                    ondismiss: () =>
                        toast.message("Remaining balance payment cancelled"),
                },
            } as any);
        } catch (error: any) {
            toast.error(error?.message || "Failed to open balance payment");
        }
    };

    return (
        <div className="square-corporate-ui min-w-0 max-w-full flex-1 overflow-x-hidden bg-white px-5 py-5 font-inter md:px-7 md:py-7">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />

            <section className="mb-8 overflow-hidden rounded-[14px] border border-[#e5e9ee] bg-white shadow-[0_18px_48px_-38px_rgba(31,41,55,0.2)]">
                <div className="flex flex-col gap-8 p-6 md:p-8 xl:flex-row xl:items-end xl:justify-between">
                    <div className="max-w-3xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#8f7750]">
                            Self-Service Ordering
                        </p>
                        <h1 className="mt-3 max-w-2xl font-inter text-3xl font-bold leading-[1.08] tracking-[-0.025em] text-[#172033] md:text-5xl">
                            Configure and place bulk orders with confidence
                        </h1>
                        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#667085] md:text-base">
                            Use the self-service corporate ordering flow to
                            choose product options, upload branding files,
                            review pricing, and place bulk orders from your
                            profile.
                        </p>

                        <div className="mt-5 flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-2 rounded-full border border-[#d9eadf] bg-[#eaf5ef] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#27634e]">
                                <ShieldCheck className="size-3.5" />
                                Premium bulk ordering
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full border border-[#d9e7f7] bg-[#eff6ff] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#3b73c4]">
                                <BarChart3 className="size-3.5" />
                                Live pricing and payment tracking
                            </span>
                        </div>
                    </div>

                    <div className="w-full max-w-xl rounded-[16px] border border-[#eef0f2] bg-white/90 p-3 shadow-[0_12px_34px_-26px_rgba(31,41,55,0.2)]">
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                            <MetricCard
                                label="Total Orders"
                                value={String(totalOrders)}
                            />
                            <MetricCard
                                label="Pending Balance"
                                value={String(pendingOrders)}
                            />
                            <MetricCard
                                label="Paid in Full"
                                value={String(paidOrders)}
                            />
                            <MetricCard
                                label="Order Value"
                                value={formatINR(totalValuePaise)}
                            />
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/70 bg-white/55 px-6 py-4 md:px-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div
                            role="tablist"
                            aria-label="Corporate order views"
                            className="inline-flex w-fit rounded-lg border border-[#dde4ec] bg-white p-1 shadow-sm"
                        >
                            <button
                                type="button"
                                role="tab"
                                aria-selected={!isPlacingOrder}
                                onClick={() => setIsPlacingOrder(false)}
                                className={cn(
                                    "rounded-md px-5 py-2.5 text-sm font-semibold transition-colors",
                                    !isPlacingOrder
                                        ? "bg-[#2f3720] text-white shadow-sm"
                                        : "text-[#475467] hover:text-[#1f2937]"
                                )}
                            >
                                Order History
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={isPlacingOrder}
                                onClick={() => setIsPlacingOrder(true)}
                                className={cn(
                                    "rounded-md px-5 py-2.5 text-sm font-semibold transition-colors",
                                    isPlacingOrder
                                        ? "bg-[#2f3720] text-white shadow-sm"
                                        : "text-[#475467] hover:text-[#1f2937]"
                                )}
                            >
                                New Self-Service Order{" "}
                                <Plus className="ml-1 inline size-4" />
                            </button>
                        </div>

                        <p className="text-sm text-[#667085] md:max-w-2xl md:text-right">
                            {isPlacingOrder
                                ? "Complete the guided order form below to place a new self-service corporate order."
                                : "Review placed orders, download summaries, and complete any remaining balance payment here."}
                        </p>
                    </div>
                </div>
            </section>

            {isPlacingOrder ? (
                <section className="mb-10 space-y-6">
                    <div className="rounded-[24px] border border-[#d7e6f5] bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(239,246,255,0.9))] px-5 py-4 text-sm text-[#3c6f9f] shadow-[0_18px_40px_-36px_rgba(91,155,213,0.55)]">
                        Fill in the details below to place a new self-service
                        corporate order, including artwork upload, employee size
                        sheet, pricing review, and payment.
                    </div>
                    <CorporateOrderPage />
                </section>
            ) : null}

            {!isPlacingOrder ? (
                <section className="mt-4 space-y-5">
                    <div className="flex min-w-0 flex-col gap-4 md:flex-row md:flex-wrap md:items-end md:justify-between">
                        <div className="min-w-0">
                            <h2 className="font-inter text-2xl font-bold tracking-[-0.02em] text-[#172033] md:text-3xl">
                                Your Self-Service Orders
                            </h2>
                            <p className="mt-2 text-sm text-[#667085]">
                                Track submitted orders, download summaries, and
                                finish any remaining balance payments here.
                            </p>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2">
                            <StatusChip label="Active tracker" tone="blue" />
                            <StatusChip
                                label={`${pendingOrders} awaiting balance`}
                                tone="amber"
                            />
                        </div>
                    </div>

                    {initialData.length === 0 ? (
                        <div className="overflow-hidden rounded-[14px] border border-[#e5e9ee] bg-white shadow-[0_18px_46px_-38px_rgba(31,41,55,0.2)]">
                            <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
                                <div className="p-8 md:p-10">
                                    <div className="flex size-14 items-center justify-center rounded-2xl bg-white text-[#8f7750] shadow-sm">
                                        <Icons.Briefcase className="size-7" />
                                    </div>
                                    <h3 className="mt-6 font-inter text-3xl font-bold text-[#1f2937]">
                                        No self-service orders yet
                                    </h3>
                                    <p className="mt-3 max-w-xl text-sm leading-7 text-[#667085] md:text-base">
                                        Your placed self-service orders will
                                        appear here. Use the new self-service
                                        order tab to create your first bulk
                                        apparel request.
                                    </p>
                                    <div className="mt-6 flex flex-wrap gap-3">
                                        <Button
                                            className="bg-[#2f3720] text-white hover:bg-[#252c18]"
                                            onClick={() =>
                                                setIsPlacingOrder(true)
                                            }
                                        >
                                            Start Your First Order
                                        </Button>
                                        <div className="rounded-full border border-[#d7e6f5] bg-white px-4 py-2 text-sm font-medium text-[#5B9BD5]">
                                            Artwork upload, live quote, Razorpay
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-[#eef2f6] bg-white p-6 lg:border-l lg:border-t-0 lg:p-7">
                                    <div className="space-y-4">
                                        <LuxuryPoint
                                            icon={
                                                <PackageCheck className="size-5" />
                                            }
                                            title="Easy order setup"
                                            description="Add company details, product preferences, branding instructions, and employee sizes in one guided flow."
                                        />
                                        <LuxuryPoint
                                            icon={
                                                <CreditCard className="size-5" />
                                            }
                                            title="Clear payment visibility"
                                            description="See the amount paid, remaining balance, and payment status for every corporate order."
                                        />
                                        <LuxuryPoint
                                            icon={
                                                <FileText className="size-5" />
                                            }
                                            title="Everything in one place"
                                            description="Return anytime to download order summaries, review status updates, and complete pending payments."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div
                                className={cn(
                                    "grid gap-5",
                                    confirmedOrder &&
                                        "xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start"
                                )}
                            >
                                <div className="min-w-0 overflow-hidden rounded-[24px] border border-[#e6e1d8] bg-white shadow-[0_20px_55px_-38px_rgba(31,41,55,0.24)]">
                                    <div className="overflow-x-auto">
                                        <table className="w-full table-fixed border-collapse text-left text-[13px]">
                                            <colgroup>
                                                <col className="w-[16%]" />
                                                <col className="w-[13%]" />
                                                <col className="w-[8%]" />
                                                <col className="w-[12%]" />
                                                <col className="w-[10%]" />
                                                <col className="w-[5%]" />
                                                <col className="w-[7%]" />
                                                <col className="w-[7%]" />
                                                <col className="w-[7%]" />
                                                <col className="w-[15%]" />
                                            </colgroup>
                                            <thead className="sticky top-0 z-10 bg-[#f7faf9]">
                                                <tr className="border-b border-[#e7edf1]">
                                                    {[
                                                        "Order",
                                                        "Company / Contact",
                                                        "Created",
                                                        "Status",
                                                        "Payment",
                                                        "Quantity",
                                                        "Amount Paid",
                                                        "Balance Due",
                                                        "Order Value",
                                                        "Actions",
                                                    ].map((heading) => (
                                                        <th
                                                            key={heading}
                                                            scope="col"
                                                            className="whitespace-nowrap px-3 py-3 text-[9px] font-bold uppercase tracking-[0.12em] text-[#28644f] first:pl-5 last:pr-5"
                                                        >
                                                            {heading}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {initialData.map((order) => {
                                                    const paidInFull =
                                                        order.balanceDuePaise ===
                                                        0;

                                                    return (
                                                        <tr
                                                            key={order.id}
                                                            className={cn(
                                                                "group border-b border-[#eef2f6] align-top transition-colors last:border-b-0 hover:bg-[#fbfdfc]",
                                                                order.id ===
                                                                    confirmedOrderId &&
                                                                    "bg-[#f0f8f3]"
                                                            )}
                                                        >
                                                            <td className="overflow-hidden px-3 py-4 first:pl-5">
                                                                <p className="truncate text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8f7750]">
                                                                    Corporate
                                                                    Order
                                                                </p>
                                                                <p className="mt-1 truncate font-inter text-sm font-bold text-[#172033] transition-colors group-hover:text-[#28644f]">
                                                                    {
                                                                        order.publicOrderId
                                                                    }
                                                                </p>
                                                            </td>
                                                            <td className="overflow-hidden px-3 py-4 text-[13px] text-[#667085]">
                                                                <p className="truncate font-semibold text-[#344054]">
                                                                    {
                                                                        order.companyName
                                                                    }
                                                                </p>
                                                                <p className="mt-1 truncate">
                                                                    {
                                                                        order.contactPersonName
                                                                    }
                                                                </p>
                                                            </td>
                                                            <td className="whitespace-nowrap px-3 py-4 text-[13px] text-[#667085]">
                                                                {new Date(
                                                                    order.createdAt
                                                                ).toLocaleDateString(
                                                                    "en-IN"
                                                                )}
                                                            </td>
                                                            <td className="px-3 py-4 pr-5">
                                                                <Badge
                                                                    variant="outline"
                                                                    className="whitespace-nowrap border-blue-200 bg-blue-50 text-blue-700"
                                                                >
                                                                    {convertValueToLabel(
                                                                        order.status
                                                                    )}
                                                                </Badge>
                                                            </td>
                                                            <td className="px-3 py-4 pl-5">
                                                                <div className="flex flex-col items-start gap-2">
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="whitespace-nowrap border-gray-200 bg-gray-50 text-gray-700"
                                                                    >
                                                                        {convertValueToLabel(
                                                                            order.paymentStatus
                                                                        )}
                                                                    </Badge>
                                                                    <div>
                                                                        {paidInFull ? (
                                                                            <Badge className="whitespace-nowrap bg-emerald-600 text-white hover:bg-emerald-600">
                                                                                Paid
                                                                                in
                                                                                full
                                                                            </Badge>
                                                                        ) : (
                                                                            <Badge className="whitespace-nowrap bg-amber-500 text-white hover:bg-amber-500">
                                                                                Balance
                                                                                pending
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-4 text-sm font-bold text-[#182131]">
                                                                {order.quantity}
                                                            </td>
                                                            <td className="whitespace-nowrap px-3 py-4 text-sm font-bold text-[#182131]">
                                                                {formatINR(
                                                                    order.advancePaidPaise
                                                                )}
                                                            </td>
                                                            <td className="whitespace-nowrap px-3 py-4 text-sm font-bold text-[#182131]">
                                                                {formatINR(
                                                                    order.balanceDuePaise
                                                                )}
                                                            </td>
                                                            <td className="whitespace-nowrap px-3 py-4 text-sm font-bold text-[#182131]">
                                                                {formatINR(
                                                                    order.totalPaise
                                                                )}
                                                            </td>
                                                            <td className="overflow-hidden px-3 py-4 last:pr-5">
                                                                <div className="flex flex-col items-stretch gap-2">
                                                                    <a
                                                                        href={`/api/corporate-orders/${order.id}/summary.pdf`}
                                                                        className="inline-flex min-h-8 w-full items-center justify-start whitespace-nowrap border border-[#e1e7e4] bg-white px-2.5 text-[11px] font-semibold text-[#344054] transition-colors hover:border-[#b9d8ca] hover:bg-[#f3faf6] hover:text-[#28644f]"
                                                                    >
                                                                        Download
                                                                        Summary
                                                                    </a>
                                                                    {order.advancePaidPaise >
                                                                    0 ? (
                                                                        <a
                                                                            href={`/api/corporate-orders/${order.id}/receipt-voucher.pdf`}
                                                                            className="inline-flex min-h-8 w-full items-center justify-start whitespace-nowrap border border-[#e1e7e4] bg-white px-2.5 text-[11px] font-semibold text-[#344054] transition-colors hover:border-[#b9d8ca] hover:bg-[#f3faf6] hover:text-[#28644f]"
                                                                        >
                                                                            Receipt
                                                                            Voucher
                                                                        </a>
                                                                    ) : null}
                                                                    {order.taxInvoice ? (
                                                                        <a
                                                                            href={`/api/corporate-orders/${order.id}/invoice.pdf`}
                                                                            className="inline-flex min-h-8 w-full items-center justify-start whitespace-nowrap border border-[#c8dcef] bg-[#f4f8fd] px-2.5 text-[11px] font-semibold text-[#07345f] transition-colors hover:bg-[#e9f2fc]"
                                                                        >
                                                                            Tax
                                                                            Invoice
                                                                        </a>
                                                                    ) : null}
                                                                    {order.balancePaymentLink &&
                                                                    order.balanceDuePaise >
                                                                        0 ? (
                                                                        <a
                                                                            href={
                                                                                order.balancePaymentLink
                                                                            }
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="mt-1 inline-flex min-h-8 w-full items-center justify-center whitespace-nowrap bg-[#2f3720] px-2.5 text-[11px] font-semibold text-white transition-colors hover:bg-[#252c18]"
                                                                        >
                                                                            Pay
                                                                            Balance
                                                                        </a>
                                                                    ) : null}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    <p className="border-t border-[#eef2f6] px-6 py-3 text-xs text-[#667085] md:hidden">
                                        Swipe horizontally to view all order
                                        details.
                                    </p>
                                </div>

                                {confirmedOrder ? (
                                    <CorporatePaymentConfirmationPanel
                                        order={confirmedOrder}
                                        onPayBalance={payRemainingBalance}
                                        onPlaceAnotherOrder={() =>
                                            setIsPlacingOrder(true)
                                        }
                                    />
                                ) : null}
                            </div>

                            {/* Kept temporarily during the layout migration; the table above is the active view. */}
                            <div className="hidden">
                                {initialData.map((order) => {
                                    const paidInFull =
                                        order.balanceDuePaise === 0;

                                    return (
                                        <article
                                            key={order.id}
                                            className="overflow-hidden rounded-[26px] border border-[#e7e1d4] bg-white shadow-[0_24px_55px_-42px_rgba(31,41,55,0.22)] transition-transform duration-200 hover:-translate-y-0.5"
                                        >
                                            <div className="flex flex-col gap-4 border-b border-[#eef2f6] bg-white p-5 md:flex-row md:items-start md:justify-between">
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8f7750]">
                                                        Corporate Order
                                                    </p>
                                                    <h3 className="mt-2 font-inter text-2xl font-bold text-[#1f2937]">
                                                        {order.publicOrderId}
                                                    </h3>
                                                    <p className="mt-1 text-sm text-[#667085]">
                                                        {order.companyName} •{" "}
                                                        {
                                                            order.contactPersonName
                                                        }
                                                    </p>
                                                    <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-[#98a2b3]">
                                                        Created{" "}
                                                        {new Date(
                                                            order.createdAt
                                                        ).toLocaleDateString(
                                                            "en-IN"
                                                        )}
                                                    </p>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    <Badge
                                                        variant="outline"
                                                        className="border-blue-200 bg-blue-50 text-blue-700"
                                                    >
                                                        {convertValueToLabel(
                                                            order.status
                                                        )}
                                                    </Badge>
                                                    <Badge
                                                        variant="outline"
                                                        className="border-gray-200 bg-gray-50 text-gray-700"
                                                    >
                                                        {convertValueToLabel(
                                                            order.paymentStatus
                                                        )}
                                                    </Badge>
                                                    {paidInFull ? (
                                                        <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                                                            Paid in full
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-amber-500 text-white hover:bg-amber-500">
                                                            Balance pending
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid gap-4 p-5 md:grid-cols-4">
                                                <MetricCard
                                                    label="Quantity"
                                                    value={String(
                                                        order.quantity
                                                    )}
                                                />
                                                <MetricCard
                                                    label={
                                                        paidInFull
                                                            ? "Amount Paid"
                                                            : "Initial Payment"
                                                    }
                                                    value={formatINR(
                                                        order.advancePaidPaise
                                                    )}
                                                />
                                                <MetricCard
                                                    label="Balance Due"
                                                    value={formatINR(
                                                        order.balanceDuePaise
                                                    )}
                                                />
                                                <MetricCard
                                                    label="Total Order Value"
                                                    value={formatINR(
                                                        order.totalPaise
                                                    )}
                                                />
                                            </div>

                                            <div className="flex flex-col gap-4 border-t border-[#eef2f6] px-5 py-4 md:flex-row md:items-center md:justify-between">
                                                <div className="max-w-2xl text-sm leading-6 text-[#667085]">
                                                    {paidInFull
                                                        ? "This order was collected with full payment upfront."
                                                        : order.balancePaymentLink
                                                          ? "Your balance payment link is ready."
                                                          : "The remaining payment link will appear here once shared by Renivet."}
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    <a
                                                        href={`/api/corporate-orders/${order.id}/summary.pdf`}
                                                        className="inline-flex h-11 items-center justify-center rounded-full border border-[#d9dee5] bg-white px-6 text-sm font-semibold text-[#344054] transition-colors hover:border-[#c2cad5] hover:bg-[#f8fafc]"
                                                    >
                                                        Download Summary
                                                    </a>
                                                    {order.advancePaidPaise >
                                                    0 ? (
                                                        <a
                                                            href={`/api/corporate-orders/${order.id}/receipt-voucher.pdf`}
                                                            className="inline-flex h-11 items-center justify-center rounded-full border border-[#d9dee5] bg-white px-6 text-sm font-semibold text-[#344054] transition-colors hover:border-[#c2cad5] hover:bg-[#f8fafc]"
                                                        >
                                                            Receipt Voucher
                                                        </a>
                                                    ) : null}
                                                    {order.taxInvoice ? (
                                                        <a
                                                            href={`/api/corporate-orders/${order.id}/invoice.pdf`}
                                                            className="inline-flex h-11 items-center justify-center rounded-full border border-[#07345f] bg-[#07345f] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#0b477f]"
                                                        >
                                                            Download Tax Invoice
                                                        </a>
                                                    ) : null}
                                                    {order.balancePaymentLink &&
                                                    order.balanceDuePaise >
                                                        0 ? (
                                                        <a
                                                            href={
                                                                order.balancePaymentLink
                                                            }
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex h-11 items-center justify-center rounded-full bg-[#2f3720] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#252c18]"
                                                        >
                                                            Pay Remaining
                                                            Balance
                                                        </a>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </section>
            ) : null}
        </div>
    );
}

function CorporatePaymentConfirmationPanel({
    order,
    onPayBalance,
    onPlaceAnotherOrder,
}: {
    order: any;
    onPayBalance: (order: any) => void;
    onPlaceAnotherOrder: () => void;
}) {
    const paidInFull = order.balanceDuePaise === 0;
    const amountPaid = Math.max(0, order.totalPaise - order.balanceDuePaise);

    return (
        <aside className="overflow-hidden rounded-[22px] border border-[#cfe3d8] bg-[linear-gradient(160deg,#f6fcf8_0%,#ffffff_48%,#eff7f2_100%)] shadow-[0_20px_48px_-38px_rgba(39,100,78,0.48)] xl:sticky xl:top-6">
            <div className="border-b border-[#d9eadf] px-5 py-5">
                <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#28644f] text-white">
                        <PackageCheck className="size-5" />
                    </span>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#28644f]">
                            Payment received
                        </p>
                        <h3 className="mt-1 font-inter text-lg font-bold text-[#172033]">
                            Order {order.publicOrderId}
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-[#667085]">
                            Your corporate order is now safely recorded in your
                            profile.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-px bg-[#dcebe2]">
                <ConfirmationMetric
                    label={paidInFull ? "Amount paid" : "Initial payment"}
                    value={formatINR(amountPaid)}
                />
                <ConfirmationMetric
                    label="Order value"
                    value={formatINR(order.totalPaise)}
                />
                <ConfirmationMetric
                    label="Balance due"
                    value={formatINR(order.balanceDuePaise)}
                />
                <ConfirmationMetric
                    label="Order status"
                    value={convertValueToLabel(order.status)}
                />
            </div>

            <div className="space-y-2 p-4">
                <a
                    href={`/api/corporate-orders/${order.id}/summary.pdf`}
                    className="flex min-h-10 w-full items-center justify-center rounded-md border border-[#c8d9cf] bg-white px-3 text-sm font-semibold text-[#245a47] transition-colors hover:bg-[#edf7f1]"
                >
                    Download order summary
                </a>
                {order.advancePaidPaise > 0 ? (
                    <a
                        href={`/api/corporate-orders/${order.id}/receipt-voucher.pdf`}
                        className="flex min-h-10 w-full items-center justify-center rounded-md border border-[#c8d9cf] bg-white px-3 text-sm font-semibold text-[#245a47] transition-colors hover:bg-[#edf7f1]"
                    >
                        Download receipt voucher
                    </a>
                ) : null}
                {order.taxInvoice ? (
                    <a
                        href={`/api/corporate-orders/${order.id}/invoice.pdf`}
                        className="flex min-h-10 w-full items-center justify-center rounded-md border border-[#c8d9cf] bg-white px-3 text-sm font-semibold text-[#245a47] transition-colors hover:bg-[#edf7f1]"
                    >
                        Download tax invoice
                    </a>
                ) : null}
                {!paidInFull ? (
                    <Button
                        className="w-full bg-[#2f3720] text-white hover:bg-[#252c18]"
                        onClick={() => onPayBalance(order)}
                    >
                        Pay remaining balance
                    </Button>
                ) : null}
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={onPlaceAnotherOrder}
                >
                    Place another order
                </Button>
            </div>
        </aside>
    );
}

function ConfirmationMetric({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="min-w-0 bg-white px-4 py-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#667085]">
                {label}
            </p>
            <p className="mt-1 truncate text-sm font-bold text-[#172033]">
                {value}
            </p>
        </div>
    );
}

function MetricCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="border-r border-[#eef0f2] px-3 py-1 last:border-r-0">
            <p className="text-[10px] font-bold uppercase leading-3 tracking-[0.12em] text-[#28644f]">
                {label}
            </p>
            <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-[#182131]">
                {value}
            </p>
        </div>
    );
}

function StatusChip({
    label,
    tone,
}: {
    label: string;
    tone: "blue" | "amber";
}) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em]",
                tone === "blue"
                    ? "border-blue-200 bg-blue-50 text-blue-700 before:size-1.5 before:rounded-full before:bg-blue-500 before:content-['']"
                    : "border-amber-200 bg-amber-50 text-amber-700 before:size-1.5 before:rounded-full before:bg-amber-500 before:content-['']"
            )}
        >
            {label}
        </span>
    );
}

function LuxuryPoint({
    icon,
    title,
    description,
}: {
    icon: ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="rounded-xl border border-[#e8edf0] bg-[#f8fafb] p-4">
            <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#e3ebe7] bg-white text-[#28644f] shadow-sm">
                    {icon}
                </span>
                <div>
                    <p className="text-sm font-semibold text-[#1f2937]">
                        {title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[#667085]">
                        {description}
                    </p>
                </div>
            </div>
        </div>
    );
}
