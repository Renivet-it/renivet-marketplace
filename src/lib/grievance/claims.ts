import { createHash, randomBytes } from "node:crypto";
import { normalizeIndianGrievancePhone } from "./validation";

export const GRIEVANCE_CLAIM_TTL_MS = 30 * 60 * 1000;

export function createGrievanceClaimToken() {
    return randomBytes(32).toString("base64url");
}

export function hashGrievanceClaimToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
}

export function isGrievanceClaimExpired(now: Date, expiresAt: Date) {
    return now.getTime() >= expiresAt.getTime();
}

export function canAuthenticatedUserConsumeClaim(
    claim: {
        expectedUserId: string | null;
        email: string;
        phone: string;
    },
    user: {
        id: string;
        email: string | null;
        phone: string | null;
    }
) {
    if (claim.expectedUserId) return claim.expectedUserId === user.id;

    if (user.email?.trim().toLowerCase() === claim.email.trim().toLowerCase()) {
        return true;
    }
    if (!user.phone) return false;

    try {
        return (
            normalizeIndianGrievancePhone(user.phone) ===
            normalizeIndianGrievancePhone(claim.phone)
        );
    } catch {
        return false;
    }
}
