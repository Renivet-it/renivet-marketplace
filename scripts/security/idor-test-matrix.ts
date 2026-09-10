import { isIP } from "node:net";

export const IDOR_MANIFEST_VERSION = "ren-124-v1";

export const resources = [
    "order",
    "invoice",
    "corporate_quote",
    "payment_request",
    "address",
    "cart",
] as const;

export const accessModes = [
    "unauthenticated",
    "wrong_user",
    "owner",
    "tampered_identifier",
] as const;

export type IdorResource = (typeof resources)[number];
export type AccessMode = (typeof accessModes)[number];
export type Channel = "http" | "browser";
export type Persona =
    | "anonymous"
    | "customer_owner"
    | "unrelated_customer"
    | "brand_owner"
    | "unrelated_brand"
    | "privileged_admin";
export type Scope = "customer" | "brand" | "admin" | "capability";
export type NormalizedOutcome =
    | "allow"
    | "unauthorized"
    | "forbidden"
    | "not_found"
    | "validation_error"
    | "redirect"
    | "error";

export type MatrixCase = {
    id: string;
    resource: IdorResource;
    accessMode: AccessMode;
    persona: Persona;
    scope: Scope;
    channel: Channel;
    method: "GET";
    target: string;
    fixtureRef: string;
    expected: NormalizedOutcome;
    mutating: false;
    sensitivity: "financial" | "personal" | "capability";
};

type ResourceDefinition = {
    channel: Channel;
    target: string;
    sensitivity: MatrixCase["sensitivity"];
    scope: Scope;
};

const definitions: Record<IdorResource, ResourceDefinition> = {
    order: {
        channel: "browser",
        target: "/profile/orders/{orderId}",
        sensitivity: "personal",
        scope: "customer",
    },
    invoice: {
        channel: "http",
        target: "/api/invoices/{orderId}/download?token={invoiceToken}",
        sensitivity: "financial",
        scope: "capability",
    },
    corporate_quote: {
        channel: "browser",
        target: "/profile/corporate?quoteId={quoteId}",
        sensitivity: "financial",
        scope: "customer",
    },
    payment_request: {
        channel: "http",
        target: "/api/corporate-payment-requests/{paymentToken}",
        sensitivity: "capability",
        scope: "capability",
    },
    address: {
        channel: "http",
        target: "/api/trpc/general/addresses.getAddressById",
        sensitivity: "personal",
        scope: "customer",
    },
    cart: {
        channel: "browser",
        target: "/profile/cart?userId={userId}",
        sensitivity: "personal",
        scope: "customer",
    },
};

const personaByMode: Record<AccessMode, Persona> = {
    unauthenticated: "anonymous",
    wrong_user: "unrelated_customer",
    owner: "customer_owner",
    tampered_identifier: "customer_owner",
};

function expectedOutcome(resource: IdorResource, mode: AccessMode) {
    if (mode === "owner") return "allow" as const;
    if (resource === "invoice" || resource === "payment_request") {
        return mode === "tampered_identifier" ? "not_found" : "allow";
    }
    return mode === "unauthenticated" ? "unauthorized" : "forbidden";
}

export const idorMatrix: MatrixCase[] = resources.flatMap((resource) =>
    accessModes.map((accessMode) => {
        const definition = definitions[resource];
        return {
            id: `REN-124-${resource}-${accessMode}`,
            resource,
            accessMode,
            persona: personaByMode[accessMode],
            scope: definition.scope,
            channel: definition.channel,
            method: "GET",
            target: definition.target,
            fixtureRef: `${resource}.${accessMode}`,
            expected: expectedOutcome(resource, accessMode),
            mutating: false,
            sensitivity: definition.sensitivity,
        };
    })
);

idorMatrix.push(
    {
        id: "REN-124-corporate_quote-brand-owner",
        resource: "corporate_quote",
        accessMode: "owner",
        persona: "brand_owner",
        scope: "brand",
        channel: "browser",
        method: "GET",
        target: definitions.corporate_quote.target,
        fixtureRef: "corporate_quote.brand_owner",
        expected: "allow",
        mutating: false,
        sensitivity: "financial",
    },
    {
        id: "REN-124-corporate_quote-unrelated-brand",
        resource: "corporate_quote",
        accessMode: "wrong_user",
        persona: "unrelated_brand",
        scope: "brand",
        channel: "browser",
        method: "GET",
        target: definitions.corporate_quote.target,
        fixtureRef: "corporate_quote.unrelated_brand",
        expected: "forbidden",
        mutating: false,
        sensitivity: "financial",
    },
    {
        id: "REN-124-corporate_quote-admin",
        resource: "corporate_quote",
        accessMode: "owner",
        persona: "privileged_admin",
        scope: "admin",
        channel: "browser",
        method: "GET",
        target: definitions.corporate_quote.target,
        fixtureRef: "corporate_quote.admin",
        expected: "allow",
        mutating: false,
        sensitivity: "financial",
    }
);

