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
        <div className="min-h-screen bg-[#fcfbf4] px-4 py-10">
            {/* Header */}
            <div className="mb-10 text-center">
                <h1
                    className="mb-3 text-2xl font-medium tracking-wide md:text-4xl"
                    style={{
                        fontFamily: "josephine sans",
                        fontSize: "clamp(28px, 5vw, 40px)",
                    }}
                >
                    Contact Us
                </h1>
                <p
                    className="text-base text-gray-600 md:text-lg"
                    style={{
                        fontFamily: "josephine sans",
                        fontSize: "clamp(20px, 4vw, 32px)",
                    }}
                >
                    We&apos;d Love To Hear From You.
                </p>
            </div>

            {/* Main Container */}
            <div
                className="relative mx-auto lg:ml-auto lg:mr-[120px]"
                style={{ maxWidth: "947px" }}
            >
                {/* ================= FORM BOX ================= */}
                <div
                    className="flex flex-col border border-gray-400 md:flex-row"
                    style={{
                        maxWidth: "100%",
                        minHeight: "auto",
                    }}
                >
                    {/* Left Form */}
                    <div className="flex-1 px-6 py-8 md:px-14 md:py-14">
                        <form
                            onSubmit={handleSubmit}
                            className="flex h-full flex-col justify-between"
                        >
                            <div className="space-y-8 md:space-y-14">
                                <div>
                                    <label
                                        className="mb-3 block text-sm md:text-base"
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
                                        className="mb-3 block text-sm md:text-base"
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
                                        className="mb-3 block text-sm md:text-base"
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
                                    "mt-8 w-full bg-[#1a1a2e] py-3 text-sm font-medium uppercase tracking-widest text-white transition-colors hover:bg-[#0f0f1a] md:py-4",
                                    isSubmitting &&
                                        "cursor-not-allowed opacity-70"
                                )}
                            >
                                {isSubmitting ? "Sending..." : "Submit"}
                            </button>
                        </form>
                    </div>

                    {/* Divider - horizontal on mobile, vertical on desktop */}
                    <div className="h-px w-full bg-gray-400 md:h-auto md:w-px" />

                    {/* Right Info */}
                    <div className="w-full space-y-8 px-6 py-8 md:w-[280px] md:space-y-14 md:px-12 md:py-14">
                        <div>
                            <h3
                                className="mb-2 text-sm font-semibold md:text-base"
                                style={{ fontFamily: "serif" }}
                            >
                                Contact
                            </h3>
                            <a
                                href={`mailto:${siteConfig.contact?.email}`}
                                className="text-sm underline md:text-base"
                            >
                                Support@Renivet.Com
                            </a>
                        </div>

                        <div>
                            <h3
                                className="mb-2 text-sm font-semibold md:text-base"
                                style={{ fontFamily: "serif" }}
                            >
                                Based In
                            </h3>
                            <p className="text-sm md:text-base">Bangalore</p>
                        </div>

                        <div>
                            <h3
                                className="mb-2 text-sm font-semibold md:text-base"
                                style={{ fontFamily: "serif" }}
                            >
                                Office Hours:
                            </h3>
                            <p className="text-sm md:text-base">
                                Monday - Friday,
                                <br />
                                9:00 AM - 5:00 PM
                            </p>
                        </div>
                    </div>
                </div>

                {/* ================= IMAGE ================= */}
                {/* Mobile: relative, flows naturally. Desktop: absolute positioned */}
                <div className="relative ml-4 mt-8 w-[70%] max-w-[500px] md:ml-20 md:w-[55%] lg:absolute lg:bottom-[-567px] lg:left-[-494px] lg:ml-0 lg:mt-0 lg:h-[613px] lg:w-[760px] lg:max-w-none">
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

            {/* Spacer - less on mobile */}
            <div className="h-8 lg:h-[500px]" />

            {/* Footer */}
            <div className="mb-16 mt-8 text-center md:mb-16 md:mt-16">
                <p
                    className="text-base leading-relaxed text-gray-600"
                    style={{
                        fontFamily: "josephine sans",
                        letterSpacing: "0.02em",
                        fontSize: "clamp(18px, 4vw, 32px)",
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
