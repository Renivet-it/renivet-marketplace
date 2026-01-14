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
        <div className="min-h-screen bg-[#FAFAF8] px-4 py-10">
            {/* Header */}
            <div className="mb-10 text-center">
                <h1
                    className="mb-3 text-4xl font-medium tracking-wide"
                    style={{ fontFamily: "josephine sans", fontSize: "40px" }}
                >
                    Contact Us
                </h1>
                <p
                    className="text-lg text-gray-600"
                    style={{ fontFamily: "josephine sans", fontSize: "32px" }}
                >
                    We&apos;d Love To Hear From You.
                </p>
            </div>

            {/* Main Container - shifted right */}
            <div
                className="relative ml-auto"
                style={{ maxWidth: "947px", marginRight: "120px" }}
            >
                {/* ================= FORM BOX ================= */}
                <div
                    className="flex border border-gray-400"
                    style={{
                        width: "947px",
                        height: "553px",
                        maxWidth: "100%",
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

                    {/* Divider */}
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
                                className="underline"
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
                            <p>Bangalore Xyz</p>
                        </div>

                        <div>
                            <h3
                                className="mb-2 text-base font-semibold"
                                style={{ fontFamily: "serif" }}
                            >
                                Office Hours:
                            </h3>
                            <p>
                                Monday - Friday,
                                <br />
                                9:00 AM - 5:00 PM
                            </p>
                        </div>
                    </div>
                </div>

                {/* ================= IMAGE ================= */}
                <div
                    className="absolute"
                    style={{
                        width: "760px",
                        height: "613px",
                        left: "-494px",
                        bottom: "-567px",
                    }}
                >
                    <Image
                        src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNg5o5iI2ENPRLZdGUpA0elOxytCDfJibYIko7"
                        alt="Leaf person"
                        width={784}
                        height={613}
                        className="object-cover"
                        priority
                    />
                </div>

                {/* Submit Button */}
                <div className="mt-10 pl-14"></div>
            </div>

            {/* Spacer */}
            <div style={{ height: "500px" }} />

            {/* Footer */}
            <div className="mt-16 mb-16 text-center">
                <p
                    className="text-lg leading-relaxed text-gray-600 md:text-lg"
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
    );
}
