export function resolvePermissionUserId({
    authenticatedUserId,
}: {
    authenticatedUserId: string | null | undefined;
    requestedUserId?: string | null;
}) {
    return authenticatedUserId ?? null;
}

export function buildPermissionResponse(
    isAuthorized: boolean,
    routingContext?: {
        sitePermissions: number;
        brandPermissions: number;
        brandId: string | null;
    }
) {
    return {
        isAuthorized,
        ...(routingContext ?? {}),
    };
}
