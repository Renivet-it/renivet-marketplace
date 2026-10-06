// File: /actions/process-order-after-payment.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { orderQueries, productQueries } from "@/lib/db/queries";
import {
    applyAtomicPaymentTransition,
    reconcilePaymentBinding,
    toAuthoritativeTransactionAmount,
} from "@/lib/payments/payment-reconciliation";
import { razorpay } from "@/lib/razorpay";

export async function processOrderAfterPayment({
    orderDetails,
    paymentId,
    orderIntentId,
}: {
    orderDetails: {
        razorpayOrderId: string;
        items: Array<{
            productId: string;
            variantId: string | null;
            sku: any;
            quantity: number;
            categoryId: string;
            price: number;
            brandId: string;
        }>;
    };
    paymentId: string;
    orderIntentId: string;
}) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const candidateIds = await orderQueries.getOrderIdsByProviderOrderId(
        orderDetails.razorpayOrderId
    );
    const candidateOrders = (
        await Promise.all(
            candidateIds.map(({ id }) => orderQueries.getOrderById(id))
        )
    ).filter((order): order is NonNullable<typeof order> => !!order);
    const existingOrder = candidateOrders.find(
        (order) =>
            order.userId === userId &&
            order.items.some((item) =>
                orderDetails.items.some(
                    (requested) => requested.productId === item.product.id
                )
            )
    );

    if (!existingOrder) throw new Error("Order not found");

    const providerPayment = await razorpay.payments.fetch(paymentId);
    const reconciledPayment = reconcilePaymentBinding({
        providerOrderId: providerPayment.order_id,
        expectedProviderOrderId:
            existingOrder.providerOrderId ?? providerPayment.order_id,
        providerPaymentId: providerPayment.id,
        expectedPaymentId: existingOrder.paymentId,
        providerAmountPaise: Number(providerPayment.amount),
        expectedAmountPaise: Math.round(existingOrder.totalAmount * 100),
        providerCurrency: providerPayment.currency,
        expectedCurrency: "INR",
    });
    const amount = toAuthoritativeTransactionAmount({
        providerAmountPaise: reconciledPayment.amountPaise,
        orderTotalRupees: existingOrder.totalAmount,
        currency: reconciledPayment.currency,
    });

    const transition = await applyAtomicPaymentTransition({
        eventType: "payment.captured",
        providerPaymentId: reconciledPayment.providerPaymentId,
        providerOrderId: reconciledPayment.providerOrderId,
        orderId: existingOrder.id,
        orderIntentId,
        amountPaise: amount.transactionAmountPaise,
        currency: amount.currency,
        amountProvenance: amount.amountProvenance,
        lookupSource: "provider_order_reference",
        paymentMethod: "razorpay",
        items: existingOrder.items.map((item) => ({
            productId: item.product.id,
            variantId: item.variant?.id ?? null,
            quantity: item.quantity,
            stockTracked: Boolean(
                item.variant?.quantity != null || item.product.quantity != null
            ),
        })),
    });

    if (!transition.duplicate) {
        for (const item of orderDetails.items) {
            await productQueries.trackPurchase(item.productId, item.brandId, userId);
        }
    }

    return {
        ...transition,
        transactionAmountPaise: amount.transactionAmountPaise,
        currency: amount.currency,
        amountProvenance: amount.amountProvenance,
    };
}
