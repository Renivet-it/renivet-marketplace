"use client";

import { Button } from "@/components/ui/button-general";
import { Input } from "@/components/ui/input-general";
import { trpc } from "@/lib/trpc/client";
import { handleClientError } from "@/lib/utils";
import { useUploadThing } from "@/lib/uploadthing";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type UploadedFile = {
    name: string;
    size: number;
    url: string;
    key?: string;
    type: string;
};

export function CorporateRequestQuoteForm() {
    const router = useRouter();
    const { data: profile } = trpc.general.corporatePlatform.getMyProfile.useQuery();
    const { startUpload } = useUploadThing("corporateRfqAttachmentUploader");
    const submitMutation = trpc.general.corporatePlatform.submitRfq.useMutation({
        onError: (error) => handleClientError(error),
    });

    const [attachments, setAttachments] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({
        companyName: "",
        contactPerson: "",
        email: "",
        phone: "",
        useCase: "",
        quantity: 100,
        budgetPerUnit: "",
        deliveryDate: "",
        sustainabilityRequired: true,
        brandingRequired: true,
        requirementDescription: "",
        procurementMode: "rfq" as "self_service" | "rfq" | "enterprise_po",
    });

    useEffect(() => {
        if (!profile) return;
        setForm((current) => ({
            ...current,
            companyName: current.companyName || profile.companyName,
            contactPerson: current.contactPerson || profile.contactPerson,
            email: current.email || profile.email,
            phone: current.phone || profile.phone,
        }));
    }, [profile]);

    const submit = async () => {
        try {
            setIsSubmitting(true);
            let uploadedAttachments: UploadedFile[] = [];
            if (attachments.length > 0) {
                const uploaded = await startUpload(attachments);
                uploadedAttachments =
                    uploaded?.map((file) => ({
                        name: file.name,
                        size: file.size,
                        url: file.url,
                        key: file.key,
                        type: (file as any).type ?? "application/octet-stream",
                    })) ?? [];
            }

            const created = await submitMutation.mutateAsync({
                profileId: profile?.id ?? null,
                companyName: form.companyName,
                contactPerson: form.contactPerson,
                email: form.email,
                phone: form.phone,
                useCase: form.useCase,
                quantity: Number(form.quantity),
                budgetPerUnitPaise: form.budgetPerUnit
                    ? Math.round(Number(form.budgetPerUnit) * 100)
                    : null,
                deliveryDate: form.deliveryDate || null,
                sustainabilityRequired: form.sustainabilityRequired,
                brandingRequired: form.brandingRequired,
                requirementDescription: form.requirementDescription,
                procurementMode: form.procurementMode,
                attachments: uploadedAttachments,
            });

            toast.success(`RFQ ${created.rfqNumber} submitted`);
            router.push("/profile/corporate");
        } catch (error) {
            handleClientError(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="grid w-full gap-6 xl:grid-cols-[minmax(0,1.8fr)_360px]">
            <div className="space-y-6 rounded-[28px] border border-[#d9e4ef] bg-white p-6 shadow-sm md:p-8">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#5B9BD5]">
                        Request Custom Quote
                    </p>
                    <h1 className="mt-3 font-serif text-3xl font-semibold text-slate-900 md:text-5xl">
                        Tell us what your team needs
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                        Submit your requirements, attach supporting files, and we will
                        convert the request into a managed corporate procurement workflow.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Input
                        placeholder="Company name"
                        value={form.companyName}
                        onChange={(e) =>
                            setForm((current) => ({
                                ...current,
                                companyName: e.target.value,
                            }))
                        }
                    />
                    <Input
                        placeholder="Contact person"
                        value={form.contactPerson}
                        onChange={(e) =>
                            setForm((current) => ({
                                ...current,
                                contactPerson: e.target.value,
                            }))
                        }
                    />
                    <Input
                        placeholder="Email address"
                        type="email"
                        value={form.email}
                        onChange={(e) =>
                            setForm((current) => ({
                                ...current,
                                email: e.target.value,
                            }))
                        }
                    />
                    <Input
                        placeholder="Phone number"
                        value={form.phone}
                        onChange={(e) =>
                            setForm((current) => ({
                                ...current,
                                phone: e.target.value,
                            }))
                        }
                    />
                    <Input
                        placeholder="Use case"
                        value={form.useCase}
                        onChange={(e) =>
                            setForm((current) => ({
                                ...current,
                                useCase: e.target.value,
                            }))
                        }
                    />
                    <Input
                        placeholder="Quantity"
                        type="number"
                        min="1"
                        value={form.quantity}
                        onChange={(e) =>
                            setForm((current) => ({
                                ...current,
                                quantity: Number(e.target.value),
                            }))
                        }
                    />
                    <Input
                        placeholder="Budget per unit (INR)"
                        type="number"
                        min="0"
                        value={form.budgetPerUnit}
                        onChange={(e) =>
                            setForm((current) => ({
                                ...current,
                                budgetPerUnit: e.target.value,
                            }))
                        }
                    />
                    <Input
                        placeholder="Expected delivery date"
                        type="date"
                        value={form.deliveryDate}
                        onChange={(e) =>
                            setForm((current) => ({
                                ...current,
                                deliveryDate: e.target.value,
                            }))
                        }
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <label className="rounded-2xl border px-4 py-4 text-sm text-slate-700">
                        <span className="mb-2 block font-semibold text-slate-900">
                            Procurement mode
                        </span>
                        <select
                            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3"
                            value={form.procurementMode}
                            onChange={(e) =>
                                setForm((current) => ({
                                    ...current,
                                    procurementMode: e.target.value as
                                        | "self_service"
                                        | "rfq"
                                        | "enterprise_po",
                                }))
                            }
                        >
                            <option value="rfq">Request for quotation managed</option>
                            <option value="self_service">Self service</option>
                            <option value="enterprise_po">Enterprise with purchase order</option>
                        </select>
                    </label>
                    <label className="flex items-center gap-3 rounded-2xl border px-4 py-4 text-sm text-slate-700">
                        <input
                            type="checkbox"
                            checked={form.sustainabilityRequired}
                            onChange={(e) =>
                                setForm((current) => ({
                                    ...current,
                                    sustainabilityRequired: e.target.checked,
                                }))
                            }
                        />
                        Sustainability preference required
                    </label>
                    <label className="flex items-center gap-3 rounded-2xl border px-4 py-4 text-sm text-slate-700">
                        <input
                            type="checkbox"
                            checked={form.brandingRequired}
                            onChange={(e) =>
                                setForm((current) => ({
                                    ...current,
                                    brandingRequired: e.target.checked,
                                }))
                            }
                        />
                        Custom branding required
                    </label>
                </div>

                <textarea
                    className="min-h-40 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                    placeholder="Requirement description"
                    value={form.requirementDescription}
                    onChange={(e) =>
                        setForm((current) => ({
                            ...current,
                            requirementDescription: e.target.value,
                        }))
                    }
                />

                <div className="rounded-2xl border border-dashed border-slate-300 p-4">
                    <p className="text-sm font-semibold text-slate-900">
                        Supporting files
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        Upload PDF, PPT, XLSX, JPG, PNG, or ZIP files up to the platform limit.
                    </p>
                    <input
                        className="mt-4 block w-full text-sm"
                        type="file"
                        multiple
                        onChange={(e) =>
                            setAttachments(Array.from(e.target.files ?? []))
                        }
                    />
                    {attachments.length > 0 ? (
                        <div className="mt-3 space-y-2 text-sm text-slate-600">
                            {attachments.map((file) => (
                                <div key={`${file.name}-${file.size}`}>{file.name}</div>
                            ))}
                        </div>
                    ) : null}
                </div>

                <div className="flex flex-wrap gap-3">
                    <Button
                        className="bg-[#5B9BD5] text-white hover:bg-[#4A8BC5]"
                        onClick={submit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Submitting..." : "Submit Request for Quotation"}
                    </Button>
                    <Button asChild variant="outline">
                        <a href="/profile/corporate">Back to Corporate Dashboard</a>
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                <SideCard
                    title="What gets created"
                    items={[
                        "Corporate profile snapshot",
                        "Request for quotation record and attachments",
                        "Quote review workflow",
                        "Purchase order, quality control, dispatch, and finance trail",
                    ]}
                />
                <SideCard
                    title="Procurement path"
                    items={[
                        "Request for quotation submitted",
                        "Quote prepared and shared",
                        "Approval or revision request",
                        "Purchase order or payment confirmation",
                        "Production, quality control, dispatch",
                    ]}
                />
                <SideCard
                    title="Before you submit"
                    items={[
                        "Confirm quantity and delivery date",
                        "Attach logo or brief if branding is needed",
                        "Mention budget expectations clearly",
                        "Use enterprise mode if PO approval is required",
                    ]}
                />
            </div>
        </div>
    );
}

function SideCard({
    title,
    items,
}: {
    title: string;
    items: string[];
}) {
    return (
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <div className="mt-4 space-y-3">
                {items.map((item) => (
                    <div
                        key={item}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
                    >
                        {item}
                    </div>
                ))}
            </div>
        </div>
    );
}
