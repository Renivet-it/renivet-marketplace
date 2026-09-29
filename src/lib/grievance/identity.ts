import { normalizeIndianGrievancePhone } from "./validation";

export interface GrievanceIdentityUser {
    id: string;
    email: string | null;
    phone: string | null;
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

    const matches = new Set(
        users
            .filter(
                (user) => {
                    if (user.email?.trim().toLowerCase() === email) return true;
                    if (!user.phone) return false;
                    try {
                        return normalizeIndianGrievancePhone(user.phone) === phone;
                    } catch {
                        return false;
                    }
                }
            )
            .map((user) => user.id)
    );

    if (matches.size === 1) {
        return { kind: "exact_match", userId: [...matches][0] };
    }
    if (matches.size > 1) return { kind: "conflict" };
    return { kind: "none" };
}
