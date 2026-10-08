export function assertCorporateFulfilmentPaymentGate(input: {
    paymentStatus: string | null | undefined;
}) {
    if (input.paymentStatus !== "paid") {
        throw new Error(
            "Corporate fulfilment cannot be issued before customer payment is complete"
        );
    }
    return true;
}
