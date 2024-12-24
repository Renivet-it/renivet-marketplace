import { z } from "zod";
import { convertEmptyStringToNull } from "../utils";

export const planSchema = z.object({
    id: z
        .string({
            required_error: "ID is required",
            invalid_type_error: "ID must be a string",
        })
        .min(1, "ID is invalid"),
    interval: z
        .number({
            required_error: "Interval is required",
            invalid_type_error: "Interval must be a number",
        })
        .int("Interval must be an integer")
        .positive("Interval must be positive"),
    period: z.enum(["daily", "weekly", "monthly", "yearly"], {
        required_error: "Period is required",
        invalid_type_error: "Period must be a string",
    }),
    amount: z
        .number({
            required_error: "Amount is required",
            invalid_type_error: "Amount must be a number",
        })
        .int("Amount must be an integer")
        .positive("Amount must be positive"),
    currency: z
        .string({
            required_error: "Currency is required",
            invalid_type_error: "Currency must be a string",
        })
        .min(1, "Currency is invalid"),
    name: z
        .string({
            required_error: "Name is required",
            invalid_type_error: "Name must be a string",
        })
        .min(1, "Name must be at least 1 characters long"),
    description: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error: "Description must be a string",
            })
            .min(1, "Description must be at least 1 characters long")
            .nullable()
    ),
    isActive: z.boolean({
        required_error: "Is Active is required",
        invalid_type_error: "Is Active must be a boolean",
    }),
    isDeleted: z.boolean({
        required_error: "Is Deleted is required",
        invalid_type_error: "Is Deleted must be a boolean",
    }),
    createdAt: z
        .union([z.string(), z.date()], {
            required_error: "Created at is required",
            invalid_type_error: "Created at must be a date",
        })
        .transform((v) => new Date(v)),
    updatedAt: z
        .union([z.string(), z.date()], {
            required_error: "Updated at is required",
            invalid_type_error: "Updated at must be a date",
        })
        .transform((v) => new Date(v)),
});

export const createPlanSchema = planSchema
    .omit({
        isDeleted: true,
        createdAt: true,
        updatedAt: true,
    })
    .extend({
        amount: z
            .union([z.string(), z.number()])
            .transform((val) => Number(val))
            .pipe(z.number().positive("Amount must be positive")),
    });

export const updatePlanStatusSchema = planSchema.pick({
    id: true,
    isActive: true,
});

export const cachedPlanSchema = planSchema;

export type Plan = z.infer<typeof planSchema>;
export type CreatePlan = z.infer<typeof createPlanSchema>;
export type UpdatePlanStatus = z.infer<typeof updatePlanStatusSchema>;
export type CachedPlan = z.infer<typeof cachedPlanSchema>;
