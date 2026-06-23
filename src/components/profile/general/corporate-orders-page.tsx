"use client";

import { CorporateOrderPage } from "@/components/corporate-orders/corporate-order-page";
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button-general";
import {
    EmptyPlaceholder,
    EmptyPlaceholderContent,
    EmptyPlaceholderDescription,
    EmptyPlaceholderIcon,
    EmptyPlaceholderTitle,
} from "@/components/ui/empty-placeholder-general";
import { cn, convertValueToLabel, formatINR } from "@/lib/utils";
import Script from "next/script";
import { useState } from "react";

export function CorporateOrdersPage({ initialData }: { initialData: any[] }) {
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);

    return (
        <div className="min-w-0 flex-1 bg-[#f8f7f4]">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />

            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
                        Corporate Orders
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Review corporate apparel requests, place new bulk
                        orders, download summaries, and complete any remaining
                        balance payment.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button
                        variant={isPlacingOrder ? "outline" : "default"}
                        onClick={() => setIsPlacingOrder(false)}
                    >
                        View Orders
                    </Button>
                    <Button onClick={() => setIsPlacingOrder((current) => !current)}>
                        {isPlacingOrder ? "Hide Order Form" : "Place New Order"}
                    </Button>
                </div>
            </div>

            {isPlacingOrder ? (
                <section className="mb-10 space-y-6">
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-blue-800">
                        Fill in the corporate apparel form below to create a new
                        bulk order request.
                    </div>
                    <CorporateOrderPage />
                </section>
            ) : null}

            <section className={cn("space-y-4", isPlacingOrder ? "mt-0" : "mt-2")}>
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 md:text-2xl">
                        Your Corporate Orders
                    </h2>
                    <p className="text-sm text-gray-500 md:max-w-2xl md:text-right">
                        Track submitted requests, download summaries, and finish
                        any remaining balance payments here.
                    </p>
                </div>

                {initialData.length === 0 ? (
                    <EmptyPlaceholder className="border border-gray-200 bg-white">
                        <EmptyPlaceholderIcon>
                            <Icons.Briefcase />
                        </EmptyPlaceholderIcon>
                        <EmptyPlaceholderContent>
                            <EmptyPlaceholderTitle>
                                No corporate orders yet
                            </EmptyPlaceholderTitle>
                            <EmptyPlaceholderDescription>
                                Your placed corporate orders will appear here.
                                Use `Place New Order` to start your first bulk
                                apparel request.
                            </EmptyPlaceholderDescription>
                        </EmptyPlaceholderContent>
                    </EmptyPlaceholder>
                ) : (
                    <div className="space-y-4">
                        {initialData.map((order) => {
                            const paidInFull = order.balanceDuePaise === 0;

                            return (
                                <article
                                    key={order.id}
                                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                                >
                                    <div className="flex flex-col gap-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white p-5 md:flex-row md:items-start md:justify-between">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
                                                Corporate Order
                                            </p>
                                            <h3 className="mt-2 text-xl font-bold text-gray-900">
                                                {order.publicOrderId}
                                            </h3>
                                            <p className="mt-1 text-sm text-gray-500">
                                                {order.companyName} •{" "}
                                                {order.contactPersonName}
                                            </p>
                                            <p className="mt-1 text-xs text-gray-400">
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
                                                <Badge className="bg-green-600 text-white hover:bg-green-600">
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

                                    <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
                                        <div className="text-sm text-gray-500">
                                            {paidInFull
                                                ? "This order was collected with full payment upfront."
                                                : order.balancePaymentLink
                                                  ? "Your balance payment link is ready."
                                                  : "The remaining payment link will appear here once shared by Renivet."}
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <a
                                                href={`/api/corporate-orders/${order.id}/summary.pdf`}
                                                className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-semibold transition-colors hover:bg-accent hover:text-accent-foreground"
                                            >
                                                Download Summary
                                            </a>
                                            {order.balancePaymentLink &&
                                            order.balanceDuePaise > 0 ? (
                                                <a
                                                    href={order.balancePaymentLink}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex h-11 items-center justify-center rounded-md bg-[#2f3720] px-8 text-sm font-semibold text-white transition-colors hover:bg-[#252c18]"
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
        </div>
    );
}

function MetricCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                {label}
            </p>
            <p className="mt-2 text-lg font-semibold text-gray-900">{value}</p>
        </div>
    );
}
