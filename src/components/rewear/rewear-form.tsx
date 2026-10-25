"use client";

import { trpc } from "@/lib/trpc/client";
import { FormEvent, useState } from "react";

const garmentOptions = [
    "1-5 garments",
    "6-10 garments",
    "11-20 garments",
    "21-30 garments",
    "More than 30 garments",
];
const contactOptions = ["WhatsApp", "Phone call", "SMS"] as const;

const fieldClass =
    "mt-2 h-13 w-full border-2 border-[#63303c] bg-[#fffdf7] px-4 text-sm text-[#63303c] outline-none placeholder:text-[#756f64]";
const labelClass =
    "text-[11px] font-bold tracking-[0.1em] text-[#63303c]";

export function RewearPickupForm() {
    const [form, setForm] = useState({
        fullName: "",
        mobileNumber: "",
        locality: "",
        garmentCount: "6-10 garments",
        contactMethod: "WhatsApp" as (typeof contactOptions)[number],
        categoryNote: "",
        consent: false,
    });
    const [showCategoryNote, setShowCategoryNote] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const pickup = trpc.general.rewear.createPickupRequest.useMutation({
        onSuccess: () => {
            setMessage("Thank you — your pickup request has been received.");
            setForm({
                fullName: "",
                mobileNumber: "",
                locality: "",
                garmentCount: "6-10 garments",
                contactMethod: "WhatsApp",
                categoryNote: "",
                consent: false,
            });
        },
        onError: (error) => setMessage(error.message),
    });

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setMessage(null);
        if (!form.consent) {
            setMessage("Please confirm that Renivet may contact you.");
            return;
        }
        pickup.mutate({ ...form, consent: true });
    }

    return (
        <form onSubmit={submit} className="space-y-8 border-2 border-t-0 border-[#63303c] px-8 py-9 sm:px-9 lg:px-10 lg:py-10">
            <div className="grid gap-7 md:grid-cols-2 md:gap-x-7">
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
                <div className="mt-4 flex flex-wrap gap-3">
                    {garmentOptions.map((option) => <button key={option} type="button" onClick={() => setForm({ ...form, garmentCount: option })} className={`border-2 border-[#63303c] px-5 py-3 text-xs font-bold text-[#63303c] ${form.garmentCount === option ? "bg-[#63303c] text-[#fbf4dc]" : "bg-transparent"}`}>{option}</button>)}
                </div>
            </fieldset>

            <fieldset>
                <legend className={labelClass}>How would you prefer us to contact you?</legend>
                <div className="mt-4 flex flex-wrap gap-3">
                    {contactOptions.map((option) => <button key={option} type="button" onClick={() => setForm({ ...form, contactMethod: option })} className={`border-2 border-[#c8959c] px-5 py-3 text-xs font-bold text-[#63303c] ${form.contactMethod === option ? "bg-[#c8959c]" : "bg-transparent"}`}>{option}</button>)}
                </div>
            </fieldset>

            <div className="border-2 border-[#c8959c] bg-[#f1dfe0] px-6 py-6 text-[#63303c]">
                <p className="text-[11px] font-bold tracking-[0.1em]">Help us understand your clothes</p>
                <p className="mt-2 text-sm text-[#756f64]">Optional for the initial request. Our team can confirm the category-wise count later.</p>
                <button type="button" onClick={() => setShowCategoryNote(!showCategoryNote)} className="mt-5 flex items-center gap-3 text-[11px] font-bold tracking-[0.1em] text-[#a45f5d]"><span className="flex size-6 items-center justify-center border-2 border-[#a45f5d] text-base">+</span> ADD AN OPTIONAL CATEGORY-WISE GARMENT COUNT</button>
                {showCategoryNote && <textarea value={form.categoryNote} onChange={(e) => setForm({ ...form, categoryNote: e.target.value })} className="mt-5 min-h-24 w-full border-2 border-[#c8959c] bg-[#fff7f5] p-3 text-sm outline-none" placeholder="e.g. 4 shirts, 2 trousers" />}
            </div>

            <label className="flex items-start gap-3 text-sm leading-6 text-[#3c3832]"><input required type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} className="mt-1 size-5 accent-[#63303c]" /> I agree that Renivet may contact me about this pickup request using my selected contact method. I have read the Privacy Notice.</label>
            {message && <p role="status" className="text-sm font-bold text-[#63303c]">{message}</p>}
            <button disabled={pickup.isPending} className="bg-[#63303c] px-8 py-4 text-xs font-bold uppercase tracking-[0.12em] text-[#fbf4dc] disabled:opacity-60" type="submit">{pickup.isPending ? "Submitting..." : "Submit pickup request"} <span className="ml-2">→</span></button>
            <p className="border-l-4 border-[#d4aa1d] pl-3 text-xs leading-5 text-[#756f64]">Review sample form submission — this is an interactive form mock-up to demonstrate the intended fields and flow. It does not submit information to Renivet or create a real pickup request.</p>
        </form>
    );
}
