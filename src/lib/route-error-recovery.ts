export type RouteRecoveryMode = "global-reload" | "localized-reset";

type RouteRecoveryActions = {
    reload: () => void;
    reset: () => void;
};

export function runRouteRecovery(
    mode: RouteRecoveryMode,
    actions: RouteRecoveryActions
) {
    if (mode === "global-reload") {
        actions.reload();
        return;
    }

    actions.reset();
}
