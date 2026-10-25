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

export function RewearPickupForm() {
    const [form, setForm] = useState({
        fullName: "",
        mobileNumber: "",
        locality: "",
        garmentCount: "",
        contactMethod: "WhatsApp" as (typeof contactOptions)[number],
        categoryNote: "",
        consent: false,
    });
    const [message, setMessage] = useState<string | null>(null);
    const pickup = trpc.general.rewear.createPickupRequest.useMutation({
        onSuccess: () => {
            setMessage("Thank you — your pickup request has been received.");
            setForm({
                fullName: "",
                mobileNumber: "",
                locality: "",
                garmentCount: "",
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
        <form onSubmit={submit} className="grid gap-5 p-5 sm:grid-cols-2 sm:p-8">
            <label className="text-[9px] font-bold uppercase tracking-[0.08em]">
                Full name *
                <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="mt-2 h-9 w-full border border-[#9b6870] bg-transparent px-3 text-xs outline-none" placeholder="Your full name" />
            </label>
            <label className="text-[9px] font-bold uppercase tracking-[0.08em]">
                Mobile number *
                <input required value={form.mobileNumber} onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })} className="mt-2 h-9 w-full border border-[#9b6870] bg-transparent px-3 text-xs outline-none" placeholder="+91" />
            </label>
            <label className="text-[9px] font-bold uppercase tracking-[0.08em] sm:col-span-2">
                Locality or PIN code *
                <input required value={form.locality} onChange={(e) => setForm({ ...form, locality: e.target.value })} className="mt-2 h-9 w-full border border-[#9b6870] bg-transparent px-3 text-xs outline-none" placeholder="e.g. Indiranagar - 560038" />
            </label>
            <fieldset className="sm:col-span-2">
                <legend className="text-[9px] font-bold uppercase tracking-[0.08em]">Approximately how many garments would you like to give away? *</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                    {garmentOptions.map((option) => <button key={option} type="button" onClick={() => setForm({ ...form, garmentCount: option })} className={`border px-3 py-2 text-[9px] ${form.garmentCount === option ? "bg-[#d4aa1d]" : "border-[#9b6870]"}`}>{option}</button>)}
                </div>
            </fieldset>
            <fieldset className="sm:col-span-2">
                <legend className="text-[9px] font-bold uppercase tracking-[0.08em]">How would you prefer us to contact you?</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                    {contactOptions.map((option) => <button key={option} type="button" onClick={() => setForm({ ...form, contactMethod: option })} className={`border px-4 py-2 text-[9px] ${form.contactMethod === option ? "bg-[#d4aa1d]" : "border-[#9b6870]"}`}>{option}</button>)}
                </div>
            </fieldset>
            <label className="sm:col-span-2 text-[9px] font-bold uppercase tracking-[0.08em]">
                Help us understand your clothes
                <textarea value={form.categoryNote} onChange={(e) => setForm({ ...form, categoryNote: e.target.value })} className="mt-2 min-h-20 w-full border border-[#c8959c] bg-[#f1dfe0] p-3 text-[10px] normal-case tracking-normal outline-none" placeholder="Optional: add an approximate category-wise garment count." />
            </label>
            <label className="flex items-start gap-2 text-[9px] leading-4 text-[#765c5e] sm:col-span-2"><input required type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} className="mt-0.5 accent-[#63303c]" /> I agree that Renivet may contact me about this pickup request using my selected contact method.</label>
            {message && <p role="status" className="text-xs font-bold sm:col-span-2">{message}</p>}
            <button disabled={pickup.isPending} className="w-fit bg-[#63303c] px-6 py-3 text-[9px] font-bold uppercase tracking-[0.11em] text-[#fbf4dc] disabled:opacity-60" type="submit">{pickup.isPending ? "Submitting..." : "Submit pickup request"} <span className="ml-2">→</span></button>
        </form>
    );
}
