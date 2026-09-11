import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import {
    buildApiRequest,
    idorMatrix,
    normalizeHttpOutcome,
    redactResult,
    type AccessMode,
    type IdorFixtures,
    type MatrixCase,
    type NormalizedOutcome,
    validateFixtureContract,
    validateMatrix,
    validateTargetOrigin,
} from "./idor-test-matrix";

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

function originHash(origin: string) {
    return createHash("sha256").update(origin).digest("hex").slice(0, 16);
}

function cookieForCase(accessMode: AccessMode) {
    if (accessMode === "owner") return process.env.IDOR_OWNER_COOKIE;
    if (accessMode === "wrong_user") return process.env.IDOR_WRONG_USER_COOKIE;
    return undefined;
}

function trpcCodeFromBody(body: string) {
    try {
        const parsed = JSON.parse(body) as {
            error?: { json?: { data?: { code?: string } } };
        };
        return parsed.error?.json?.data?.code ?? null;
    } catch {
        return null;
    }
}

function expectedForCase(item: MatrixCase): NormalizedOutcome {
    return item.expected;
}

export async function runApiMatrix({
    origin,
    allowedOrigins,
    fixtures,
    fetchImpl = fetch,
}: {
    origin: string;
    allowedOrigins: string[];
    fixtures: IdorFixtures;
    fetchImpl?: FetchLike;
}) {
    const target = validateTargetOrigin(origin, allowedOrigins, {
        allowNonLocal: process.env.IDOR_ALLOW_NONLOCAL_TARGET === "true",
        acknowledgement: process.env.IDOR_NONLOCAL_ACKNOWLEDGEMENT,
    });
    const matrixErrors = validateMatrix(idorMatrix);
    const fixtureErrors = validateFixtureContract(fixtures);
    if (matrixErrors.length) throw new Error(matrixErrors.join("; "));
    if (fixtureErrors.length) throw new Error(fixtureErrors.join("; "));

    const results = [];
    for (const item of idorMatrix.filter((entry) => entry.channel === "http")) {
        const cookie = cookieForCase(item.accessMode);
        if ((item.accessMode === "owner" || item.accessMode === "wrong_user") && !cookie) {
            throw new Error(`missing auth cookie for ${item.accessMode} API cases`);
        }
        const request = buildApiRequest(item, target.origin, fixtures);
        const startedAt = new Date().toISOString();
        const started = Date.now();
        let response: Response;
        let observed: NormalizedOutcome;
        let errorCode: string | null = null;
        try {
            response = await fetchImpl(request.url, {
                method: request.method,
                headers: cookie ? { ...request.headers, Cookie: cookie } : request.headers,
                redirect: "manual",
                signal: AbortSignal.timeout(15_000),
            });
            const body = await response.text();
            errorCode = trpcCodeFromBody(body);
            observed = normalizeHttpOutcome({ status: response.status, trpcCode: errorCode });
            const location = response.headers.get("location");
            if (location) validateTargetOrigin(new URL(location, request.url).origin, allowedOrigins, {
                allowNonLocal: process.env.IDOR_ALLOW_NONLOCAL_TARGET === "true",
                acknowledgement: process.env.IDOR_NONLOCAL_ACKNOWLEDGEMENT,
            });
        } catch (error) {
            observed = "error";
            errorCode = error instanceof Error ? error.name : "UnknownError";
            response = new Response(null, { status: 0 });
        }
        results.push(
            redactResult({
                caseId: item.id,
                resource: item.resource,
                accessMode: item.accessMode,
                persona: item.persona,
                expected: expectedForCase(item),
                observed,
                status: response.status || null,
                errorCode,
                targetOriginHash: originHash(target.origin),
                startedAt,
                durationMs: Date.now() - started,
                attempt: 1,
            })
        );
    }

    return {
        manifestVersion: "ren-124-v1",
        runner: "http",
        targetOriginHash: originHash(target.origin),
        results,
        passed: results.every((result) => result.expected === result.observed),
    };
}

async function main() {
    const origin = process.env.IDOR_TARGET_ORIGIN;
    const allowedOrigins = (process.env.IDOR_ALLOWED_ORIGINS ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    const fixturePath = process.env.IDOR_FIXTURES_FILE;
    if (!origin || !allowedOrigins.length || !fixturePath) {
        throw new Error(
            "Set IDOR_TARGET_ORIGIN, IDOR_ALLOWED_ORIGINS, and IDOR_FIXTURES_FILE before running the matrix."
        );
    }
    const fixtures = JSON.parse(await readFile(fixturePath, "utf8")) as IdorFixtures;
    const report = await runApiMatrix({ origin, allowedOrigins, fixtures });
    console.log(JSON.stringify(report, null, 2));
    if (!report.passed) process.exitCode = 1;
}

if (import.meta.main) {
    main().catch((error) => {
        console.error(error instanceof Error ? error.message : "IDOR API matrix failed");
        process.exitCode = 1;
    });
}
