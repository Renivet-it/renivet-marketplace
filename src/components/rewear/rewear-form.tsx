"use client";

import { trpc } from "@/lib/trpc/client";
import { MessageCircle, MessageSquare, Phone } from "lucide-react";
import { FormEvent, useState } from "react";

const garmentOptions = [
    "1-5 garments",
    "6-10 garments",
    "11-20 garments",
    "21-30 garments",
    "More than 30 garments",
];
const contactOptions = [
    { label: "WhatsApp", icon: MessageCircle },
    { label: "Phone call", icon: Phone },
    { label: "SMS", icon: MessageSquare },
] as const;
type ContactMethod = (typeof contactOptions)[number]["label"];

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
                <div className="mt-3 flex flex-wrap gap-2">
                    {contactOptions.map((option) => <button key={option.label} type="button" onClick={() => setForm({ ...form, contactMethod: option.label })} className={`inline-flex items-center gap-2 border-2 border-[#c8959c] px-4 py-2.5 text-xs font-bold text-[#63303c] ${form.contactMethod === option.label ? "bg-[#c8959c]" : "bg-transparent"}`}><option.icon className="size-4" aria-hidden="true" />{option.label}</button>)}
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
