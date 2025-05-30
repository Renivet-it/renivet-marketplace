// import crypto from "crypto";
// import { env } from "@/../env";
// import { BRAND_EVENTS } from "@/config/brand";
// import { db } from "@/lib/db";
// import { orderQueries, productQueries, refundQueries } from "@/lib/db/queries";
// import { orderShipments } from "@/lib/db/schema";
// import { razorpay } from "@/lib/razorpay";
// import { analytics, revenue, userCache } from "@/lib/redis/methods";
// import { resend } from "@/lib/resend";
// import {
//     OrderPlaced,
//     OrderPlaceFailed,
//     OrderRefundInitiated,
// } from "@/lib/resend/emails";
// import { shiprocket } from "@/lib/shiprocket";
// import {
//     AppError,
//     convertPaiseToRupees,
//     CResponse,
//     formatPriceTag,
//     handleError,
// } from "@/lib/utils";
// import { razorpayPaymentWebhookSchema } from "@/lib/validations";
// import { eq } from "drizzle-orm";
// import { NextRequest } from "next/server";

// export async function POST(req: NextRequest) {
//     try {
//         const body = await req.text();
//         const signature = req.headers.get("x-razorpay-signature");

//         const secret = env.RAZOR_PAY_WEBHOOK_SECRET;

//         const isValid = validateWebhookSignature(body, signature, secret);
//         if (!isValid) throw new AppError("Invalid signature", "BAD_REQUEST");

//         const payload = razorpayPaymentWebhookSchema.parse(JSON.parse(body));

//         const orderId = payload.payload.payment.entity.order_id;

//         const existingOrder = await orderQueries.getOrderById(orderId);
//         if (!existingOrder) throw new AppError("Order not found", "NOT_FOUND");

//         switch (payload.event) {
//             case "payment.captured":
//                 {
//                     const isStockAvailable = existingOrder.items.every(
//                         (item) => {
//                             const quantity = item.quantity;

//                             return (
//                                 item.product.verificationStatus ===
//                                     "approved" &&
//                                 !item.product.isDeleted &&
//                                 item.product.isAvailable &&
//                                 (!!item.product.quantity
//                                     ? item.product.quantity >= quantity
//                                     : true) &&
//                                 (!item.variant ||
//                                     (item.variant &&
//                                         !item.variant.isDeleted &&
//                                         item.variant.quantity >= quantity))
//                             );
//                         }
//                     );

//                     const uniqueBrandIds = [
//                         ...new Set(
//                             existingOrder.items.map(
//                                 (item) => item.product.brandId
//                             )
//                         ),
//                     ];

//                     if (!isStockAvailable) {
//                         await orderQueries.updateOrderStatus(existingOrder.id, {
//                             paymentId: payload.payload.payment.entity.id,
//                             paymentMethod:
//                                 payload.payload.payment.entity.method,
//                             paymentStatus: "refund_pending",
//                             status: "cancelled",
//                         });

//                         const rzpRefund = await razorpay.payments.refund(
//                             payload.payload.payment.entity.id,
//                             {
//                                 amount: payload.payload.payment.entity.amount,
//                             }
//                         );

//                         await refundQueries.createRefund({
//                             id: rzpRefund.id,
//                             userId: existingOrder.userId,
//                             orderId: existingOrder.id,
//                             paymentId: payload.payload.payment.entity.id,
//                             status: "pending",
//                             amount: payload.payload.payment.entity.amount,
//                         });

//                         const existingUser = await userCache.get(
//                             existingOrder.userId
//                         );

//                         if (existingUser) {
//                             await resend.emails.send({
//                                 from: env.RESEND_EMAIL_FROM,
//                                 to: existingUser.email,
//                                 subject: "Order Refund Initiated",
//                                 react: OrderRefundInitiated({
//                                     user: {
//                                         name: `${existingUser.firstName} ${existingUser.lastName}`,
//                                     },
//                                     order: {
//                                         id: existingOrder.id,
//                                         amount: existingOrder.totalAmount,
//                                     },
//                                 }),
//                             });
//                         }

//                         await Promise.all(
//                             uniqueBrandIds.map((brandId) => {
//                                 const brandItems = existingOrder.items.filter(
//                                     (item) => item.product.brandId === brandId
//                                 );

