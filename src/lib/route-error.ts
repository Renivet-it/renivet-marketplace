type RouteError = {
    digest?: string;
};

export function createRouteErrorLog(segment: string, error: RouteError) {
    return {
        event: "app-route-boundary",
        segment,
        digest: error.digest ?? null,
    };
}
