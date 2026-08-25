type EnvironmentVariables = {
    APP_ENV?: string;
    VERCEL_ENV?: string;
    NODE_ENV?: string;
};

export function isProductionEnvironment(
    environment: EnvironmentVariables = process.env
): boolean {
    if (environment.APP_ENV) return environment.APP_ENV === "production";
    if (environment.VERCEL_ENV) return environment.VERCEL_ENV === "production";
    return environment.NODE_ENV === "production";
}
