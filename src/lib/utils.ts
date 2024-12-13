import {
    COSTS,
    DEFAULT_MESSAGES,
    DELIVERY_CHARGE,
    FREE_DELIVERY_THRESHOLD,
} from "@/config/const";
import {
    BitFieldBrandPermission,
    BitFieldSitePermission,
} from "@/config/permissions";
import { init } from "@paralleldrive/cuid2";
import { clsx, type ClassValue } from "clsx";
import { NextResponse } from "next/server";
import { toast } from "sonner";
import { ValidationError, WebhookVerificationError } from "svix";
import { twMerge } from "tailwind-merge";
import { ZodError } from "zod";
import { Address, ResponseMessages, Role } from "./validations";

export function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function getAbsoluteURL(path: string = "/") {
    if (process.env.NEXT_PUBLIC_DEPLOYMENT_URL)
        return `https://${process.env.NEXT_PUBLIC_DEPLOYMENT_URL}${path}`;
    else if (process.env.VERCEL_URL)
        return `https://${process.env.VERCEL_URL}${path}`;
    return "http://localhost:3000" + path;
}

export class AppError extends Error {
    status: ResponseMessages;

    constructor(message: string, status: ResponseMessages) {
        super(message);
        this.name = "AppError";
        this.status = status;
    }
}

export function sanitizeError(error: unknown) {
    if (error instanceof AppError) return error.message;
    if (error instanceof ZodError)
        return error.issues.map((x) => x.message).join(", ");
    else if (error instanceof ValidationError) return error.msg;
    else if (error instanceof WebhookVerificationError) return error.message;
    else if (error instanceof Error) return error.message;
    else return DEFAULT_MESSAGES.ERRORS.GENERIC;
}

export function handleError(error: unknown) {
    if (error instanceof AppError)
        return CResponse({
            message: error.status,
            longMessage: sanitizeError(error),
        });
    else if (error instanceof ZodError)
        return CResponse({
            message: "BAD_REQUEST",
            longMessage: sanitizeError(error),
        });
    else if (error instanceof ValidationError)
        return CResponse({
            message: "BAD_REQUEST",
            longMessage: sanitizeError(error),
        });
    else if (error instanceof WebhookVerificationError)
        return CResponse({
            message: "BAD_REQUEST",
            longMessage: sanitizeError(error),
        });
    else if (error instanceof Error)
        return CResponse({
            message: "INTERNAL_SERVER_ERROR",
            longMessage: error.message,
        });
    else return CResponse({ message: "INTERNAL_SERVER_ERROR" });
}

export function handleClientError(error: unknown, toastId?: string | number) {
    if (error instanceof Error)
        return toast.error(error.message, { id: toastId });
    else toast.error(DEFAULT_MESSAGES.ERRORS.GENERIC, { id: toastId });
}

export async function cFetch<
    T,
    E = {
        message: string;
        code: number;
    },
>(
    url: string,
    options?: RequestInit
): Promise<{ data: T | null; error: E | null }> {
    try {
        const res = await fetch(url, options);
        const data = await res.json();
        if (!res.ok)
            return {
                data: null,
                error: data as E,
            };

        return {
            data: data as T,
            error: null,
        };
    } catch (error) {
        return {
            data: null,
            error: error as E,
        };
    }
}

export function CResponse<T>({
    message,
    longMessage,
    data,
}: {
    message: ResponseMessages;
    longMessage?: string;
    data?: T;
}) {
    let code: number;
    let success = false;

    switch (message) {
        case "OK":
            success = true;
            code = 200;
            break;
        case "CREATED":
            success = true;
            code = 201;
            break;
        case "BAD_REQUEST":
            code = 400;
            break;
        case "ERROR":
            code = 400;
            break;
        case "UNAUTHORIZED":
            code = 401;
            break;
        case "FORBIDDEN":
            code = 403;
            break;
        case "NOT_FOUND":
            code = 404;
            break;
        case "CONFLICT":
            code = 409;
            break;
        case "TOO_MANY_REQUESTS":
            code = 429;
            break;
        case "UNPROCESSABLE_ENTITY":
            code = 422;
            break;
        case "INTERNAL_SERVER_ERROR":
            code = 500;
            break;
        case "UNKNOWN_ERROR":
            code = 500;
            break;
        case "NOT_IMPLEMENTED":
            code = 501;
            break;
        case "BAD_GATEWAY":
            code = 502;
            break;
        case "SERVICE_UNAVAILABLE":
            code = 503;
            break;
        case "GATEWAY_TIMEOUT":
            code = 504;
            break;
        default:
            code = 500;
            break;
    }

    return NextResponse.json(
        {
            success,
            longMessage,
            data,
        },
        {
            status: code,
            statusText: message,
        }
    );
}

export function snakeToCamel(s: string): string {
    return s.replace(/(_\w)/g, (matches) => matches[1].toUpperCase());
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function convertKeysToCamelCase(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map((v) => convertKeysToCamelCase(v));
    } else if (obj !== null && obj.constructor === Object) {
        return Object.keys(obj).reduce((result, key) => {
            result[snakeToCamel(key)] = convertKeysToCamelCase(obj[key]);
            return result;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }, {} as any);
    }
    return obj;
}

