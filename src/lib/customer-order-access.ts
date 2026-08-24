type OrderAccount = {
    brand?: unknown | null;
    roles?: Array<{
        isSiteRole?: boolean | null;
        brandPermissions?: string | null;
    }>;
};

export function canPlaceCustomerOrder(account?: OrderAccount | null) {
    if (!account || account.brand) return false;

    return !(account.roles ?? []).some(
        (role) =>
            role.isSiteRole === true ||
            Number.parseInt(role.brandPermissions ?? "0", 10) > 0
    );
}
