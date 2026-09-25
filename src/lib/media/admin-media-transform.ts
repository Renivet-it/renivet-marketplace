import { getUploadThingFileKey } from "./admin-media-source";

const DEFAULT_WIDTH = 480;
const DEFAULT_QUALITY = 70;

function boundedInteger(
    value: string | null,
    fallback: number,
    min: number,
    max: number
) {
    const parsed = Number.parseInt(value ?? "", 10);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, parsed));
}

export function getAdminMediaTransform(url: URL) {
    return {
        width: boundedInteger(
            url.searchParams.get("w"),
            DEFAULT_WIDTH,
            64,
            800
        ),
        quality: boundedInteger(
            url.searchParams.get("q"),
            DEFAULT_QUALITY,
            40,
            85
        ),
    };
}

export async function resolveAdminMediaSourceUrl(
    rawUrl: string,
    signUploadThingKey: (key: string) => Promise<string>
) {
    const key = getUploadThingFileKey(rawUrl);
    return key ? signUploadThingKey(key) : rawUrl;
}
