"use client";

import { History, Mail, Sparkles } from "lucide-react";
import { useState } from "react";
import { MarketingEmailForm } from "@/components/globals/email-template/bulk-email-send";
import { DigestCampaignManager } from "./digest-campaign-manager";

const WORKSPACE_TABS = [
    {
        value: "manual",
        label: "Manual Bulk Campaigns",
        description: "Professional recipient import, email composition, and send review.",
        icon: Mail,
    },
    {
        value: "digest",
        label: "Digest Campaigns",
        description: "Build scheduled new-arrivals and blog-digest campaigns.",
        icon: Sparkles,
    },
    {
        value: "logs",
        label: "Delivery Logs",
        description: "Review history, export reports, and retry failed sends.",
        icon: History,
    },
] as const;

export function EmailCampaignWorkspace() {
    const [activeTab, setActiveTab] =
        useState<(typeof WORKSPACE_TABS)[number]["value"]>("manual");

    return (
        <div className="space-y-6">
            <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                <div className="bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_30%),linear-gradient(135deg,#0f172a,#1f2937)] px-6 py-8 text-white sm:px-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">
                        Growth Workspace
                    </p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                        Bulk Campaign Operations
                    </h2>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200">
                        Run manual campaigns, digest sends, and delivery tracking from a
                        single professional campaign workspace.
                    </p>
                </div>

                <div className="grid gap-3 bg-slate-50 p-4 md:grid-cols-3">
                    {WORKSPACE_TABS.map((tab) => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.value;

                        return (
                            <button
                                key={tab.value}
                                type="button"
                                onClick={() => setActiveTab(tab.value)}
                                className={`rounded-2xl border p-4 text-left transition ${
                                    active
                                        ? "border-slate-900 bg-white shadow-sm"
                                        : "border-gray-200 bg-white/70 hover:bg-white"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`rounded-xl p-2 ${
                                            active
                                                ? "bg-slate-900 text-white"
                                                : "bg-slate-100 text-slate-700"
                                        }`}
                                    >
                                        <Icon className="size-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            {tab.label}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {tab.description}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </section>

            {activeTab === "manual" ? (
                <MarketingEmailForm availableTabs={["send"]} compact />
            ) : null}

            {activeTab === "digest" ? <DigestCampaignManager /> : null}

            {activeTab === "logs" ? (
                <MarketingEmailForm availableTabs={["logs"]} defaultTab="logs" compact />
            ) : null}
        </div>
    );
}
