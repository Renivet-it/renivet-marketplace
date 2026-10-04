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

export class PaymentReconciliationError extends Error {
    constructor(
        public readonly code:
            | "MISSING_IDENTITY"
            | "IDENTITY_MISMATCH"
            | "AMOUNT_MISMATCH"
            | "CURRENCY_MISMATCH",
        message: string
    ) {
        super(message);
        this.name = "PaymentReconciliationError";
    }
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
