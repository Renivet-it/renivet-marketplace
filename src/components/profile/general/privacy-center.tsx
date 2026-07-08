"use client";

import { Button } from "@/components/ui/button-dash";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea-dash";
import { trpc } from "@/lib/trpc/client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const OPTIONAL_CONSENTS = [
    {
        consentType: "marketing_emails" as const,
        label: "Marketing emails",
        description: "Promotions, launches, and editorial campaign updates.",
    },
    {
        consentType: "whatsapp_notifications" as const,
        label: "WhatsApp updates",
        description: "Order and offer messages sent through WhatsApp.",
    },
    {
        consentType: "analytics_tracking" as const,
        label: "Anonymized analytics",
        description: "Usage analytics used only to improve the platform.",
    },
];

export function PrivacyCenter() {
    const searchParams = useSearchParams();
    const [deletionNotes, setDeletionNotes] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [savingConsentType, setSavingConsentType] = useState<string | null>(null);

    const utils = trpc.useUtils();
    const consentStateQuery = trpc.general.financeCompliance.getConsentCenterState.useQuery();
    const createDeletionRequest =
        trpc.general.financeCompliance.createDataDeletionRequest.useMutation({
            onSuccess: () => {
                setMessage("Deletion request created. Check your email to verify it.");
            },
        });
    const verifyDeletionRequest =
        trpc.general.financeCompliance.verifyDataDeletionRequest.useMutation({
            onSuccess: () => {
                setMessage("Deletion request verified. Admin review is now pending.");
                void utils.general.financeCompliance.getConsentCenterState.invalidate();
            },
        });
    const grantConsent = trpc.general.financeCompliance.grantConsent.useMutation({
        onSuccess: (_data, variables) => {
            setSavingConsentType(null);
            toast.success(
                `${variables.consentType === "data_processing" ? "Data processing consent" : variables.consentType === "marketing_emails" ? "Marketing emails" : variables.consentType === "whatsapp_notifications" ? "WhatsApp updates" : "Anonymized analytics"} ${variables.consentGiven ? "activated" : "deactivated"}.`
            );
            void utils.general.financeCompliance.getConsentCenterState.invalidate();
        },
        onError: (error) => {
            setSavingConsentType(null);
            toast.error(error.message || "Could not update consent.");
        },
    });

    useEffect(() => {
        const token = searchParams.get("dpdpVerify");
        if (!token || verifyDeletionRequest.isPending || verifyDeletionRequest.isSuccess) {
            return;
        }

        verifyDeletionRequest.mutate({ token });
    }, [searchParams, verifyDeletionRequest]);

    const consentState = consentStateQuery.data;
    const dataProcessingConsent = consentState?.consents.find(
        (consent) => consent.consentType === "data_processing"
    );

    const handleConsentToggle = (
        consentType:
            | "data_processing"
            | "marketing_emails"
            | "whatsapp_notifications"
            | "analytics_tracking",
        consentGiven: boolean
    ) => {
        setSavingConsentType(consentType);
        grantConsent.mutate({
            consentType,
            consentGiven,
        });
    };

    return (
        <Card className="w-full rounded-none">
            <CardHeader className="px-4 md:p-6">
                <CardTitle>Privacy Controls</CardTitle>
                <CardDescription>
                    Manage DPDP consent preferences and request deletion while required tax and finance records stay retained by law.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 px-4 md:px-6">
                {message ? (
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                        {message}
                    </div>
                ) : null}

                {dataProcessingConsent?.needsReconsent ? (
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                        Privacy policy version `{consentState?.version}` is available. You can refresh your consent here without affecting normal ordering or support access.
                    </div>
                ) : null}

                <section className="space-y-3">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900">Required platform consent</h3>
                        <p className="text-sm text-slate-600">
                            This consent covers account operation, order fulfilment, and customer support. For existing users, it is treated as active unless you explicitly revoke it.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 rounded-md border p-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-slate-900">Data processing consent</p>
                                <p className="text-sm text-slate-600">
                                    Current version: {consentState?.version ?? "loading"}
                                </p>
                            </div>
                            <Switch
                                checked={Boolean(dataProcessingConsent?.granted)}
                                onCheckedChange={(checked) =>
                                    handleConsentToggle("data_processing", checked)
                                }
                                disabled={grantConsent.isPending}
                            />
                        </div>
                        {savingConsentType === "data_processing" ? (
                            <p className="text-xs font-medium text-amber-700">
                                Saving consent...
                            </p>
                        ) : null}
                        <p className="text-xs text-slate-500">
                            Turning this off automatically opens a deletion request that must be email-verified.
                        </p>
                    </div>
                </section>

                <section className="space-y-3">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900">Optional consents</h3>
                        <p className="text-sm text-slate-600">
                            These can be changed at any time and revoke downstream subscriptions immediately.
                        </p>
                    </div>
                    <div className="space-y-3">
                        {OPTIONAL_CONSENTS.map((item) => {
                            const state = consentState?.consents.find(
                                (consent) => consent.consentType === item.consentType
                            );

                            return (
                                <div
                                    key={item.consentType}
                                    className="flex items-start justify-between gap-4 rounded-md border p-4"
                                >
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-slate-900">{item.label}</p>
                                        <p className="text-sm text-slate-600">{item.description}</p>
                                    </div>
                                    <Switch
                                        checked={Boolean(state?.granted)}
                                        onCheckedChange={(checked) =>
                                            handleConsentToggle(item.consentType, checked)
                                        }
                                        disabled={grantConsent.isPending}
                                    />
                                </div>
                            );
                        })}
                    </div>
                    {savingConsentType &&
                    savingConsentType !== "data_processing" ? (
                        <p className="text-xs font-medium text-amber-700">
                            Saving consent preference...
                        </p>
                    ) : null}
                </section>

                <section className="space-y-3 rounded-md border border-rose-200 bg-rose-50 p-4">
                    <div>
                        <h3 className="text-sm font-semibold text-rose-950">Request account deletion</h3>
                        <p className="text-sm text-rose-900/80">
                            Personal data will be deleted or anonymized where possible. Finance, invoice, payout, and GST records stay retained for 7 years under legal obligation.
                        </p>
                    </div>
                    <Textarea
                        minRows={3}
                        placeholder="Add any context for the privacy team"
                        value={deletionNotes}
                        onChange={(event) => setDeletionNotes(event.target.value)}
                    />
                    <Button
                        variant="destructive"
                        onClick={() =>
                            createDeletionRequest.mutate({
                                notes: deletionNotes || undefined,
                            })
                        }
                        disabled={createDeletionRequest.isPending}
                    >
                        Request Account Deletion
                    </Button>
                </section>
            </CardContent>
        </Card>
    );
}
