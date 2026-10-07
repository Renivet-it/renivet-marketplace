export type CorporateStagingEnvironment = {
    nodeEnv?: string;
    databaseUrl?: string;
    razorpayKeyId?: string;
    deploymentSha: string;
    migrationTag: string;
};

function isProductionLike(value: string | undefined) {
    return /prod|production|live/i.test(value ?? "");
}

export function assertNonProductionEnvironment(
    environment: Pick<CorporateStagingEnvironment, "nodeEnv" | "databaseUrl" | "razorpayKeyId">
) {
    if (isProductionLike(environment.nodeEnv)) {
        throw new Error("Corporate staging readiness requires a non-production NODE_ENV");
    }
    if (isProductionLike(environment.databaseUrl)) {
        throw new Error("Corporate staging readiness rejected a production-like database URL");
    }
    if (isProductionLike(environment.razorpayKeyId)) {
        throw new Error("Corporate staging readiness rejected a production-like Razorpay key");
    }
}

function redact(value: string | undefined) {
    if (!value) return null;
    return `${value.slice(0, 4)}…redacted`;
}

export function buildStagingReadinessEvidence(environment: CorporateStagingEnvironment) {
    assertNonProductionEnvironment(environment);
    if (!environment.deploymentSha || !environment.migrationTag) {
        throw new Error("Corporate staging readiness requires deployment SHA and migration tag");
    }
    return {
        environment: "non-production",
        nodeEnv: environment.nodeEnv ?? "test",
        commitSha: environment.deploymentSha,
        migrationTag: environment.migrationTag,
        database: redact(environment.databaseUrl),
        razorpayKey: redact(environment.razorpayKeyId),
    } as const;
}

export function buildStagingReadinessEvidenceFromProcess(input: {
    deploymentSha: string;
    migrationTag: string;
}) {
    return buildStagingReadinessEvidence({
        nodeEnv: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        deploymentSha: input.deploymentSha,
        migrationTag: input.migrationTag,
    });
}
