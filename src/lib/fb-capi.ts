import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { capiLogs } from "@/lib/db/schema";
import { shouldRunExternalSideEffects } from "@/lib/external-side-effects";
import { sanitizeFbUserData } from "@/lib/fbpixel";
import { env } from "../../env";
import {
    CustomData,
    EventRequest,
    FacebookAdsApi,
    ServerEvent,
    UserData,
} from "facebook-nodejs-business-sdk";

const ACCESS_TOKEN = env.FACEBOOK_CAPI_ACCESS_TOKEN;
const PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || "618442627790500";

export const CAPI_META_TIMEOUT_MS = 3_000;
export const CAPI_LOG_TIMEOUT_MS = 1_000;

FacebookAdsApi.init(ACCESS_TOKEN ?? "");

export type CapiUserData = {
    em?: string;
    ph?: string;
    fn?: string;
    ln?: string;
    db?: string;
    ge?: string;
    ct?: string;
    st?: string;
    zp?: string;
    country?: string;
    external_id?: string;
    fb_login_id?: string;
    client_ip_address?: string;
    client_user_agent?: string;
    fbp?: string;
    fbc?: string;
};

export type CapiCustomData = {
    content_name?: string;
    content_category?: string;
    content_ids?: string[];
    content_type?: string;
    value?: number;
    currency?: string;
    order_id?: string;
    predicted_ltv?: number;
    num_items?: number;
    search_string?: string;
    status?: string;
    delivery_category?: string;
};

export type CapiOutcome =
    | "accepted"
    | "provider_rejected"
    | "timed_out"
    | "transport_error"
    | "invalid_response"
    | "pending";

export type CapiResponse = {
    version: 1;
    outcome: CapiOutcome;
    httpStatus?: number;
    code?: string;
    message?: string;
};

export type CapiTimerApi = {
    setTimeout: (callback: () => void, timeoutMs: number) => unknown;
    clearTimeout: (timer: unknown) => void;
};

export type CancellableQuery<T> = PromiseLike<T> & { cancel: () => void };

export type CapiLogWriter = {
    insertPending: (values: {
        eventName: string;
        eventId: string;
        userData: CapiUserData;
        customData: CapiCustomData;
        status: "pending";
        response: CapiResponse;
    }) => CancellableQuery<Array<{ id: string }>>;
    updateTerminal: (
        id: string,
        values: { status: "success" | "failed"; response: CapiResponse }
    ) => CancellableQuery<unknown>;
};

type CapiLogQueryOutcome<T> =
    | { state: "fulfilled"; value: T }
    | { state: "rejected"; error: unknown }
    | { state: "timed_out" };

type CapiHttpServiceDependencies = {
    fetch: typeof fetch;
    timers: CapiTimerApi;
    timeoutMs?: number;
};

type CapiSenderDependencies = CapiHttpServiceDependencies & {
    accessToken?: string;
    pixelId: string;
    logWriter: CapiLogWriter;
    now: () => number;
    shouldRunExternalSideEffects: () => Promise<boolean>;
    sanitizeUserData?: (userData: CapiUserData) => CapiUserData;
};

class CapiAttemptError extends Error {
    constructor(
        readonly outcome: Exclude<CapiOutcome, "accepted" | "pending">,
        readonly httpStatus?: number,
        readonly code?: string,
        message?: string
    ) {
        super(message);
    }
}

const defaultTimers: CapiTimerApi = {
    setTimeout: (callback, timeoutMs) => setTimeout(callback, timeoutMs),
    clearTimeout: (timer) => clearTimeout(timer as ReturnType<typeof setTimeout>),
};

function safeScalar(value: unknown): string | undefined {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }
}

function redact(value: string | undefined, accessToken?: string): string | undefined {
    if (!value) return undefined;
    return accessToken ? value.split(accessToken).join("[REDACTED]") : value;
}

function errorDetails(error: unknown, accessToken?: string) {
    const source = error && typeof error === "object" ? (error as Record<string, unknown>) : {};
    const nested = source.error && typeof source.error === "object"
        ? (source.error as Record<string, unknown>)
        : {};
    return {
        code: safeScalar(source.code) ?? safeScalar(nested.code),
        message: redact(
            safeScalar(source.message) ?? safeScalar(nested.message) ?? safeScalar(error),
            accessToken
        ),
    };
}

function isAcceptedMetaResponse(body: unknown): body is { events_received: number } {
    return Boolean(
        body &&
        typeof body === "object" &&
        typeof (body as Record<string, unknown>).events_received === "number"
    );
}

function toCapiResponse(error: unknown, accessToken?: string): CapiResponse {
    if (error instanceof CapiAttemptError) {
        const { code, message } = errorDetails(error, accessToken);
        return {
            version: 1,
            outcome: error.outcome,
            ...(error.httpStatus === undefined ? {} : { httpStatus: error.httpStatus }),
            ...(error.code ?? code ? { code: error.code ?? code } : {}),
            ...(message ? { message } : {}),
        };
    }

    const { code, message } = errorDetails(error, accessToken);
    return {
        version: 1,
        outcome: "transport_error",
        ...(code ? { code } : {}),
        ...(message ? { message } : {}),
    };
}

