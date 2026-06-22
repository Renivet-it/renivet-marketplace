"use client";

import { Button } from "@/components/ui/button-general";
import { formatINR } from "@/lib/utils";

export function CorporateOrderConfirmation({ data }: { data: any }) {
    const { order, settings } = data;

    return (
        <div className="rounded-[28px] border border-[#e7d7bb] bg-[linear-gradient(135deg,#fffaf1_0%,#f5ead7_55%,#efe1c4_100%)] p-6 shadow-[0_24px_70px_-48px_rgba(88,54,16,0.45)] md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8a6935]">
                Corporate Order Confirmed
            </p>
            <h1 className="mt-3 font-serif text-3xl font-semibold text-[#3e2a14] md:text-4xl">
                Thank you. Your corporate order has been received.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6c5737]">
                We have captured your 30% advance and shared the order with the
                Renivet operations team for review.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Card label="Order ID" value={order.publicOrderId} />
                <Card
                    label="Amount Paid"
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
                    className="bg-[#8d5b2f] text-white hover:bg-[#764825]"
                >
                    <a href={`/api/corporate-orders/${order.id}/summary.pdf`}>
                        Download Order Summary PDF
                    </a>
                </Button>
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
