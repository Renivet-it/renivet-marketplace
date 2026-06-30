"use client";

import { Button } from "@/components/ui/button-general";
import { initializeRazorpayPayment } from "@/lib/razorpay/payment";
import { trpc } from "@/lib/trpc/client";
import { formatINR } from "@/lib/utils";
import Script from "next/script";
import { toast } from "sonner";

function ensureRazorpaySdk() {
    return new Promise<void>((resolve, reject) => {
        if (typeof window === "undefined") {
            reject(new Error("Razorpay checkout is only available in the browser"));
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

export function CorporateOrderConfirmation({ data }: { data: any }) {
    const { order, settings } = data;
    const paidInFull = order.balanceDuePaise === 0;
    const createBalancePaymentOrder =
        trpc.general.corporateOrders.createBalancePaymentOrder.useMutation();
    const confirmBalancePayment =
        trpc.general.corporateOrders.confirmBalancePayment.useMutation();

    const payRemainingBalance = async () => {
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
                    window.location.reload();
                },
                modal: {
                    ondismiss: () => {
                        toast.message("Remaining balance payment cancelled");
                    },
                },
            } as any);
        } catch (error: any) {
            toast.error(error?.message || "Failed to open balance payment");
        }
    };

    return (
        <div className="rounded-[28px] border border-[#dbe5f0] bg-[linear-gradient(135deg,#ffffff_0%,#f5f9fd_55%,#edf4fb_100%)] p-6 shadow-[0_24px_70px_-48px_rgba(57,91,124,0.28)] md:p-8">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#5B9BD5]">
                Corporate Order Confirmed
            </p>
            <h1 className="mt-3 font-serif text-3xl font-semibold text-[#1f2937] md:text-4xl">
                Thank you. Your corporate order has been received.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#64748b]">
                We have captured your{" "}
                {paidInFull ? "full upfront payment" : "initial payment"} and
                shared the order with the Renivet operations team for review.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Card label="Order ID" value={order.publicOrderId} />
                <Card
                    label={paidInFull ? "Amount Paid" : "Initial Payment"}
                    value={formatINR(order.advancePaidPaise)}
                />
                <Card
                    label="Balance Due"
                    value={formatINR(order.balanceDuePaise)}
                />
                <Card
                    label="Expected Timeline"
                    value={settings.expectedTimelineText}
                />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
                <Button
                    asChild
                    className="bg-[#5B9BD5] text-white hover:bg-[#4A8BC5]"
                >
                    <a href={`/api/corporate-orders/${order.id}/summary.pdf`}>
                        Download Order Summary PDF
                    </a>
                </Button>
                <Button asChild variant="outline">
                    <a href="/profile/corporate-orders">View Corporate Orders</a>
                </Button>
                {!paidInFull ? (
                    <Button
                        onClick={payRemainingBalance}
                        className="bg-[#2f3720] text-white hover:bg-[#252c18]"
                    >
                        Pay Remaining Balance
                    </Button>
                ) : null}
                <Button asChild variant="outline">
                    <a href="/corporate-orders">Place Another Order</a>
                </Button>
            </div>
        </div>
    );
}

function Card({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-[#e1d1b3] bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8d6c3d]">
                {label}
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
        </div>
    );
}
