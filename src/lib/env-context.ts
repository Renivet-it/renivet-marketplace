type EnvironmentVariables = {
    APP_ENV?: string;
    VERCEL_ENV?: string;
    NODE_ENV?: string;
};

export function isProductionEnvironment(
    environment: EnvironmentVariables = process.env
): boolean {
    return environment.APP_ENV === "production";
}
