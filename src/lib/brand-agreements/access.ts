export function canReadAgreement(input: {
    isAdmin: boolean;
    userBrandId?: string | null;
    agreementBrandId: string;
}) {
    return input.isAdmin || input.userBrandId === input.agreementBrandId;
}
