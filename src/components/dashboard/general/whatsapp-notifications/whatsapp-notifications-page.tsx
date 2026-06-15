"use client";

import {
    DEFAULT_SLA_WHATSAPP_NUMBERS,
    DEFAULT_SUPPORT_WHATSAPP_NUMBERS,
    WHATSAPP_NOTIFICATION_MODULE_LABELS,
} from "@/config/whatsapp-notifications";
import { Button } from "@/components/ui/button-dash";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc/client";
import { handleClientError } from "@/lib/utils";
import {
    CachedRole,
    WhatsappNotificationModuleKey,
    WhatsappNotificationSettings,
} from "@/lib/validations";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface PageProps {
    initialRoles: CachedRole[];
    initialSettings: WhatsappNotificationSettings;
}

type ModuleDraft = {
    enabled: boolean;
    roleIds: string[];
};

const MODULE_COPY: Record<
    WhatsappNotificationModuleKey,
    {
        description: string;
        assignmentDescription: string;
        fallbackNumbers: readonly string[];
        fallbackDescription: string;
        previewDescription: string;
        saveLabel: string;
    }
> = {
    support: {
        description:
            "When enabled, support alerts will continue going by email and will also be sent over WhatsApp.",
        assignmentDescription:
            "Select one or more site roles. Their saved phone numbers will receive support WhatsApp alerts.",
        fallbackNumbers: DEFAULT_SUPPORT_WHATSAPP_NUMBERS,
        fallbackDescription:
            "If no role is assigned, or assigned roles have no saved numbers, support WhatsApp alerts will go to:",
        previewDescription: "Current recipient preview",
        saveLabel: "Save Support WhatsApp Settings",
    },
    sla: {
        description:
            "When enabled, SLA and monitoring breach alerts will also be sent over WhatsApp using the SLA template.",
        assignmentDescription:
            "Select one or more site roles. Their saved phone numbers will receive SLA WhatsApp alerts.",
        fallbackNumbers: DEFAULT_SLA_WHATSAPP_NUMBERS,
        fallbackDescription:
            "If no role is assigned, or assigned roles have no saved numbers, SLA WhatsApp alerts will go to:",
        previewDescription: "Current SLA recipient preview",
        saveLabel: "Save SLA WhatsApp Settings",
    },
};

