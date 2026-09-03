import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { expect, test } from "bun:test";

type CancellableQuery<T> = PromiseLike<T> & { cancel: () => void };
type CapiTimerApi = {
    setTimeout: (callback: () => void, timeoutMs: number) => unknown;
    clearTimeout: (timer: unknown) => void;
};
type CapiLogWriter = {
    insertPending: (
        values: Record<string, unknown>
    ) => CancellableQuery<Array<{ id: string }>>;
    updateTerminal: (
        id: string,
        values: Record<string, unknown>
    ) => CancellableQuery<unknown>;
};
type CapiModule = {
    prepareCapiUserDataForMeta?: (
        userData: Record<string, string>
    ) => Record<string, string>;
    createCapiEventSender?: (
        dependencies: Record<string, unknown>
    ) => (...args: typeof event) => Promise<unknown>;
    createCapiHttpService?: (dependencies: Record<string, unknown>) => {
        executeRequest: (...args: any[]) => Promise<unknown>;
    };
    runCapiLogQuery?: (
        query: CancellableQuery<unknown>,
        timers: CapiTimerApi
    ) => Promise<unknown>;
};

Object.assign(process.env, {
    CLERK_SECRET_KEY: "test",
    SVIX_SECRET: "test",
    DATABASE_URL: "postgres://test:test@localhost:5432/test",
    REDIS_URL: "redis://localhost:6379",
    UPLOADTHING_TOKEN: "test",
    JWT_SECRET_KEY: "test",
    GOOGLE_ANALYTICS_ID: "test",
    FACEBOOK_CAPI_ACCESS_TOKEN: "test-access-token",
    RESEND_API_KEY: "test",
    RAZOR_PAY_KEY_ID: "test",
    RAZOR_PAY_SECRET_KEY: "test",
    RAZOR_PAY_WEBHOOK_SECRET: "test",
    RESEND_EMAIL_FROM: "test@example.com",
    RENIVET_EMAIL_1: "one@example.com",
    RENIVET_EMAIL_2: "two@example.com",
    SHIPROCKET_LOGIN_EMAIL: "test@example.com",
    SHIPROCKET_LOGIN_PASSWORD: "test",
    SHIPROCKET_WEBHOOK_API_KEY: "test",
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "test",
    NEXT_PUBLIC_RAZOR_PAY_KEY_ID: "test",
    NEXT_PUBLIC_FACEBOOK_APP_ID: "test",
    NEXT_PUBLIC_POSTHOG_KEY: "test",
    NEXT_PUBLIC_POSTHOG_HOST: "https://example.com",
});
const capi = (await import("./fb-capi")) as CapiModule;
const implementationAvailable = Boolean(
    capi.createCapiEventSender &&
        capi.createCapiHttpService &&
        capi.runCapiLogQuery
);
const behaviorTest = implementationAvailable ? test : test.skip;

const event = [
    "Purchase",
    { em: "test@example.com", fbp: "fb.1.123.456" },
    { value: 42, currency: "INR", order_id: "order-1" },
    "event-1",
    "https://renivet.example/checkout",
] as const;

type Deferred<T> = {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (error: unknown) => void;
};

function deferred<T>(): Deferred<T> {
    let resolve!: (value: T) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<T>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return { promise, resolve, reject };
}

function createTimers(): CapiTimerApi & {
    callbacks: (() => void)[];
    cleared: unknown[];
} {
    const callbacks: (() => void)[] = [];
    const cleared: unknown[] = [];
    return {
        callbacks,
        cleared,
        setTimeout(callback) {
            callbacks.push(callback);
            return callback;
        },
        clearTimeout(timer) {
            cleared.push(timer);
        },
    };
}

function resolvedQuery<T>(value: T) {
    return Object.assign(Promise.resolve(value), { cancel() {} });
}

function createWriter(overrides: Partial<CapiLogWriter> = {}) {
    const writes: Array<{
        kind: "pending" | "terminal";
        values: Record<string, unknown>;
    }> = [];
    const writer: CapiLogWriter = {
        insertPending(values) {
            writes.push({ kind: "pending", values });
            return resolvedQuery([{ id: "inserted-row" }]);
        },
        updateTerminal(id, values) {
            writes.push({ kind: "terminal", values: { id, ...values } });
            return resolvedQuery([]);
        },
        ...overrides,
    };
    return { writer, writes };
}

