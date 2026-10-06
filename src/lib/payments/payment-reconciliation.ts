import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
    orders,
    ordersIntent,
    paymentEventReceipts,
    productVariants,
    products,
} from "@/lib/db/schema";

export type PaymentBindingInput = {
    providerOrderId: string | null | undefined;
    expectedProviderOrderId: string | null | undefined;
    providerPaymentId: string | null | undefined;
    expectedPaymentId: string | null | undefined;
    providerAmountPaise: number | null | undefined;
    expectedAmountPaise: number | null | undefined;
    providerCurrency: string | null | undefined;
    expectedCurrency: string | null | undefined;
};

export type ReconciledPaymentBinding = {
    providerOrderId: string;
    providerPaymentId: string;
    amountPaise: number;
    currency: string;
};

export type AtomicPaymentTransitionInput = {
    eventType: "payment.captured" | "payment.failed";
    providerPaymentId: string;
    providerOrderId: string;
    orderId: string;
    orderIntentId?: string | null;
    amountPaise: number;
    currency: string;
    paymentMethod?: string | null;
    items: Array<{
        productId: string;
        variantId?: string | null;
        quantity: number;
        stockTracked: boolean;
    }>;
    amountProvenance: string;
    lookupSource: "provider_order_reference" | "legacy_payment_id";
};

export type AtomicPaymentTransitionResult = {
    duplicate: boolean;
    applied: boolean;
    receiptId: string;
    transactionAmountPaise: number;
    currency: string;
    amountProvenance: string;
};

export class PaymentReconciliationError extends Error {
    constructor(
        public readonly code:
            | "MISSING_IDENTITY"
            | "IDENTITY_MISMATCH"
            | "AMOUNT_MISMATCH"
            | "CURRENCY_MISMATCH"
            | "STOCK_UNAVAILABLE",
        message: string
    ) {
        super(message);
        this.name = "PaymentReconciliationError";
    }
}

export function resolveCanonicalPaymentOrderIds(input: {
    providerOrderMatches: string[];
    legacyPaymentIdMatches: string[];
}) {
    const providerOrderMatches = [...new Set(input.providerOrderMatches)];
    if (providerOrderMatches.length > 0) {
        return {
            orderIds: providerOrderMatches,
            source: "provider_order_reference" as const,
        };
    }

    const legacyPaymentIdMatches = [...new Set(input.legacyPaymentIdMatches)];
    if (legacyPaymentIdMatches.length === 1) {
        return {
            orderIds: legacyPaymentIdMatches,
            source: "legacy_payment_id" as const,
        };
    }

    throw new PaymentReconciliationError(
        "IDENTITY_MISMATCH",
        legacyPaymentIdMatches.length === 0
            ? "Payment is not bound to a server order."
            : "Payment identity is ambiguous across multiple server orders."
    );
}

export function toAuthoritativeTransactionAmount(input: {
    providerAmountPaise: number;
    orderTotalRupees: number;
    currency: string;
}) {
    if (!Number.isInteger(input.providerAmountPaise)) {
        throw new PaymentReconciliationError(
            "AMOUNT_MISMATCH",
            "Provider amount must be an integer minor-unit value."
        );
    }

    if (input.currency !== "INR") {
        throw new PaymentReconciliationError(
            "CURRENCY_MISMATCH",
            "Only INR payment amounts are supported."
        );
    }

    const expectedAmountPaise = Math.round(input.orderTotalRupees * 100);
    if (input.providerAmountPaise !== expectedAmountPaise) {
        throw new PaymentReconciliationError(
            "AMOUNT_MISMATCH",
            "Provider amount does not match the server order total."
        );
    }

    return {
        transactionAmountPaise: input.providerAmountPaise,
        currency: input.currency,
        amountProvenance: "provider_verified_against_legacy_order_total" as const,
    };
}

