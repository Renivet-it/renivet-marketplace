"use client";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

interface ContactFormData {
    fullName: string;
    email: string;
    message: string;
}

export default function ContactPage() {
    const [formData, setFormData] = useState<ContactFormData>({
        fullName: "",
        email: "",
        message: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setIsSubmitting(true);
        await new Promise((r) => setTimeout(r, 1000));
        toast.success("Message sent successfully!");
        setFormData({ fullName: "", email: "", message: "" });
        setIsSubmitting(false);
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="bg-[#fcfbf4] px-4 py-10 md:min-h-screen">
            {/* Header */}
            <div className="mb-6 text-center md:mb-10">
                <h1
                    className="mb-2 text-2xl font-medium tracking-wide md:mb-3 md:text-4xl"
                    style={{
                        fontFamily: "josephine sans",
                        fontSize: "clamp(24px, 5vw, 40px)",
                    }}
                >
                    Contact Us
                </h1>
                <p
                    className="text-base text-gray-600 md:text-lg"
                    style={{
                        fontFamily: "josephine sans",
                        fontSize: "clamp(16px, 4vw, 32px)",
                    }}
                >
                    We&apos;d Love To Hear From You.
                </p>
            </div>

            {/* ================= MOBILE LAYOUT ================= */}
            <div className="block md:hidden">
                {/* Mobile Form Box - 289x169 aspect ratio */}
                <div
                    className="mx-auto flex border border-gray-400"
                    style={{
                        width: "320px",
                        minHeight: "169px",
                        marginLeft: "75px",
                    }}
                >
                    {/* Left Form - Mobile */}
                    <div className="flex-1 px-3 py-3">
                        <form
                            onSubmit={handleSubmit}
                            className="flex h-full flex-col justify-between"
                        >
                            <div className="space-y-3">
                                <div>
                                    <label
                                        className="mb-1 block text-[10px]"
                                        style={{ fontFamily: "serif" }}
                                    >
                                        Full Name
                                    </label>
                                    <input
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        className="w-full border-0 border-b border-gray-500 bg-transparent py-0.5 text-[10px] focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label
                                        className="mb-1 block text-[10px]"
                                        style={{ fontFamily: "serif" }}
                                    >
                                        Email
                                    </label>
                                    <input
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full border-0 border-b border-gray-500 bg-transparent py-0.5 text-[10px] focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label
                                        className="mb-1 block text-[10px]"
                                        style={{ fontFamily: "serif" }}
                                    >
                                        Message
                                    </label>
                                    <textarea
                                        name="message"
                                        rows={1}
                                        value={formData.message}
                                        onChange={handleChange}
                                        className="w-full resize-none border-0 border-b border-gray-500 bg-transparent py-0.5 text-[10px] focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Small Submit Button - Mobile */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={cn(
                                    "mt-3 w-full bg-[#1a1a2e] py-1.5 text-[8px] font-medium uppercase tracking-widest text-white transition-colors hover:bg-[#0f0f1a]",
                                    isSubmitting &&
                                        "cursor-not-allowed opacity-70"
                                )}
                            >
                                {isSubmitting ? "Sending..." : "Submit"}
                            </button>
                        </form>
                    </div>

                    {/* Vertical Divider - Mobile */}
                    {/* <div className="w-px bg-gray-400" /> */}

                    {/* Right Info - Mobile */}
                    <div className="w-[100px] space-y-3 px-2 py-3">
                        <div>
                            <h3
                                className="text-[9px] font-semibold"
                                style={{ fontFamily: "serif" }}
                            >
                                Contact
                            </h3>
                            <a
                                href={`mailto:${siteConfig.contact?.email}`}
                                className="text-[8px] underline"
                            >
                                Support@Renivet.Com
                            </a>
                        </div>

                        <div>
                            <h3
                                className="text-[9px] font-semibold"
                                style={{ fontFamily: "serif" }}
                            >
                                Based In
                            </h3>
                            <p className="text-[8px]">Bangalore Xyz</p>
                        </div>

                        <div>
                            <h3
                                className="text-[9px] font-semibold"
                                style={{ fontFamily: "serif" }}
                            >
                                Office Hours:
                            </h3>
                            <p className="text-[8px] leading-tight">
                                Monday - Friday,
                                <br />
                                9:00 AM - 5:00 PM
                            </p>
                        </div>
                    </div>
                </div>

                {/* Mobile Image - 214x167, showing top portion */}
                <div className="ml-4 mt-[-0.5]">
                    <Image
                        src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNg5o5iI2ENPRLZdGUpA0elOxytCDfJibYIko7"
                        alt="Leaf person"
                        width={214}
                        height={167}
                        className="h-[167px] w-[214px] object-cover object-top"
                        priority
                    />
                </div>

                {/* Mobile Footer */}
                <div className="mt-6 text-center">
                    <p
                        className="text-sm leading-relaxed text-gray-600"
                        style={{
                            fontFamily: "josephine sans",
                            letterSpacing: "0.02em",
                            fontSize: "16px",
                        }}
                    >
                        Every Conversation Begins With A Pause.
                        <br />
                        Thanks For Starting One.
                    </p>
                </div>
            </div>

            {/* ================= DESKTOP LAYOUT ================= */}
            <div className="hidden md:block">
                {/* Main Container */}
                <div
                    className="relative mx-auto lg:ml-auto lg:mr-[120px]"
                    style={{ maxWidth: "947px" }}
                >
                    {/* Form Box */}
                    <div
                        className="flex flex-row border border-gray-400"
                        style={{
                            maxWidth: "100%",
                            minHeight: "auto",
                        }}
                    >
                        {/* Left Form */}
                        <div className="flex-1 px-14 py-14">
                            <form
                                onSubmit={handleSubmit}
                                className="flex h-full flex-col justify-between"
                            >
                                <div className="space-y-14">
                                    <div>
                                        <label
                                            className="mb-3 block text-base"
                                            style={{ fontFamily: "serif" }}
                                        >
                                            Full Name
                                        </label>
                                        <input
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            className="w-full border-0 border-b border-gray-500 bg-transparent py-2 focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            className="mb-3 block text-base"
                                            style={{ fontFamily: "serif" }}
                                        >
                                            Email
                                        </label>
                                        <input
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full border-0 border-b border-gray-500 bg-transparent py-2 focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            className="mb-3 block text-base"
                                            style={{ fontFamily: "serif" }}
                                        >
                                            Message
                                        </label>
                                        <textarea
                                            name="message"
                                            rows={1}
                                            value={formData.message}
                                            onChange={handleChange}
                                            className="w-full resize-none border-0 border-b border-gray-500 bg-transparent py-2 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={cn(
                                        "mt-8 w-full bg-[#1a1a2e] py-4 text-sm font-medium uppercase tracking-widest text-white transition-colors hover:bg-[#0f0f1a]",
                                        isSubmitting &&
                                            "cursor-not-allowed opacity-70"
                                    )}
                                >
                                    {isSubmitting ? "Sending..." : "Submit"}
                                </button>
                            </form>
                        </div>

                        {/* Vertical Divider */}
                        <div className="w-px bg-gray-400" />

                        {/* Right Info */}
                        <div className="w-[280px] space-y-14 px-12 py-14">
                            <div>
                                <h3
                                    className="mb-2 text-base font-semibold"
                                    style={{ fontFamily: "serif" }}
                                >
                                    Contact
                                </h3>
                                <a
                                    href={`mailto:${siteConfig.contact?.email}`}
                                    className="text-base underline"
                                >
                                    Support@Renivet.Com
                                </a>
                            </div>

                            <div>
                                <h3
                                    className="mb-2 text-base font-semibold"
                                    style={{ fontFamily: "serif" }}
                                >
                                    Based In
                                </h3>
                                <p className="text-base">Bangalore</p>
                            </div>

                            <div>
                                <h3
                                    className="mb-2 text-base font-semibold"
                                    style={{ fontFamily: "serif" }}
                                >
                                    Office Hours:
                                </h3>
                                <p className="text-base">
                                    Monday - Friday,
                                    <br />
                                    9:00 AM - 5:00 PM
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Image - Absolute positioned */}
                    <div className="absolute bottom-[-567px] left-[-494px] h-[613px] w-[760px]">
                        <Image
                            src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNg5o5iI2ENPRLZdGUpA0elOxytCDfJibYIko7"
                            alt="Leaf person"
                            width={784}
                            height={613}
                            className="h-auto w-full object-cover"
                            priority
                        />
                    </div>
                </div>

                {/* Desktop Spacer */}
                <div className="h-[500px]" />

                {/* Desktop Footer */}
                <div className="mb-16 mt-16 text-center">
                    <p
                        className="text-base leading-relaxed text-gray-600"
                        style={{
                            fontFamily: "josephine sans",
                            letterSpacing: "0.02em",
                            fontSize: "32px",
                        }}
                    >
                        Every Conversation Begins With A Pause.
                        <br />
                        Thanks For Starting One.
                    </p>
                </div>
            </div>
        </div>
    );
}
