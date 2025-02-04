import crypto from "crypto";
import { env } from "@/../env";
import { BRAND_EVENTS } from "@/config/brand";
import { orderQueries, refundQueries } from "@/lib/db/queries";
import { analytics, revenue, userCache } from "@/lib/redis/methods";
import { resend } from "@/lib/resend";
import { OrderRefundFailed, OrderRefundProcessed } from "@/lib/resend/emails";
import {
    AppError,
    convertPaiseToRupees,
    CResponse,
    formatPriceTag,
    handleError,
} from "@/lib/utils";
import { razorPayRefundWebhookSchema } from "@/lib/validations";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const signature = req.headers.get("x-razorpay-signature");

        const secret = env.RAZOR_PAY_WEBHOOK_SECRET;

        const isValid = validateWebhookSignature(body, signature, secret);
        if (!isValid) throw new AppError("Invalid signature", "BAD_REQUEST");

        const payload = razorPayRefundWebhookSchema.parse(JSON.parse(body));

        const orderId = payload.payload.payment.entity.order_id;

        const existingOrder = await orderQueries.getOrderById(orderId);
        if (!existingOrder) throw new AppError("Order not found", "NOT_FOUND");

        switch (payload.event) {
            case "refund.processed":
                {
                    await Promise.all([
                        orderQueries.updateOrderStatus(existingOrder.id, {
                            paymentId: payload.payload.payment.entity.id,
                            paymentMethod:
                                payload.payload.payment.entity.method,
                            paymentStatus: "refunded",
                            status: "cancelled",
                        }),
                        refundQueries.updateRefundStatus(
                            payload.payload.refund.entity.id,
                            payload.payload.refund.entity.status
                        ),
                    ]);

                    const uniqueBrandIds = [
                        ...new Set(
                            existingOrder.items.map(
                                (item) => item.product.brandId
                            )
                        ),
                    ];

                    await Promise.all(
                        uniqueBrandIds.map((brandId) => {
                            const brandItems = existingOrder.items.filter(
                                (item) => item.product.brandId === brandId
                            );

                            const brandRevenue = brandItems.reduce(
                                (total, item) => {
                                    const itemPrice =
                                        item.variant?.price ||
                                        item.product.price ||
                                        0;
                                    return total + itemPrice * item.quantity;
                                },
                                0
                            );

                            analytics.track({
                                namespace: BRAND_EVENTS.REFUND.COMPLETED,
                                brandId,
                                event: {
                                    orderId: existingOrder.id,
                                    refundId: payload.payload.refund.entity.id,
                                    paymentId:
                                        payload.payload.payment.entity.id,
                                    amount: formatPriceTag(
                                        +convertPaiseToRupees(
                                            payload.payload.refund.entity.amount
                                        ),
                                        true
                                    ),
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
                                                item.variant?.price ||
                                                    item.product.price ||
                                                    0
                                            ),
                                            true
                                        ),
                                    })),
                                },
                            });

                            revenue.track(brandId, {
                                type: "refund",
                                amount: payload.payload.refund.entity.amount,
                                orderId: existingOrder.id,
                                paymentId: payload.payload.payment.entity.id,
                                refundId: payload.payload.refund.entity.id,
                                success: true,
                            });
                        })
                    );

                    const existingUser = await userCache.get(
                        existingOrder.userId
                    );
                    if (existingUser) {
                        await resend.emails.send({
                            from: env.RESEND_EMAIL_FROM,
                            to: existingUser.email,
                            subject: "Refund Processed Successfully",
                            react: OrderRefundProcessed({
                                user: {
                                    name: `${existingUser.firstName} ${existingUser.lastName}`,
                                },
                                order: {
                                    id: existingOrder.id,
                                    amount: payload.payload.refund.entity
                                        .amount,
                                },
                            }),
                        });
                    }
                }
                break;

            case "refund.failed":
                {
                    await Promise.all([
                        orderQueries.updateOrderStatus(existingOrder.id, {
                            paymentId: payload.payload.payment.entity.id,
                            paymentMethod:
                                payload.payload.payment.entity.method,
                            paymentStatus: "refund_failed",
                            status: "cancelled",
                        }),
                        refundQueries.updateRefundStatus(
                            payload.payload.refund.entity.id,
                            payload.payload.refund.entity.status
                        ),
                    ]);

                    const uniqueBrandIds = [
                        ...new Set(
                            existingOrder.items.map(
                                (item) => item.product.brandId
                            )
                        ),
                    ];

                    await Promise.all(
                        uniqueBrandIds.map((brandId) => {
                            const brandItems = existingOrder.items.filter(
                                (item) => item.product.brandId === brandId
                            );

                            const brandRevenue = brandItems.reduce(
                                (total, item) => {
                                    const itemPrice =
                                        item.variant?.price ||
                                        item.product.price ||
                                        0;
                                    return total + itemPrice * item.quantity;
                                },
                                0
                            );

                            analytics.track({
                                namespace: BRAND_EVENTS.REFUND.FAILED,
                                brandId,
                                event: {
                                    orderId: existingOrder.id,
                                    refundId: payload.payload.refund.entity.id,
                                    paymentId:
                                        payload.payload.payment.entity.id,
                                    amount: formatPriceTag(
                                        +convertPaiseToRupees(
                                            payload.payload.refund.entity.amount
                                        ),
                                        true
                                    ),
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
                                                item.variant?.price ||
                                                    item.product.price ||
                                                    0
                                            ),
                                            true
                                        ),
                                    })),
                                },
                            });

                            revenue.track(brandId, {
                                type: "refund",
                                amount: payload.payload.refund.entity.amount,
                                orderId: existingOrder.id,
                                paymentId: payload.payload.payment.entity.id,
                                refundId: payload.payload.refund.entity.id,
                                success: false,
                            });
                        })
                    );

                    const existingUser = await userCache.get(
                        existingOrder.userId
                    );
                    if (existingUser) {
                        await resend.batch.send([
                            {
                                from: env.RESEND_EMAIL_FROM,
                                to: existingUser.email,
                                subject: "Refund Processing Failed",
                                react: OrderRefundFailed({
                                    user: {
                                        name: `${existingUser.firstName} ${existingUser.lastName}`,
                                    },
                                    order: {
                                        id: existingOrder.id,
                                        amount: payload.payload.refund.entity
                                            .amount,
                                    },
                                }),
                            },
                            {
                                from: env.RESEND_EMAIL_FROM,
                                to: env.RENIVET_EMAIL_1,
                                subject: "Refund Processing Failed",
                                react: OrderRefundFailed({
                                    user: {
                                        name: `${existingUser.firstName} ${existingUser.lastName}`,
                                    },
                                    order: {
                                        id: existingOrder.id,
                                        amount: payload.payload.refund.entity
                                            .amount,
                                    },
                                }),
                            },
                            {
                                from: env.RESEND_EMAIL_FROM,
                                to: env.RENIVET_EMAIL_2,
                                subject: "Refund Processing Failed",
                                react: OrderRefundFailed({
                                    user: {
                                        name: `${existingUser.firstName} ${existingUser.lastName}`,
                                    },
                                    order: {
                                        id: existingOrder.id,
                                        amount: payload.payload.refund.entity
                                            .amount,
                                    },
                                }),
                            },
                        ]);
                    }
                }
                break;
        }

        return CResponse({
            message: "OK",
        });
    } catch (err) {
        console.log(err);
        return handleError(err);
    }
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

    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}