//                                 const brandRevenue = brandItems.reduce(
//                                     (total, item) => {
//                                         const itemPrice =
//                                             item.variant?.price ||
//                                             item.product.price ||
//                                             0;
//                                         return (
//                                             total + itemPrice * item.quantity
//                                         );
//                                     },
//                                     0
//                                 );

//                                 return analytics.track({
//                                     namespace: BRAND_EVENTS.REFUND.CREATED,
//                                     brandId,
//                                     event: {
//                                         orderId: existingOrder.id,
//                                         paymentId:
//                                             payload.payload.payment.entity.id,
//                                         totalAmount: formatPriceTag(
//                                             payload.payload.payment.entity
//                                                 .amount,
//                                             true
//                                         ),
//                                         brandRevenue: formatPriceTag(
//                                             +convertPaiseToRupees(brandRevenue),
//                                             true
//                                         ),
//                                         items: brandItems.map((item) => ({
//                                             productId: item.product.id,
//                                             quantity: item.quantity,
//                                             variantId: item.variant?.id,
//                                             price: formatPriceTag(
//                                                 +convertPaiseToRupees(
//                                                     item.variant?.price ||
//                                                         item.product.price ||
//                                                         0
//                                                 ),
//                                                 true
//                                             ),
//                                         })),
//                                         reason: "Insufficient stock",
//                                     },
//                                 });
//                             })
//                         );

//                         throw new Error(
//                             "Insufficient stock for one or more items"
//                         );
//                     }

//                     const updateProductStockData = existingOrder.items.map(
//                         (item) => {
//                             const quantity = item.quantity;
//                             const stock = !!item.variant
//                                 ? item.variant.quantity
//                                 : item.product.quantity || 0;

//                             const updatedQuantity = stock - quantity;
//                             return {
//                                 productId: item.product.id,
//                                 variantId: item.variant?.id,
//                                 quantity: updatedQuantity,
//                             };
//                         }
//                     );

//                     await productQueries.updateProductStock(
//                         updateProductStockData
//                     );

//                     await orderQueries.updateOrderStatus(existingOrder.id, {
//                         paymentId: payload.payload.payment.entity.id,
//                         paymentMethod: payload.payload.payment.entity.method,
//                         paymentStatus: "paid",
//                         status: "processing",
//                     });

//                     // Process Shiprocket orders for each brand
//                     const sr = await shiprocket();
//                     const shipments = existingOrder.shipments;

//                     for (const shipment of shipments) {
//                         try {
//                             // Generate AWB
//                             const awbResult = await sr.generateAWB({
//                                 shipment_id: shipment.shiprocketShipmentId!,
//                             });
//                             if (!awbResult.status)
//                                 throw new AppError(
//                                     `Failed to generate AWB for shipment ${shipment.id}`,
//                                     "BAD_REQUEST"
//                                 );

//                             // Generate label
//                             const labelResult = await sr.generateLabel({
//                                 shipment_id: [shipment.shiprocketShipmentId!],
//                             });

//                             // Generate invoice
//                             const invoiceResult = await sr.generateInvoice({
//                                 ids: [shipment.shiprocketOrderId!],
//                             });

//                             // Schedule pickup
//                             const pickupResult = await sr.shipmentPickup({
//                                 shipment_id: shipment.shiprocketShipmentId!,
//                             });

//                             // Generate manifest
//                             const manifestResult = await sr.generateManifest({
//                                 shipment_id: [shipment.shiprocketShipmentId!],

//                             });

//                             // Update shipment details in database
//                             await db
//                                 .update(orderShipments)
//                                 .set({
//                                     awbNumber: (awbResult as any)?.data?.data?.awb_code, // Type assertion to bypass TS error
//                                     status: "processing",
//                                     labelUrl: labelResult.data,
//                                     invoiceUrl: invoiceResult.data,
//                                     manifestUrl: manifestResult.data,
//                                     isPickupScheduled: true,
//                                     pickupTokenNumber:
//                                         pickupResult.data?.pickup_token_number,
//                                 })
//                                 .where(eq(orderShipments.id, shipment.id));
//                         } catch (error) {
//                             console.error(error);
//                             throw new AppError(
//                                 `Error processing shipment ${shipment.id}`,
//                                 "BAD_REQUEST"
//                             );
//                         }
//                     }

