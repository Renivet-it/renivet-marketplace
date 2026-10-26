"use client";

import { trpc } from "@/lib/trpc/client";
import { MessageSquare, Phone } from "lucide-react";
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
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.986 2.894a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.887-9.883 9.887m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.89c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.479-8.413" />
        </svg>
    );
}

const fieldClass =
    "mt-2 h-12 w-full border-2 border-[#63303c] bg-[#fffdf7] px-4 text-sm text-[#63303c] outline-none placeholder:text-[#756f64] md:h-14 md:px-5 md:text-base";
const labelClass =
    "text-[11px] font-bold tracking-[0.1em] text-[#63303c]";

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
        <form onSubmit={submit} className="space-y-6 border-2 border-t-0 border-[#63303c] px-6 py-6 sm:px-7 lg:px-8 lg:py-8">
                <div className="grid gap-5 md:grid-cols-2 md:gap-x-6">
                <label className={labelClass}>
                    Full name *
                    <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={fieldClass} placeholder="Your full name" />
                </label>
                <label className={labelClass}>
                    Locality or PIN code *
                    <input required value={form.locality} onChange={(e) => setForm({ ...form, locality: e.target.value })} className={fieldClass} placeholder="e.g. Indiranagar · 560038" />
                </label>
                <label className={`${labelClass} max-w-[660px]`}>
                    Mobile number *
                    <input required value={form.mobileNumber} onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })} className={fieldClass} placeholder="+91" />
                    <span className="mt-2 block text-xs font-normal tracking-normal text-[#756f64]">Include your Indian mobile number. We may use it to follow up on your request.</span>
                </label>
            </div>

            <fieldset>
                <legend className={labelClass}>Approximately how many garments would you like to give away? *</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                    {garmentOptions.map((option) => <button key={option} type="button" onClick={() => setForm({ ...form, garmentCount: option })} className={`border-2 border-[#63303c] px-5 py-3 text-xs font-bold text-[#63303c] ${form.garmentCount === option ? "bg-[#63303c] text-[#fbf4dc]" : "bg-transparent"}`}>{option}</button>)}
                </div>
            </fieldset>

            <fieldset>
                <legend className={labelClass}>How would you prefer us to contact you?</legend>
                <div className="mt-3 flex flex-nowrap gap-2">
                    {contactOptions.map((option) => <button key={option.label} type="button" onClick={() => setForm({ ...form, contactMethod: option.label })} className={`inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 border-2 border-[#c8959c] px-2 py-2 text-[10px] font-bold text-[#63303c] sm:flex-none sm:gap-2 sm:px-4 sm:py-2.5 sm:text-xs ${form.contactMethod === option.label ? "bg-[#c8959c]" : "bg-transparent"}`}><option.icon className="size-4 shrink-0" aria-hidden="true" />{option.label}</button>)}
                </div>
            </fieldset>

            <div className="border-2 border-[#c8959c] bg-[#f1dfe0] px-5 py-5 text-[#63303c]">
                <p className="text-[11px] font-bold tracking-[0.1em]">Help us understand your clothes</p>
                <p className="mt-2 text-sm text-[#756f64]">Optional for the initial request. Our team can confirm the category-wise count later.</p>
                <button type="button" onClick={() => setShowCategoryNote(!showCategoryNote)} className="mt-5 flex items-center gap-3 text-[11px] font-bold tracking-[0.1em] text-[#a45f5d]"><span className="flex size-6 items-center justify-center border-2 border-[#a45f5d] text-base">+</span> ADD AN OPTIONAL CATEGORY-WISE GARMENT COUNT</button>
                {showCategoryNote && <textarea value={form.categoryNote} onChange={(e) => setForm({ ...form, categoryNote: e.target.value })} className="mt-5 min-h-24 w-full border-2 border-[#c8959c] bg-[#fff7f5] p-3 text-sm outline-none" placeholder="e.g. 4 shirts, 2 trousers" />}
            </div>

            <label className="flex items-start gap-3 text-sm leading-6 text-[#3c3832]"><input required type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} className="mt-1 size-5 accent-[#63303c]" /> I agree that Renivet may contact me about this pickup request using my selected contact method. I have read the Privacy Notice.</label>
            {submitted && <div role="status" className="border-2 border-[#d4aa1d] bg-[#fff7d9] px-6 py-6 text-[#63303c]"><p className="rewear-display-font text-2xl uppercase leading-none">Pickup request received</p><p className="mt-3 max-w-2xl text-sm leading-6 text-[#756f64]">Thank you for choosing Rewear. Our team will review your details and contact you shortly using your selected contact method.</p><button type="button" onClick={() => setSubmitted(false)} className="mt-5 border-2 border-[#63303c] px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#63303c]">Submit another request <span className="ml-2">-&gt;</span></button></div>}
            {message && <p role="status" className="text-sm font-bold text-[#63303c]">{message}</p>}
            <button disabled={pickup.isPending || submitted} className={`${submitted ? "hidden " : ""}bg-[#63303c] px-8 py-4 text-xs font-bold uppercase tracking-[0.12em] text-[#fbf4dc] disabled:opacity-60`} type="submit">{pickup.isPending ? "Submitting..." : "Submit pickup request"} <span className="ml-2">→</span></button>
            <p className="border-l-4 border-[#d4aa1d] pl-3 text-xs leading-5 text-[#756f64]">Your details are securely shared with the Renivet team so we can follow up on your pickup request.</p>
            {submitted && <div role="dialog" aria-modal="true" aria-labelledby="rewear-confirmation-title" className="fixed inset-0 z-50 flex items-center justify-center bg-[#2c1a20]/50 px-5 py-8 backdrop-blur-sm"><div className="relative w-full max-w-[460px] border border-[#d4aa1d] bg-[#fbf4dc] p-8 text-center text-[#63303c] shadow-[0_24px_80px_rgb(44_26_32_/_28%)] sm:p-10"><div className="mx-auto flex size-14 items-center justify-center rounded-full border-2 border-[#d4aa1d] text-2xl text-[#d4aa1d]">✓</div><p className="mt-6 text-[10px] font-bold uppercase tracking-[0.24em] text-[#a96460]">Rewear pickup</p><h2 id="rewear-confirmation-title" className="rewear-display-font mt-3 text-4xl uppercase leading-none">Request confirmed</h2><p className="mx-auto mt-4 max-w-[330px] text-sm leading-6 text-[#756f64]">Your details are safely with our team. We&apos;ll be in touch shortly using your selected contact method.</p><div className="mt-6 border-t border-[#d4aa1d]/40 pt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#63303c]">Thank you for choosing Rewear</div><button type="button" onClick={() => setSubmitted(false)} className="mt-7 w-full bg-[#63303c] px-6 py-4 text-xs font-bold uppercase tracking-[0.14em] text-[#fbf4dc]">Continue browsing <span className="ml-2">-&gt;</span></button></div></div>}
        </form>
    );
}
