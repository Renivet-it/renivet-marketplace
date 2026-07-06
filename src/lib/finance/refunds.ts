import { orderQueries } from "@/lib/db/queries";
import { financeComplianceQueries } from "@/lib/db/queries/finance-compliance";
import { db } from "@/lib/db";
import { orderItems, orderShipments, returnExchangePolicy, users } from "@/lib/db/schema";
import { auditAndAlert } from "@/lib/monitoring-sla/audit";
import { razorpay } from "@/lib/razorpay";
import { shiprocket } from "@/lib/shiprocket";
import { eq } from "drizzle-orm";

const DEFAULT_REFUND_APPROVAL_THRESHOLD_PAISE = 200_000;
const DEFAULT_RETURN_WINDOW_DAYS = 5;

type RefundFaultOwner =
    | "brand_fault"
    | "renivet_fault"
    | "customer_fault"
    | "courier_fault";

type RefundCreateInput = {
    orderId: string;
    userId: string;
    paymentId: string;
    amountPaise: number;
    reasonCode?: string | null;
    reasonNotes?: string | null;
    refundType?: "full" | "partial" | "exchange" | "credit_note";
    policyBucket?: RefundFaultOwner | null;
    reversePickupRequired?: boolean;
    actorId: string;
};

function differenceInDays(from: Date, to: Date) {
    return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

async function getRefundApprovalThresholdPaise() {
    const setting = await financeComplianceQueries.getPlatformSetting(
        "refund_approval_threshold_paise"
    );
    const value = Number(setting?.value?.value ?? setting?.value?.amountPaise);
    return Number.isFinite(value) && value > 0
        ? value
        : DEFAULT_REFUND_APPROVAL_THRESHOLD_PAISE;
}

async function getOrderReturnPolicies(orderId: string) {
    return db
        .select({
            productId: orderItems.productId,
            returnable: returnExchangePolicy.returnable,
            returnPeriod: returnExchangePolicy.returnPeriod,
        })
        .from(orderItems)
        .leftJoin(
            returnExchangePolicy,
            eq(returnExchangePolicy.productId, orderItems.productId)
        )
        .where(eq(orderItems.orderId, orderId));
}

async function assertRefundBusinessRules(input: RefundCreateInput) {
    const [existingRefund, order, policies] = await Promise.all([
        financeComplianceQueries.getRefundByOrderId(input.orderId),
        orderQueries.getOrderById(input.orderId),
        getOrderReturnPolicies(input.orderId),
    ]);

    if (existingRefund) {
        throw new Error(`A refund case already exists for order ${input.orderId}.`);
    }

    if (!order) {
        throw new Error(`Order ${input.orderId} was not found.`);
    }

    if (!order.paymentId && !input.paymentId) {
        throw new Error("A Razorpay payment id is required to create a refund.");
    }

    const deliveredAt =
        order.shipments.find((shipment) => shipment.status === "delivered")?.updatedAt ??
        order.updatedAt ??
        order.createdAt;

    const maxWindowDays =
        policies.reduce((max, policy) => {
            if (policy.returnable === false) return max;
            return Math.max(max, policy.returnPeriod ?? DEFAULT_RETURN_WINDOW_DAYS);
        }, 0) || DEFAULT_RETURN_WINDOW_DAYS;

    const nonReturnableProductIds = policies
        .filter((policy) => policy.returnable === false)
        .map((policy) => policy.productId);

    if (nonReturnableProductIds.length) {
        throw new Error("This order contains non-returnable products and cannot be refunded.");
    }

    if (deliveredAt) {
        const ageingDays = differenceInDays(new Date(deliveredAt), new Date());
        if (ageingDays > maxWindowDays) {
            throw new Error(
                `Refund window expired ${ageingDays} days after delivery. Allowed window is ${maxWindowDays} days.`
            );
        }
    }

    if (
        (input.policyBucket === "renivet_fault" ||
            input.policyBucket === "courier_fault") &&
        !input.reasonNotes?.trim()
    ) {
        throw new Error("Notes are required for renivet_fault and courier_fault refunds.");
    }

    return order;
}

export async function createFinanceRefundCase(input: RefundCreateInput) {
    const order = await assertRefundBusinessRules(input);
    const thresholdPaise = await getRefundApprovalThresholdPaise();
    const approvalStatus =
        input.amountPaise >= thresholdPaise ? "pending" : "approved";
    const status = approvalStatus === "approved" ? "pending" : "pending";

    const row = await financeComplianceQueries.createRefund({
        id: `fin_${input.orderId}_${Date.now()}`,
        userId: input.userId,
        orderId: input.orderId,
        paymentId: input.paymentId || order.paymentId!,
        amount: input.amountPaise,
        status,
        reasonCode: input.reasonCode,
        reasonNotes: input.reasonNotes,
        refundType: input.refundType ?? "full",
        policyBucket: input.policyBucket ?? undefined,
        approvalStatus,
        approvedBy: approvalStatus === "approved" ? input.actorId : null,
        approvedAt: approvalStatus === "approved" ? new Date() : null,
        reversePickupRequired: input.reversePickupRequired ?? false,
        escalationStatus: "none",
        metadata: {
            source: "finance_refund_workflow",
            thresholdPaise,
            deductibleFromBrand: input.policyBucket === "brand_fault",
        },
    });

    await auditAndAlert({
        actorId: input.actorId,
        actionType: "refund_case_created",
        entityType: "refund",
        entityId: row.id,
        afterValue: row as Record<string, unknown>,
        reason: input.reasonCode ?? input.reasonNotes ?? "refund_case_created",
        title: "Refund case created",
        message:
            approvalStatus === "pending"
                ? `Refund ${row.id} is awaiting approval.`
                : `Refund ${row.id} is ready for execution.`,
        severity: approvalStatus === "pending" ? "warning" : "info",
        ownerRole: "finance_admin",
        type: "refund_case_created",
        dedupeKey: `refund:create:${row.id}`,
        channels: ["admin"],
        metadata: {
            module: "finance_compliance",
            orderId: input.orderId,
        },
    });

    return row;
}

export async function createReversePickupForRefund(refundId: string, actorId: string) {
    const refund = await financeComplianceQueries.getRefundById(refundId);
    if (!refund) {
        throw new Error("Refund case not found.");
    }

    const order = await orderQueries.getOrderById(refund.orderId);
    if (!order) {
        throw new Error("Order not found.");
    }

    const existingShipment = await db.query.orderShipments.findFirst({
        where: eq(orderShipments.orderId, order.id),
    });

    if (!existingShipment) {
        throw new Error("No shipment record found for reverse pickup.");
    }

    const primaryItem = order.items[0];
    const address = order.address;
    if (!primaryItem || !address) {
        throw new Error("Order is missing item or address details for reverse pickup.");
    }
    const refundUser = await db.query.users.findFirst({
        where: eq(users.id, refund.userId),
    });
    const contactEmail = refundUser?.email ?? `support+${order.userId}@renivet.local`;
    const customerName = address.fullName;

    const client = await shiprocket();
    const result = await client.returnOrderShipment({
        order_id: `refund-${order.id}`,
        order_date: new Date(order.createdAt ?? new Date()).toISOString().slice(0, 10),
        pickup_customer_name: customerName,
        pickup_address: address.street,
        pickup_city: address.city,
        pickup_state: address.state,
        pickup_country: "India",
        pickup_pincode: Number(address.zip),
        pickup_email: contactEmail,
        pickup_phone: address.phone ?? "",
        shipping_customer_name: customerName,
        shipping_address: address.street,
        shipping_city: address.city,
        shipping_state: address.state,
        shipping_country: "India",
        shipping_pincode: Number(address.zip),
        shipping_email: contactEmail,
        shipping_phone: address.phone ?? "",
        order_items: order.items.map((item) => ({
            name: item.product?.title ?? "Product",
            qc_enable: true,
            qc_product_name: item.product?.title ?? "Product",
            sku:
                item.variant?.sku ??
                item.product?.sku ??
                item.product?.nativeSku ??
                item.productId,
            units: item.quantity,
            selling_price: Number(item.variant?.price ?? item.product?.price ?? 0) / 100,
            qc_brand: item.product?.brand?.name ?? undefined,
        })),
        payment_method: "PREPAID",
        sub_total: Number(refund.amount) / 100,
        length: Math.max(existingShipment.givenLength ?? 10, 1),
        breadth: Math.max(existingShipment.givenWidth ?? 10, 1),
        height: Math.max(existingShipment.givenHeight ?? 10, 1),
        weight: 0.5,
    });

    if (!result.status || !result.data) {
        throw new Error(result.message || "Failed to create reverse pickup in Shiprocket.");
    }

    const updated = await financeComplianceQueries.updateRefund(refund.id, {
        reversePickupRequired: true,
        metadata: {
            ...(refund.metadata ?? {}),
            reversePickup: result.data,
        },
    });

    await auditAndAlert({
        actorId,
        actionType: "refund_reverse_pickup_created",
        entityType: "refund",
        entityId: refund.id,
        beforeValue: refund as Record<string, unknown>,
        afterValue: updated as Record<string, unknown>,
        reason: "reverse_pickup_created",
        title: "Reverse pickup created",
        message: `Reverse pickup has been created for refund ${refund.id}.`,
        severity: "info",
        ownerRole: "operations",
        type: "refund_reverse_pickup_created",
        dedupeKey: `refund:reverse-pickup:${refund.id}`,
        channels: ["admin"],
        metadata: {
            module: "finance_compliance",
            shiprocket: result.data,
        },
    });

    return updated;
}

export async function executeApprovedRefund(refundId: string, actorId: string) {
    const refund = await financeComplianceQueries.getRefundById(refundId);
    if (!refund) {
        throw new Error("Refund case not found.");
    }

    if (refund.approvalStatus !== "approved") {
        throw new Error("Refund must be approved before execution.");
    }

    const order = await orderQueries.getOrderById(refund.orderId);
    if (!order) {
        throw new Error("Order not found for refund execution.");
    }

    if (!order.paymentId && !refund.paymentId) {
        throw new Error("Unable to execute refund without a payment id.");
    }
    const paymentId = refund.paymentId ?? order.paymentId;
    if (!paymentId) {
        throw new Error("Unable to execute refund without a payment id.");
    }

    const razorpayRefund = await razorpay.payments.refund(
        paymentId,
        {
            amount: refund.amount,
            notes: {
                refundId: refund.id,
                orderId: refund.orderId,
                reasonCode: refund.reasonCode ?? "uncoded",
                policyBucket: refund.policyBucket ?? "unknown",
            },
        }
    );

    const nextStatus =
        razorpayRefund.status === "processed" ? "processed" : "pending";
    const updated = await financeComplianceQueries.updateRefund(refund.id, {
        status: nextStatus,
        processedBy: actorId,
        razorpayRefundId: razorpayRefund.id,
        escalationStatus: "none",
        metadata: {
            ...(refund.metadata ?? {}),
            razorpayRefund,
        },
    });

    if (
        updated.policyBucket &&
        ["brand_fault", "renivet_fault"].includes(updated.policyBucket) &&
        updated.reversePickupRequired
    ) {
        await createReversePickupForRefund(updated.id, actorId);
    }

    await auditAndAlert({
        actorId,
        actionType: "refund_processed",
        entityType: "refund",
        entityId: refund.id,
        beforeValue: refund as Record<string, unknown>,
        afterValue: updated as Record<string, unknown>,
        reason: "razorpay_refund_requested",
        title: "Refund submitted to Razorpay",
        message: `Refund ${refund.id} has been submitted to Razorpay with status ${razorpayRefund.status}.`,
        severity: razorpayRefund.status === "failed" ? "critical" : "info",
        ownerRole: "finance_admin",
        type:
            razorpayRefund.status === "failed"
                ? "refund_failed_gateway"
                : "refund_processed_gateway",
        dedupeKey: `refund:execute:${refund.id}:${razorpayRefund.status}`,
        channels:
            razorpayRefund.status === "failed"
                ? ["admin", "email", "whatsapp"]
                : ["admin"],
        metadata: {
            module: "finance_compliance",
            razorpayRefundId: razorpayRefund.id,
            gatewayStatus: razorpayRefund.status,
        },
    });

    return updated;
}

export async function retryFinanceRefund(refundId: string, actorId: string) {
    const refund = await financeComplianceQueries.getRefundById(refundId);
    if (!refund) {
        throw new Error("Refund case not found.");
    }

    const reset = await financeComplianceQueries.updateRefund(refund.id, {
        status: "pending",
        failedReason: null,
        escalationStatus: "raised",
    });

    return executeApprovedRefund(reset.id, actorId);
}
