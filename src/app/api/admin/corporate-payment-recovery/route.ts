import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { BitFieldSitePermission } from "@/config/permissions";
import { db } from "@/lib/db";
import { corporatePaymentIntents } from "@/lib/db/schema";
import { razorpay } from "@/lib/razorpay";
import { corporateDocumentService } from "@/lib/services/corporate-documents";
import {
    CorporatePaymentIntegrityError,
    assertCorporatePaymentBinding,
} from "@/lib/services/corporate-payment-integrity";
import {
    markCorporatePaymentIntentApplied,
    reconcileCorporatePaymentIntent,
} from "@/lib/services/corporate-payment-reconciliation";
import { getUserPermissions, hasPermission } from "@/lib/utils";
import { userCache } from "@/lib/redis/methods";
import { eq } from "drizzle-orm";

const inputSchema = z.object({
    intentId: z.string().uuid(),
    providerPaymentId: z.string().min(1),
});

export async function POST(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await userCache.get(userId);
    const permissions = user ? getUserPermissions(user.roles).sitePermissions : 0;
    if (
        !hasPermission(
            permissions,
            [BitFieldSitePermission.ADMINISTRATOR, BitFieldSitePermission.MANAGE_ORDERS],
            "any"
        )
    ) {
        return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const input = inputSchema.parse(await request.json());
    const intent = await db.query.corporatePaymentIntents.findFirst({
        where: eq(corporatePaymentIntents.id, input.intentId),
    });
    if (!intent) {
        return NextResponse.json({ ok: false, error: "Intent not found" }, { status: 404 });
    }

    const providerPayment = await razorpay.payments.fetch(input.providerPaymentId);
    try {
        assertCorporatePaymentBinding({
            intentProviderOrderId: intent.providerOrderId ?? String(providerPayment.order_id ?? ""),
            providerOrderId: String(providerPayment.order_id ?? ""),
            providerPaymentId: String(providerPayment.id ?? input.providerPaymentId),
            providerAmountPaise: Number(providerPayment.amount ?? -1),
            intentAmountPaise: intent.amountPaise,
            providerCurrency: String(providerPayment.currency ?? ""),
            intentCurrency: intent.currency,
            providerStatus: String(providerPayment.status ?? ""),
        });
    } catch (error) {
        const message =
            error instanceof CorporatePaymentIntegrityError
                ? error.message
                : "Provider payment could not be verified";
        await db
            .update(corporatePaymentIntents)
            .set({
                providerPaymentId: input.providerPaymentId,
                status: "recovery_required",
                rejectionCode: "operator_verification_failed",
                recoveryMetadata: { actorId: userId, message },
                updatedAt: new Date(),
            })
            .where(eq(corporatePaymentIntents.id, intent.id));
        return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }

    const reconciled = await reconcileCorporatePaymentIntent({
        intentId: intent.id,
        providerPaymentId: input.providerPaymentId,
        amountPaise: Number(providerPayment.amount),
    });
    if (!reconciled.order || !reconciled.payment) {
        return NextResponse.json(
            { ok: false, error: "Intent remains pending recovery" },
            { status: 409 }
        );
    }

    await corporateDocumentService.ensureReceiptVoucher(
        reconciled.order.id,
        reconciled.payment.id
    );
    await corporateDocumentService.ensureProformaInvoiceForOrder(
        reconciled.order.id
    );
    await db
        .update(corporatePaymentIntents)
        .set({ recoveryMetadata: { actorId: userId }, updatedAt: new Date() })
        .where(eq(corporatePaymentIntents.id, intent.id));
    await markCorporatePaymentIntentApplied(intent.id);

    return NextResponse.json({ ok: true, orderId: reconciled.order.id });
}
