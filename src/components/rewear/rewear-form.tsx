"use client";

import { trpc } from "@/lib/trpc/client";
import {
    ArrowRight,
    Check,
    LockKeyhole,
    MapPin,
    MessageSquare,
    Phone,
    Plus,
    Shirt,
    Smartphone,
    UserRound,
} from "lucide-react";
import { FormEvent, useState } from "react";

const garmentOptions = [
    "1-5 garments",
    "6-10 garments",
    "11-20 garments",
    "21-30 garments",
    "More than 30 garments",
];

const contactOptions = [
    { label: "WhatsApp", icon: WhatsAppIcon },
    { label: "Phone call", icon: Phone },
    { label: "SMS", icon: MessageSquare },
] as const;

type ContactMethod = (typeof contactOptions)[number]["label"];

function WhatsAppIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={className}
            fill="currentColor"
        >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.986 2.894a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.887-9.883 9.887m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.89c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.479-8.413" />
        </svg>
    );
}

const labelClass = "text-[11px] font-bold tracking-[0.12em] text-[#63303c]";
const fieldClass =
    "h-12 w-full border border-[#63303c]/70 bg-[#fffdf7] pl-11 pr-4 text-sm text-[#3c3832] outline-none transition duration-200 placeholder:text-[#8a8377] hover:border-[#63303c] focus:border-[#d4aa1d] focus:ring-2 focus:ring-[#d4aa1d]/20 md:h-[52px] md:text-[15px]";
const fieldIconClass =
    "pointer-events-none absolute left-4 top-1/2 size-[17px] -translate-y-1/2 text-[#a96460]";

