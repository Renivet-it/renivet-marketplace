import { describe, expect, test } from "bun:test";
import {
    agentBrowserInvocation,
    createNetworkBlockingSpike,
    providerRoutes,
    type AgentBrowserCommand,
} from "../scripts/ren-122-network-blocking-spike";

describe("REN-122 agent-browser network blocking spike", () => {
    test("uses Bun's local CLI resolver on Windows", () => {
        expect(agentBrowserInvocation(["open", "--json"])).toEqual([
            "bunx",
            "agent-browser",
            "open",
            "--json",
        ]);
    });

    test("installs every abort route before issuing a synthetic request", async () => {
        const commands: AgentBrowserCommand[][] = [];
        const spike = createNetworkBlockingSpike({
            run: async (args) => {
                commands.push(args);
                if (args[0] === "network" && args[1] === "route") {
                    return { exitCode: 0, stdout: JSON.stringify({ routed: args[2] }) };
                }
                if (args[0] === "eval") {
                    return { exitCode: 0, stdout: JSON.stringify({ result: "request_failed" }) };
                }
                if (args[0] === "network" && args[1] === "requests") {
                    return {
                        exitCode: 0,
                        stdout: JSON.stringify({
                            requests: [
                                {
                                    url: args[3],
                                    method: "GET",
                                    headers: { "User-Agent": "test-agent" },
                                },
                            ],
                        }),
                    };
                }
                return { exitCode: 0, stdout: "" };
            },
        });

        const evidence = await spike.run();

        expect(commands[0]).toEqual(["open"]);
        expect(commands.slice(1, 1 + providerRoutes.length)).toEqual(
            providerRoutes.map(({ pattern }) => [
                "network",
                "route",
                pattern,
                "--abort",
                "--json",
            ])
        );
        expect(commands[1 + providerRoutes.length]).toContain("eval");
        expect(commands[1 + providerRoutes.length]).toContain("--stdin");
        expect(evidence.Delhivery).toEqual({
            abortRule: "https://track.delhivery.com/**",
            method: "GET",
            outcome: "request_failed",
            probeUrl: "https://track.delhivery.com/renivet-agent-browser-safety-probe",
            responseStatus: null,
        });
    });

    test("fails closed when route registration fails", async () => {
        const commands: AgentBrowserCommand[][] = [];
        const spike = createNetworkBlockingSpike({
            run: async (args) => {
                commands.push(args);
                if (args[0] === "network" && args[1] === "route") {
                    return { exitCode: 1, stdout: "", stderr: "route failed" };
                }
                return { exitCode: 0, stdout: "" };
            },
        });

        await expect(spike.run()).rejects.toThrow("route failed");
        expect(commands.some((args) => args[0] === "eval")).toBe(false);
        expect(commands.at(-1)).toEqual(["close"]);
    });

    test("removes routes and closes the browser after a probe failure", async () => {
        const commands: AgentBrowserCommand[][] = [];
        const spike = createNetworkBlockingSpike({
            run: async (args) => {
                commands.push(args);
                if (args[0] === "eval") {
                    return { exitCode: 1, stdout: "", stderr: "request aborted" };
                }
                return { exitCode: 0, stdout: "" };
            },
        });

        await expect(spike.run()).rejects.toThrow("request aborted");
        expect(
            commands.filter(
                (args) => args[0] === "network" && args[1] === "unroute"
            )
        ).toHaveLength(providerRoutes.length);
        expect(commands.at(-1)).toEqual(["close"]);
    });

    test("rejects evidence that shows a provider response", async () => {
        const spike = createNetworkBlockingSpike({
            run: async (args) => {
                if (args[0] === "network" && args[1] === "route") {
                    return { exitCode: 0, stdout: JSON.stringify({ routed: args[2] }) };
                }
                if (args[0] === "eval") {
                    return { exitCode: 0, stdout: JSON.stringify({ result: "request_failed" }) };
                }
                if (args[0] === "network" && args[1] === "requests") {
                    return {
                        exitCode: 0,
                        stdout: JSON.stringify({
                            requests: [{ url: args[3], status: 404 }],
                        }),
                    };
                }
                return { exitCode: 0, stdout: "" };
            },
        });

        await expect(spike.run()).rejects.toThrow("response status");
    });
});
