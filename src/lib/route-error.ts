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

type RouteErrorLog = ReturnType<typeof createRouteErrorLog>;

export function logRouteError(
    segment: string,
    error: RouteError,
    sink: (event: RouteErrorLog) => void = (event) => console.error(event)
) {
    try {
        sink(createRouteErrorLog(segment, error));
    } catch {
        // Error recovery must remain usable when observability is unavailable.
    }
}