//                     // Send order confirmation email
//                     const existingUser = await userCache.get(
//                         existingOrder.userId
//                     );
//                     if (existingUser) {
//                         await resend.emails.send({
//                             from: env.RESEND_EMAIL_FROM,
//                             to: existingUser.email,
//                             subject: "Order Placed Successfully",
//                             react: OrderPlaced({
//                                 user: {
//                                     name: `${existingUser.firstName} ${existingUser.lastName}`,
//                                 },
//                                 order: {
//                                     id: existingOrder.id,
//                                     shipmentId:
//                                         existingOrder.shipments?.[0]?.id || "",
//                                     awb:
//                                         existingOrder.shipments?.[0]
//                                             ?.awbNumber || "",
//                                     amount: existingOrder.totalAmount,
//                                     items: existingOrder.items.map((item) => ({
//                                         title: item.product.title,
//                                         slug: item.product.slug,
//                                         quantity: item.quantity,
//                                         price:
//                                             item.variant?.price ||
//                                             item.product.price ||
//                                             0,
//                                     })),
//                                 },
//                             }),
//                         });
//                     }

//                     await Promise.all(
//                         uniqueBrandIds.map((brandId) => {
//                             const brandItems = existingOrder.items.filter(
//                                 (item) => item.product.brandId === brandId
//                             );

//                             const brandRevenue = brandItems.reduce(
//                                 (total, item) => {
//                                     const itemPrice =
//                                         item.variant?.price ||
//                                         item.product.price ||
//                                         0;
//                                     return total + itemPrice * item.quantity;
//                                 },
//                                 0
//                             );

//                             return analytics.track({
//                                 namespace: BRAND_EVENTS.PAYMENT.SUCCESS,
//                                 brandId,
//                                 event: {
//                                     orderId: existingOrder.id,
//                                     paymentId:
//                                         payload.payload.payment.entity.id,
//                                     totalAmount: formatPriceTag(
//                                         payload.payload.payment.entity.amount,
//                                         true
//                                     ),
//                                     brandRevenue: formatPriceTag(
//                                         +convertPaiseToRupees(brandRevenue),
//                                         true
//                                     ),
//                                     items: existingOrder.items
//                                         .filter(
//                                             (item) =>
//                                                 item.product.brandId === brandId
//                                         )
//                                         .map((item) => ({
//                                             productId: item.product.id,
//                                             quantity: item.quantity,
//                                             variantId: item.variant?.id,
//                                             price: formatPriceTag(
//                                                 +convertPaiseToRupees(
//                                                     item.variant?.price ||
//                                                         item.product.price ||
//                                                         0
//                                                 ),
//                                                 true
//                                             ),
//                                         })),
//                                 },
//                             });
//                         })
//                     );

//                     await Promise.all(
//                         uniqueBrandIds.map((brandId) =>
//                             revenue.track(brandId, {
//                                 type: "payment",
//                                 amount: payload.payload.payment.entity.amount,
//                                 orderId: existingOrder.id,
//                                 paymentId: payload.payload.payment.entity.id,
//                                 success: true,
//                             })
//                         )
//                     );
//                 }
//                 break;

//             case "payment.failed":
//                 await orderQueries.updateOrderStatus(existingOrder.id, {
//                     paymentId: payload.payload.payment.entity.id,
//                     paymentMethod: payload.payload.payment.entity.method,
//                     paymentStatus: "failed",
//                     status: "pending",
//                 });

//                 // Send failed order email
//                 const user = await userCache.get(existingOrder.userId);
//                 if (user) {
//                     await resend.emails.send({
//                         from: env.RESEND_EMAIL_FROM,
//                         to: user.email,
//                         subject: "Order Payment Failed",
//                         react: OrderPlaceFailed({
//                             user: {
//                                 name: `${user.firstName} ${user.lastName}`,
//                             },
//                             order: {
//                                 id: existingOrder.id,
//                                 amount: existingOrder.totalAmount,
//                             },
//                         }),
//                     });
//                 }

//                 const uniqueBrandIds = [
//                     ...new Set(
//                         existingOrder.items.map((item) => item.product.brandId)
//                     ),
//                 ];

//                 await Promise.all(
//                     uniqueBrandIds.map((brandId) => {
//                         return revenue.track(brandId, {
//                             type: "payment",
//                             amount: payload.payload.payment.entity.amount,
//                             orderId: existingOrder.id,
//                             paymentId: payload.payload.payment.entity.id,
//                             success: false,
//                         });
//                     })
//                 );
//                 break;
//         }

