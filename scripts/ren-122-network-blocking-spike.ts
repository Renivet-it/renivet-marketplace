export type AgentBrowserCommand = string[];

export function agentBrowserInvocation(args: AgentBrowserCommand) {
    return ["bunx", "agent-browser", ...args];
}

type CommandResult = {
    exitCode: number;
    stdout: string;
    stderr?: string;
};

export type NetworkBlockingEvidence = {
    abortRule: string;
    method: "GET";
    outcome: "request_failed";
    probeUrl: string;
    responseStatus: null;
};

type CommandRunner = (
    args: AgentBrowserCommand,
    stdin?: string
) => Promise<CommandResult>;

export const providerRoutes = [
    {
        provider: "Delhivery",
        pattern: "https://track.delhivery.com/**",
        probeUrl: "https://track.delhivery.com/renivet-agent-browser-safety-probe",
    },
    {
        provider: "Twilio",
        pattern: "https://api.twilio.com/**",
        probeUrl: "https://api.twilio.com/renivet-agent-browser-safety-probe",
    },
    {
        provider: "Meta CAPI",
        pattern: "https://graph.facebook.com/**",
        probeUrl: "https://graph.facebook.com/renivet-agent-browser-safety-probe",
    },
    {
        provider: "Resend",
        pattern: "https://api.resend.com/**",
        probeUrl: "https://api.resend.com/renivet-agent-browser-safety-probe",
    },
] as const;

function probeExpression(url: string) {
    return `fetch(${JSON.stringify(url)}, { method: "GET", credentials: "omit", cache: "no-store", redirect: "error" }).then(() => JSON.stringify({ outcome: "unexpected_response" })).catch((error) => JSON.stringify({ outcome: "request_failed", error: error.name }))`;
}

function requireSuccess(result: CommandResult): string {
    if (result.exitCode === 0) return result.stdout;
    throw new Error(result.stderr || result.stdout || "agent-browser command failed");
}

function requireAbortedEvidence({
    provider,
    pattern,
    probeUrl,
    registration,
    probe,
    requestLog,
}: {
    provider: string;
    pattern: string;
    probeUrl: string;
    registration: string;
    probe: string;
    requestLog: string;
}): { method: "GET" } {
    if (!registration.includes(pattern)) {
        throw new Error(
            `${provider} abort route registration was not recorded.`
        );
    }
    if (!probe.includes("request_failed")) {
        throw new Error(`${provider} probe did not fail as expected.`);
    }
    const parsedRequestLog = JSON.parse(requestLog) as {
        data?: { requests?: Array<{ method?: string; status?: number; url?: string }> };
        requests?: Array<{ method?: string; status?: number; url?: string }>;
    };
    const request = (parsedRequestLog.data?.requests ?? parsedRequestLog.requests ?? []).find(
        (entry) => entry.url === probeUrl
    );
    if (!request) {
        throw new Error(`${provider} request log did not record the probe URL.`);
    }
    if (request.status !== undefined) {
        throw new Error(`${provider} probe recorded a response status.`);
    }
    if (request.method !== "GET") {
        throw new Error(`${provider} probe did not use the required GET method.`);
    }
    return { method: "GET" };
}

export function createNetworkBlockingSpike({ run }: { run: CommandRunner }) {
    return {
        async run() {
            const registeredPatterns: string[] = [];
            const evidence: Record<string, NetworkBlockingEvidence> = {};

            try {
                requireSuccess(await run(["open"]));

                const registrations = new Map<string, string>();
                for (const { pattern } of providerRoutes) {
                    const registration = requireSuccess(
                        await run(["network", "route", pattern, "--abort", "--json"])
                    );
                    registeredPatterns.push(pattern);
                    registrations.set(pattern, registration);
                }

                for (const { provider, pattern, probeUrl } of providerRoutes) {
                    const probe = requireSuccess(
                        await run(["eval", "--stdin", "--json"], probeExpression(probeUrl))
                    );
                    const requestOutput = requireSuccess(
                        await run([
                            "network",
                            "requests",
                            "--filter",
                            probeUrl,
                            "--json",
                        ])
                    );
                    const registration = registrations.get(pattern) ?? "";
                    const { method } = requireAbortedEvidence({
                        provider,
                        pattern,
                        probeUrl,
                        registration,
                        probe,
                        requestLog: requestOutput,
                    });
                    evidence[provider] = {
                        abortRule: pattern,
                        method,
                        outcome: "request_failed",
                        probeUrl,
                        responseStatus: null,
                    };
                }

                return evidence;
            } finally {
                for (const pattern of registeredPatterns.reverse()) {
                    await run(["network", "unroute", pattern, "--json"]);
                }
                await run(["close"]);
            }
        },
    };
}

if (import.meta.main) {
    const spike = createNetworkBlockingSpike({
        run: async (args, stdin) => {
            const process = Bun.spawn(agentBrowserInvocation(args), {
                stdin: "pipe",
                stdout: "pipe",
                stderr: "pipe",
            });
            if (stdin) {
                process.stdin.write(stdin);
            }
            process.stdin.end();
            const [stdout, stderr, exitCode] = await Promise.all([
                new Response(process.stdout).text(),
                new Response(process.stderr).text(),
                process.exited,
            ]);
            return { exitCode, stdout, stderr };
        },
    });

    const evidence = await spike.run();
    console.log(JSON.stringify(evidence, null, 2));
}
