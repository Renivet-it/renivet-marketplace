"use client";

import { Button } from "@/components/ui/button-dash";
import { Input } from "@/components/ui/input-dash";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea-dash";
import { trpc } from "@/lib/trpc/client";
import { handleClientError } from "@/lib/utils";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Draft = {
    legalName: string;
    tradeName: string;
    gstin: string;
    cin: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    email: string;
    phone: string;
    bankName: string;
    bankAccountName: string;
    bankAccountNumber: string;
    bankAccountType: string;
    bankIfscCode: string;
    bankBranch: string;
    authorizedSignatoryName: string;
    defaultPaymentTerms: string;
    proformaValidityDays: number;
    balanceDueDays: number;
    isActive: boolean;
};

const emptyDraft: Draft = {
    legalName: "Renivet",
    tradeName: "Renivet",
    gstin: "",
    cin: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    email: "",
    phone: "",
    bankName: "IDFC",
    bankAccountName: "Renivet",
    bankAccountNumber: "73564993505",
    bankAccountType: "",
    bankIfscCode: "IDFB0090174",
    bankBranch: "",
    authorizedSignatoryName: "Renivet",
    defaultPaymentTerms:
        "30% advance on PO confirmation; balance within 15 days of dispatch.",
    proformaValidityDays: 14,
    balanceDueDays: 15,
    isActive: true,
};

export function CorporateDocumentSettingsPanel() {
    const { data, isLoading } =
        trpc.general.corporatePlatform.getCorporateDocumentSettings.useQuery();
    const [draft, setDraft] = useState<Draft>(emptyDraft);
    useEffect(() => {
        if (!data) return;
        setDraft(
            Object.fromEntries(
                Object.entries(emptyDraft).map(([key, fallback]) => [
                    key,
                    (data as Record<string, unknown>)[key] ?? fallback,
                ])
            ) as Draft
        );
    }, [data]);
    const mutation =
        trpc.general.corporatePlatform.updateCorporateDocumentSettings.useMutation(
            {
                onSuccess: () =>
                    toast.success("Corporate document settings saved"),
                onError: (error) => handleClientError(error),
            }
        );
    const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
        setDraft((current) => ({ ...current, [key]: value }));
    const optional = (value: string) => value.trim() || null;

    return (
        <section className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                        Corporate document identity
                    </h2>
                    <p className="mt-1 max-w-3xl text-sm text-slate-500">
                        These legal, GST, bank, and signatory details appear on
                        all seven corporate-order documents.
                    </p>
                </div>
                <Button
                    disabled={isLoading || mutation.isPending}
                    onClick={() =>
                        mutation.mutate({
                            legalName: draft.legalName,
                            tradeName: draft.tradeName,
                            gstin: optional(draft.gstin),
                            cin: optional(draft.cin),
                            addressLine1: optional(draft.addressLine1),
                            addressLine2: optional(draft.addressLine2),
                            city: optional(draft.city),
                            state: optional(draft.state),
                            postalCode: optional(draft.postalCode),
                            country: draft.country,
                            email: optional(draft.email),
                            phone: optional(draft.phone),
                            bankName: optional(draft.bankName),
                            bankAccountName: draft.bankAccountName,
                            bankAccountNumber: optional(
                                draft.bankAccountNumber
                            ),
                            bankAccountType: optional(draft.bankAccountType),
                            bankIfscCode: optional(draft.bankIfscCode),
                            bankBranch: optional(draft.bankBranch),
                            authorizedSignatoryName:
                                draft.authorizedSignatoryName,
                            defaultPaymentTerms: draft.defaultPaymentTerms,
                            proformaValidityDays: draft.proformaValidityDays,
                            balanceDueDays: draft.balanceDueDays,
                            isActive: draft.isActive,
                        })
                    }
                >
                    {mutation.isPending
                        ? "Saving..."
                        : "Save document settings"}
                </Button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Field
                    label="Legal name"
                    value={draft.legalName}
                    onChange={(value) => set("legalName", value)}
                />
                <Field
                    label="Trade name"
                    value={draft.tradeName}
                    onChange={(value) => set("tradeName", value)}
                />
                <Field
                    label="GSTIN"
                    value={draft.gstin}
                    onChange={(value) => set("gstin", value.toUpperCase())}
                />
                <Field
                    label="CIN"
                    value={draft.cin}
                    onChange={(value) => set("cin", value.toUpperCase())}
                />
                <Field
                    label="Address line 1"
                    value={draft.addressLine1}
                    onChange={(value) => set("addressLine1", value)}
                />
                <Field
                    label="Address line 2"
                    value={draft.addressLine2}
                    onChange={(value) => set("addressLine2", value)}
                />
                <Field
                    label="City"
                    value={draft.city}
                    onChange={(value) => set("city", value)}
                />
                <Field
                    label="State"
                    value={draft.state}
                    onChange={(value) => set("state", value)}
                />
                <Field
                    label="Postal code"
                    value={draft.postalCode}
                    onChange={(value) => set("postalCode", value)}
                />
                <Field
                    label="Country"
                    value={draft.country}
                    onChange={(value) => set("country", value)}
                />
                <Field
                    label="Billing email"
                    value={draft.email}
                    onChange={(value) => set("email", value)}
                />
                <Field
                    label="Billing phone"
                    value={draft.phone}
                    onChange={(value) => set("phone", value)}
                />
                <Field
                    label="Bank name"
                    value={draft.bankName}
                    onChange={(value) => set("bankName", value)}
                />
                <Field
                    label="Account name"
                    value={draft.bankAccountName}
                    onChange={(value) => set("bankAccountName", value)}
                />
                <Field
                    label="Account number"
                    value={draft.bankAccountNumber}
                    onChange={(value) => set("bankAccountNumber", value)}
                />
                <Field
                    label="Account type"
                    value={draft.bankAccountType}
                    onChange={(value) => set("bankAccountType", value)}
                />
                <Field
                    label="IFSC code"
                    value={draft.bankIfscCode}
                    onChange={(value) =>
                        set("bankIfscCode", value.toUpperCase())
                    }
                />
                <Field
                    label="Bank branch"
                    value={draft.bankBranch}
                    onChange={(value) => set("bankBranch", value)}
                />
                <Field
                    label="Authorized signatory"
                    value={draft.authorizedSignatoryName}
                    onChange={(value) => set("authorizedSignatoryName", value)}
                />
                <Field
                    label="Proforma validity (days)"
                    type="number"
                    value={String(draft.proformaValidityDays)}
                    onChange={(value) =>
                        set("proformaValidityDays", Number(value) || 1)
                    }
                />
                <Field
                    label="Balance due after dispatch (days)"
                    type="number"
                    value={String(draft.balanceDueDays)}
                    onChange={(value) =>
                        set("balanceDueDays", Number(value) || 0)
                    }
                />
                <div className="space-y-2 md:col-span-2 xl:col-span-3">
                    <Label>Default payment terms</Label>
                    <Textarea
                        minRows={3}
                        value={draft.defaultPaymentTerms}
                        onChange={(event) =>
                            set("defaultPaymentTerms", event.target.value)
                        }
                    />
                </div>
            </div>
        </section>
    );
}

function Field({
    label,
    value,
    onChange,
    type = "text",
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
}) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <Input
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
        </div>
    );
}