//         return CResponse({
//             message: "OK",
//         });
//     } catch (err) {
//         return handleError(err);
//     }
// }

// function validateWebhookSignature(
//     body: string,
//     signature: string | null,
//     secret: string | undefined
// ): boolean {
//     if (!signature || !secret) return false;

//     const expectedSignature = crypto
//         .createHmac("sha256", secret)
//         .update(body)
//         .digest("hex");

//     return crypto.timingSafeEqual(
//         Buffer.from(signature),
//         Buffer.from(expectedSignature)
//     );
// }

import crypto from "crypto";
import { env } from "@/../env";
import { BRAND_EVENTS } from "@/config/brand";
import { db } from "@/lib/db";
import { orderQueries, productQueries, refundQueries } from "@/lib/db/queries";
import { analytics, revenue, userCache } from "@/lib/redis/methods";
import { resend } from "@/lib/resend";
import {
    OrderPlaced,
    OrderPlaceFailed,
    OrderRefundInitiated,
} from "@/lib/resend/emails";
import {
    AppError,
    convertPaiseToRupees,
    CResponse,
    formatPriceTag,
    handleError,
} from "@/lib/utils";
import { razorpayPaymentWebhookSchema } from "@/lib/validations";
import { NextRequest } from "next/server";
import { razorpay } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const signature = req.headers.get("x-razorpay-signature");

        const secret = env.RAZOR_PAY_WEBHOOK_SECRET;

        const isValid = validateWebhookSignature(body, signature, secret);
        if (!isValid) throw new AppError("Invalid signature", "BAD_REQUEST");

        const payload = razorpayPaymentWebhookSchema.parse(JSON.parse(body));

        const orderId = payload.payload.payment.entity.order_id;

        const existingOrder = await orderQueries.getOrderById(orderId);
        if (!existingOrder) throw new AppError("Order not found", "NOT_FOUND");

        switch (payload.event) {
            case "payment.captured":
                {
                    const isStockAvailable = existingOrder.items.every(
                        (item) => {
                            const quantity = item.quantity;

                            return (
                                item.product.verificationStatus ===
                                    "approved" &&
                                !item.product.isDeleted &&
                                item.product.isAvailable &&
                                (!!item.product.quantity
                                    ? item.product.quantity >= quantity
                                    : true) &&
                                (!item.variant ||
                                    (item.variant &&
                                        !item.variant.isDeleted &&
                                        item.variant.quantity >= quantity))
                            );
                        }
                    );

                    const uniqueBrandIds = [
                        ...new Set(
                            existingOrder.items.map(
                                (item) => item.product.brandId
                            )
                        ),
                    ];

                    if (!isStockAvailable) {
                        await orderQueries.updateOrderStatus(existingOrder.id, {
                            paymentId: payload.payload.payment.entity.id,
                            paymentMethod:
                                payload.payload.payment.entity.method,
                            paymentStatus: "refund_pending",
                            status: "cancelled",
                        });

                        const rzpRefund = await razorpay.payments.refund(
                            payload.payload.payment.entity.id,
                            {
                                amount: payload.payload.payment.entity.amount,
                            }
                        );

                        await refundQueries.createRefund({
                            id: rzpRefund.id,
                            userId: existingOrder.userId,
                            orderId: existingOrder.id,
                            paymentId: payload.payload.payment.entity.id,
                            status: "pending",
                            amount: payload.payload.payment.entity.amount,
                        });

                        const existingUser = await userCache.get(
                            existingOrder.userId
                        );

                        if (existingUser) {
                            await resend.emails.send({
                                from: env.RESEND_EMAIL_FROM,
                                to: existingUser.email,
                                subject: "Order Refund Initiated",
                                react: OrderRefundInitiated({
                                    user: {
                                        name: `${existingUser.firstName} ${existingUser.lastName}`,
                                    },
                                    order: {
                                        id: existingOrder.id,
                                        amount: existingOrder.totalAmount,
                                    },
                                }),
                            });
                        }

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
                                        return (
                                            total + itemPrice * item.quantity
                                        );
                                    },
                                    0
                                );

                                return analytics.track({
                                    namespace: BRAND_EVENTS.REFUND.CREATED,
                                    brandId,
                                    event: {
                                        orderId: existingOrder.id,
                                        paymentId:
                                            payload.payload.payment.entity.id,
                                        totalAmount: formatPriceTag(
                                            payload.payload.payment.entity
                                                .amount,
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
                                        reason: "Insufficient stock",
                                    },
                                });
                            })
                        );

                        throw new Error(
                            "Insufficient stock for one or more items"
                        );
                    }

                    const updateProductStockData = existingOrder.items.map(
                        (item) => {
                            const quantity = item.quantity;
                            const stock = !!item.variant
                                ? item.variant.quantity
                                : item.product.quantity || 0;

                            const updatedQuantity = stock - quantity;
                            return {
                                productId: item.product.id,
                                variantId: item.variant?.id,
                                quantity: updatedQuantity,
                            };
                        }
                    );

                    await productQueries.updateProductStock(
                        updateProductStockData
                    );

                    await orderQueries.updateOrderStatus(existingOrder.id, {
                        paymentId: payload.payload.payment.entity.id,
                        paymentMethod: payload.payload.payment.entity.method,
                        paymentStatus: "paid",
                        status: "processing",
                    });

                    // Send order confirmation email
                    const existingUser = await userCache.get(
                        existingOrder.userId
                    );
                    if (existingUser) {
                        await resend.emails.send({
                            from: env.RESEND_EMAIL_FROM,
                            to: existingUser.email,
                            subject: "Order Placed Successfully",
                            react: OrderPlaced({
                                user: {
                                    name: `${existingUser.firstName} ${existingUser.lastName}`,
                                },
                                order: {
                                    id: existingOrder.id,
                                    shipmentId:
                                        existingOrder.shipments?.[0]?.id || "",
                                    awb:
                                        existingOrder.shipments?.[0]
                                            ?.awbNumber || "",
                                    amount: existingOrder.totalAmount,
                                    items: existingOrder.items.map((item) => ({
                                        title: item.product.title,
                                        slug: item.product.slug,
                                        quantity: item.quantity,
                                        price:
                                            item.variant?.price ||
                                            item.product.price ||
                                            0,
                                    })),
                                },
                            }),
                        });
                    }

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

                            return analytics.track({
                                namespace: BRAND_EVENTS.PAYMENT.SUCCESS,
                                brandId,
                                event: {
                                    orderId: existingOrder.id,
                                    paymentId:
                                        payload.payload.payment.entity.id,
                                    totalAmount: formatPriceTag(
                                        payload.payload.payment.entity.amount,
                                        true
                                    ),
                                    brandRevenue: formatPriceTag(
                                        +convertPaiseToRupees(brandRevenue),
                                        true
                                    ),
                                    items: existingOrder.items
                                        .filter(
                                            (item) =>
                                                item.product.brandId === brandId
                                        )
                                        .map((item) => ({
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
                        })
                    );

                    await Promise.all(
                        uniqueBrandIds.map((brandId) =>
                            revenue.track(brandId, {
                                type: "payment",
                                amount: payload.payload.payment.entity.amount,
                                orderId: existingOrder.id,
                                paymentId: payload.payload.payment.entity.id,
                                success: true,
                            })
                        )
                    );
                }
                break;

            case "payment.failed":
                await orderQueries.updateOrderStatus(existingOrder.id, {
                    paymentId: payload.payload.payment.entity.id,
                    paymentMethod: payload.payload.payment.entity.method,
                    paymentStatus: "failed",
                    status: "pending",
                });

                // Send failed order email
                const user = await userCache.get(existingOrder.userId);
                if (user) {
                    await resend.emails.send({
                        from: env.RESEND_EMAIL_FROM,
                        to: user.email,
                        subject: "Order Payment Failed",
                        react: OrderPlaceFailed({
                            user: {
                                name: `${user.firstName} ${user.lastName}`,
                            },
                            order: {
                                id: existingOrder.id,
                                amount: existingOrder.totalAmount,
                            },
                        }),
                    });
                }

                const uniqueBrandIds = [
                    ...new Set(
                        existingOrder.items.map((item) => item.product.brandId)
                    ),
                ];

                await Promise.all(
                    uniqueBrandIds.map((brandId) => {
                        return revenue.track(brandId, {
                            type: "payment",
                            amount: payload.payload.payment.entity.amount,
                            orderId: existingOrder.id,
                            paymentId: payload.payload.payment.entity.id,
                            success: false,
                        });
                    })
                );
                break;
        }

        return CResponse({
            message: "OK",
        });
    } catch (err) {
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