export function generateCacheKey(separator = ":", prefix?: string) {
    const createRedisKey = (...args: string[]): string => {
        return args.join(separator);
    };

    if (prefix)
        return (...args: string[]): string => {
            return createRedisKey(prefix, ...args);
        };

    return createRedisKey;
}

export function parseToJSON<T>(data?: string | null): T | null {
    if (!data) return null;
    return JSON.parse(data);
}

export function slugify(text: string, separator: string = "-") {
    return text
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9 ]/g, "")
        .replace(/\s+/g, separator);
}

export function convertValueToLabel(value: string) {
    return value
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .split(/[_-\s]/)
        .map((x) =>
            x.toLowerCase().includes("id")
                ? x.toLowerCase().replace("id", "ID")
                : x.charAt(0).toUpperCase() + x.slice(1)
        )
        .join(" ");
}

export function generateId(
    opts: {
        length?: number;
        casing?: "upper" | "lower" | "normal";
    } = {
        length: 32,
        casing: "normal",
    }
) {
    return init(opts)();
}

export function convertBitToString(bit: number): string {
    return bit.toString();
}

export function hasPermission(
    permissions: number,
    requiredPermissions: number[],
    type: "all" | "any" = "all"
) {
    if (requiredPermissions.length === 0) return false;
    if (permissions & BitFieldSitePermission.ADMINISTRATOR) return true;
    if (permissions & BitFieldBrandPermission.ADMINISTRATOR) return true;

    const requiredBitmask = requiredPermissions.reduce(
        (acc, permission) => acc | permission,
        0
    );

    return type === "all"
        ? (permissions & requiredBitmask) === requiredBitmask
        : (permissions & requiredBitmask) !== 0;
}

export function getUserPermissions(
    roles: Omit<Role, "isSiteRole" | "createdAt" | "updatedAt">[]
) {
    return {
        sitePermissions: roles.reduce(
            (acc, role) => acc | parseInt(role.sitePermissions, 10),
            0
        ),
        brandPermissions: roles.reduce(
            (acc, role) => acc | parseInt(role.brandPermissions, 10),
            0
        ),
    };
}

export function hideEmail(email: string) {
    const [username, domain] = email.split("@");
    const hiddenUsername = `${username.slice(0, 3)}${"*".repeat(5)}`;
    return `${hiddenUsername}@${domain}`;
}

export function generateUploadThingFileUrl(appUrl: string, fileKey: string) {
    return `${appUrl}${fileKey}`;
}

export function getUploadThingFileKey(url: string) {
    const split = url.split("/").filter(Boolean);
    return split[split.length - 1];
}

export function isValidUrl(url: string) {
    return /^https?:\/\/\S+$/.test(url);
}

export function getUrlFromString(str: string) {
    if (isValidUrl(str)) return str;
    if (str.includes(".") && !str.includes(" "))
        return new URL(`https://${str}`).toString();
    return null;
}

export function getReadTime(content: string) {
    const WORDS_PER_MINUTE = 200;
    const textLength = content.split(" ").length;
    return Math.ceil(textLength / WORDS_PER_MINUTE);
}

export function generateAddress(
    address: Omit<Address, "createdAt" | "updatedAt">
) {
    return Object.entries(address)
        .filter(([key]) => ["street", "city", "state", "zip"].includes(key))
        .filter(([, value]) => value !== null)
        .map(([, value]) => value)
        .join(", ");
}

export function reorder<T>(
    list: T[],
    startIndex: number,
    endIndex: number
): T[] {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result;
}

export function convertBytesToHumanReadable(bytes: number) {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    if (bytes === 0) return "0 Byte";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
}

export function convertEmptyStringToNull(data: unknown) {
    return typeof data === "string" && data === "" ? null : data;
}

export function generateBrandRoleSlug(roleName: string, brandId: string) {
    return slugify(`${roleName} ${brandId}`);
}

export function formatPriceTag(price: number, keepDeciamls = false) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: keepDeciamls ? 2 : 0,
    }).format(price);
}

export function generateProductSlug(productName: string, brandName: string) {
    return slugify(
        `${brandName} ${productName} ${Date.now()} ${Math.random().toString(36).substring(7)}`
    );
}

export function calculateTotalPrice(prices: number[]) {
    const items = prices.reduce((acc, price) => acc + price, 0);
    const platform = items * COSTS.PLATFORM;
    const gateway = items * COSTS.GATEWAY;

    let total = items + platform + gateway;
    if (items < FREE_DELIVERY_THRESHOLD) total += DELIVERY_CHARGE;

    return {
        items: parseFloat(items.toFixed(2)),
        platform: parseFloat((platform + gateway).toFixed(2)),
        devliery: items < FREE_DELIVERY_THRESHOLD ? DELIVERY_CHARGE : 0,
        total: parseFloat(total.toFixed(2)),
    };
}

export function calculatePriceWithGST(price: number) {
    return parseFloat((price + price * COSTS.GST).toFixed(2));
}

export function calculatePriceWithoutGST(price: number) {
    return parseFloat((price / (1 + COSTS.GST)).toFixed(2));
}

export function generateReceiptId() {
    return `RNVT-RCPT-${generateId({ length: 8, casing: "upper" })}-${Date.now()}`;
}

export function convertPriceToPaise(price: number) {
    return Math.round(price * 100);
}
