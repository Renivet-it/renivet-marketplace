import { createHash, randomBytes } from "node:crypto";

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