export function WhatsappNotificationsPage({
    initialRoles,
    initialSettings,
}: PageProps) {
    const { data: roles = initialRoles } = trpc.general.roles.getRoles.useQuery(
        undefined,
        { initialData: initialRoles }
    );
    const { data: settings = initialSettings, refetch } =
        trpc.general.whatsappNotifications.getSettings.useQuery(undefined, {
            initialData: initialSettings,
        });

    const [drafts, setDrafts] = useState<
        Record<WhatsappNotificationModuleKey, ModuleDraft>
    >({
        support: {
            enabled: initialSettings.support.enabled,
            roleIds: initialSettings.support.roleIds,
        },
        sla: {
            enabled: initialSettings.sla.enabled,
            roleIds: initialSettings.sla.roleIds,
        },
    });

    useEffect(() => {
        setDrafts({
            support: {
                enabled: settings.support.enabled,
                roleIds: settings.support.roleIds,
            },
            sla: {
                enabled: settings.sla.enabled,
                roleIds: settings.sla.roleIds,
            },
        });
    }, [settings]);

    const { mutate: updateModule, isPending } =
        trpc.general.whatsappNotifications.updateModule.useMutation({
            onMutate: () => {
                const toastId = toast.loading(
                    "Saving WhatsApp notification settings..."
                );
                return { toastId };
            },
            onSuccess: (_, __, ctx) => {
                toast.success("WhatsApp notification settings saved", {
                    id: ctx.toastId,
                });
                refetch();
            },
            onError: (error, _, ctx) => {
                handleClientError(error, ctx?.toastId);
            },
        });

    const moduleKeys: WhatsappNotificationModuleKey[] = ["support", "sla"];

    return (
        <div className="space-y-6">
            {moduleKeys.map((moduleKey) => {
                const draft = drafts[moduleKey];
                const copy = MODULE_COPY[moduleKey];
                const selectedRoles = roles.filter((role) =>
                    draft.roleIds.includes(role.id)
                );
                const resolvedRolePhoneNumbers = selectedRoles.flatMap((role) =>
                    (role.phoneNumbers ?? []).filter(Boolean)
                );

                return (
                    <Card key={moduleKey}>
                        <CardHeader>
                            <CardTitle>
                                {WHATSAPP_NOTIFICATION_MODULE_LABELS[moduleKey]}{" "}
                                Module
                            </CardTitle>
                        </CardHeader>

                        <Separator />

                        <CardContent className="space-y-6 pt-6">
                            <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
                                <div className="space-y-1">
                                    <p className="font-medium">
                                        Enable WhatsApp for{" "}
                                        {
                                            WHATSAPP_NOTIFICATION_MODULE_LABELS[
                                                moduleKey
                                            ]
                                        }{" "}
                                        alerts
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {copy.description}
                                    </p>
                                </div>

                                <Switch
                                    checked={draft.enabled}
                                    onCheckedChange={(checked) =>
                                        setDrafts((current) => ({
                                            ...current,
                                            [moduleKey]: {
                                                ...current[moduleKey],
                                                enabled: checked,
                                            },
                                        }))
                                    }
                                    disabled={isPending}
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <p className="font-medium">
                                        Assign receiver roles
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {copy.assignmentDescription}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {roles.map((role) => {
                                        const phoneNumbers =
                                            role.phoneNumbers ?? [];
                                        const isSelected =
                                            draft.roleIds.includes(role.id);

                                        return (
                                            <label
                                                key={`${moduleKey}-${role.id}`}
                                                className="flex cursor-pointer items-start gap-3 rounded-lg border p-4"
                                            >
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={(
                                                        checked
                                                    ) => {
                                                        setDrafts((current) => ({
                                                            ...current,
                                                            [moduleKey]: {
                                                                ...current[
                                                                    moduleKey
                                                                ],
                                                                roleIds: checked
                                                                    ? [
                                                                          ...current[
                                                                              moduleKey
                                                                          ]
                                                                              .roleIds,
                                                                          role.id,
                                                                      ]
                                                                    : current[
                                                                          moduleKey
                                                                      ].roleIds.filter(
                                                                          (id) =>
                                                                              id !==
                                                                              role.id
                                                                      ),
                                                            },
                                                        }));
                                                    }}
                                                    disabled={isPending}
                                                />

                                                <div className="space-y-1">
                                                    <p className="font-medium">
                                                        {role.name}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {phoneNumbers.length > 0
                                                            ? `${phoneNumbers.length} saved WhatsApp number(s): ${phoneNumbers.join(", ")}`
                                                            : "No WhatsApp numbers saved on this role yet"}
                                                    </p>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-2 rounded-lg bg-muted p-4">
                                <p className="font-medium">Fallback Numbers</p>
                                <p className="text-sm text-muted-foreground">
                                    {copy.fallbackDescription}
                                </p>
                                <div className="text-sm">
                                    {copy.fallbackNumbers.join(", ")}
                                </div>
                            </div>

                            <div className="space-y-2 rounded-lg border p-4">
                                <p className="font-medium">
                                    {copy.previewDescription}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {resolvedRolePhoneNumbers.length > 0
                                        ? resolvedRolePhoneNumbers.join(", ")
                                        : copy.fallbackNumbers.join(", ")}
                                </p>
                            </div>

                            <Button
                                className="w-full sm:w-auto"
                                disabled={isPending}
                                onClick={() =>
                                    updateModule({
                                        module: moduleKey,
                                        settings: {
                                            enabled: draft.enabled,
                                            roleIds: draft.roleIds,
                                        },
                                    })
                                }
                            >
                                {copy.saveLabel}
                            </Button>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
