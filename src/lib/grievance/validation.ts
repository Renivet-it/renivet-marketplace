import { z } from "zod";

export const grievanceCategorySchema = z.enum([
    "order_issue",
    "refund_dispute",
    "delivery_issue",
    "product_quality",
    "other",
]);

export function normalizeIndianGrievancePhone(value: string) {
    const digits = value.replace(/\D/g, "");
    const normalized =
        digits.length === 12 && digits.startsWith("91")
            ? digits.slice(2)
            : digits.length === 11 && digits.startsWith("0")
              ? digits.slice(1)
              : digits;

    if (!/^[6-9]\d{9}$/.test(normalized)) {
        throw new Error("Enter a valid 10-digit Indian phone number.");
    }

    return normalized;
}

const normalizedPhoneSchema = z.string().refine(
    (value) => {
        try {
            normalizeIndianGrievancePhone(value);
            return true;
        } catch {
            return false;
        }
    },
    "Enter a valid 10-digit Indian phone number."
);

const blockedEmailDomains = new Set([
    "example.com",
    "example.org",
    "example.net",
    "test.com",
    "localhost",
]);

function hasUsableEmailDomain(value: string) {
    const domain = value.trim().toLowerCase().split("@").at(-1) ?? "";
    return (
        domain.includes(".") &&
        !blockedEmailDomains.has(domain) &&
        !domain.startsWith(".") &&
        !domain.endsWith(".") &&
        !domain.includes("..")
    );
}

export const grievanceSubmissionSchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters."),
    phone: normalizedPhoneSchema.transform(normalizeIndianGrievancePhone),
    email: z
        .string()
        .trim()
        .toLowerCase()
        .email("Enter a valid email address.")
        .refine(hasUsableEmailDomain, "Enter an email address with a valid domain."),
    orderId: z
        .string()
        .trim()
        .optional()
        .transform((value) => (value ? value : undefined)),
    category: grievanceCategorySchema,
    description: z.string().trim().min(10, "Description must be at least 10 characters."),
    accountCreationConsent: z.boolean().default(false),
});

export type GrievanceSubmission = z.infer<typeof grievanceSubmissionSchema>;

export function normalizeGrievanceSubmission(
    input: z.input<typeof grievanceSubmissionSchema>
): GrievanceSubmission {
    return grievanceSubmissionSchema.parse(input);
}
