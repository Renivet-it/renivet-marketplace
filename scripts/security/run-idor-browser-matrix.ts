import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import {
    buildBrowserUrl,
    idorMatrix,
    type AccessMode,
    type IdorFixtures,
    type MatrixCase,
    type NormalizedOutcome,
    validateFixtureContract,
    validateMatrix,
    validateTargetOrigin,
} from "./idor-test-matrix";

type CommandResult = { exitCode: number; stdout: string; stderr: string };
type CommandRunner = (args: string[], stdin?: string) => Promise<CommandResult>;

function agentBrowserInvocation(args: string[]) {
    return ["bunx", "agent-browser", ...args];
}

async function spawnCommand(args: string[], stdin?: string): Promise<CommandResult> {
    const process = Bun.spawn(agentBrowserInvocation(args), {
        stdin: "pipe",
        stdout: "pipe",
        stderr: "pipe",
    });
    if (stdin) process.stdin.write(stdin);
    process.stdin.end();
    const [stdout, stderr, exitCode] = await Promise.all([
        new Response(process.stdout).text(),
        new Response(process.stderr).text(),
        process.exited,
    ]);
    return { exitCode, stdout, stderr };
}

function requireSuccess(result: CommandResult) {
    if (result.exitCode === 0) return result.stdout.trim();
    throw new Error(result.stderr || result.stdout || "agent-browser command failed");
}

function originHash(origin: string) {
    return createHash("sha256").update(origin).digest("hex").slice(0, 16);
}

function sessionFor(accessMode: AccessMode) {
    return `ren124-${accessMode}`;
}

function stateFor(item: MatrixCase) {
    if (item.persona === "brand_owner") return process.env.IDOR_BRAND_STATE;
    if (item.persona === "unrelated_brand") return process.env.IDOR_WRONG_BRAND_STATE;
    if (item.persona === "privileged_admin") return process.env.IDOR_ADMIN_STATE;
    if (item.accessMode === "owner") return process.env.IDOR_OWNER_STATE;
    if (item.accessMode === "wrong_user") return process.env.IDOR_WRONG_USER_STATE;
    return undefined;
}

function parseUrl(output: string) {
    try {
        return new URL(output).toString();
    } catch {
        throw new Error("agent-browser returned an invalid URL");
    }
}

export function normalizeBrowserSignals({
    finalUrl,
    unauthorized,
    forbidden,
    notFound,
}: {
    finalUrl: string;
    unauthorized: boolean;
    forbidden: boolean;
    notFound: boolean;
}): NormalizedOutcome {
    if (notFound) return "not_found";
    if (unauthorized || /\/auth\/(signin|signup)/.test(finalUrl)) return "unauthorized";
    if (forbidden) return "forbidden";
    return "allow";
}

async function runBrowserCase(
    item: MatrixCase,
    origin: string,
    allowedOrigins: string[],
    fixtures: IdorFixtures,
    run: CommandRunner
) {
    const session = sessionFor(item.accessMode);
    const state = stateFor(item);
    if (item.persona !== "anonymous" && !state) {
        throw new Error(`missing browser state for ${item.accessMode} cases`);
    }
    const url = buildBrowserUrl(item, origin, fixtures);
    validateTargetOrigin(new URL(url).origin, allowedOrigins, {
        allowNonLocal: process.env.IDOR_ALLOW_NONLOCAL_TARGET === "true",
        acknowledgement: process.env.IDOR_NONLOCAL_ACKNOWLEDGEMENT,
    });
    const startedAt = new Date().toISOString();
    const started = Date.now();
    let cleanupError: unknown = null;
    let result:
        | {
              caseId: string;
              manifestVersion: string;
              runner: string;
              resource: MatrixCase["resource"];
              accessMode: MatrixCase["accessMode"];
              persona: MatrixCase["persona"];
              expected: NormalizedOutcome;
              observed: NormalizedOutcome;
              status: null;
              errorCode: string | null;
              targetOriginHash: string;
              startedAt: string;
              durationMs: number;
              attempt: number;
          }
        | undefined;
    try {
        if (state) requireSuccess(await run(["--session", session, "state", "load", state]));
        requireSuccess(await run(["--session", session, "open", url]));
        requireSuccess(await run(["--session", session, "wait", "--load", "networkidle"]));
        const finalUrl = parseUrl(requireSuccess(await run(["--session", session, "get", "url"])));
        validateTargetOrigin(new URL(finalUrl).origin, allowedOrigins, {
            allowNonLocal: process.env.IDOR_ALLOW_NONLOCAL_TARGET === "true",
            acknowledgement: process.env.IDOR_NONLOCAL_ACKNOWLEDGEMENT,
        });
        const signalOutput = requireSuccess(
            await run(
                ["--session", session, "eval", "JSON.stringify({ unauthorized: /unauthenticated|authentication required|sign in/i.test(document.body.innerText), forbidden: /forbidden|not authorized|access denied/i.test(document.body.innerText), notFound: /not found|404/i.test(document.body.innerText) })"]
            )
        );
        const signals = JSON.parse(signalOutput) as {
            unauthorized: boolean;
            forbidden: boolean;
            notFound: boolean;
        };
        const observed = normalizeBrowserSignals({ finalUrl, ...signals });
        result = {
            caseId: item.id,
            manifestVersion: "ren-124-v1",
            runner: "browser",
            resource: item.resource,
            accessMode: item.accessMode,
            persona: item.persona,
            expected: item.expected,
            observed,
            status: null,
            errorCode: null,
            targetOriginHash: originHash(origin),
            startedAt,
            durationMs: Date.now() - started,
            attempt: 1,
        };
    } catch (error) {
        result = {
            caseId: item.id,
            manifestVersion: "ren-124-v1",
            runner: "browser",
            resource: item.resource,
            accessMode: item.accessMode,
            persona: item.persona,
            expected: item.expected,
            observed: "error" as const,
            status: null,
            errorCode: error instanceof Error ? error.name : "UnknownError",
            targetOriginHash: originHash(origin),
            startedAt,
            durationMs: Date.now() - started,
            attempt: 1,
        };
    } finally {
        try {
            requireSuccess(await run(["--session", session, "close"]));
        } catch (error) {
            cleanupError = error;
        }
    }
    if (cleanupError) throw new Error("browser cleanup failed");
    return result!;
}

export async function runBrowserMatrix({
    origin,
    allowedOrigins,
    fixtures,
    run = spawnCommand,
}: {
    origin: string;
    allowedOrigins: string[];
    fixtures: IdorFixtures;
    run?: CommandRunner;
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
    for (const item of idorMatrix.filter((entry) => entry.channel === "browser")) {
        results.push(await runBrowserCase(item, target.origin, allowedOrigins, fixtures, run));
    }
    return {
        manifestVersion: "ren-124-v1",
        runner: "browser",
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
    const report = await runBrowserMatrix({ origin, allowedOrigins, fixtures });
    console.log(JSON.stringify(report, null, 2));
    if (!report.passed) process.exitCode = 1;
}

if (import.meta.main) {
    main().catch((error) => {
        console.error(error instanceof Error ? error.message : "IDOR browser matrix failed");
        process.exitCode = 1;
    });
}