function reportDatabaseProblem(operation: "insert" | "update", error: unknown) {
    const { message } = errorDetails(error, ACCESS_TOKEN);
    console.error("CAPI log database operation did not settle", { operation, message });
}

export function createCapiHttpService({
    fetch: fetchImpl,
    timers,
    timeoutMs = CAPI_META_TIMEOUT_MS,
}: CapiHttpServiceDependencies) {
    return {
        executeRequest: async (
            url: string,
            method: string,
            headers: Record<string, string>,
            params: Record<string, unknown>
        ) => {
            const controller = new AbortController();
            let deadlineReached = false;
            let request: Promise<Response>;

            try {
                request = Promise.resolve(
                    fetchImpl(url, {
                        method,
                        headers,
                        body: JSON.stringify(params),
                        signal: controller.signal,
                    })
                );
            } catch (error) {
                request = Promise.reject(error);
            }

            const deadline = timers.setTimeout(() => {
                deadlineReached = true;
                controller.abort();
            }, timeoutMs);

            try {
                const response = await request;
                if (deadlineReached) {
                    throw new CapiAttemptError("timed_out", undefined, undefined, "Meta request timed out");
                }

                if (!response.ok) {
                    let body: unknown;
                    try {
                        body = await response.json();
                    } catch {
                        throw new CapiAttemptError("provider_rejected", response.status, undefined, "Meta rejected the event");
                    }
                    const details = errorDetails(body);
                    throw new CapiAttemptError(
                        "provider_rejected",
                        response.status,
                        details.code,
                        details.message ?? "Meta rejected the event"
                    );
                }

                let body: unknown;
                try {
                    body = await response.json();
                } catch {
                    throw new CapiAttemptError("invalid_response", response.status, undefined, "Meta response was not JSON");
                }

                if (!isAcceptedMetaResponse(body)) {
                    throw new CapiAttemptError("invalid_response", response.status, undefined, "Meta response was malformed");
                }

                return body;
            } catch (error) {
                if (error instanceof CapiAttemptError) throw error;
                if (deadlineReached) {
                    throw new CapiAttemptError("timed_out", undefined, undefined, "Meta request timed out");
                }
                const details = errorDetails(error);
                throw new CapiAttemptError("transport_error", undefined, details.code, details.message);
            } finally {
                timers.clearTimeout(deadline);
            }
        },
    };
}

export function runCapiLogQuery<T>(
    query: CancellableQuery<T>,
    timers: CapiTimerApi = defaultTimers,
    timeoutMs = CAPI_LOG_TIMEOUT_MS
): Promise<CapiLogQueryOutcome<T>> {
    return new Promise((resolve) => {
        let settled = false;
        let deadline: unknown;

        const finish = (outcome: CapiLogQueryOutcome<T>) => {
            if (settled) return;
            settled = true;
            timers.clearTimeout(deadline);
            resolve(outcome);
        };

        try {
            query.then(
                (value) => finish({ state: "fulfilled", value }),
                (error) => finish({ state: "rejected", error })
            );
        } catch (error) {
            finish({ state: "rejected", error });
            return;
        }

        deadline = timers.setTimeout(() => {
            if (settled) return;
            try {
                query.cancel();
            } catch (error) {
                reportDatabaseProblem("update", error);
            }
            finish({ state: "timed_out" });
        }, timeoutMs);
    });
}

function buildDefaultLogWriter(): CapiLogWriter {
    return {
        insertPending(values) {
            const statement = db
                .insert(capiLogs)
                .values({
                    eventName: values.eventName,
                    eventId: values.eventId,
                    userData: values.userData,
                    customData: values.customData,
                    status: values.status,
                    response: values.response,
                })
                .returning({ id: capiLogs.id })
                .toSQL();
            return db.$client.unsafe(statement.sql, statement.params) as unknown as CancellableQuery<Array<{ id: string }>>;
        },
        updateTerminal(id, values) {
            const statement = db
                .update(capiLogs)
                .set(values)
                .where(eq(capiLogs.id, id))
                .toSQL();
            return db.$client.unsafe(statement.sql, statement.params) as unknown as CancellableQuery<unknown>;
        },
    };
}

