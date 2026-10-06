import crypto from "crypto";
import { NextRequest } from "next/server";
import { env } from "@/../env";
import { BRAND_EVENTS } from "@/config/brand";
import { orderQueries, refundQueries } from "@/lib/db/queries";
import {
    applyAtomicPaymentBatch,
    PaymentReconciliationError,
    reconcilePaymentBinding,
    resolveCanonicalPaymentOrderIds,
    toAuthoritativeTransactionAmount,
} from "@/lib/payments/payment-reconciliation";
import { analytics, revenue, userCache } from "@/lib/redis/methods";
import { resend } from "@/lib/resend";
import {
    OrderPlaced,
    OrderPlaceFailed,
} from "@/lib/resend/emails";
import {
    AppError,
    convertPaiseToRupees,
    CResponse,
    formatPriceTag,
    handleError,
} from "@/lib/utils";
import { razorpayPaymentWebhookSchema } from "@/lib/validations";
import { razorpay } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const signature = req.headers.get("x-razorpay-signature");

        if (!validateWebhookSignature(body, signature, env.RAZOR_PAY_WEBHOOK_SECRET)) {
            throw new AppError("Invalid signature", "BAD_REQUEST");
        }

        const payload = razorpayPaymentWebhookSchema.parse(JSON.parse(body));
        const paymentEntity = payload.payload.payment.entity;
        const providerOrderMatches = await orderQueries.getOrderIdsByProviderOrderId(
            paymentEntity.order_id
        );
        const legacyPaymentMatches = await orderQueries.getOrderIdsByPaymentId(
            paymentEntity.id
        );
        const resolved = resolveCanonicalPaymentOrderIds({
            providerOrderMatches: providerOrderMatches.map((row) => row.id),
            legacyPaymentIdMatches: legacyPaymentMatches.map((row) => row.id),
        });

        const prepared = [];
        for (const orderId of resolved.orderIds) {
            const existingOrder = await orderQueries.getOrderById(orderId);
            if (!existingOrder) {
                throw new AppError("Order not found", "NOT_FOUND");
            }

            const expectedProviderOrderId =
                existingOrder.providerOrderId ?? paymentEntity.order_id;
            const reconciledPayment = reconcilePaymentBinding({
                providerOrderId: paymentEntity.order_id,
                expectedProviderOrderId,
                providerPaymentId: paymentEntity.id,
                expectedPaymentId: existingOrder.paymentId,
                providerAmountPaise: paymentEntity.amount,
                expectedAmountPaise: Math.round(existingOrder.totalAmount * 100),
                providerCurrency: paymentEntity.currency,
                expectedCurrency: "INR",
            });
            const amount = toAuthoritativeTransactionAmount({
                providerAmountPaise: reconciledPayment.amountPaise,
                orderTotalRupees: existingOrder.totalAmount,
                currency: reconciledPayment.currency,
            });

            prepared.push({
                existingOrder,
                amount,
                transitionInput: {
                    eventType: payload.event as
                        | "payment.captured"
                        | "payment.failed",
                    providerPaymentId: reconciledPayment.providerPaymentId,
                    providerOrderId: reconciledPayment.providerOrderId,
                    orderId: existingOrder.id,
                    amountPaise: amount.transactionAmountPaise,
                    currency: amount.currency,
                    amountProvenance: amount.amountProvenance,
                    lookupSource: resolved.source,
                    paymentMethod: paymentEntity.method,
                    items: existingOrder.items.map((item) => ({
                        productId: item.product.id,
                        variantId: item.variant?.id ?? null,
                        quantity: item.quantity,
                        stockTracked: Boolean(
                            item.variant?.quantity != null ||
                                item.product.quantity != null
                        ),
                    })),
                },
            });
        }

        let transitions;
        try {
            transitions = await applyAtomicPaymentBatch(
                prepared.map(({ transitionInput }) => transitionInput)
            );
        } catch (error) {
            if (
                payload.event === "payment.captured" &&
                error instanceof PaymentReconciliationError &&
                error.code === "STOCK_UNAVAILABLE" &&
                prepared[0]
            ) {
                await refundForUnavailableStock({
                    existingOrder: prepared[0].existingOrder,
                    paymentId: paymentEntity.id,
                    amount: paymentEntity.amount,
                    paymentMethod: paymentEntity.method,
                });
                return CResponse({
                    message: "Payment refunded because stock was unavailable",
                    refunded: true,
                });
            }
            throw error;
        }

        const outcomes = prepared.map((entry, index) => ({
            ...entry,
            transition: transitions[index],
        }));

        for (const { existingOrder, transition, amount } of outcomes) {
            if (transition.duplicate) continue;
            await emitPaymentEffects({
                existingOrder,
                paymentId: paymentEntity.id,
                amountPaise: amount.transactionAmountPaise,
                event: payload.event,
            });
        }

        return CResponse({
            message: "OK",
            duplicate: outcomes.every(({ transition }) => transition.duplicate),
            transactionAmountPaise: outcomes[0]?.amount.transactionAmountPaise,
            currency: outcomes[0]?.amount.currency,
            amountProvenance: outcomes[0]?.amount.amountProvenance,
        });
    } catch (error) {
        return handleError(error);
    }
}

