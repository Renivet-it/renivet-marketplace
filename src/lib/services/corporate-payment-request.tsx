import crypto from "crypto";
import { env } from "@/../env";
import { db } from "@/lib/db";
import {
    corporateOrders,
    corporateOrderStatusHistory,
    corporatePaymentRequests,
    corporatePayments,
} from "@/lib/db/schema";
import { razorpay } from "@/lib/razorpay";
import { resend } from "@/lib/resend";
import {
    CorporateOrderEmailShell,
    EmailDetailCard,
    EmailMetricGrid,
    EmailNote,
} from "@/lib/resend/emails/corporate-order-email-shell";
import { corporateDocumentService } from "@/lib/services/corporate-documents";
import { formatINR, getAbsoluteURL } from "@/lib/utils";
import {
    corporateAdminOfflinePaymentInputSchema,
    corporateAdminPaymentRequestInputSchema,
} from "@/lib/validations/corporate-platform";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray } from "drizzle-orm";

function tokenHash(token: string) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

function publicPaymentUrl(token: string) {
    return getAbsoluteURL(`/corporate-payment/${token}`);
}

function hasValidRazorpaySignature(expected: string, received: string) {
    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(received);
    return (
        expectedBuffer.length === receivedBuffer.length &&
        crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    );
}

async function getRequestByToken(token: string) {
    const request = await db.query.corporatePaymentRequests.findFirst({
        where: eq(corporatePaymentRequests.tokenHash, tokenHash(token)),
    });
    if (!request) {
        throw new TRPCError({
            code: "NOT_FOUND",
            message: "Payment request not found",
        });
    }
    const order = await db.query.corporateOrders.findFirst({
        where: eq(corporateOrders.id, request.orderId),
    });
    if (!order) {
        throw new TRPCError({
            code: "NOT_FOUND",
            message: "Corporate order not found",
        });
    }
    return { request, order };
}

async function getVerifiedCollectedPaise(orderId: string) {
    const payments = await db.query.corporatePayments.findMany({
        where: eq(corporatePayments.orderId, orderId),
    });
    return payments
        .filter((payment) =>
            ["payment_success", "payment_partial"].includes(
                payment.paymentStatus
            )
        )
        .reduce((sum, payment) => sum + payment.amountPaise, 0);
}

