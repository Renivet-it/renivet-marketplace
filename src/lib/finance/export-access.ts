export function canExportTdsReport({
    canView,
    canManage,
}: {
    canView: boolean;
    canManage: boolean;
}) {
    return canView || canManage;
}

export function canExportOperationalReport(isFinanceAdmin: boolean) {
    return isFinanceAdmin;
}