export function validateMatrix(cases: MatrixCase[]): string[] {
    const errors: string[] = [];
    const ids = new Set<string>();

    for (const item of cases) {
        if (ids.has(item.id)) errors.push("duplicate case id");
        ids.add(item.id);
        if (item.mutating) errors.push("mutating case is not allowed");
        if (!item.resource || !item.accessMode || !item.persona || !item.scope || !item.fixtureRef) {
            errors.push("case metadata is incomplete");
        }
        if (!item.target || !item.channel || item.method !== "GET") {
            errors.push("case transport is incomplete or mutating");
        }
    }

    for (const resource of resources) {
        for (const mode of accessModes) {
            if (!cases.some((item) => item.resource === resource && item.accessMode === mode)) {
                errors.push(`missing ${resource}/${mode} case`);
            }
        }
    }

    return errors;
}

const trpcOutcomeMap: Record<string, NormalizedOutcome> = {
    UNAUTHORIZED: "unauthorized",
    FORBIDDEN: "forbidden",
    NOT_FOUND: "not_found",
    BAD_REQUEST: "validation_error",
    TOO_MANY_REQUESTS: "error",
};

export function normalizeHttpOutcome({
    status,
    trpcCode,
}: {
    status: number;
    trpcCode?: string | null;
}): NormalizedOutcome {
    if (trpcCode && trpcOutcomeMap[trpcCode]) return trpcOutcomeMap[trpcCode];
    if (status >= 200 && status < 300) return "allow";
    if (status === 301 || status === 302 || status === 303 || status === 307 || status === 308)
        return "redirect";
    if (status === 400) return "validation_error";
    if (status === 401) return "unauthorized";
    if (status === 403) return "forbidden";
    if (status === 404) return "not_found";
    return "error";
}

type TargetOptions = {
    allowNonLocal?: boolean;
    acknowledgement?: string;
};

function isLocalHostname(hostname: string) {
    return hostname === "localhost" || hostname === "::1";
}

export function validateTargetOrigin(
    target: string,
    allowedOrigins: string[],
    options: TargetOptions = {}
) {
    let parsed: URL;
    try {
        parsed = new URL(target);
    } catch {
        throw new Error("target origin is not a valid URL");
    }
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.pathname !== "/" || parsed.search || parsed.hash) {
        throw new Error("target must be an HTTP(S) origin");
    }
    const origin = parsed.origin;
    if (!allowedOrigins.includes(origin)) {
        throw new Error("target is not in IDOR_ALLOWED_ORIGINS");
    }
    const local = isLocalHostname(parsed.hostname) || isIP(parsed.hostname) === 6 && parsed.hostname === "::1";
    if (!local && (!options.allowNonLocal || options.acknowledgement !== "REN-124-STAGING")) {
        throw new Error("non-local target acknowledgement is required");
    }
    return { origin, local };
}

export type IdorFixtures = {
    ownerUserId: string;
    wrongUserId: string;
    ownerBrandId: string;
    wrongBrandId: string;
    resources: {
        order: { id: string; ownerUserId: string; tamperedId: string };
        invoice: {
            orderId: string;
            ownerUserId: string;
            token: string;
            wrongToken: string;
            mismatchOrderId: string;
        };
        corporateQuote: {
            id: string;
            ownerUserId: string;
            ownerBrandId: string;
            tamperedId: string;
        };
        paymentRequest: {
            token: string;
            wrongToken: string;
            status: "open" | "paid" | "expired" | "cancelled";
        };
        address: { id: string; ownerUserId: string; tamperedId: string };
        cart: { ownerUserId: string; tamperedUserId: string };
    };
};

