import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/../env";
import { db } from "@/lib/db";
import { corporatePaymentIntents } from "@/lib/db/schema";
import { razorpay } from "@/lib/razorpay";
import {
    CorporatePaymentIntegrityError,
    assertCorporatePaymentBinding,
    refundCorporatePaymentExcess,
} from "@/lib/services/corporate-payment-integrity";
import {
    markCorporatePaymentIntentApplied,
    reconcileCorporatePaymentIntent,
} from "@/lib/services/corporate-payment-reconciliation";
import { corporateDocumentService } from "@/lib/services/corporate-documents";
import { eq } from "drizzle-orm";

function hasValidWebhookSignature(
    body: string,
    receivedSignature: string | null
) {
    if (!receivedSignature) return false;
    const expected = crypto
        .createHmac("sha256", env.RAZOR_PAY_WEBHOOK_SECRET)
        .update(body)
        .digest("hex");
    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(receivedSignature);
    return (
        expectedBuffer.length === receivedBuffer.length &&
        crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    );
}

export async function POST(request: NextRequest) {
    const body = await request.text();
    if (!hasValidWebhookSignature(body, request.headers.get("x-razorpay-signature"))) {
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }

    let payload: {
        event?: string;
        payload?: { payment?: { entity?: Record<string, unknown> } };
    };
    try {
        payload = JSON.parse(body) as typeof payload;
    } catch {
        return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
    }

    const payment = payload.payload?.payment?.entity;
    if (!payment || !["payment.captured", "payment.failed"].includes(payload.event ?? "")) {
        return NextResponse.json({ received: true });
    }

    const providerOrderId = String(payment.order_id ?? "");
    const providerPaymentId = String(payment.id ?? "");
    const intent = await db.query.corporatePaymentIntents.findFirst({
        where: eq(corporatePaymentIntents.providerOrderId, providerOrderId),
    });
    if (!intent) {
        return NextResponse.json({ received: true, recovery: "unknown_intent" }, { status: 202 });
    }

    try {
        const providerPayment = await razorpay.payments.fetch(providerPaymentId);
        assertCorporatePaymentBinding({
            intentProviderOrderId: intent.providerOrderId ?? "",
            providerOrderId: String(providerPayment.order_id ?? providerOrderId),
            providerPaymentId: String(providerPayment.id ?? providerPaymentId),
            providerAmountPaise: Number(providerPayment.amount ?? payment.amount ?? -1),
            intentAmountPaise: intent.amountPaise,
            providerCurrency: String(providerPayment.currency ?? payment.currency ?? ""),
            intentCurrency: intent.currency,
            providerStatus: String(providerPayment.status ?? payment.status ?? ""),
        });
    } catch (error) {
        let refundedExcess = false;
        if (Number(payment.amount ?? 0) > intent.amountPaise) {
            try {
                await refundCorporatePaymentExcess({
                    intentId: intent.id,
                    providerPaymentId,
                    providerAmountPaise: Number(payment.amount),
                    intentAmountPaise: intent.amountPaise,
                    provider: razorpay,
                });
                refundedExcess = true;
            } catch {
                refundedExcess = false;
            }
        }
        await db
            .update(corporatePaymentIntents)
            .set({
                providerPaymentId,
                status: refundedExcess ? "refunded" : "recovery_required",
                rejectionCode:
                    error instanceof CorporatePaymentIntegrityError
                        ? error.code
                        : "provider_lookup_failed",
                updatedAt: new Date(),
            })
            .where(eq(corporatePaymentIntents.id, intent.id));
        return NextResponse.json({ received: true, recovery: "required" }, { status: 202 });
    }

    if (payload.event === "payment.captured") {
        try {
            const reconciliation = await reconcileCorporatePaymentIntent({
                intentId: intent.id,
                providerPaymentId,
                amountPaise: Number(payment.amount ?? -1),
            });
            if (!reconciliation.order || !reconciliation.payment) {
                return NextResponse.json(
                    { received: true, recovery: "required" },
                    { status: 202 }
                );
            }
            await corporateDocumentService.ensureReceiptVoucher(
                reconciliation.order.id,
                reconciliation.payment.id
            );
            await corporateDocumentService.ensureProformaInvoiceForOrder(
                reconciliation.order.id
            );
            await markCorporatePaymentIntentApplied(intent.id);
        } catch {
            await db
                .update(corporatePaymentIntents)
                .set({
                    providerPaymentId,
                    status: "recovery_required",
                    rejectionCode: "finalization_failed",
                    updatedAt: new Date(),
                })
                .where(eq(corporatePaymentIntents.id, intent.id));
            return NextResponse.json(
                { received: true, recovery: "required" },
                { status: 202 }
            );
        }
    } else {
        await db
            .update(corporatePaymentIntents)
            .set({
                providerPaymentId,
                status: "rejected",
                updatedAt: new Date(),
            })
            .where(eq(corporatePaymentIntents.id, intent.id));
    }

    return NextResponse.json({ received: true });
}
