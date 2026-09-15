export type CategoryRedirectReason =
    | "mode_off"
    | "duplicate_product_type"
    | "category_conflict"
    | "subcategory_alias_conflict"
    | "subcategory_conflict"
    | "invalid_uuid"
    | "unknown_product_type"
    | "inconsistent_hierarchy"
    | "lookup_timeout"
    | "lookup_error"
    | "invalid_lookup_response"
    | "success";

export type CategoryRouteReason =
    | "success"
    | "invalid_slug"
    | "unknown_slug"
    | "duplicate_filter"
    | "hierarchy_mismatch"
    | "category_deleted"
    | "server_error";

type CommonEvent = {
    status: number;
    environment?: string;
};

export function createCategoryRedirectEvent(
    input: CommonEvent & {
        outcome: "redirected" | "fail_open" | "bypassed";
        reason: CategoryRedirectReason;
        productTypeId?: string;
        categoryId?: string;
        destinationPathname?: string;
    }
) {
    return { event: "category_slug_redirect" as const, ...input };
}

export function createCategoryRouteEvent(
    input: CommonEvent & {
        outcome: "rendered" | "not_found" | "error";
        reason: CategoryRouteReason;
        slug: string;
        categoryId?: string;
        destinationPathname?: string;
    }
) {
    return { event: "category_slug_route" as const, ...input };
}

export function emitCategoryEvent(event: Record<string, unknown>) {
    console.info(JSON.stringify(event));
}
