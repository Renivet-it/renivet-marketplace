import { orderQueries } from "@/lib/db/queries";
import { financeComplianceQueries } from "@/lib/db/queries/finance-compliance";
import { db } from "@/lib/db";
import { orderItems, orderShipments, returnExchangePolicy, users } from "@/lib/db/schema";
import {
    getAwaitingStatus,
    getDefaultQcStatus,
    getReturnShippingPaidBy,
    inferRefundCostAllocationFromReason,
    isLateWindowExceptionAllowed,
    requiresNotesForCostAllocation,
    requiresPhysicalReturn,
    requiresReversePickup,
    type RefundCostAllocation,
    type RefundQcStatus,
} from "@/lib/finance/refund-policy";
import { auditAndAlert } from "@/lib/monitoring-sla/audit";
import { razorpay } from "@/lib/razorpay";
import { shiprocket } from "@/lib/shiprocket";
import { eq } from "drizzle-orm";

const DEFAULT_REFUND_APPROVAL_THRESHOLD_PAISE = 200_000;
const DEFAULT_RETURN_WINDOW_DAYS = 7;

type RefundStatus =
    | "pending"
    | "awaiting_approval"
    | "awaiting_return"
    | "awaiting_qc"
    | "qc_failed"
    | "processed"
    | "failed"
    | "rejected";

type RefundCreateInput = {
    orderId: string;
    userId: string;
    paymentId: string;
    amountPaise: number;
    reasonCode: string;
    notes?: string | null;
    refundType?: "full" | "partial" | "exchange" | "credit_note";
    costAllocation: RefundCostAllocation;
    returnShippingPaidBy?: "renivet" | "customer" | "na";
    evidenceUrls?: string[];
    actorId: string;
    source?: "finance_refund_workflow" | "customer_return_request" | "customer_return_approved";
    sourceContext?: Record<string, unknown>;
};

function differenceInDays(from: Date, to: Date) {
    return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

function isUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value
    );
}