function createServerEvent(
    eventName: string,
    userData: CapiUserData,
    customData: CapiCustomData,
    eventId: string,
    eventSourceUrl: string,
    timestamp: number
) {
    const user = new UserData();
    if (userData.em) user.setEmail(userData.em);
    if (userData.ph) user.setPhone(userData.ph);
    if (userData.fn) user.setFirstName(userData.fn);
    if (userData.ln) user.setLastName(userData.ln);
    if (userData.db) user.setDateOfBirth(userData.db);
    if (userData.ge) user.setGender(userData.ge);
    if (userData.ct) user.setCity(userData.ct);
    if (userData.st) user.setState(userData.st);
    if (userData.zp) user.setZip(userData.zp);
    if (userData.country) user.setCountry(userData.country);
    if (userData.external_id) user.setExternalId(userData.external_id);
    if (userData.fb_login_id) user.setFbLoginId(userData.fb_login_id);
    if (userData.client_ip_address) user.setClientIpAddress(userData.client_ip_address);
    if (userData.client_user_agent) user.setClientUserAgent(userData.client_user_agent);
    if (userData.fbp) user.setFbp(userData.fbp);
    if (userData.fbc) user.setFbc(userData.fbc);

    const custom = new CustomData();
    if (customData.content_name) custom.setContentName(customData.content_name);
    if (customData.content_category) custom.setContentCategory(customData.content_category);
    if (customData.content_ids) custom.setContentIds(customData.content_ids);
    if (customData.content_type) custom.setContentType(customData.content_type);
    if (customData.value !== undefined) custom.setValue(customData.value);
    if (customData.currency) custom.setCurrency(customData.currency);
    if (customData.order_id) custom.setOrderId(customData.order_id);
    if (customData.predicted_ltv !== undefined) custom.setPredictedLtv(customData.predicted_ltv);
    if (customData.num_items !== undefined) custom.setNumItems(customData.num_items);
    if (customData.search_string) custom.setSearchString(customData.search_string);
    if (customData.status) custom.setStatus(customData.status);
    if (customData.delivery_category) custom.setDeliveryCategory(customData.delivery_category);

    return new ServerEvent()
        .setEventName(eventName)
        .setEventTime(timestamp)
        .setUserData(user)
        .setCustomData(custom)
        .setEventSourceUrl(eventSourceUrl)
        .setActionSource("website")
        .setEventId(eventId);
}

function runLogOperation<T>(
    operation: "insert" | "update",
    start: () => CancellableQuery<T>,
    timers: CapiTimerApi
) {
    try {
        return runCapiLogQuery(start(), timers).then((outcome) => {
            if (outcome.state === "rejected") reportDatabaseProblem(operation, outcome.error);
            return outcome;
        });
    } catch (error) {
        reportDatabaseProblem(operation, error);
        return Promise.resolve({ state: "rejected", error } as CapiLogQueryOutcome<T>);
    }
}

export function createCapiEventSender(dependencies: CapiSenderDependencies) {
    return async (
        eventName: string,
        userData: CapiUserData,
        customData: CapiCustomData,
        eventId: string,
        eventSourceUrl: string
    ) => {
        if (!(await dependencies.shouldRunExternalSideEffects())) {
            console.info(`Skipping CAPI event '${eventName}': external side effects are disabled.`);
            return { skipped: true, reason: "external_side_effects_disabled" };
        }

        if (!dependencies.accessToken) {
            console.warn("FACEBOOK_ACCESS_TOKEN not found, skipping CAPI event.");
            return;
        }

        const safeUserData = dependencies.sanitizeUserData?.(userData) ?? userData;
        const serverEvent = createServerEvent(
            eventName,
            safeUserData,
            customData,
            eventId,
            eventSourceUrl,
            Math.floor(dependencies.now() / 1_000)
        );
        const eventRequest = new EventRequest(dependencies.accessToken, dependencies.pixelId)
            .setEvents([serverEvent])
            .setHttpService(createCapiHttpService(dependencies));

        const metaPromise = eventRequest.execute()
            .then((): CapiResponse => ({ version: 1, outcome: "accepted" }))
            .catch((error): CapiResponse => toCapiResponse(error, dependencies.accessToken));
        const pendingPromise = runLogOperation(
            "insert",
            () => dependencies.logWriter.insertPending({
                eventName,
                eventId,
                userData,
                customData,
                status: "pending",
                response: { version: 1, outcome: "pending" },
            }),
            dependencies.timers
        );

        const [metaResult, pendingResult] = await Promise.allSettled([metaPromise, pendingPromise]);
        const response = metaResult.status === "fulfilled"
            ? metaResult.value
            : toCapiResponse(metaResult.reason, dependencies.accessToken);
        const pendingOutcome = pendingResult.status === "fulfilled" ? pendingResult.value : undefined;

        if (pendingOutcome?.state === "fulfilled") {
            const id = pendingOutcome.value[0]?.id;
            if (id) {
                await runLogOperation(
                    "update",
                    () => dependencies.logWriter.updateTerminal(id, {
                        status: response.outcome === "accepted" ? "success" : "failed",
                        response,
                    }),
                    dependencies.timers
                );
            }
        }

        return response;
    };
}

export const sendCapiEvent = createCapiEventSender({
    accessToken: ACCESS_TOKEN,
    pixelId: PIXEL_ID,
    fetch: globalThis.fetch,
    logWriter: buildDefaultLogWriter(),
    now: () => Date.now(),
    timers: defaultTimers,
    shouldRunExternalSideEffects,
    sanitizeUserData: (userData) => sanitizeFbUserData(userData) as CapiUserData,
});