export async function applyAtomicPaymentTransition(
    input: AtomicPaymentTransitionInput
): Promise<AtomicPaymentTransitionResult> {
    return db.transaction(async (tx) => {
        const receiptValues = {
            eventType: input.eventType,
            providerPaymentId: input.providerPaymentId,
            providerOrderId: input.providerOrderId,
            orderId: input.orderId,
            orderIntentId: input.orderIntentId ?? null,
            amountPaise: input.amountPaise,
            currency: input.currency,
            metadata: {
                amountProvenance: input.amountProvenance,
                lookupSource: input.lookupSource,
            },
        };

        const [inserted] = await tx
            .insert(paymentEventReceipts)
            .values(receiptValues)
            .onConflictDoNothing({
                target: [
                    paymentEventReceipts.provider,
                    paymentEventReceipts.eventType,
                    paymentEventReceipts.providerPaymentId,
                    paymentEventReceipts.orderId,
                ],
            })
            .returning();

        let receipt = inserted;
        if (!receipt) {
            const [existing] = await tx
                .select()
                .from(paymentEventReceipts)
                .where(
                    and(
                        eq(paymentEventReceipts.provider, "razorpay"),
                        eq(
                            paymentEventReceipts.eventType,
                            input.eventType
                        ),
                        eq(
                            paymentEventReceipts.providerPaymentId,
                            input.providerPaymentId
                        ),
                        eq(paymentEventReceipts.orderId, input.orderId)
                    )
                )
                .limit(1);

            if (!existing) {
                throw new PaymentReconciliationError(
                    "IDENTITY_MISMATCH",
                    "Payment receipt could not be claimed."
                );
            }

            if (existing.status === "applied") {
                return {
                    duplicate: true,
                    applied: true,
                    receiptId: existing.id,
                    transactionAmountPaise: existing.amountPaise,
                    currency: existing.currency,
                    amountProvenance:
                        typeof existing.metadata?.amountProvenance ===
                        "string"
                            ? existing.metadata.amountProvenance
                            : "receipt",
                };
            }

            const [reopened] = await tx
                .update(paymentEventReceipts)
                .set({
                    status: "received",
                    appliedAt: null,
                    updatedAt: new Date(),
                    metadata: receiptValues.metadata,
                })
                .where(eq(paymentEventReceipts.id, existing.id))
                .returning();
            receipt = reopened;
        }

        const [currentOrder] = await tx
            .select({
                id: orders.id,
                paymentStatus: orders.paymentStatus,
            })
            .from(orders)
            .where(eq(orders.id, input.orderId))
            .limit(1);

        if (!currentOrder) {
            throw new PaymentReconciliationError(
                "IDENTITY_MISMATCH",
                "Payment order no longer exists."
            );
        }

        if (currentOrder.paymentStatus === "paid") {
            const [applied] = await tx
                .update(paymentEventReceipts)
                .set({
                    status: "applied",
                    appliedAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(paymentEventReceipts.id, receipt.id))
                .returning();

            return {
                duplicate: true,
                applied: true,
                receiptId: applied.id,
                transactionAmountPaise: input.amountPaise,
                currency: input.currency,
                amountProvenance: input.amountProvenance,
            };
        }

        if (input.eventType === "payment.captured") {
            for (const item of input.items) {
                if (!item.stockTracked) continue;

                const updated = item.variantId
                    ? await tx
                          .update(productVariants)
                          .set({
                              quantity: sql`${productVariants.quantity} - ${item.quantity}`,
                              updatedAt: new Date(),
                          })
                          .where(
                              and(
                                  eq(productVariants.id, item.variantId),
                                  sql`${productVariants.quantity} >= ${item.quantity}`
                              )
                          )
                          .returning({ id: productVariants.id })
                    : await tx
                          .update(products)
                          .set({
                              quantity: sql`${products.quantity} - ${item.quantity}`,
                              updatedAt: new Date(),
                          })
                          .where(
                              and(
                                  eq(products.id, item.productId),
                                  sql`${products.quantity} IS NOT NULL`,
                                  sql`${products.quantity} >= ${item.quantity}`
                              )
                          )
                          .returning({ id: products.id });

                if (updated.length !== 1) {
                    throw new PaymentReconciliationError(
                        "STOCK_UNAVAILABLE",
                        "Stock is unavailable for the payment transition."
                    );
                }
            }
        }

        const [updatedOrder] = await tx
            .update(orders)
            .set({
                paymentId: input.providerPaymentId,
                paymentMethod: input.paymentMethod ?? undefined,
                paymentStatus:
                    input.eventType === "payment.captured" ? "paid" : "failed",
                status:
                    input.eventType === "payment.captured"
                        ? "processing"
                        : "pending",
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(orders.id, input.orderId),
                    ne(orders.paymentStatus, "paid")
                )
            )
            .returning({ id: orders.id });

        if (!updatedOrder) {
            throw new PaymentReconciliationError(
                "IDENTITY_MISMATCH",
                "Payment order transition was not applied."
            );
        }

        if (input.orderIntentId) {
            await tx
                .update(ordersIntent)
                .set({
                    paymentId: input.providerPaymentId,
                    paymentStatus:
                        input.eventType === "payment.captured"
                            ? "paid"
                            : "failed",
                    updatedAt: new Date(),
                })
                .where(eq(ordersIntent.id, input.orderIntentId));
        }

        const [applied] = await tx
            .update(paymentEventReceipts)
            .set({
                status: "applied",
                appliedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(paymentEventReceipts.id, receipt.id))
            .returning();

        return {
            duplicate: false,
            applied: true,
            receiptId: applied.id,
            transactionAmountPaise: input.amountPaise,
            currency: input.currency,
            amountProvenance: input.amountProvenance,
        };
    });
}

export function reconcilePaymentBinding(
    input: PaymentBindingInput
): ReconciledPaymentBinding {
    if (
        !input.providerOrderId ||
        !input.providerPaymentId ||
        !input.expectedProviderOrderId ||
        input.providerAmountPaise == null ||
        input.expectedAmountPaise == null ||
        !input.providerCurrency ||
        !input.expectedCurrency
    ) {
        throw new PaymentReconciliationError(
            "MISSING_IDENTITY",
            "Payment identity, amount, and currency are required."
        );
    }

    if (
        input.providerOrderId !== input.expectedProviderOrderId ||
        (input.expectedPaymentId &&
            input.providerPaymentId !== input.expectedPaymentId)
    ) {
        throw new PaymentReconciliationError(
            "IDENTITY_MISMATCH",
            "Provider payment identity does not match the server binding."
        );
    }

    if (input.providerAmountPaise !== input.expectedAmountPaise) {
        throw new PaymentReconciliationError(
            "AMOUNT_MISMATCH",
            "Provider payment amount does not match the server amount."
        );
    }

    if (input.providerCurrency !== input.expectedCurrency) {
        throw new PaymentReconciliationError(
            "CURRENCY_MISMATCH",
            "Provider payment currency does not match the server currency."
        );
    }

    return {
        providerOrderId: input.providerOrderId,
        providerPaymentId: input.providerPaymentId,
        amountPaise: input.providerAmountPaise,
        currency: input.providerCurrency,
    };
}
