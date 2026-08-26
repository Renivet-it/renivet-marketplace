import { NextRequest, NextResponse } from "next/server";
import { isTimingSafeSecretMatch } from "./secret-comparison";

export function isCronSecretAuthorized(
    authorizationHeader: string | null,
    _querySecret: string | null,
    expectedSecret: string | undefined
): boolean {
    const bearerSecret = authorizationHeader?.startsWith("Bearer ")
        ? authorizationHeader.slice("Bearer ".length)
        : null;

    return isTimingSafeSecretMatch(bearerSecret, expectedSecret);
}

export function requireCronSecret(req: NextRequest) {
    const secret = process.env.CRON_SECRET;
    if (!secret) {
        return NextResponse.json(
            { ok: false, error: "Cron secret is not configured" },
            { status: 503 }
        );
    }

    if (
        !isCronSecretAuthorized(
            req.headers.get("authorization"),
            null,
            secret
        )
    ) {
        return NextResponse.json(
            { ok: false, error: "Unauthorized" },
            { status: 401 }
        );
    }

    return null;
}