async function applyVerifiedPayment(params: {
    orderId: string;
    amountPaise: number;
    paymentType: "advance" | "balance" | "full" | "partial";
    paymentMode:
        | "razorpay"
        | "upi"
        | "card"
        | "net_banking"
        | "manual"
        | "neft"
        | "rtgs"
        | "bank_transfer";
    paymentReference: string;
    paymentDate: string;
    paymentRequestId?: string | null;
    proofFileUrl?: string | null;
    notes?: string | null;
    recordedByUserId?: string | null;
}) {
    const order = await db.query.corporateOrders.findFirst({
        where: eq(corporateOrders.id, params.orderId),
    });
    if (!order)
        throw new TRPCError({
            code: "NOT_FOUND",
            message: "Corporate order not found",
        });

    const duplicate = await db.query.corporatePayments.findFirst({
        where: and(
            eq(corporatePayments.orderId, order.id),
            eq(corporatePayments.paymentReference, params.paymentReference)
        ),
    });
    if (duplicate) return { payment: duplicate, order, receiptVoucher: null };

    const collectedBeforePaise = await getVerifiedCollectedPaise(order.id);
    const outstandingBeforePaise = Math.max(
        0,
        order.totalPaise - collectedBeforePaise
    );
    const amountPaise = Math.min(params.amountPaise, outstandingBeforePaise);
    if (amountPaise <= 0) {
        throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This order has no amount due",
        });
    }

    const paymentType =
        params.paymentType === "full" ? "manual" : params.paymentType;
    const totalCollectedPaise = Math.min(
        order.totalPaise,
        collectedBeforePaise + amountPaise
    );
    const remainingPaise = Math.max(0, order.totalPaise - totalCollectedPaise);
    const payment = await db.transaction(async (tx) => {
        const created = await tx
            .insert(corporatePayments)
            .values({
                orderId: order.id,
                paymentType,
                paymentMode: params.paymentMode,
                amountPaise,
                paymentReference: params.paymentReference,
                paymentStatus:
                    remainingPaise === 0
                        ? "payment_success"
                        : "payment_partial",
                paymentDate: params.paymentDate,
                metadata: {
                    paymentRequestId: params.paymentRequestId ?? null,
                    proofFileUrl: params.proofFileUrl ?? null,
                    notes: params.notes ?? null,
                    recordedByUserId: params.recordedByUserId ?? null,
                },
            })
            .returning()
            .then((rows) => rows[0]);

        await tx
            .update(corporateOrders)
            .set({
                advancePaidPaise: totalCollectedPaise,
                balanceDuePaise: remainingPaise,
                paymentStatus: remainingPaise === 0 ? "paid" : "pending",
                balancePaymentStatus: remainingPaise === 0 ? "paid" : "pending",
                status:
                    order.status === "payment_pending"
                        ? "under_review"
                        : order.status,
                paymentReference: params.paymentReference,
                updatedAt: new Date(),
            })
            .where(eq(corporateOrders.id, order.id));

        if (order.status === "payment_pending") {
            await tx.insert(corporateOrderStatusHistory).values({
                corporateOrderId: order.id,
                fromStatus: order.status,
                toStatus: "under_review",
                changedByUserId: params.recordedByUserId ?? null,
                note:
                    remainingPaise === 0
                        ? "Payment completed; order released for review"
                        : "Agreed payment received; order released for review",
                metadata: {
                    paymentId: created.id,
                    paymentRequestId: params.paymentRequestId ?? null,
                    amountPaise,
                },
            });
        }

        if (params.paymentRequestId) {
            await tx
                .update(corporatePaymentRequests)
                .set({
                    status: "paid",
                    paymentReference: params.paymentReference,
                    paymentMode: params.paymentMode,
                    proofFileUrl: params.proofFileUrl ?? null,
                    paidAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(
                    eq(corporatePaymentRequests.id, params.paymentRequestId)
                );
        }
        return created;
    });
    const updatedOrder = await db.query.corporateOrders.findFirst({
        where: eq(corporateOrders.id, order.id),
    });
    const receiptVoucher = await corporateDocumentService.ensureReceiptVoucher(
        order.id,
        payment.id
    );
    return { payment, order: updatedOrder!, receiptVoucher };
}

export const corporatePaymentRequestService = {
    async create(actorUserId: string, input: unknown) {
        const parsed = corporateAdminPaymentRequestInputSchema.parse(input);
        const order = await db.query.corporateOrders.findFirst({
            where: eq(corporateOrders.id, parsed.orderId),
        });
        if (!order)
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Corporate order not found",
            });
        const collectedPaise = await getVerifiedCollectedPaise(order.id);
        const outstandingPaise = Math.max(0, order.totalPaise - collectedPaise);
        if (outstandingPaise <= 0)
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "This order is already paid",
            });
        if (parsed.amountPaise > outstandingPaise)
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Requested amount exceeds the outstanding balance",
            });

        if (
            order.advancePaidPaise !== collectedPaise ||
            order.balanceDuePaise !== outstandingPaise
        ) {
            await db
                .update(corporateOrders)
                .set({
                    advancePaidPaise: collectedPaise,
                    balanceDuePaise: outstandingPaise,
                    updatedAt: new Date(),
                })
                .where(eq(corporateOrders.id, order.id));
        }

        await db
            .update(corporatePaymentRequests)
            .set({ status: "cancelled", updatedAt: new Date() })
            .where(
                and(
                    eq(corporatePaymentRequests.orderId, order.id),
                    inArray(corporatePaymentRequests.status, [
                        "pending",
                        "initiated",
                    ])
                )
            );
        const token = crypto.randomBytes(32).toString("base64url");
        const expiresAt = new Date(
            Date.now() + parsed.expiresInDays * 86_400_000
        );
        const created = await db
            .insert(corporatePaymentRequests)
            .values({
                orderId: order.id,
                recipientEmail: order.emailAddress.trim().toLowerCase(),
                tokenHash: tokenHash(token),
                amountPaise: parsed.amountPaise,
                paymentType: parsed.paymentType,
                status: "pending",
                notes: parsed.notes ?? null,
                expiresAt,
                sentAt: parsed.sendEmail ? new Date() : null,
                createdByUserId: actorUserId,
            })
            .returning()
            .then((rows) => rows[0]);
        const paymentUrl = publicPaymentUrl(token);

        if (parsed.sendEmail) {
            const delivery = await resend.emails.send({
                from: env.RESEND_EMAIL_FROM,
                to: order.emailAddress,
                subject: `Payment request for ${order.publicOrderId}`,
                react: (
                    <CorporateOrderEmailShell
                        preview={`Payment request for ${order.publicOrderId}`}
                        eyebrow="Corporate Payment"
                        title="Complete your corporate order payment"
                        intro={`Renivet has accepted your purchase order and prepared ${order.publicOrderId}. Use the secure link below to complete the requested payment.`}
                        primaryAction={{
                            href: paymentUrl,
                            label: "Pay securely",
                        }}
                    >
                        <EmailMetricGrid
                            items={[
                                { label: "Order", value: order.publicOrderId },
                                {
                                    label: "Requested amount",
                                    value: formatINR(parsed.amountPaise),
                                },
                                {
                                    label: "Order value",
                                    value: formatINR(order.totalPaise),
                                },
                                {
                                    label: "Balance",
                                    value: formatINR(outstandingPaise),
                                },
                            ]}
                        />
                        <EmailDetailCard
                            title="Payment request"
                            rows={[
                                { label: "Company", value: order.companyName },
                                {
                                    label: "Payment type",
                                    value: parsed.paymentType,
                                },
                                {
                                    label: "Valid until",
                                    value: expiresAt.toLocaleDateString(
                                        "en-IN"
                                    ),
                                },
                            ]}
                        />
                        <EmailNote>
                            After payment is verified, the receipt voucher and
                            updated order will be available in your Renivet
                            account. This secure link also works before
                            registration.
                        </EmailNote>
                    </CorporateOrderEmailShell>
                ),
            });
            if (delivery.error) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message:
                        "Payment link was created but the email could not be delivered. Generate a new link and try again.",
                });
            }
        }
        return { ...created, paymentUrl };
    },

    async listForOrders(orderIds: string[]) {
        if (!orderIds.length) return [];
        return db.query.corporatePaymentRequests.findMany({
            where: inArray(corporatePaymentRequests.orderId, orderIds),
            orderBy: [desc(corporatePaymentRequests.createdAt)],
        });
    },

    async getPublic(token: string) {
        const { request, order } = await getRequestByToken(token);
        const collectedPaise = await getVerifiedCollectedPaise(order.id);
        const verifiedBalanceDuePaise = Math.max(
            0,
            order.totalPaise - collectedPaise
        );
        const expired =
            request.expiresAt.getTime() < Date.now() &&
            request.status !== "paid";
        return {
            id: request.id,
            status: expired ? "expired" : request.status,
            amountPaise: request.amountPaise,
            paymentType: request.paymentType,
            expiresAt: request.expiresAt,
            order: {
                publicOrderId: order.publicOrderId,
                companyName: order.companyName,
                contactPersonName: order.contactPersonName,
                emailAddress: order.emailAddress,
                mobileNumber: order.mobileNumber,
                totalPaise: order.totalPaise,
                collectedPaise,
                balanceDuePaise: verifiedBalanceDuePaise,
            },
            receiptUrl:
                request.status === "paid"
                    ? `/api/corporate-orders/${order.id}/receipt-voucher.pdf?paymentToken=${encodeURIComponent(token)}`
                    : null,
        };
    },

    async authorizeReceipt(token: string, orderId: string) {
        const { request } = await getRequestByToken(token);
        return request.orderId === orderId && request.status === "paid";
    },

    async getForAccount(userId: string, paymentRequestId: string) {
        const request = await db.query.corporatePaymentRequests.findFirst({
            where: eq(corporatePaymentRequests.id, paymentRequestId),
        });
        if (!request)
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Payment request not found",
            });
        const order = await db.query.corporateOrders.findFirst({
            where: eq(corporateOrders.id, request.orderId),
        });
        if (!order || order.userId !== userId)
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "Payment request does not belong to your account",
            });
        return { request, order };
    },

    async createAccountCheckout(userId: string, paymentRequestId: string) {
        const { request, order } = await this.getForAccount(
            userId,
            paymentRequestId
        );
        if (request.status === "paid")
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "This payment request is already paid",
            });
        if (
            ["cancelled", "expired"].includes(request.status) ||
            request.expiresAt.getTime() < Date.now()
        )
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "This payment request has expired",
            });
        const amount = Math.min(request.amountPaise, order.balanceDuePaise);
        if (amount <= 0)
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "This order is already paid",
            });
        const rzpOrder = await razorpay.orders.create({
            amount,
            currency: "INR",
            receipt: `${order.publicOrderId}-${request.id.slice(0, 6)}`.slice(
                0,
                40
            ),
            notes: {
                corporateOrderId: order.id,
                paymentRequestId: request.id,
                userId,
            },
        });
        await db
            .update(corporatePaymentRequests)
            .set({
                status: "initiated",
                razorpayOrderId: rzpOrder.id,
                updatedAt: new Date(),
            })
            .where(eq(corporatePaymentRequests.id, request.id));
        return {
            orderId: rzpOrder.id,
            amount,
            currency: "INR",
            key: env.NEXT_PUBLIC_RAZOR_PAY_KEY_ID,
            name: "Renivet Corporate Orders",
            description: `Payment for ${order.publicOrderId}`,
        };
    },

    async confirmAccount(
        userId: string,
        paymentRequestId: string,
        input: {
            razorpayOrderId: string;
            razorpayPaymentId: string;
            razorpaySignature: string;
        }
    ) {
        const { request } = await this.getForAccount(userId, paymentRequestId);
        if (request.status === "paid")
            return { success: true, orderId: request.orderId };
        if (request.razorpayOrderId !== input.razorpayOrderId)
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Payment order mismatch",
            });
        const signature = crypto
            .createHmac("sha256", env.RAZOR_PAY_SECRET_KEY)
            .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
            .digest("hex");
        if (!hasValidRazorpaySignature(signature, input.razorpaySignature))
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Invalid payment signature",
            });
        await db
            .update(corporatePaymentRequests)
            .set({
                razorpayPaymentId: input.razorpayPaymentId,
                updatedAt: new Date(),
            })
            .where(eq(corporatePaymentRequests.id, request.id));
        await applyVerifiedPayment({
            orderId: request.orderId,
            amountPaise: request.amountPaise,
            paymentType: request.paymentType,
            paymentMode: "razorpay",
            paymentReference: input.razorpayPaymentId,
            paymentDate: new Date().toISOString().slice(0, 10),
            paymentRequestId: request.id,
        });
        return { success: true, orderId: request.orderId };
    },

    async createCheckout(token: string) {
        const { request, order } = await getRequestByToken(token);
        if (request.status === "paid")
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "This payment request is already paid",
            });
        if (
            ["cancelled", "expired"].includes(request.status) ||
            request.expiresAt.getTime() < Date.now()
        )
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "This payment request has expired",
            });
        const amount = Math.min(request.amountPaise, order.balanceDuePaise);
        if (amount <= 0)
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "This order is already paid",
            });
        const rzpOrder = await razorpay.orders.create({
            amount,
            currency: "INR",
            receipt: `${order.publicOrderId}-${request.id.slice(0, 6)}`.slice(
                0,
                40
            ),
            notes: { corporateOrderId: order.id, paymentRequestId: request.id },
        });
        await db
            .update(corporatePaymentRequests)
            .set({
                status: "initiated",
                razorpayOrderId: rzpOrder.id,
                updatedAt: new Date(),
            })
            .where(eq(corporatePaymentRequests.id, request.id));
        return {
            orderId: rzpOrder.id,
            amount,
            currency: "INR",
            key: env.NEXT_PUBLIC_RAZOR_PAY_KEY_ID,
            name: "Renivet Corporate Orders",
            description: `Payment for ${order.publicOrderId}`,
        };
    },

    async confirm(
        token: string,
        input: {
            razorpayOrderId: string;
            razorpayPaymentId: string;
            razorpaySignature: string;
        }
    ) {
        const { request } = await getRequestByToken(token);
        if (request.status === "paid") return this.getPublic(token);
        if (request.razorpayOrderId !== input.razorpayOrderId)
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Payment order mismatch",
            });
        const signature = crypto
            .createHmac("sha256", env.RAZOR_PAY_SECRET_KEY)
            .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
            .digest("hex");
        if (!hasValidRazorpaySignature(signature, input.razorpaySignature))
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Invalid payment signature",
            });
        await db
            .update(corporatePaymentRequests)
            .set({
                razorpayPaymentId: input.razorpayPaymentId,
                updatedAt: new Date(),
            })
            .where(eq(corporatePaymentRequests.id, request.id));
        await applyVerifiedPayment({
            orderId: request.orderId,
            amountPaise: request.amountPaise,
            paymentType: request.paymentType,
            paymentMode: "razorpay",
            paymentReference: input.razorpayPaymentId,
            paymentDate: new Date().toISOString().slice(0, 10),
            paymentRequestId: request.id,
        });
        return this.getPublic(token);
    },

    async recordOffline(actorUserId: string, input: unknown) {
        const parsed = corporateAdminOfflinePaymentInputSchema.parse(input);
        if (parsed.paymentRequestId) {
            const request = await db.query.corporatePaymentRequests.findFirst({
                where: eq(corporatePaymentRequests.id, parsed.paymentRequestId),
            });
            if (!request || request.orderId !== parsed.orderId) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Payment request does not belong to this order",
                });
            }
        }
        return applyVerifiedPayment({
            ...parsed,
            proofFileUrl: parsed.proofFile?.url ?? null,
            recordedByUserId: actorUserId,
        });
    },
};
