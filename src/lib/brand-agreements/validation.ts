import { z } from "zod";

const dateValue = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const agreementMetadataBaseSchema = z.object({
        signedDate: dateValue,
        effectiveDate: dateValue,
        expiryDate: dateValue.optional().nullable(),
        status: z.enum(["draft", "active", "expired", "superseded"]),
    });

export const agreementMetadataSchema = agreementMetadataBaseSchema
    .superRefine((value, ctx) => {
        if (value.expiryDate && value.expiryDate < value.effectiveDate) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["expiryDate"],
                message: "Expiry date cannot be before the effective date",
            });
        }
    });

export function getNextAgreementVersion(rows: Array<{ version: number }>) {
    return rows.reduce((max, row) => Math.max(max, row.version), 0) + 1;
}

export const agreementFileSchema = z.object({
    key: z.string().min(1).max(512),
    name: z.string().trim().min(1).max(255),
    size: z.number().int().positive().max(16 * 1024 * 1024),
    type: z.enum(["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]),
});
