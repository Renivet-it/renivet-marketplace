"use client";

import { Button } from "@/components/ui/button-general";
import { Input } from "@/components/ui/input-general";
import { trpc } from "@/lib/trpc/client";
import { handleClientError } from "@/lib/utils";
import { useUploadThing } from "@/lib/uploadthing";
import {
    ArrowLeft,
    ArrowRight,
    Building2,
    CalendarDays,
    Check,
    CheckCircle2,
    ChevronDown,
    ClipboardList,
    FileText,
    Headphones,
    LockKeyhole,
    Paperclip,
    Send,
    SlidersHorizontal,
    UploadCloud,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type Dispatch, type ReactNode, type SetStateAction, useEffect, useState } from "react";
import { toast } from "sonner";

type UploadedFile = {
    name: string;
    size: number;
    url: string;
    key?: string;
    type: string;
};

const useCaseOptions = [
    "Apparel and uniforms",
    "Corporate gifting",
    "Event merchandise",
    "Employee onboarding kits",
    "Institutional procurement",
    "Hospitality supply",
    "Other requirement",
] as const;

type RequestFormState = {
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    useCase: string;
    quantity: number;
    budgetPerUnit: string;
    deliveryDate: string;
    sustainabilityRequired: boolean;
    brandingRequired: boolean;
    requirementDescription: string;
    procurementMode: "self_service" | "rfq" | "enterprise_po";
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
    const [form, setForm] = useState<RequestFormState>({
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

            toast.success(`Request for quotation ${created.rfqNumber} submitted`);
            router.push("/profile/corporate");
        } catch (error) {
            handleClientError(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ExpandedRequestQuoteForm
            form={form}
            setForm={setForm}
            attachments={attachments}
            setAttachments={setAttachments}
            isSubmitting={isSubmitting}
            submit={submit}
        />
    );

    /* Legacy layout retained below for reference while the expanded design is active. */
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
                    <label className="rounded-2xl border px-4 py-4 text-sm text-slate-700">
                        <span className="mb-2 block font-semibold text-slate-900">
                            Use case
                        </span>
                        <select
                            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3"
                            value={form.useCase}
                            onChange={(e) =>
                                setForm((current) => ({
                                    ...current,
                                    useCase: e.target.value,
                                }))
                            }
                        >
                            <option value="">Select use case</option>
                            {useCaseOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </label>
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
                        required
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
                        Upload PDF, PPT, XLSX, JPG, PNG, or ZIP files. Combined attachment size must stay within 50 MB.
                    </p>
                    <input
                        className="mt-4 block w-full text-sm"
                        type="file"
                        accept=".pdf,.ppt,.pptx,.xlsx,.xls,.jpg,.jpeg,.png,.zip"
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

function ExpandedRequestQuoteForm({
    form,
    setForm,
    attachments,
    setAttachments,
    isSubmitting,
    submit,
}: {
    form: RequestFormState;
    setForm: Dispatch<SetStateAction<RequestFormState>>;
    attachments: File[];
    setAttachments: Dispatch<SetStateAction<File[]>>;
    isSubmitting: boolean;
    submit: () => Promise<void>;
}) {
    const update = (changes: Partial<RequestFormState>) =>
        setForm((current) => ({ ...current, ...changes }));
    const fieldClass =
        "h-10 w-full rounded-lg border border-[#dfe5ea] bg-white px-3 text-[13px] text-[#344054] outline-none transition focus:border-[#1d6a50] focus:ring-2 focus:ring-[#1d6a50]/10";

    return (
        <div className="grid w-full max-w-full gap-7 overflow-x-hidden font-inter text-[#182131] lg:grid-cols-[minmax(0,1fr)_278px]">
            <main className="rounded-xl border border-[#e0e6e9] bg-white p-6 shadow-[0_7px_24px_rgba(25,42,56,0.04)] md:p-7">
                <header>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1d6a50]">Request custom quote</p>
                    <div className="mt-3 flex items-start justify-between gap-5">
                        <div>
                            <h1 className="max-w-[560px] font-playfair text-3xl font-semibold leading-[1.1] tracking-[-0.03em] text-[#182131] md:text-[40px]">
                                Tell us what your team needs
                            </h1>
                            <p className="mt-3 max-w-[600px] text-[14px] leading-5 text-[#697587]">
                                Share your requirements, attach supporting files, and we&apos;ll convert your request into managed corporate procurement workflow.
                            </p>
                        </div>
                        <div className="hidden size-20 shrink-0 items-center justify-center rounded-full bg-[#eff9f4] lg:flex">
                            <CheckCircle2 className="size-10 text-[#20b57c]" strokeWidth={1.5} />
                        </div>
                    </div>
                </header>

                <div className="mt-7 flex items-center gap-4 border-b border-[#edf0f2] pb-5 text-[12px]">
                    <ProgressStep number="1" title="Company & contact" subtitle="Who should we contact?" active />
                    <div className="h-px flex-1 bg-[#dce3e7]" />
                    <ProgressStep number="2" title="Order requirements" subtitle="Tell us what you need" />
                    <div className="h-px flex-1 bg-[#dce3e7]" />
                    <ProgressStep number="3" title="Submit" subtitle="We&apos;ll take it from here" />
                </div>

                <div className="mt-6 space-y-3">
                    <FormSection number="1" icon={<Building2 className="size-4" />} title="Company & Contact Details" subtitle="Who should we contact?">
                        <div className="grid gap-3 md:grid-cols-2">
                            <Field label="Company name"><input className={fieldClass} placeholder="Company name" value={form.companyName} onChange={(e) => update({ companyName: e.target.value })} /></Field>
                            <Field label="Contact person"><input className={fieldClass} placeholder="Contact person" value={form.contactPerson} onChange={(e) => update({ contactPerson: e.target.value })} /></Field>
                            <Field label="Email address"><input className={fieldClass} type="email" placeholder="Email address" value={form.email} onChange={(e) => update({ email: e.target.value })} /></Field>
                            <Field label="Phone number"><input className={fieldClass} placeholder="Phone number" value={form.phone} onChange={(e) => update({ phone: e.target.value })} /></Field>
                        </div>
                    </FormSection>

                    <FormSection number="2" icon={<ClipboardList className="size-4" />} title="Order Requirements" subtitle="Tell us about your requirements">
                        <div className="grid gap-3 md:grid-cols-2">
                            <Field label="Use case"><select className={fieldClass} value={form.useCase} onChange={(e) => update({ useCase: e.target.value })}><option value="">Select use case</option>{useCaseOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></Field>
                            <Field label="Quantity"><input className={fieldClass} type="number" min="1" placeholder="Enter quantity" value={form.quantity} onChange={(e) => update({ quantity: Number(e.target.value) })} /></Field>
                            <Field label="Budget per unit (INR)"><input className={fieldClass} type="number" min="0" placeholder="Enter budget" value={form.budgetPerUnit} onChange={(e) => update({ budgetPerUnit: e.target.value })} /></Field>
                            <Field label="Required by"><div className="relative"><input className={fieldClass} type="date" value={form.deliveryDate} onChange={(e) => update({ deliveryDate: e.target.value })} /><CalendarDays className="pointer-events-none absolute right-3 top-3 size-4 text-[#98a2b3]" /></div></Field>
                        </div>
                    </FormSection>

                    <FormSection number="3" icon={<SlidersHorizontal className="size-4" />} title="Procurement Preferences" subtitle="Your preferences help us serve you better.">
                        <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_1fr]">
                            <Field label="Procurement mode"><select className={fieldClass} value={form.procurementMode} onChange={(e) => update({ procurementMode: e.target.value as RequestFormState["procurementMode"] })}><option value="rfq">Request for quotation managed</option><option value="self_service">Self service</option><option value="enterprise_po">Enterprise with purchase order</option></select></Field>
                            <CheckField checked={form.sustainabilityRequired} label="Sustainability preference required" onChange={(checked) => update({ sustainabilityRequired: checked })} />
                            <CheckField checked={form.brandingRequired} label="Custom branding required" onChange={(checked) => update({ brandingRequired: checked })} />
                        </div>
                    </FormSection>

                    <FormSection number="4" icon={<FileText className="size-4" />} title="Requirement Description" subtitle="Add more details about your requirements (optional)">
                        <div className="relative">
                            <textarea className="min-h-28 w-full resize-y rounded-lg border border-[#dfe5ea] px-3 py-3 text-[13px] text-[#344054] outline-none placeholder:text-[#98a2b3] focus:border-[#1d6a50] focus:ring-2 focus:ring-[#1d6a50]/10" maxLength={1000} placeholder="Write your requirements, specifications, or any other details..." value={form.requirementDescription} onChange={(e) => update({ requirementDescription: e.target.value })} />
                            <span className="absolute bottom-2 right-3 text-[10px] text-[#98a2b3]">{form.requirementDescription.length} / 1000</span>
                        </div>
                    </FormSection>

                    <FormSection number="5" icon={<Paperclip className="size-4" />} title="Supporting Files" subtitle="Upload any supporting documents, images, or files to support your request.">
                        <label className="flex min-h-20 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#cbd5dc] bg-[#fafcfd] px-4 py-4 text-center text-[12px] text-[#697587] transition hover:border-[#1d6a50] hover:bg-[#f3faf6] sm:flex-row">
                            <UploadCloud className="size-5 text-[#98a2b3]" />
                            <span>Drag &amp; drop files here or</span>
                            <span className="rounded-md border border-[#d9e1e6] bg-white px-3 py-1.5 font-semibold text-[#344054] shadow-sm">Choose Files</span>
                            <input className="sr-only" type="file" accept=".pdf,.ppt,.pptx,.xlsx,.xls,.jpg,.jpeg,.png,.zip" multiple onChange={(e) => setAttachments(Array.from(e.target.files ?? []))} />
                        </label>
                        <p className="mt-2 text-[11px] text-[#98a2b3]">PDF, PPT, XLSX, JPG, PNG, or ZIP files. Combined attachment size must stay within 50 MB.</p>
                        {attachments.length > 0 ? <div className="mt-3 flex flex-wrap gap-2">{attachments.map((file) => <span key={`${file.name}-${file.size}`} className="rounded-full bg-[#edf7f1] px-3 py-1 text-[11px] text-[#1d6a50]">{file.name}</span>)}</div> : null}
                    </FormSection>
                </div>

                <div className="mt-7 flex flex-col gap-3 border-t border-[#edf0f2] pt-6 sm:flex-row">
                    <Button className="h-11 flex-1 bg-[#1d6a50] text-[13px] font-semibold text-white shadow-sm hover:bg-[#15533e]" onClick={submit} disabled={isSubmitting}>
                        {isSubmitting ? "Submitting..." : "Submit Request for Quotation"}<Send className="ml-2 size-4" />
                    </Button>
                    <Button asChild variant="outline" className="h-11 flex-1 border-[#d6dee4] text-[13px] text-[#344054]">
                        <a href="/profile/corporate"><ArrowLeft className="mr-2 size-4" />Back to Corporate Dashboard</a>
                    </Button>
                </div>
                <p className="mt-3 flex items-center gap-2 text-[11px] text-[#8a94a3]"><LockKeyhole className="size-3" />Your information is secure and will only be used to process your request.</p>
            </main>

            <aside className="space-y-5">
                <SidePanel icon={<FileText className="size-4" />} title="What happens next?">
                    <TimelineStep number="1" title="We&apos;ll review your request" description="Our procurement team will review your requirements." active />
                    <TimelineStep number="2" title="We&apos;ll prepare your quote" description="You&apos;ll receive a customized quotation via email." />
                    <TimelineStep number="3" title="Review & approve" description="Review the quote and approve to proceed." />
                    <TimelineStep number="4" title="We take it forward" description="We handle the next—sourcing, quality, and delivery." last />
                </SidePanel>
                <SidePanel icon={<CheckCircle2 className="size-4" />} title="Tips before you submit">
                    {[
                        "Confirm quantity and delivery date",
                        "Attach logo/brief if branding is needed",
                        "Mention budget expectations clearly",
                        "Use enterprise mode if PO approval is required",
                    ].map((tip) => <div key={tip} className="flex items-start gap-2 text-[12px] leading-5 text-[#536174]"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#1d6a50]" />{tip}</div>)}
                </SidePanel>
                <div className="rounded-xl border border-[#dcefe6] bg-[#effaf4] p-5">
                    <Headphones className="size-5 text-[#1d6a50]" />
                    <h2 className="mt-4 text-[16px] font-bold text-[#182131]">Need help?</h2>
                    <p className="mt-2 text-[12px] leading-5 text-[#536174]">Our procurement team is here to help you with your requirements.</p>
                    <a href="/contact" className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold text-[#1d6a50]">Contact Procurement Team <ArrowRight className="size-3.5" /></a>
                </div>
            </aside>
        </div>
    );
}

function ProgressStep({ number, title, subtitle, active = false }: { number: string; title: string; subtitle: string; active?: boolean }) {
    return <div className="flex min-w-0 items-center gap-2"><span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${active ? "bg-[#1d6a50] text-white" : "border border-[#d6dee4] bg-white text-[#8490a0]"}`}>{number}</span><span className="hidden min-w-0 sm:block"><span className="block truncate font-semibold text-[#344054]">{title}</span><span className="block truncate text-[10px] text-[#8a94a3]">{subtitle}</span></span></div>;
}

function FormSection({ number, icon, title, subtitle, children }: { number: string; icon: ReactNode; title: string; subtitle: string; children: ReactNode }) {
    return <section className="rounded-xl border border-[#dfe5ea] bg-white p-4"><div className="flex items-start gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#e5f5ed] text-[#1d6a50]">{icon}</span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><div><h2 className="text-[14px] font-bold text-[#182131]"><span className="mr-2 text-[#1d6a50]">{number}</span>{title}</h2><p className="mt-0.5 text-[11px] text-[#7b8797]">{subtitle}</p></div><ChevronDown className="mt-1 size-4 shrink-0 text-[#98a2b3]" /></div><div className="mt-4">{children}</div></div></div></section>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    return <label className="block"><span className="mb-1.5 block text-[10px] font-medium text-[#667085]">{label}</span>{children}</label>;
}

function CheckField({ checked, label, onChange }: { checked: boolean; label: string; onChange: (checked: boolean) => void }) {
    return <label className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-[#dfe5ea] px-3 text-[12px] text-[#536174]"><input type="checkbox" className="size-4 accent-[#1d6a50]" checked={checked} onChange={(e) => onChange(e.target.checked)} /><span>{label}</span></label>;
}

function SidePanel({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
    return <section className="rounded-xl border border-[#dfe5ea] bg-white p-5 shadow-[0_7px_20px_rgba(25,42,56,0.03)]"><div className="flex items-center gap-2 text-[16px] font-bold text-[#182131]"><span className="text-[#1d6a50]">{icon}</span>{title}<ChevronDown className="ml-auto size-4 text-[#98a2b3]" /></div><div className="mt-5 space-y-4">{children}</div></section>;
}

function TimelineStep({ number, title, description, active = false, last = false }: { number: string; title: string; description: string; active?: boolean; last?: boolean }) {
    return <div className="relative flex gap-3"><span className={`relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${active ? "bg-[#1d6a50] text-white" : "border border-[#d8e0e5] bg-white text-[#8a94a3]"}`}>{active ? <Check className="size-3" /> : number}</span>{!last ? <span className="absolute left-3 top-6 h-[calc(100%+16px)] w-px bg-[#dfe7e3]" /> : null}<span className="pb-1"><span className="block text-[12px] font-bold text-[#344054]">{title}</span><span className="mt-1 block text-[11px] leading-4 text-[#7b8797]">{description}</span></span></div>;
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
