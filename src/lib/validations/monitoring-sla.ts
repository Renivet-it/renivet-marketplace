import { z } from "zod";

export const monitoringAlertActionSchema = z.object({
    alertId: z.string().uuid(),
    reasonCode: z.string().min(2).max(80).optional(),
    notes: z.string().max(1000).optional(),
});

export const complianceExportSchema = z.object({
    exportMonth: z.string().regex(/^\d{4}-\d{2}$/),
    exportType: z.enum([
        "refunds",
        "brand-actions",
        "access-changes",
        "manual-overrides",
        "sustainability-claims",
        "data-deletion-requests",
        "customer-escalations",
        "alerts",
    ]),
});

export type MonitoringAlertAction = z.infer<typeof monitoringAlertActionSchema>;
export type ComplianceExportInput = z.infer<typeof complianceExportSchema>;