export function RewearPickupForm() {
    const [form, setForm] = useState({
        fullName: "",
        mobileNumber: "",
        locality: "",
        garmentCount: "6-10 garments",
        contactMethod: "WhatsApp" as ContactMethod,
        categoryNote: "",
        consent: true,
    });
    const [showCategoryNote, setShowCategoryNote] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const pickup = trpc.general.rewear.createPickupRequest.useMutation({
        onSuccess: () => {
            setMessage(null);
            setSubmitted(true);
            setForm({
                fullName: "",
                mobileNumber: "",
                locality: "",
                garmentCount: "6-10 garments",
                contactMethod: "WhatsApp",
                categoryNote: "",
                consent: true,
            });
        },
        onError: (error) => setMessage(error.message),
    });

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setMessage(null);
        setSubmitted(false);

        if (!form.consent) {
            setMessage("Please confirm that Renivet may contact you.");
            return;
        }

        pickup.mutate({ ...form, consent: true });
    }

    return (
        <form
            onSubmit={submit}
            className="space-y-5 border-2 border-t-0 border-[#63303c] bg-[#fbf4dc] px-5 py-6 sm:px-7 lg:px-9 lg:py-7"
        >
            <div className="grid gap-4 md:grid-cols-2 md:gap-x-6">
                <label className={labelClass}>
                    Full name *
                    <span className="relative mt-2 block">
                        <UserRound
                            className={fieldIconClass}
                            aria-hidden="true"
                        />
                        <input
                            required
                            autoComplete="name"
                            value={form.fullName}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    fullName: event.target.value,
                                })
                            }
                            className={fieldClass}
                            placeholder="Your full name"
                        />
                    </span>
                </label>

                <label className={labelClass}>
                    Locality or PIN code *
                    <span className="relative mt-2 block">
                        <MapPin className={fieldIconClass} aria-hidden="true" />
                        <input
                            required
                            autoComplete="postal-code"
                            value={form.locality}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    locality: event.target.value,
                                })
                            }
                            className={fieldClass}
                            placeholder="e.g. Indiranagar · 560038"
                        />
                    </span>
                </label>

                <label className={`${labelClass} md:max-w-[calc(100%-12px)]`}>
                    Mobile number *
                    <span className="relative mt-2 block">
                        <Smartphone
                            className={fieldIconClass}
                            aria-hidden="true"
                        />
                        <input
                            required
                            inputMode="tel"
                            autoComplete="tel"
                            value={form.mobileNumber}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    mobileNumber: event.target.value,
                                })
                            }
                            className={fieldClass}
                            placeholder="+91"
                        />
                    </span>
                    <span className="mt-1.5 block text-[11px] font-normal leading-4 tracking-normal text-[#756f64]">
                        Include your Indian mobile number. We may use it to
                        follow up on your request.
                    </span>
                </label>
            </div>

            <fieldset className="border-t border-[#d4aa1d]/30 pt-5">
                <legend className={`${labelClass} pr-3`}>
                    Approximately how many garments would you like to give away?
                    *
                </legend>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                    {garmentOptions.map((option, index) => (
                        <button
                            key={option}
                            type="button"
                            aria-pressed={form.garmentCount === option}
                            onClick={() =>
                                setForm({ ...form, garmentCount: option })
                            }
                            className={`${index === garmentOptions.length - 1 ? "col-span-2" : ""} min-h-10 border border-[#63303c] px-3 py-2 text-[11px] font-bold text-[#63303c] transition duration-200 hover:bg-[#63303c]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4aa1d] sm:px-5 ${form.garmentCount === option ? "bg-[#63303c] text-[#fbf4dc] shadow-[inset_0_0_0_1px_#63303c] hover:bg-[#63303c]" : "bg-[#fffdf7]/45"}`}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </fieldset>

            <fieldset>
                <legend className={labelClass}>
                    How would you prefer us to contact you?
                </legend>
                <div className="mt-3 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
                    {contactOptions.map((option) => (
                        <button
                            key={option.label}
                            type="button"
                            aria-pressed={form.contactMethod === option.label}
                            onClick={() =>
                                setForm({
                                    ...form,
                                    contactMethod: option.label,
                                })
                            }
                            className={`inline-flex min-h-11 min-w-0 items-center justify-center gap-1.5 border border-[#c8959c] px-2 text-[10px] font-bold text-[#63303c] transition duration-200 hover:border-[#a96460] hover:bg-[#c8959c]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4aa1d] sm:min-w-[126px] sm:gap-2 sm:px-4 sm:text-xs ${form.contactMethod === option.label ? "border-[#a96460] bg-[#c8959c] shadow-[inset_0_0_0_1px_#a96460]" : "bg-[#fffdf7]/35"}`}
                        >
                            <option.icon
                                className="size-4 shrink-0"
                                aria-hidden="true"
                            />
                            <span>{option.label}</span>
                        </button>
                    ))}
                </div>
            </fieldset>

            <div className="border border-[#c8959c] bg-[#f3e2e2] px-4 py-4 text-[#63303c] sm:px-5">
                <div className="flex gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center border border-[#c8959c] bg-[#fffdf7]/55">
                        <Shirt
                            className="size-[18px] text-[#a96460]"
                            aria-hidden="true"
                        />
                    </span>
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold tracking-[0.1em]">
                            Help us understand your clothes
                        </p>
                        <p className="mt-1 text-xs leading-5 text-[#756f64]">
                            Optional for the initial request. Our team can
                            confirm the category-wise count later.
                        </p>
                        <button
                            type="button"
                            aria-expanded={showCategoryNote}
                            onClick={() =>
                                setShowCategoryNote(!showCategoryNote)
                            }
                            className="mt-3 inline-flex items-center gap-2 text-left text-[10px] font-bold uppercase tracking-[0.1em] text-[#a45f5d] transition hover:text-[#63303c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4aa1d]"
                        >
                            <span className="flex size-5 items-center justify-center border border-[#a45f5d]">
                                <Plus
                                    className={`size-3.5 transition ${showCategoryNote ? "rotate-45" : ""}`}
                                    aria-hidden="true"
                                />
                            </span>
                            Add an optional category-wise garment count
                        </button>
                    </div>
                </div>

                {showCategoryNote && (
                    <textarea
                        value={form.categoryNote}
                        onChange={(event) =>
                            setForm({
                                ...form,
                                categoryNote: event.target.value,
                            })
                        }
                        className="mt-4 min-h-20 w-full resize-y border border-[#c8959c] bg-[#fffaf7] p-3 text-sm text-[#3c3832] outline-none transition placeholder:text-[#8a8377] focus:border-[#d4aa1d] focus:ring-2 focus:ring-[#d4aa1d]/20"
                        placeholder="e.g. 4 shirts, 2 trousers"
                    />
                )}
            </div>

            <label className="flex cursor-pointer items-start gap-3 border-t border-[#d4aa1d]/30 pt-5 text-xs leading-5 text-[#3c3832] sm:text-sm sm:leading-6">
                <input
                    required
                    type="checkbox"
                    checked={form.consent}
                    onChange={(event) =>
                        setForm({ ...form, consent: event.target.checked })
                    }
                    className="mt-0.5 size-[18px] shrink-0 accent-[#63303c] sm:mt-1"
                />
                <span>
                    I agree that Renivet may contact me about this pickup
                    request using my selected contact method. I have read the
                    Privacy Notice.
                </span>
            </label>

            {submitted && (
                <div
                    role="status"
                    className="border border-[#d4aa1d] bg-[#fff7d9] px-5 py-5 text-[#63303c]"
                >
                    <p className="rewear-display-font text-2xl uppercase leading-none">
                        Pickup request received
                    </p>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#756f64]">
                        Thank you for choosing Rewear. Our team will review your
                        details and contact you shortly using your selected
                        contact method.
                    </p>
                    <button
                        type="button"
                        onClick={() => setSubmitted(false)}
                        className="mt-4 border border-[#63303c] px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#63303c] transition hover:bg-[#63303c] hover:text-[#fbf4dc]"
                    >
                        Submit another request{" "}
                        <ArrowRight
                            className="ml-1 inline size-3.5"
                            aria-hidden="true"
                        />
                    </button>
                </div>
            )}

            {message && (
                <p
                    role="status"
                    className="border-l-2 border-[#a96460] pl-3 text-sm font-bold text-[#63303c]"
                >
                    {message}
                </p>
            )}

            <div className="flex flex-col gap-4 border-t border-[#d4aa1d]/30 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <button
                    disabled={pickup.isPending || submitted}
                    className={`${submitted ? "hidden" : ""}inline-flex min-h-12 items-center justify-center gap-3 bg-[#63303c] px-7 text-[11px] font-bold uppercase tracking-[0.14em] text-[#fbf4dc] transition hover:bg-[#50242f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4aa1d] focus-visible:ring-offset-2 disabled:opacity-60`}
                    type="submit"
                >
                    {pickup.isPending
                        ? "Submitting..."
                        : "Submit pickup request"}
                    <ArrowRight className="size-4" aria-hidden="true" />
                </button>

                <p className="flex max-w-xl items-start gap-2 text-[11px] leading-5 text-[#756f64]">
                    <LockKeyhole
                        className="mt-0.5 size-3.5 shrink-0 text-[#d4aa1d]"
                        aria-hidden="true"
                    />
                    Your details are securely shared with the Renivet team so we
                    can follow up on your pickup request.
                </p>
            </div>

            {submitted && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="rewear-confirmation-title"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-[#2c1a20]/50 px-5 py-8 backdrop-blur-sm"
                >
                    <div className="relative w-full max-w-[460px] border border-[#d4aa1d] bg-[#fbf4dc] p-8 text-center text-[#63303c] shadow-[0_24px_80px_rgb(44_26_32_/_28%)] sm:p-10">
                        <div className="mx-auto flex size-14 items-center justify-center rounded-full border-2 border-[#d4aa1d] text-[#d4aa1d]">
                            <Check className="size-6" aria-hidden="true" />
                        </div>
                        <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.24em] text-[#a96460]">
                            Rewear pickup
                        </p>
                        <h2
                            id="rewear-confirmation-title"
                            className="rewear-display-font mt-3 text-4xl uppercase leading-none"
                        >
                            Request confirmed
                        </h2>
                        <p className="mx-auto mt-4 max-w-[330px] text-sm leading-6 text-[#756f64]">
                            Your details are safely with our team. We&apos;ll be
                            in touch shortly using your selected contact method.
                        </p>
                        <div className="mt-6 border-t border-[#d4aa1d]/40 pt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#63303c]">
                            Thank you for choosing Rewear
                        </div>
                        <button
                            type="button"
                            onClick={() => setSubmitted(false)}
                            className="mt-7 inline-flex w-full items-center justify-center gap-2 bg-[#63303c] px-6 py-4 text-xs font-bold uppercase tracking-[0.14em] text-[#fbf4dc] transition hover:bg-[#50242f]"
                        >
                            Continue browsing{" "}
                            <ArrowRight className="size-4" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            )}
        </form>
    );
}
