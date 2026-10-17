import crypto from "node:crypto";
import { db } from "@/lib/db";
import { corporatePaymentRefunds } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export class CorporatePaymentIntegrityError extends Error {
    readonly code:
        | "provider_order_mismatch"
        | "provider_payment_missing"
        | "provider_amount_mismatch"
        | "provider_currency_mismatch"
        | "provider_not_captured";

    constructor(
        code: CorporatePaymentIntegrityError["code"],
        message: string
    ) {
        super(message);
        this.name = "CorporatePaymentIntegrityError";
        this.code = code;
    }
}

export type CorporatePaymentBinding = {
    intentProviderOrderId: string;
    providerOrderId: string | null | undefined;
    providerPaymentId: string | null | undefined;
    providerAmountPaise: number;
    intentAmountPaise: number;
    providerCurrency: string | null | undefined;
    intentCurrency: string;
    providerStatus: string | null | undefined;
};

export function assertCorporatePaymentBinding(
    binding: CorporatePaymentBinding
) {
    if (
        !binding.providerOrderId ||
        binding.providerOrderId !== binding.intentProviderOrderId
    ) {
        throw new CorporatePaymentIntegrityError(
            "provider_order_mismatch",
            "The provider order is not bound to this Corporate payment intent."
        );
    }

    if (!binding.providerPaymentId) {
        throw new CorporatePaymentIntegrityError(
            "provider_payment_missing",
            "The provider payment identity is required."
        );
    }

    if (binding.providerAmountPaise !== binding.intentAmountPaise) {
        throw new CorporatePaymentIntegrityError(
            "provider_amount_mismatch",
            "The captured amount does not match the Corporate payment intent."
        );
    }

    if (binding.providerCurrency !== binding.intentCurrency) {
        throw new CorporatePaymentIntegrityError(
            "provider_currency_mismatch",
            "The captured currency does not match the Corporate payment intent."
        );
    }

    if (binding.providerStatus !== "captured") {
        throw new CorporatePaymentIntegrityError(
            "provider_not_captured",
            "Only captured provider payments can be applied."
        );
    }

    return {
        providerPaymentId: binding.providerPaymentId,
        amountPaise: binding.providerAmountPaise,
        currency: binding.providerCurrency,
    } as const;
}

export function calculateExcessPaise(
    providerAmountPaise: number,
    outstandingPaise: number
) {
    return Math.max(0, providerAmountPaise - outstandingPaise);
}

type RazorpayPayment = {
    id?: string;
    order_id?: string;
    amount?: number;
    currency?: string;
    status?: string;
};

export async function verifyCorporateRazorpayPayment(params: {
    provider: {
        payments: { fetch: (paymentId: string) => Promise<RazorpayPayment> };
    };
    secret: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    amountPaise: number;
}) {
    const expectedSignature = crypto
        .createHmac("sha256", params.secret)
        .update(`${params.razorpayOrderId}|${params.razorpayPaymentId}`)
        .digest("hex");

    const expected = Buffer.from(expectedSignature);
    const received = Buffer.from(params.razorpaySignature);
    if (
        expected.length !== received.length ||
        !crypto.timingSafeEqual(expected, received)
    ) {
        throw new CorporatePaymentIntegrityError(
            "provider_payment_missing",
            "Invalid Razorpay payment signature."
        );
    }

    const payment = await params.provider.payments.fetch(
        params.razorpayPaymentId
    );
    const verified = assertCorporatePaymentBinding({
        intentProviderOrderId: params.razorpayOrderId,
        providerOrderId: payment.order_id,
        providerPaymentId: payment.id,
        providerAmountPaise: payment.amount ?? -1,
        intentAmountPaise: params.amountPaise,
        providerCurrency: payment.currency,
        intentCurrency: "INR",
        providerStatus: payment.status,
    });

    return { ...verified, providerPayment: payment };
}

export async function refundCorporatePaymentExcess(params: {
    intentId: string;
    providerPaymentId: string;
    providerAmountPaise: number;
    intentAmountPaise: number;
    provider: {
        payments: {
            refund: (
                paymentId: string,
                options: { amount: number }
            ) => Promise<{ id?: string }>;
        };
    };
}) {
    const excessPaise = calculateExcessPaise(
        params.providerAmountPaise,
        params.intentAmountPaise
    );
    if (excessPaise <= 0) return null;

    const existing = await db.query.corporatePaymentRefunds.findFirst({
        where: eq(corporatePaymentRefunds.intentId, params.intentId),
    });
    if (existing) return existing;

    const refund = await params.provider.payments.refund(
        params.providerPaymentId,
        { amount: excessPaise }
    );
    const [created] = await db
        .insert(corporatePaymentRefunds)
        .values({
            intentId: params.intentId,
            providerPaymentId: params.providerPaymentId,
            amountPaise: excessPaise,
            status: "processed",
            providerRefundId: refund.id ?? null,
        })
        .returning();
    return created;
}
