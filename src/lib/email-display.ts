export function isPhoneGeneratedEmail(email?: string | null) {
    return Boolean(email?.toLowerCase().endsWith("@phone.renivet.com"));
}

export function displayCustomerEmail(email?: string | null) {
    return !email || isPhoneGeneratedEmail(email) ? "N/A" : email;
}
