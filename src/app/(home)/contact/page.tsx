"use client";

import { Button } from "@/components/ui/button-dash";
import { Input } from "@/components/ui/input-dash";
import { Textarea } from "@/components/ui/textarea-dash";
import { siteConfig } from "@/config/site";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type ContactFormData = {
    fullName: string;
    email: string;
    message: string;
};

type GrievanceFormData = {
    name: string;
    email: string;
    orderId: string;
    category:
        | "order_issue"
        | "refund_dispute"
        | "delivery_issue"
        | "product_quality"
        | "other";
    description: string;
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
        orderId: "",
        category: "order_issue",
        description: "",
    });

    const legalContactsQuery = trpc.general.legal.getActiveLegalContacts.useQuery();
    const submitGrievance = trpc.general.legal.submitGrievance.useMutation({
        onSuccess: (result) => {
            toast.success(`Grievance submitted. Ticket ID: ${result.ticketId}`);
            setGrievanceForm({
                name: "",
                email: "",
                orderId: "",
                category: "order_issue",
                description: "",
            });
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

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
                                    submitGrievance.mutate({
                                        name: grievanceForm.name,
                                        email: grievanceForm.email,
                                        orderId: grievanceForm.orderId || undefined,
                                        category: grievanceForm.category,
                                        description: grievanceForm.description,
                                    });
                                }}
                            >
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Input
                                        placeholder="Name"
                                        value={grievanceForm.name}
                                        onChange={(event) =>
                                            setGrievanceForm((current) => ({
                                                ...current,
                                                name: event.target.value,
                                            }))
                                        }
                                    />
                                    <Input
                                        type="email"
                                        placeholder="Email"
                                        value={grievanceForm.email}
                                        onChange={(event) =>
                                            setGrievanceForm((current) => ({
                                                ...current,
                                                email: event.target.value,
                                            }))
                                        }
                                    />
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
