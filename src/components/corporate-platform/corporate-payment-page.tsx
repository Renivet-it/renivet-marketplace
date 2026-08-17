"use client";

import { initializeRazorpayPayment } from "@/lib/razorpay/payment";
import { formatINR } from "@/lib/utils";
import { CheckCircle2, CreditCard, Download, LockKeyhole } from "lucide-react";
import Script from "next/script";
import { useState } from "react";
import { toast } from "sonner";

export function CorporatePaymentPage({
    token,
    initialData,
}: {
    token: string;
    initialData: any;
}) {
    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(false);
    const [checkoutReady, setCheckoutReady] = useState(false);
    const unavailable = ["expired", "cancelled"].includes(data.status);
    const verifiedCollectedPaise = data.order.collectedPaise ?? 0;
    const balanceAfterPayment = Math.max(
        0,
        data.order.totalPaise -
            verifiedCollectedPaise -
            (data.status === "paid" ? 0 : data.amountPaise)
    );

    const pay = async () => {
        try {
            setLoading(true);
            const checkoutResponse = await fetch(
                `/api/corporate-payment-requests/${token}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "checkout" }),
                }
            );
            const checkout = await checkoutResponse.json();
            if (!checkoutResponse.ok) throw new Error(checkout.message);
            if (!(window as any).Razorpay)
                throw new Error(
                    "Secure checkout is still loading. Please try again."
                );

            initializeRazorpayPayment({
                key: checkout.key,
                amount: checkout.amount,
                currency: checkout.currency,
                name: checkout.name,
                description: checkout.description,
                order_id: checkout.orderId,
                prefill: {
                    name: data.order.contactPersonName,
                    email: data.order.emailAddress,
                    contact: data.order.mobileNumber,
                },
                theme: { color: "#26351f" },
                handler: async (response: any) => {
                    try {
                        const confirmedResponse = await fetch(
                            `/api/corporate-payment-requests/${token}`,
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                    action: "confirm",
                                    razorpayOrderId: response.razorpay_order_id,
                                    razorpayPaymentId:
                                        response.razorpay_payment_id,
                                    razorpaySignature:
                                        response.razorpay_signature,
                                }),
                            }
                        );
                        const confirmed = await confirmedResponse.json();
                        if (!confirmedResponse.ok)
                            throw new Error(confirmed.message);
                        setData(confirmed);
                        toast.success("Payment verified and receipt issued");
                    } catch (error) {
                        toast.error(
                            error instanceof Error
                                ? error.message
                                : "Payment verification failed"
                        );
                    } finally {
                        setLoading(false);
                    }
                },
                modal: { ondismiss: () => setLoading(false) },
            } as any);
        } catch (error) {
            setLoading(false);
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Unable to start payment"
            );
        }
    };

    return (
        <main className="min-h-[calc(100vh-8rem)] bg-slate-50 px-4 py-10 sm:py-14">
            <Script
                src="https://checkout.razorpay.com/v1/checkout.js"
                onLoad={() => setCheckoutReady(true)}
                onError={() =>
                    toast.error("Secure checkout could not be loaded")
                }
            />

            <section className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white shadow-sm">
                <header className="border-b border-slate-200 px-6 py-5">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-medium text-slate-500">
                                Corporate payment
                            </p>
                            <h1 className="mt-1 text-base font-semibold text-slate-950">
                                {data.order.publicOrderId}
                            </h1>
                        </div>
                        <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
                            <LockKeyhole className="size-3.5" />
                            Secure
                        </div>
                    </div>
                </header>

                <div className="p-6">
                    {data.status === "paid" ? (
                        <StatusMessage
                            icon={<CheckCircle2 className="size-5" />}
                            title="Payment received"
                            text="Payment verified. Your receipt is ready."
                            tone="success"
                        />
                    ) : unavailable ? (
                        <StatusMessage
                            title="Payment link unavailable"
                            text="Please contact Renivet for a new payment link."
                            tone="warning"
                        />
                    ) : (
                        <div className="mb-6">
                            <p className="text-xs text-slate-500">
                                Amount to pay
                            </p>
                            <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
                                {formatINR(data.amountPaise)}
                            </p>
                        </div>
                    )}

                    <dl className="divide-y divide-slate-100 border-y border-slate-200 text-sm">
                        <DetailRow
                            label="Company"
                            value={data.order.companyName}
                        />
                        <DetailRow
                            label="Payment for"
                            value={formatPaymentType(data.paymentType)}
                        />
                        <DetailRow
                            label="Order total"
                            value={formatINR(data.order.totalPaise)}
                        />
                        <DetailRow
                            label="Balance after payment"
                            value={formatINR(balanceAfterPayment)}
                        />
                    </dl>

                    <p className="mt-4 flex items-center gap-2 text-[11px] text-slate-500">
                        <LockKeyhole className="size-3.5 shrink-0" />
                        Secure payment processed by Razorpay
                    </p>

                    {data.status === "paid" && data.receiptUrl ? (
                        <a
                            href={data.receiptUrl}
                            className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#26351f] px-4 text-xs font-semibold text-white transition hover:bg-[#1d2918]"
                        >
                            <Download className="size-4" />
                            Download receipt
                        </a>
                    ) : (
                        <button
                            disabled={loading || unavailable || !checkoutReady}
                            onClick={pay}
                            className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#26351f] px-4 text-xs font-semibold text-white transition hover:bg-[#1d2918] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <CreditCard className="size-4" />
                            {loading
                                ? "Opening checkout..."
                                : !checkoutReady
                                  ? "Loading checkout..."
                                  : `Pay ${formatINR(data.amountPaise)}`}
                        </button>
                    )}
                </div>
            </section>
        </main>
    );
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="grid grid-cols-[120px_1fr] gap-4 py-3">
            <dt className="text-slate-500">{label}</dt>
            <dd className="text-right font-medium text-slate-900">{value}</dd>
        </div>
    );
}

function StatusMessage({
    icon,
    title,
    text,
    tone,
}: {
    icon?: React.ReactNode;
    title: string;
    text: string;
    tone: "success" | "warning";
}) {
    const colors =
        tone === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-amber-200 bg-amber-50 text-amber-800";

    return (
        <div className={`mb-5 rounded-md border px-4 py-3 ${colors}`}>
            <div className="flex items-center gap-2 text-sm font-semibold">
                {icon}
                {title}
            </div>
            <p className="mt-1 text-xs opacity-80">{text}</p>
        </div>
    );
}

function formatPaymentType(value: string) {
    return value
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
