export function resolvePermissionUserId({
    authenticatedUserId,
}: {
    authenticatedUserId: string | null | undefined;
    requestedUserId?: string | null;
}) {
    return authenticatedUserId ?? null;
}

export function buildPermissionResponse(isAuthorized: boolean) {
    return { isAuthorized };
}
