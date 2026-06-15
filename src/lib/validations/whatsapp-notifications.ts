import { z } from "zod";

export const whatsappNotificationModuleKeySchema = z.enum(["support", "sla"]);

export const whatsappNotificationModuleSettingsSchema = z.object({
    enabled: z.boolean().default(false),
    roleIds: z.array(z.string().uuid()).default([]),
});

export const whatsappNotificationSettingsSchema = z.object({
    support: whatsappNotificationModuleSettingsSchema.default({
        enabled: false,
        roleIds: [],
    }),
    sla: whatsappNotificationModuleSettingsSchema.default({
        enabled: false,
        roleIds: [],
    }),
});

export const updateWhatsappNotificationModuleSchema = z.object({
    module: whatsappNotificationModuleKeySchema,
    settings: whatsappNotificationModuleSettingsSchema,
});

export type WhatsappNotificationModuleKey = z.infer<
    typeof whatsappNotificationModuleKeySchema
>;
export type WhatsappNotificationModuleSettings = z.infer<
    typeof whatsappNotificationModuleSettingsSchema
>;
export type WhatsappNotificationSettings = z.infer<
    typeof whatsappNotificationSettingsSchema
>;
export type UpdateWhatsappNotificationModule = z.infer<
    typeof updateWhatsappNotificationModuleSchema
>;
