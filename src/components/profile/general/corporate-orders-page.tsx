"use client";

import { CorporateOrderPage } from "@/components/corporate-orders/corporate-order-page";
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button-general";
import { cn, convertValueToLabel, formatINR } from "@/lib/utils";
import Script from "next/script";
import { useState } from "react";

export function CorporateOrdersPage({ initialData }: { initialData: any[] }) {
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
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

    return (
        <div className="min-w-0 flex-1 bg-[#f8f7f4]">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />

            <section className="mb-8 overflow-hidden rounded-[30px] border border-[#e7e1d4] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.98),_rgba(248,243,236,0.96)_42%,_rgba(238,244,252,0.95)_100%)] shadow-[0_28px_80px_-52px_rgba(45,53,31,0.35)]">
                <div className="flex flex-col gap-8 p-6 md:p-8 xl:flex-row xl:items-end xl:justify-between">
                    <div className="max-w-3xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#8f7750]">
                            Self-Service Ordering
                        </p>
                        <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight text-[#1f2937] md:text-5xl">
                            Configure and place bulk orders with confidence
                        </h1>
                        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#667085] md:text-base">
                            Use the self-service corporate ordering flow to choose product options, upload branding files, review pricing, and place bulk orders from your profile.
                        </p>

                        <div className="mt-5 flex flex-wrap gap-2">
                            <span className="rounded-full border border-[#dbcdb7] bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#6f5b3e]">
                                Premium bulk ordering
                            </span>
                            <span className="rounded-full border border-[#d9e7f7] bg-[#f4f8fd] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#4c7fb6]">
                                Live pricing and payment tracking
                            </span>
                        </div>
                    </div>

                    <div className="w-full max-w-xl rounded-[26px] border border-white/80 bg-white/80 p-3 shadow-[0_18px_50px_-36px_rgba(31,41,55,0.28)] backdrop-blur">
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
                            className="inline-flex w-fit rounded-full border border-[#dde4ec] bg-white p-1 shadow-sm"
                        >
                            <button
                                type="button"
                                role="tab"
                                aria-selected={!isPlacingOrder}
                                onClick={() => setIsPlacingOrder(false)}
                                className={cn(
                                    "rounded-full px-5 py-2.5 text-sm font-semibold transition-colors",
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
                                    "rounded-full px-5 py-2.5 text-sm font-semibold transition-colors",
                                    isPlacingOrder
                                        ? "bg-[#5B9BD5] text-white shadow-sm"
                                        : "text-[#475467] hover:text-[#1f2937]"
                                )}
                            >
                                New Self-Service Order
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
                        Fill in the details below to place a new self-service corporate order, including artwork upload, employee size sheet, pricing review, and payment.
                    </div>
                    <CorporateOrderPage />
                </section>
            ) : null}

            {!isPlacingOrder ? (
                <section className="mt-2 space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h2 className="font-serif text-2xl font-semibold text-[#1f2937] md:text-3xl">
                            Your Self-Service Orders
                        </h2>
                        <p className="mt-2 text-sm text-[#667085]">
                            Track submitted orders, download summaries, and
                            finish any remaining balance payments here.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <StatusChip label="Active tracker" tone="blue" />
                        <StatusChip
                            label={`${pendingOrders} awaiting balance`}
                            tone="amber"
                        />
                    </div>
                </div>

                {initialData.length === 0 ? (
                    <div className="overflow-hidden rounded-[28px] border border-[#eadfce] bg-[linear-gradient(135deg,#fffdf9_0%,#fff8ef_45%,#f8fbff_100%)] shadow-[0_26px_60px_-50px_rgba(61,44,22,0.35)]">
                        <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
                            <div className="p-8 md:p-10">
                                <div className="flex size-14 items-center justify-center rounded-2xl bg-white text-[#8f7750] shadow-sm">
                                    <Icons.Briefcase className="size-7" />
                                </div>
                                <h3 className="mt-6 font-serif text-3xl font-semibold text-[#1f2937]">
                                    No self-service orders yet
                                </h3>
                                <p className="mt-3 max-w-xl text-sm leading-7 text-[#667085] md:text-base">
                                    Your placed self-service orders will appear
                                    here. Use the new self-service order tab to create your
                                    first bulk apparel request.
                                </p>
                                <div className="mt-6 flex flex-wrap gap-3">
                                    <Button
                                        className="bg-[#2f3720] text-white hover:bg-[#252c18]"
                                        onClick={() => setIsPlacingOrder(true)}
                                    >
                                        Start Your First Order
                                    </Button>
                                    <div className="rounded-full border border-[#d7e6f5] bg-white px-4 py-2 text-sm font-medium text-[#5B9BD5]">
                                        Artwork upload, live quote, Razorpay
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-[#f1e6d6] bg-white/60 p-8 lg:border-l lg:border-t-0">
                                <div className="space-y-4">
                                    <LuxuryPoint
                                        title="Easy order setup"
                                        description="Add company details, product preferences, branding instructions, and employee sizes in one guided flow."
                                    />
                                    <LuxuryPoint
                                        title="Clear payment visibility"
                                        description="See the amount paid, remaining balance, and payment status for every corporate order."
                                    />
                                    <LuxuryPoint
                                        title="Everything in one place"
                                        description="Return anytime to download order summaries, review status updates, and complete pending payments."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {initialData.map((order) => {
                            const paidInFull = order.balanceDuePaise === 0;

                            return (
                                <article
                                    key={order.id}
                                    className="overflow-hidden rounded-[26px] border border-[#e7e1d4] bg-white shadow-[0_24px_55px_-42px_rgba(31,41,55,0.22)] transition-transform duration-200 hover:-translate-y-0.5"
                                >
                                    <div className="flex flex-col gap-4 border-b border-[#eef2f6] bg-[linear-gradient(120deg,#f8fbff_0%,#fffdf9_60%,#ffffff_100%)] p-5 md:flex-row md:items-start md:justify-between">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8f7750]">
                                                Corporate Order
                                            </p>
                                            <h3 className="mt-2 font-serif text-2xl font-semibold text-[#1f2937]">
                                                {order.publicOrderId}
                                            </h3>
                                            <p className="mt-1 text-sm text-[#667085]">
                                                {order.companyName} •{" "}
                                                {order.contactPersonName}
                                            </p>
                                            <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-[#98a2b3]">
                                                Created{" "}
                                                {new Date(
                                                    order.createdAt
                                                ).toLocaleDateString("en-IN")}
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
                                            value={String(order.quantity)}
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
                                            value={formatINR(order.totalPaise)}
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
                                            {order.balancePaymentLink &&
                                            order.balanceDuePaise > 0 ? (
                                                <a
                                                    href={order.balancePaymentLink}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex h-11 items-center justify-center rounded-full bg-[#2f3720] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#252c18]"
                                                >
                                                    Pay Remaining Balance
                                                </a>
                                            ) : null}
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
                </section>
            ) : null}
        </div>
    );
}

function MetricCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-white/80 bg-[linear-gradient(180deg,#ffffff_0%,#fbfbfc_100%)] p-4 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.28)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#98a2b3]">
                {label}
            </p>
            <p className="mt-2 text-lg font-semibold text-[#1f2937]">{value}</p>
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
                "rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em]",
                tone === "blue"
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
            )}
        >
            {label}
        </span>
    );
}

function LuxuryPoint({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-[0_16px_34px_-28px_rgba(31,41,55,0.24)]">
            <p className="text-sm font-semibold text-[#1f2937]">{title}</p>
            <p className="mt-1 text-sm leading-6 text-[#667085]">
                {description}
            </p>
        </div>
    );
}