async function refundForUnavailableStock({
    existingOrder,
    paymentId,
    amount,
    paymentMethod,
}: {
    existingOrder: NonNullable<Awaited<ReturnType<typeof orderQueries.getOrderById>>>;
    paymentId: string;
    amount: number;
    paymentMethod?: string | null;
}) {
    const refund = await razorpay.payments.refund(paymentId, { amount });
    await refundQueries.recordRefundEvent({
        refundId: refund.id,
        gatewayRefundId: refund.id,
        userId: existingOrder.userId,
        orderId: existingOrder.id,
        paymentId,
        amount,
        status: "pending",
        paymentMethod,
        orderStatus: "cancelled",
        cancellationReasonCode: "OUT_OF_STOCK",
        manualOverrideReason: "Payment captured after stock became unavailable",
    });
}

async function emitPaymentEffects({
    existingOrder,
    paymentId,
    amountPaise,
    event,
}: {
    existingOrder: Awaited<ReturnType<typeof orderQueries.getOrderById>>;
    paymentId: string;
    amountPaise: number;
    event: string;
}) {
    if (!existingOrder) return;

    const user = await userCache.get(existingOrder.userId);
    if (user && event === "payment.captured") {
        await resend.emails.send({
            from: env.RESEND_EMAIL_FROM,
            to: user.email,
            subject: "Order Placed Successfully",
            react: OrderPlaced({
                user: { name: `${user.firstName} ${user.lastName}` },
                order: {
                    id: existingOrder.id,
                    shipmentId: existingOrder.shipments?.[0]?.id || "",
                    awb: existingOrder.shipments?.[0]?.awbNumber || "",
                    amount: existingOrder.totalAmount,
                    items: existingOrder.items.map((item) => ({
                        title: item.product.title,
                        slug: item.product.slug,
                        quantity: item.quantity,
                        price: item.variant?.price || item.product.price || 0,
                    })),
                },
            }),
        });
    }

    if (user && event === "payment.failed") {
        await resend.emails.send({
            from: env.RESEND_EMAIL_FROM,
            to: user.email,
            subject: "Order Payment Failed",
            react: OrderPlaceFailed({
                user: { name: `${user.firstName} ${user.lastName}` },
                order: { id: existingOrder.id, amount: existingOrder.totalAmount },
            }),
        });
    }

    const uniqueBrandIds = [
        ...new Set(existingOrder.items.map((item) => item.product.brandId)),
    ];
    await Promise.all(
        uniqueBrandIds.map(async (brandId) => {
            const brandItems = existingOrder.items.filter(
                (item) => item.product.brandId === brandId
            );
            const brandRevenue = brandItems.reduce(
                (total, item) =>
                    total +
                    (item.variant?.price || item.product.price || 0) *
                        item.quantity,
                0
            );

            if (event === "payment.captured") {
                await analytics.track({
                    namespace: BRAND_EVENTS.PAYMENT.SUCCESS,
                    brandId,
                    event: {
                        orderId: existingOrder.id,
                        paymentId,
                        totalAmount: formatPriceTag(amountPaise, true),
                        brandRevenue: formatPriceTag(
                            +convertPaiseToRupees(brandRevenue),
                            true
                        ),
                        items: brandItems.map((item) => ({
                            productId: item.product.id,
                            quantity: item.quantity,
                            variantId: item.variant?.id,
                            price: formatPriceTag(
                                +convertPaiseToRupees(
                                    item.variant?.price || item.product.price || 0
                                ),
                                true
                            ),
                        })),
                    },
                });
            }

            await revenue.track(brandId, {
                type: "payment",
                amount: amountPaise,
                orderId: existingOrder.id,
                paymentId,
                success: event === "payment.captured",
            });
        })
    );
}

function validateWebhookSignature(
    body: string,
    signature: string | null,
    secret: string | undefined
): boolean {
    if (!signature || !secret) return false;

    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");

    return (
        signature.length === expectedSignature.length &&
        crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        )
    );
}
