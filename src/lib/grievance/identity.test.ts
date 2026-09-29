import { describe, expect, test } from "bun:test";
import { resolveGrievanceIdentity } from "./identity";

const users = [
    { id: "user-1", email: "one@example.com", phone: "9876543210" },
    { id: "user-2", email: "two@example.com", phone: "9123456789" },
];

describe("grievance identity resolution", () => {
    test("returns exactly one matching account when phone and email agree", async () => {
        await expect(
            resolveGrievanceIdentity(
                { email: " ONE@example.com ", phone: "+91 98765 43210" },
                async () => users
            )
        ).resolves.toEqual({ kind: "exact_match", userId: "user-1" });
    });

    test("returns a conflict when phone and email match different accounts", async () => {
        await expect(
            resolveGrievanceIdentity(
                { email: "one@example.com", phone: "9123456789" },
                async () => users
            )
        ).resolves.toEqual({ kind: "conflict" });
    });

    test("returns no match without revealing account details", async () => {
        await expect(
            resolveGrievanceIdentity(
                { email: "new@example.com", phone: "9988776655" },
                async () => users
            )
        ).resolves.toEqual({ kind: "none" });
    });

    test("ignores malformed stored phone data without failing the submission", async () => {
        await expect(
            resolveGrievanceIdentity(
                { email: "new@example.com", phone: "9988776655" },
                async () => [
                    { id: "legacy", email: "legacy@example.com", phone: "not-a-phone" },
                ]
            )
        ).resolves.toEqual({ kind: "none" });
    });
});
