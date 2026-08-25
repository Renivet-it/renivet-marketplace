import { financeComplianceQueries } from "@/lib/db/queries/finance-compliance";
import { isProductionEnvironment } from "./env-context";

export const EXTERNAL_SIDE_EFFECTS_SETTING_KEY = "external_side_effects";

export function isExternalSideEffectsEnabled(
    isProduction: boolean,
    configuredEnabled: boolean | undefined
): boolean {
    if (isProduction) return true;
    return configuredEnabled ?? true;
}

export async function shouldRunExternalSideEffects(): Promise<boolean> {
    if (isProductionEnvironment()) return true;

    const setting = await financeComplianceQueries.getPlatformSetting(
        EXTERNAL_SIDE_EFFECTS_SETTING_KEY
    );
    const configuredEnabled =
        typeof setting?.value?.enabled === "boolean"
            ? setting.value.enabled
            : undefined;

    return isExternalSideEffectsEnabled(false, configuredEnabled);
}
