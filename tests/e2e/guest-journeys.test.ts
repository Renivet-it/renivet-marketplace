import { describe, expect, test } from "bun:test";
import {
    classifyPage,
    createGuestJourneyRunner,
    guestJourneys,
    validateFinalOrigin,
    validateTargetOrigin,
} from "../../scripts/e2e/guest-journeys";

describe("REN-121 guest journey suite", () => {
    test("contains exactly ten read-only journeys", () => {
        expect(guestJourneys).toHaveLength(10);
        expect(guestJourneys.every((journey) => journey.readOnly)).toBe(true);
        expect(
            guestJourneys.every((journey) => journey.path.startsWith("/"))
        ).toBe(true);
        expect(new Set(guestJourneys.map((journey) => journey.path)).size).toBe(
            10
        );
    });

    test("identifies login-wall journeys without payment actions", () => {
        const wallJourneys = guestJourneys.filter(
            (journey) => journey.expected === "login_wall"
        );
        expect(wallJourneys.map((journey) => journey.id)).toEqual([
            "protected-profile",
            "guest-cart",
            "guest-checkout",
        ]);
        expect(
            guestJourneys.some((journey) =>
                journey.actions.includes("submit_payment")
            )
        ).toBe(false);
    });

    test("rejects production and unknown origins", () => {
        expect(() =>
            validateTargetOrigin("https://renivet.com", [
                "https://staging.example.com",
            ])
        ).toThrow("blocked");
        expect(() =>
            validateTargetOrigin("https://unknown.example.com", [
                "https://staging.example.com",
            ])
        ).toThrow("blocked");
    });

    test("accepts loopback and explicitly allowlisted staging origins", () => {
        expect(validateTargetOrigin("http://localhost:3000", [])).toBe(
            "http://localhost:3000"
        );
        expect(
            validateTargetOrigin("https://staging.example.com", [
                "https://staging.example.com",
            ])
        ).toBe("https://staging.example.com");
    });

    test("rejects redirects outside the approved origin", () => {
        expect(() =>
            validateFinalOrigin(
                "https://evil.example/login",
                "https://staging.example.com"
            )
        ).toThrow("redirected outside");
        expect(
            validateFinalOrigin(
                "https://staging.example.com/auth/signin",
                "https://staging.example.com"
            )
        ).toBe("https://staging.example.com/auth/signin");
    });

    test("does not classify an error page as a successful public journey", () => {
        expect(
            classifyPage({
                finalUrl: "https://staging.example.com/missing",
                bodyText: "404 Page not found",
                expected: "public_page",
            })
        ).toBe("error_page");
    });

    test("isolates the browser session and closes it after a journey failure", async () => {
        const commands: string[][] = [];
        const runner = createGuestJourneyRunner({
            run: async (args) => {
                commands.push([...args]);
                if (args.includes("url")) return "https://staging.example.com/";
                if (args.includes("eval")) return "404 Page not found";
                return "";
            },
        });

        await expect(
            runner.run({
                baseUrl: "https://staging.example.com",
                allowedOrigins: ["https://staging.example.com"],
            })
        ).rejects.toThrow("expected public_page");

        expect(commands[0]).toContain("--allowed-domains");
        expect(commands[0]).toContain("staging.example.com");
        expect(commands.every((args) => args.includes("--session"))).toBe(true);
        expect(commands.at(-1)).toContain("close");
    });
});
