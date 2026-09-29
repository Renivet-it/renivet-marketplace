"use client";

import { Button } from "@/components/ui/button-dash";
import { Input } from "@/components/ui/input-dash";
import { Textarea } from "@/components/ui/textarea-dash";
import { siteConfig } from "@/config/site";
import { grievanceSubmissionSchema } from "@/lib/grievance/validation";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

type ContactFormData = {
    fullName: string;
    email: string;
    message: string;
};

type GrievanceFormData = {
    name: string;
    email: string;
    phone: string;
    orderId: string;
    category:
        | "order_issue"
        | "refund_dispute"
        | "delivery_issue"
        | "product_quality"
        | "other";
    description: string;
    accountCreationConsent: boolean;
};

const grievanceCategoryLabels: Record<GrievanceFormData["category"], string> = {
    order_issue: "Order issue",
    refund_dispute: "Refund dispute",
    delivery_issue: "Delivery issue",
    product_quality: "Product quality",
    other: "Other",
};

export default function ContactPage() {
    const [contactForm, setContactForm] = useState<ContactFormData>({
        fullName: "",
        email: "",
        message: "",
    });
    const [grievanceForm, setGrievanceForm] = useState<GrievanceFormData>({
        name: "",
        email: "",
        phone: "",
        orderId: "",
        category: "order_issue",
        description: "",
        accountCreationConsent: false,
    });
    const [identityEditing, setIdentityEditing] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [submissionAccessPath, setSubmissionAccessPath] = useState<string | null>(null);

    const legalContactsQuery = trpc.general.legal.getActiveLegalContacts.useQuery();
    const currentUserQuery = trpc.general.users.currentUser.useQuery(undefined, {
        retry: false,
    });
    const currentUser = currentUserQuery.data;
    const submitGrievance = trpc.general.legal.submitGrievance.useMutation({
        onSuccess: (result) => {
            if (result.accessPath) {
                setSubmissionAccessPath(result.accessPath);
                toast.success(
                    result.requiresAccountCreation
                        ? "Your grievance is saved. Continue to create your account to track it."
                        : "Your grievance was submitted. Sign in to track it."
                );
            } else {
                toast.success(`Grievance submitted. Ticket ID: ${result.ticketId}`);
            }
            setGrievanceForm({
                name: "",
                email: "",
                phone: "",
                orderId: "",
                category: "order_issue",
                description: "",
                accountCreationConsent: false,
            });
            setFieldErrors({});
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    useEffect(() => {
        if (!currentUser || identityEditing) return;
        setGrievanceForm((current) => ({
            ...current,
            name: current.name || `${currentUser.firstName} ${currentUser.lastName}`.trim(),
            email: current.email || currentUser.email,
            phone: current.phone || currentUser.phone || "",
        }));
    }, [currentUser, identityEditing]);

    const gro = useMemo(
        () => legalContactsQuery.data?.find((item) => item.role === "gro") ?? null,
        [legalContactsQuery.data]
    );

    const handleContactSubmit = async (event?: React.FormEvent) => {
        event?.preventDefault();
        await new Promise((resolve) => setTimeout(resolve, 500));
        toast.success("Message recorded. Our team will get back to you.");
        setContactForm({
            fullName: "",
            email: "",
            message: "",
        });
    };

    return (
        <main className="min-h-screen bg-[linear-gradient(180deg,#fcfbf4_0%,#f3f7ee_100%)] px-4 py-10 sm:px-6">
            <div className="mx-auto max-w-6xl space-y-8">
                <header className="rounded-[28px] border border-[#d8dec8] bg-white/80 px-6 py-8 shadow-sm backdrop-blur sm:px-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                        Renivet Contact
                    </p>
                    <h1 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-5xl">
                        Contact Us
                    </h1>
                    <p className="mt-3 max-w-3xl text-sm text-slate-600 sm:text-base">
                        For general help, reach our support team. For complaints under the
                        Consumer Protection (E-Commerce) Rules, use the grievance section below so
                        we can acknowledge within 48 hours.
                    </p>
                </header>

                <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-[28px] border border-[#d8dec8] bg-white p-6 shadow-sm sm:p-8">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                            General Contact
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                            Support and business queries
                        </h2>
                        <form onSubmit={handleContactSubmit} className="mt-6 space-y-4">
                            <Input
                                placeholder="Full name"
                                value={contactForm.fullName}
                                onChange={(event) =>
                                    setContactForm((current) => ({
                                        ...current,
                                        fullName: event.target.value,
                                    }))
                                }
                            />
                            <Input
                                type="email"
                                placeholder="Email"
                                value={contactForm.email}
                                onChange={(event) =>
                                    setContactForm((current) => ({
                                        ...current,
                                        email: event.target.value,
                                    }))
                                }
                            />
                            <Textarea
                                minRows={5}
                                placeholder="How can we help?"
                                value={contactForm.message}
                                onChange={(event) =>
                                    setContactForm((current) => ({
                                        ...current,
                                        message: event.target.value,
                                    }))
                                }
                            />
                            <Button type="submit">Send message</Button>
                        </form>
                    </div>

                    <aside className="rounded-[28px] border border-[#d8dec8] bg-[#eff7ec] p-6 shadow-sm sm:p-8">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                            Contact Details
                        </p>
                        <div className="mt-5 space-y-5 text-sm text-slate-700">
                            <div>
                                <p className="font-medium text-slate-900">Support email</p>
                                <a
                                    href={`mailto:${siteConfig.contact.email}`}
                                    className="text-emerald-800 underline underline-offset-2"
                                >
                                    {siteConfig.contact.email}
                                </a>
                            </div>
                            <div>
                                <p className="font-medium text-slate-900">Office hours</p>
                                <p>{siteConfig.contact.officeHours}</p>
                            </div>
                            <div>
                                <p className="font-medium text-slate-900">Based in</p>
                                <p>Bangalore, Karnataka</p>
                            </div>
                        </div>
                    </aside>
                </section>

                <section
                    id="grievance-redressal"
                    className="rounded-[28px] border border-emerald-200 bg-white p-6 shadow-sm sm:p-8"
                >
                    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                        <div className="space-y-4 rounded-[24px] bg-[linear-gradient(180deg,#ebf8ee_0%,#f7fcf8_100%)] p-6">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                                Grievance Redressal
                            </p>
                            <h2 className="text-2xl font-semibold text-slate-950">
                                Grievance Redressal Officer
                            </h2>
                            <p className="text-sm text-slate-600">
                                Complaints are acknowledged within 48 hours and we aim to resolve
                                them within 30 days.
                            </p>

                            {gro ? (
                                <div className="space-y-2 rounded-2xl border border-emerald-200 bg-white p-5 text-sm text-slate-700">
                                    <p className="text-lg font-semibold text-slate-950">{gro.name}</p>
                                    {gro.designation ? <p>{gro.designation}</p> : null}
                                    <a
                                        href={`mailto:${gro.email}`}
                                        className="block text-emerald-800 underline underline-offset-2"
                                    >
                                        {gro.email}
                                    </a>
                                    {gro.phone ? <p>{gro.phone}</p> : null}
                                    {gro.address ? <p>{gro.address}</p> : null}
                                    <p className="text-xs text-slate-500">
                                        Effective from {new Date(gro.effectiveFrom).toLocaleDateString()}
                                    </p>
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-emerald-200 bg-white p-5 text-sm text-slate-500">
                                    GRO details will appear here as soon as compliance records are published.
                                </div>
                            )}
                        </div>

                        <div>
                            <p className="text-sm font-medium text-slate-900">Submit a complaint</p>
                            <p className="mt-1 text-sm text-slate-600">
                                This creates a high-priority grievance support ticket with a 48-hour acknowledgment SLA.
                            </p>
                            <form
                                className="mt-5 grid gap-4"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    const parsed = grievanceSubmissionSchema.safeParse(grievanceForm);
                                    if (!parsed.success) {
                                        setFieldErrors(
                                            Object.fromEntries(
                                                Object.entries(parsed.flatten().fieldErrors).map(([key, errors]) => [
                                                    key,
                                                    errors?.[0] ?? "Please check this field.",
                                                ])
                                            )
                                        );
                                        return;
                                    }
                                    setFieldErrors({});
                                    submitGrievance.mutate({
                                        ...parsed.data,
                                    });
                                }}
                            >
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Input
                                        placeholder="Name"
                                        aria-invalid={Boolean(fieldErrors.name)}
                                        value={grievanceForm.name}
                                        disabled={Boolean(currentUser) && !identityEditing}
                                        onChange={(event) =>
                                            setGrievanceForm((current) => ({
                                                ...current,
                                                name: event.target.value,
                                            }))
                                        }
                                    />
                                    {fieldErrors.name ? (
                                        <p className="text-xs text-red-600">{fieldErrors.name}</p>
                                    ) : null}
                                    <Input
                                        type="email"
                                        placeholder="Email"
                                        aria-invalid={Boolean(fieldErrors.email)}
                                        value={grievanceForm.email}
                                        disabled={Boolean(currentUser) && !identityEditing}
                                        onChange={(event) =>
                                            setGrievanceForm((current) => ({
                                                ...current,
                                                email: event.target.value,
                                            }))
                                        }
                                    />
                                    {fieldErrors.email ? (
                                        <p className="text-xs text-red-600">{fieldErrors.email}</p>
                                    ) : null}
                                </div>
                                {currentUser && !identityEditing ? (
                                    <button
                                        type="button"
                                        className="justify-self-start text-xs font-semibold text-emerald-800 underline underline-offset-2"
                                        onClick={() => setIdentityEditing(true)}
                                    >
                                        Edit contact details for this grievance
                                    </button>
                                ) : null}
                                <div>
                                    <Input
                                        placeholder="Phone number"
                                        inputMode="tel"
                                        aria-invalid={Boolean(fieldErrors.phone)}
                                        value={grievanceForm.phone}
                                        disabled={Boolean(currentUser?.phone) && !identityEditing}
                                        onChange={(event) =>
                                            setGrievanceForm((current) => ({
                                                ...current,
                                                phone: event.target.value,
                                            }))
                                        }
                                    />
                                    {fieldErrors.phone ? (
                                        <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>
                                    ) : null}
                                </div>
                                <div className="grid gap-4 sm:grid-cols-[0.9fr_1.1fr]">
                                    <Input
                                        placeholder="Order ID (optional)"
                                        value={grievanceForm.orderId}
                                        onChange={(event) =>
                                            setGrievanceForm((current) => ({
                                                ...current,
                                                orderId: event.target.value,
                                            }))
                                        }
                                    />
                                    <select
                                        value={grievanceForm.category}
                                        onChange={(event) =>
                                            setGrievanceForm((current) => ({
                                                ...current,
                                                category: event.target.value as GrievanceFormData["category"],
                                            }))
                                        }
                                        className={cn(
                                            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-slate-900 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        )}
                                    >
                                        {Object.entries(grievanceCategoryLabels).map(([value, label]) => (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <Textarea
                                    minRows={6}
                                    placeholder="Describe the complaint"
                                    value={grievanceForm.description}
                                    onChange={(event) =>
                                        setGrievanceForm((current) => ({
                                            ...current,
                                            description: event.target.value,
                                        }))
                                    }
                                />
                                {!currentUser ? (
                                    <label className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-xs leading-5 text-slate-700">
                                        <input
                                            type="checkbox"
                                            checked={grievanceForm.accountCreationConsent}
                                            onChange={(event) =>
                                                setGrievanceForm((current) => ({
                                                    ...current,
                                                    accountCreationConsent: event.target.checked,
                                                }))
                                            }
                                            className="mt-1"
                                        />
                                        <span>
                                            If no account matches these details, I consent to creating a Renivet account so I can securely track and reply to this grievance.
                                        </span>
                                    </label>
                                ) : null}
                                {submissionAccessPath ? (
                                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                                        <p>Continue securely to access your grievance:</p>
                                        <Link className="mt-2 inline-block font-semibold underline underline-offset-2" href={submissionAccessPath}>
                                            Continue to account access
                                        </Link>
                                    </div>
                                ) : null}
                                <Button type="submit" disabled={submitGrievance.isPending}>
                                    {submitGrievance.isPending ? "Submitting..." : "Submit grievance"}
                                </Button>
                            </form>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
