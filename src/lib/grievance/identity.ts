import { normalizeIndianGrievancePhone } from "./validation";

export interface GrievanceIdentityUser {
    id: string;
    email: string | null;
    phone: string | null;
    emails?: string[];
    phones?: string[];
}

export type GrievanceIdentityResolution =
    | { kind: "exact_match"; userId: string }
    | { kind: "conflict" }
    | { kind: "none" };

export async function resolveGrievanceIdentity(
    input: { email: string; phone: string },
    findUsers: () => Promise<GrievanceIdentityUser[]>
): Promise<GrievanceIdentityResolution> {
    const email = input.email.trim().toLowerCase();
    const phone = normalizeIndianGrievancePhone(input.phone);
    const users = await findUsers();

    const emailMatches = new Set(
        users
            .filter((user) =>
                [user.email, ...(user.emails ?? [])].some(
                    (candidate) => candidate?.trim().toLowerCase() === email
                )
            )
            .map((user) => user.id)
    );

    if (emailMatches.size === 1) {
        return { kind: "exact_match", userId: [...emailMatches][0] };
    }
    if (emailMatches.size > 1) return { kind: "conflict" };

    const phoneMatches = new Set(
        users
            .filter((user) =>
                [user.phone, ...(user.phones ?? [])].some((candidate) => {
                    if (!candidate) return false;
                    try {
                        return (
                            normalizeIndianGrievancePhone(candidate) === phone
                        );
                    } catch {
                        return false;
                    }
                })
            )
            .map((user) => user.id)
    );

    if (phoneMatches.size === 1) {
        return { kind: "exact_match", userId: [...phoneMatches][0] };
    }
    if (phoneMatches.size > 1) return { kind: "conflict" };
    return { kind: "none" };
}
