import { env } from "@/../env.mjs";
import { DEFAULT_MESSAGES } from "@/config/const";
import { init } from "@paralleldrive/cuid2";
import { clsx, type ClassValue } from "clsx";
import ms from "enhanced-ms";
import { NextResponse } from "next/server";
import { toast } from "sonner";
import { ValidationError, WebhookVerificationError } from "svix";
import { twMerge } from "tailwind-merge";
import { ZodError } from "zod";
import { ResponseMessages } from "./validations";

export function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function getAbsoluteURL(path: string = "/") {
    if (process.env.NODE_ENV === "production") {
        if (env.VERCEL_PROJECT_PRODUCTION_URL)
            return env.VERCEL_PROJECT_PRODUCTION_URL + path;
    }
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

export function handleClientError(error: unknown, toastId?: string) {
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
        .split(/[_-\s]/)
        .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
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

export function convertToSeconds(input: string): number {
    return ms(input) / 1000;
}