function createSender(
    fetchImpl: typeof fetch,
    logWriter: CapiLogWriter,
    timers = createTimers()
) {
    return {
        send: capi.createCapiEventSender!({
            accessToken: "test-access-token",
            pixelId: "pixel-123",
            fetch: fetchImpl,
            logWriter,
            now: () => 1_700_000_000_000,
            timers,
            shouldRunExternalSideEffects: async () => true,
        }),
        timers,
    };
}

function acceptedResponse(
    body: Record<string, unknown> = { events_received: 1 }
) {
    return {
        ok: true,
        status: 200,
        json: async () => body,
    } as Response;
}

test("reads the CAPI access token from the typed server environment", async () => {
    const [capiSource, envSource] = await Promise.all([
        readFile(new URL("./fb-capi.ts", import.meta.url), "utf8"),
        readFile(new URL("../../env.ts", import.meta.url), "utf8"),
    ]);

    expect(capiSource).toContain('import { env } from "../../env";');
    expect(capiSource).toContain(
        "const ACCESS_TOKEN = env.FACEBOOK_CAPI_ACCESS_TOKEN;"
    );
    expect(capiSource).not.toMatch(/const ACCESS_TOKEN\s*=\s*["']/);
    expect(envSource).toContain("FACEBOOK_CAPI_ACCESS_TOKEN");
});

test("provides the bounded CAPI transport and logging seams", () => {
    expect(implementationAvailable).toBe(true);
});

test("hashes external_id only for Meta while preserving browser identifiers", () => {
    const rawUserData = {
        em: "Buyer@Renivet.com",
        external_id: "user_123",
        fbp: "fb.1.1558571054389.1098115397",
        fbc: "fb.1.1554763741205.AbCdEfGhIjKlMnOpQrStUvWxYz1234567890",
    };

    expect(capi.prepareCapiUserDataForMeta?.(rawUserData)).toEqual({
        em: "buyer@renivet.com",
        external_id: createHash("sha256").update("user_123").digest("hex"),
        fbp: rawUserData.fbp,
        fbc: rawUserData.fbc,
    });
});

test("omits malformed browser identifiers from the outbound Meta payload", () => {
    expect(
        capi.prepareCapiUserDataForMeta?.({
            external_id: "user_123",
            fbp: "malformed-fbp",
            fbc: "malformed-fbc",
        })
    ).toEqual({
        external_id: createHash("sha256").update("user_123").digest("hex"),
    });
});

behaviorTest(
    "keeps CAPI logs raw while hashing only the outbound Meta external id",
    async () => {
        const calls: Array<{ url: string; init?: RequestInit }> = [];
        const { writer, writes } = createWriter();
        const rawUserData = {
            em: "buyer@renivet.com",
            external_id: "user_123",
            fbp: "fb.1.1558571054389.1098115397",
            fbc: "fb.1.1554763741205.AbCdEf123",
        };
        const send = capi.createCapiEventSender!({
            accessToken: "test-access-token",
            pixelId: "pixel-123",
            fetch: async (url: URL | RequestInfo, init?: RequestInit) => {
                calls.push({ url: String(url), init });
                return acceptedResponse();
            },
            logWriter: writer,
            now: () => 1_700_000_000_000,
            timers: createTimers(),
            shouldRunExternalSideEffects: async () => true,
            sanitizeUserData: capi.prepareCapiUserDataForMeta,
        });

        await send(
            "Purchase",
            rawUserData,
            { value: 42, currency: "INR", order_id: "order-1" },
            "event-1",
            "https://renivet.com/checkout"
        );

        expect(writes[0]).toMatchObject({
            kind: "pending",
            values: { userData: rawUserData },
        });
        const body = JSON.parse(String(calls[0].init?.body));
        expect(body.data[0].user_data).toMatchObject({
            external_id: [
                createHash("sha256").update("user_123").digest("hex"),
            ],
            fbp: rawUserData.fbp,
            fbc: rawUserData.fbc,
        });
    }
);

behaviorTest(
    "sends SDK-generated URL, headers, and params through the custom HTTP service",
    async () => {
        const calls: Array<{ url: string; init?: RequestInit }> = [];
        const { writer, writes } = createWriter();
        const providerResponse = {
            events_received: 1,
            trace_id: "meta-trace-1",
        };
        const { send, timers } = createSender(async (url, init) => {
            calls.push({ url: String(url), init });
            return acceptedResponse(providerResponse);
        }, writer);

        const result = await send(...event);

        expect(result).toEqual(providerResponse);
        expect(calls).toHaveLength(1);
        expect(calls[0].url).toContain("/pixel-123/events");
        expect(calls[0].init?.method).toBe("POST");
        expect(calls[0].init?.headers).toMatchObject({
            "Content-Type": "application/json",
            Accept: "application/json",
        });
        expect(JSON.parse(String(calls[0].init?.body))).toMatchObject({
            access_token: "test-access-token",
            data: [{ event_name: "Purchase", event_id: "event-1" }],
        });
        expect(writes.map((write) => write.kind)).toEqual([
            "pending",
            "terminal",
        ]);
        expect(writes[1]).toMatchObject({
            kind: "terminal",
            values: {
                status: "success",
                response: { version: 1, outcome: "accepted" },
            },
        });
        expect(timers.cleared).toHaveLength(3);
    }
);

behaviorTest(
    "aborts the underlying Meta fetch when the transport deadline fires",
    async () => {
        const timers = createTimers();
        const aborts: string[] = [];
        const service = capi.createCapiHttpService!({
            fetch: (_url, init) =>
                new Promise((_resolve, reject) => {
                    init?.signal?.addEventListener("abort", () => {
                        aborts.push("aborted");
                        reject(new DOMException("deadline", "AbortError"));
                    });
                }),
            timers,
        });

        const attempt = service.executeRequest(
            "https://graph.example/events",
            "POST",
            {},
            {}
        );
        timers.callbacks[0]!();

        await expect(attempt).rejects.toMatchObject({ outcome: "timed_out" });
        expect(aborts).toEqual(["aborted"]);
    }
);

behaviorTest("maps a non-2xx Meta response to provider_rejected", async () => {
    const { writer, writes } = createWriter();
    const providerError = { error: { code: 100, message: "bad event" } };
    const { send } = createSender(
        async () =>
            ({
                ok: false,
                status: 400,
                json: async () => providerError,
            }) as Response,
        writer
    );

    expect(await send(...event)).toEqual(providerError);
    expect(writes[1]).toMatchObject({
        kind: "terminal",
        values: {
            status: "failed",
            response: { version: 1, outcome: "provider_rejected" },
        },
    });
});

behaviorTest(
    "maps a non-JSON non-2xx Meta response to provider_rejected",
    async () => {
        const { writer, writes } = createWriter();
        const { send } = createSender(
            async () =>
                ({
                    ok: false,
                    status: 502,
                    json: async () => {
                        throw new Error("not JSON");
                    },
                }) as Response,
            writer
        );

        expect(await send(...event)).toEqual({
            message: "Meta rejected the event",
        });
        expect(writes[1]).toMatchObject({
            kind: "terminal",
            values: {
                status: "failed",
                response: { version: 1, outcome: "provider_rejected" },
            },
        });
    }
);

behaviorTest("maps a Meta network failure to transport_error", async () => {
    const { writer, writes } = createWriter();
    const { send } = createSender(async () => {
        throw new Error("socket reset");
    }, writer);

    expect(await send(...event)).toEqual({ message: "socket reset" });
    expect(writes[1]).toMatchObject({
        kind: "terminal",
        values: {
            status: "failed",
            response: { version: 1, outcome: "transport_error" },
        },
    });
});

behaviorTest(
    "maps a malformed successful Meta response to invalid_response",
    async () => {
        const { writer, writes } = createWriter();
        const { send } = createSender(
            async () =>
                ({
                    ok: true,
                    status: 200,
                    json: async () => ({ received: true }),
                }) as Response,
            writer
        );

        expect(await send(...event)).toEqual({
            message: "Meta response was malformed",
        });
        expect(writes[1]).toMatchObject({
            kind: "terminal",
            values: {
                status: "failed",
                response: { version: 1, outcome: "invalid_response" },
            },
        });
    }
);

behaviorTest(
    "starts the Meta request and pending insert before awaiting either",
    async () => {
        const meta = deferred<Response>();
        const insert = deferred<Array<{ id: string }>>();
        const started: string[] = [];
        const { writer } = createWriter({
            insertPending() {
                started.push("insert");
                return Object.assign(insert.promise, { cancel() {} });
            },
        });
        const { send } = createSender(async () => {
            started.push("meta");
            return meta.promise;
        }, writer);

        const attempt = send(...event);
        await Promise.resolve();
        await Promise.resolve();

        expect(started).toEqual(["meta", "insert"]);
        meta.resolve(acceptedResponse());
        insert.resolve([{ id: "inserted-row" }]);
        await attempt;
    }
);

behaviorTest(
    "continues the Meta attempt when the pending insert fails",
    async () => {
        const insertFailure = new Error("database unavailable");
        const { writer, writes } = createWriter({
            insertPending() {
                return Object.assign(Promise.reject(insertFailure), {
                    cancel() {},
                });
            },
        });
        const { send } = createSender(async () => acceptedResponse(), writer);

        const originalConsoleError = console.error;
        console.error = () => {};
        try {
            expect(await send(...event)).toEqual({ events_received: 1 });
            expect(writes).toEqual([]);
        } finally {
            console.error = originalConsoleError;
        }
    }
);

behaviorTest(
    "updates the inserted pending row by its returned ID after Meta settles",
    async () => {
        const { writer, writes } = createWriter({
            insertPending(values) {
                writes.push({ kind: "pending", values });
                return resolvedQuery([{ id: "row-from-insert" }]);
            },
        });
        const { send } = createSender(async () => acceptedResponse(), writer);

        await send(...event);

        expect(writes[1]).toMatchObject({
            kind: "terminal",
            values: {
                id: "row-from-insert",
                status: "success",
                response: { version: 1, outcome: "accepted" },
            },
        });
    }
);

behaviorTest(
    "cancels a pending Postgres query synchronously and observes its eventual rejection",
    async () => {
        const timers = createTimers();
        const query = deferred<unknown>();
        let cancelCalls = 0;
        let rejectionObserved = false;
        const cancellableQuery = {
            then<TResult1 = unknown, TResult2 = never>(
                onfulfilled?:
                    | ((value: unknown) => TResult1 | PromiseLike<TResult1>)
                    | null,
                onrejected?:
                    | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
                    | null
            ) {
                rejectionObserved = true;
                return query.promise.then(onfulfilled, onrejected);
            },
            cancel() {
                cancelCalls += 1;
            },
        };

        const outcome = capi.runCapiLogQuery!(cancellableQuery, timers);
        timers.callbacks[0]!();

        expect(await outcome).toMatchObject({ state: "timed_out" });
        expect(cancelCalls).toBe(1);
        expect(rejectionObserved).toBe(true);
        query.reject(new Error("cancelled by postgres"));
        await Promise.resolve();
    }
);

behaviorTest(
    "does not register a deadline after a query settles synchronously",
    async () => {
        const timers = createTimers();
        const query = {
            then(onfulfilled?: (value: unknown) => unknown) {
                onfulfilled?.("written");
                return Promise.resolve();
            },
            cancel() {},
        } as CancellableQuery<unknown>;

        await expect(
            capi.runCapiLogQuery!(query, timers)
        ).resolves.toMatchObject({
            state: "fulfilled",
            value: "written",
        });
        expect(timers.callbacks).toHaveLength(0);
        expect(timers.cleared).toHaveLength(0);
    }
);

behaviorTest(
    "labels a synchronous insert cancellation error and observes a late rejection",
    async () => {
        const timers = createTimers();
        const insert = deferred<Array<{ id: string }>>();
        const reports: unknown[][] = [];
        const originalConsoleError = console.error;
        console.error = (...args: unknown[]) => {
            reports.push(args);
        };

        try {
            const { writer, writes } = createWriter({
                insertPending(values) {
                    writes.push({ kind: "pending", values });
                    return Object.assign(insert.promise, {
                        cancel() {
                            throw new Error("cancelled synchronously");
                        },
                    });
                },
            });
            const { send } = createSender(
                async () => acceptedResponse(),
                writer,
                timers
            );
            const attempt = send(...event);
            await Promise.resolve();
            await Promise.resolve();

            timers.callbacks.at(-1)!();
            await expect(attempt).resolves.toEqual({ events_received: 1 });
            insert.reject(new Error("cancelled by postgres"));
            await Promise.resolve();

            expect(reports).toEqual([
                [
                    "CAPI log database operation did not settle",
                    { operation: "insert", message: "cancelled synchronously" },
                ],
            ]);
        } finally {
            console.error = originalConsoleError;
        }
    }
);

behaviorTest(
    "leaves an unconfirmed log write pending without retrying it",
    async () => {
        const timers = createTimers();
        const pendingInsert = deferred<Array<{ id: string }>>();
        const { writer, writes } = createWriter({
            insertPending(values) {
                writes.push({ kind: "pending", values });
                return Object.assign(pendingInsert.promise, { cancel() {} });
            },
        });
        const { send } = createSender(
            async () => acceptedResponse(),
            writer,
            timers
        );
        const attempt = send(...event);
        await Promise.resolve();
        await Promise.resolve();

        timers.callbacks.at(-1)!();
        await attempt;

        expect(writes).toHaveLength(1);
        expect(writes[0]?.values).toMatchObject({
            status: "pending",
            response: { version: 1, outcome: "pending" },
        });
    }
);