export function validateFixtureContract(fixtures: IdorFixtures): string[] {
    const errors: string[] = [];
    if (fixtures.ownerUserId === fixtures.wrongUserId) {
        errors.push("owner and wrong-user identities must differ");
    }
    if (fixtures.ownerBrandId === fixtures.wrongBrandId) {
        errors.push("owner and wrong-brand identities must differ");
    }
    if (fixtures.resources.order.ownerUserId !== fixtures.ownerUserId) {
        errors.push("order owner does not match owner identity");
    }
    if (fixtures.resources.invoice.ownerUserId !== fixtures.ownerUserId) {
        errors.push("invoice owner does not match owner identity");
    }
    if (fixtures.resources.corporateQuote.ownerUserId !== fixtures.ownerUserId) {
        errors.push("quote owner does not match owner identity");
    }
    if (fixtures.resources.corporateQuote.ownerBrandId !== fixtures.ownerBrandId) {
        errors.push("quote brand does not match owner brand identity");
    }
    if (fixtures.resources.address.ownerUserId !== fixtures.ownerUserId) {
        errors.push("address owner does not match owner identity");
    }
    if (fixtures.resources.cart.ownerUserId !== fixtures.ownerUserId) {
        errors.push("cart owner does not match owner identity");
    }
    if (!fixtures.resources.paymentRequest.token.trim()) {
        errors.push("payment-request token is required");
    }
    if (fixtures.resources.paymentRequest.token === fixtures.resources.paymentRequest.wrongToken) {
        errors.push("valid and wrong payment-request tokens must differ");
    }
    if (fixtures.resources.invoice.token === fixtures.resources.invoice.wrongToken) {
        errors.push("valid and wrong invoice tokens must differ");
    }
    if (fixtures.resources.invoice.orderId === fixtures.resources.invoice.mismatchOrderId) {
        errors.push("invoice order and mismatch order must differ");
    }
    if (fixtures.resources.order.id === fixtures.resources.order.tamperedId) {
        errors.push("order and tampered identifiers must differ");
    }
    if (fixtures.resources.corporateQuote.id === fixtures.resources.corporateQuote.tamperedId) {
        errors.push("quote and tampered identifiers must differ");
    }
    if (fixtures.resources.address.id === fixtures.resources.address.tamperedId) {
        errors.push("address and tampered identifiers must differ");
    }
    return errors;
}

function getResourceValue(
    item: MatrixCase,
    fixtures: IdorFixtures
): { id?: string; token?: string } {
    if (item.resource === "address") {
        return {
            id:
                item.accessMode === "tampered_identifier"
                    ? fixtures.resources.address.tamperedId
                    : fixtures.resources.address.id,
        };
    }
    if (item.resource === "invoice") {
        return {
            id:
                item.accessMode === "tampered_identifier"
                    ? fixtures.resources.invoice.mismatchOrderId
                    : fixtures.resources.invoice.orderId,
            token:
                item.accessMode === "tampered_identifier"
                    ? fixtures.resources.invoice.wrongToken
                    : fixtures.resources.invoice.token,
        };
    }
    if (item.resource === "payment_request") {
        return {
            token:
                item.accessMode === "tampered_identifier"
                    ? fixtures.resources.paymentRequest.wrongToken
                    : fixtures.resources.paymentRequest.token,
        };
    }
    return {};
}

export function buildApiRequest(
    item: MatrixCase,
    origin: string,
    fixtures: IdorFixtures
): { url: string; method: "GET"; headers: Record<string, string> } {
    const value = getResourceValue(item, fixtures);
    if (item.resource === "address") {
        const input = encodeURIComponent(JSON.stringify({ addressId: value.id }));
        return {
            url: `${origin}/api/trpc/general.addresses.getAddressById?input=${input}`,
            method: "GET",
            headers: {},
        };
    }
    if (item.resource === "invoice") {
        return {
            url: `${origin}/api/invoices/${encodeURIComponent(value.id ?? "")}/download?token=${encodeURIComponent(value.token ?? "")}`,
            method: "GET",
            headers: {},
        };
    }
    if (item.resource === "payment_request") {
        return {
            url: `${origin}/api/corporate-payment-requests/${encodeURIComponent(value.token ?? "")}`,
            method: "GET",
            headers: {},
        };
    }
    throw new Error(`no direct HTTP request mapping for ${item.resource}`);
}

export function buildBrowserUrl(
    item: MatrixCase,
    origin: string,
    fixtures: IdorFixtures
) {
    const value =
        item.resource === "order"
            ? item.accessMode === "tampered_identifier"
                ? fixtures.resources.order.tamperedId
                : fixtures.resources.order.id
            : item.resource === "corporate_quote"
              ? item.accessMode === "tampered_identifier"
                  ? fixtures.resources.corporateQuote.tamperedId
                  : fixtures.resources.corporateQuote.id
              : item.resource === "cart"
                ? item.accessMode === "wrong_user"
                    ? fixtures.wrongUserId
                    : item.accessMode === "tampered_identifier"
                      ? fixtures.resources.cart.tamperedUserId
                      : fixtures.ownerUserId
                : "";
    return new URL(item.target.replace(/\{[^}]+\}/g, encodeURIComponent(value)), origin).toString();
}

export function redactResult(result: {
    caseId: string;
    resource: IdorResource;
    accessMode: AccessMode;
    persona: Persona;
    expected: NormalizedOutcome;
    observed: NormalizedOutcome;
    status: number | null;
    errorCode?: string | null;
    targetOriginHash: string;
    startedAt: string;
    durationMs: number;
    attempt: number;
}) {
    return {
        manifestVersion: IDOR_MANIFEST_VERSION,
        runner: "http",
        ...result,
    };
}