async function getRefundApprovalThresholdPaise() {
    const setting = await financeComplianceQueries.getPlatformSetting(
        "refund_approval_threshold_paise"
    );
    const rawValue =
        typeof setting?.value?.value === "number"
            ? setting.value.value
            : typeof setting?.value?.value === "string"
              ? Number(setting.value.value)
              : typeof setting?.value?.amountPaise === "number"
                ? setting.value.amountPaise
                : Number(setting?.value);

    return Number.isFinite(rawValue) && rawValue > 0
        ? rawValue
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
    const [existingRefund, order, policies, reason] = await Promise.all([
        financeComplianceQueries.getRefundByOrderId(input.orderId),
        orderQueries.getOrderById(input.orderId),
        getOrderReturnPolicies(input.orderId),
        financeComplianceQueries.getRefundReasonById(input.reasonCode),
    ]);

    if (existingRefund) {
        throw new Error(`A refund case already exists for order ${input.orderId}.`);
    }

    if (!order) {
        throw new Error(`Order ${input.orderId} was not found.`);
    }

    if (!reason || !reason.isActive || reason.reasonType !== "return_reason") {
        throw new Error("A valid refund reason is required.");
    }

    if (!order.paymentId && !input.paymentId) {
        throw new Error("A Razorpay payment id is required to create a refund.");
    }

    if (!isUuid(input.reasonCode)) {
        throw new Error("Refund reason code must be a valid reason master id.");
    }

    const suggestedCostAllocation = inferRefundCostAllocationFromReason({
        reasonName: reason.name,
        parentReasonName: reason.parent?.name ?? null,
    });

    if (requiresNotesForCostAllocation(input.costAllocation) && !input.notes?.trim()) {
        throw new Error("Notes are required for renivet_fault and carrier_fault refunds.");
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

    if (nonReturnableProductIds.length && requiresPhysicalReturn(input.costAllocation)) {
        throw new Error("This order contains non-returnable products and cannot be refunded.");
    }

    if (deliveredAt) {
        const ageingDays = differenceInDays(new Date(deliveredAt), new Date());
        if (ageingDays > maxWindowDays) {
            if (!isLateWindowExceptionAllowed(input.costAllocation)) {
                throw new Error(
                    `Refund window expired ${ageingDays} days after delivery. Only brand_fault and carrier_fault refunds are allowed after ${maxWindowDays} days.`
                );
            }

            if (!input.evidenceUrls?.length) {
                throw new Error(
                    "Photographic evidence is required for late brand_fault or carrier_fault refunds."
                );
            }
        }
    }

    return {
        order,
        reason,
        suggestedCostAllocation,
    };
}

async function updateRefundStatus(
    refundId: string,
    actorId: string,
    next: {
        status?: RefundStatus;
        approvalStatus?: "pending" | "approved" | "rejected";
        approvedBy?: string | null;
        approvedAt?: Date | null;
        rejectedBy?: string | null;
        rejectedAt?: Date | null;
        rejectionReason?: string | null;
        returnReceivedAt?: Date | null;
        returnQcStatus?: RefundQcStatus | null;
        processedBy?: string | null;
        failedReason?: string | null;
        notes?: string | null;
        metadata?: Record<string, unknown>;
    },
    audit: {
        actionType: string;
        reason: string;
        title: string;
        message: string;
        severity?: "info" | "warning" | "critical";
        ownerRole?: string;
    }
)
{
    const existing = await financeComplianceQueries.getRefundById(refundId);
    if (!existing) {
        throw new Error("Refund case not found.");
    }

    const updated = await financeComplianceQueries.updateRefund(refundId, {
        ...next,
        metadata: next.metadata
            ? {
                  ...(existing.metadata ?? {}),
                  ...next.metadata,
              }
            : undefined,
    });

    await auditAndAlert({
        actorId,
        actionType: audit.actionType,
        entityType: "refund",
        entityId: refundId,
        beforeValue: existing as Record<string, unknown>,
        afterValue: updated as Record<string, unknown>,
        reason: audit.reason,
        title: audit.title,
        message: audit.message,
        severity: audit.severity ?? "info",
        ownerRole: audit.ownerRole ?? "finance_admin",
        type: audit.actionType,
        dedupeKey: `${audit.actionType}:${refundId}:${Date.now()}`,
        channels: ["admin"],
        metadata: {
            module: "finance_compliance",
        },
    });

    return updated;
}

export async function createFinanceRefundCase(input: RefundCreateInput) {
    const { order, reason, suggestedCostAllocation } = await assertRefundBusinessRules(input);
    const thresholdPaise = await getRefundApprovalThresholdPaise();
    const approvalStatus =
        input.amountPaise > thresholdPaise ? "pending" : "approved";
    const status: RefundStatus =
        approvalStatus === "pending" ? "awaiting_approval" : "pending";
    const returnShippingPaidBy =
        input.returnShippingPaidBy ?? getReturnShippingPaidBy(input.costAllocation);
    const qcStatus = getDefaultQcStatus(input.costAllocation);

    const row = await financeComplianceQueries.createRefund({
        id: `fin_${input.orderId}_${Date.now()}`,
        userId: input.userId,
        orderId: input.orderId,
        paymentId: input.paymentId || order.paymentId!,
        amount: input.amountPaise,
        status,
        reasonCode: input.reasonCode,
        reasonNotes: input.notes,
        costAllocation: input.costAllocation,
        notes: input.notes,
        refundType: input.refundType ?? "full",
        policyBucket: input.costAllocation,
        approvalStatus,
        approvedBy: approvalStatus === "approved" ? input.actorId : null,
        approvedAt: approvalStatus === "approved" ? new Date() : null,
        reversePickupRequired: requiresReversePickup(input.costAllocation),
        escalationStatus: "none",
        returnShippingPaidBy,
        returnQcStatus: qcStatus,
        metadata: {
            source: input.source ?? "finance_refund_workflow",
            thresholdPaise,
            evidenceUrls: input.evidenceUrls ?? [],
            deductibleFromBrand: input.costAllocation === "brand_fault",
            suggestedCostAllocation,
            reasonName: reason.name,
            parentReasonName: reason.parent?.name ?? null,
            ...(input.sourceContext ?? {}),
        },
    });

    await auditAndAlert({
        actorId: input.actorId,
        actionType: "refund_case_created",
        entityType: "refund",
        entityId: row.id,
        afterValue: row as Record<string, unknown>,
        reason: input.reasonCode,
        title: "Refund case created",
        message:
            approvalStatus === "pending"
                ? `Refund ${row.id} is awaiting approval.`
                : `Refund ${row.id} is approved and ready for processing.`,
        severity: approvalStatus === "pending" ? "warning" : "info",
        ownerRole: "finance_admin",
        type: "refund_case_created",
        dedupeKey: `refund:create:${row.id}`,
        channels: approvalStatus === "pending" ? ["admin", "email"] : ["admin"],
        metadata: {
            module: "finance_compliance",
            orderId: input.orderId,
            costAllocation: input.costAllocation,
            suggestedCostAllocation,
        },
    });

    return row;
}

export async function approveFinanceRefundCase(
    refundId: string,
    actorId: string,
    reason?: string | null
) {
    const refund = await financeComplianceQueries.getRefundById(refundId);
    if (!refund) {
        throw new Error("Refund case not found.");
    }

    if (refund.approvalStatus === "approved") {
        return refund;
    }

    return updateRefundStatus(
        refundId,
        actorId,
        {
            approvalStatus: "approved",
            approvedBy: actorId,
            approvedAt: new Date(),
            status: "pending",
            rejectionReason: null,
            rejectedBy: null,
            rejectedAt: null,
        },
        {
            actionType: "refund.approved",
            reason: reason ?? "Refund approved",
            title: "Refund approved",
            message: `Refund ${refundId} has been approved and is ready for processing.`,
        }
    );
}

export async function rejectFinanceRefundCase(
    refundId: string,
    actorId: string,
    reason: string
) {
    if (!reason.trim()) {
        throw new Error("A rejection reason is required.");
    }

    return updateRefundStatus(
        refundId,
        actorId,
        {
            approvalStatus: "rejected",
            rejectedBy: actorId,
            rejectedAt: new Date(),
            rejectionReason: reason,
            status: "rejected",
        },
        {
            actionType: "refund.rejected",
            reason,
            title: "Refund rejected",
            message: `Refund ${refundId} was rejected.`,
            severity: "warning",
        }
    );
}

export async function createReversePickupForRefund(refundId: string, actorId: string) {
    const refund = await financeComplianceQueries.getRefundById(refundId);
    if (!refund) {
        throw new Error("Refund case not found.");
    }

    if (!refund.costAllocation || !requiresReversePickup(refund.costAllocation as RefundCostAllocation)) {
        throw new Error("Reverse pickup is only available for brand_fault or renivet_fault refunds.");
    }

    if (refund.reversePickupShipmentId) {
        return refund;
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

    const reverseShipmentId =
        String((result.data as Record<string, unknown>).shipment_id ?? "") || null;

    const updated = await financeComplianceQueries.updateRefund(refund.id, {
        reversePickupRequired: true,
        reversePickupShipmentId:
            reverseShipmentId && isUuid(reverseShipmentId) ? reverseShipmentId : null,
        status: "awaiting_return",
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
        channels: ["admin", "email", "whatsapp"],
        metadata: {
            module: "finance_compliance",
            shiprocket: result.data,
        },
    });

    return updated;
}

export async function processFinanceRefundCase(refundId: string, actorId: string) {
    const refund = await financeComplianceQueries.getRefundById(refundId);
    if (!refund) {
        throw new Error("Refund case not found.");
    }

    if (refund.approvalStatus !== "approved") {
        throw new Error("Refund must be approved before processing.");
    }

    if (!refund.costAllocation) {
        throw new Error("Refund cost allocation is required before processing.");
    }

    const costAllocation = refund.costAllocation as RefundCostAllocation;
    if (costAllocation === "carrier_fault") {
        return executeApprovedRefund(refundId, actorId);
    }

    const updated = await updateRefundStatus(
        refundId,
        actorId,
        {
            status: getAwaitingStatus(costAllocation),
        },
        {
            actionType: "refund.processing_started",
            reason: "Refund workflow started",
            title: "Refund workflow started",
            message: `Refund ${refundId} has moved into return logistics and QC.`,
        }
    );

    if (requiresReversePickup(costAllocation) && !updated.reversePickupShipmentId) {
        return createReversePickupForRefund(refundId, actorId);
    }

    return updated;
}

export async function markFinanceRefundReturnReceived(
    refundId: string,
    actorId: string,
    receivedAt?: Date
) {
    return updateRefundStatus(
        refundId,
        actorId,
        {
            returnReceivedAt: receivedAt ?? new Date(),
            status: "awaiting_qc",
        },
        {
            actionType: "refund.return_received",
            reason: "Return received at warehouse",
            title: "Return received",
            message: `Refund ${refundId} return shipment was received.`,
        }
    );
}

export async function updateFinanceRefundQcStatus(input: {
    refundId: string;
    actorId: string;
    qcStatus: RefundQcStatus;
    note?: string | null;
}) {
    const refund = await financeComplianceQueries.getRefundById(input.refundId);
    if (!refund) {
        throw new Error("Refund case not found.");
    }

    const nextStatus: RefundStatus =
        input.qcStatus === "failed"
            ? "qc_failed"
            : input.qcStatus === "passed"
              ? "pending"
              : input.qcStatus === "na"
                ? "pending"
                : "awaiting_qc";

    const updated = await updateRefundStatus(
        input.refundId,
        input.actorId,
        {
            returnQcStatus: input.qcStatus,
            status: nextStatus,
            failedReason: input.qcStatus === "failed" ? input.note ?? "QC failed" : null,
            notes: input.note ?? refund.notes,
        },
        {
            actionType: `refund.qc_${input.qcStatus}`,
            reason: input.note ?? `Refund QC marked ${input.qcStatus}`,
            title: "Refund QC updated",
            message: `Refund ${input.refundId} QC status changed to ${input.qcStatus}.`,
            severity: input.qcStatus === "failed" ? "warning" : "info",
        }
    );

    if (input.qcStatus === "passed" || input.qcStatus === "na") {
        return executeApprovedRefund(updated.id, input.actorId);
    }

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

    if (!refund.costAllocation) {
        throw new Error("Refund cost allocation is required before execution.");
    }

    const costAllocation = refund.costAllocation as RefundCostAllocation;
    if (
        requiresPhysicalReturn(costAllocation) &&
        refund.returnQcStatus !== "passed"
    ) {
        throw new Error("Refund cannot be executed until QC has passed.");
    }

    const order = await orderQueries.getOrderById(refund.orderId);
    if (!order) {
        throw new Error("Order not found for refund execution.");
    }

    const paymentId = refund.paymentId ?? order.paymentId;
    if (!paymentId) {
        throw new Error("Unable to execute refund without a payment id.");
    }

    const razorpayRefund = await razorpay.payments.refund(paymentId, {
        amount: refund.amount,
        notes: {
            refundId: refund.id,
            orderId: refund.orderId,
            reasonCode: refund.reasonCode ?? "uncoded",
            costAllocation,
        },
    });

    const nextStatus: RefundStatus =
        razorpayRefund.status === "processed"
            ? "processed"
            : razorpayRefund.status === "failed"
              ? "failed"
              : "pending";
    const updated = await financeComplianceQueries.updateRefund(refund.id, {
        status: nextStatus,
        processedBy: actorId,
        razorpayRefundId: razorpayRefund.id,
        escalationStatus: razorpayRefund.status === "failed" ? "raised" : "none",
        failedReason:
            razorpayRefund.status === "failed"
                ? "Razorpay refund execution failed."
                : null,
        metadata: {
            ...(refund.metadata ?? {}),
            razorpayRefund,
        },
    });

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
        ownerRole: "admin",
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
            escalationTarget: "AJ",
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

    if (reset.costAllocation === "carrier_fault" || reset.returnQcStatus === "passed") {
        return executeApprovedRefund(reset.id, actorId);
    }

    return processFinanceRefundCase(reset.id, actorId);
}
